-- ============================================================
-- 004: hide roaster costs from partners, lock down worker time logs,
-- atomic lot shipping, USD exchange rate, keep history on delete.
-- Idempotent: safe to re-run.
-- ============================================================

-- ---------- Partners: read orders without cost/margin columns ----------
-- RLS can't hide columns, so partners lose direct SELECT on orders and read
-- through this function instead.
DROP POLICY IF EXISTS "Partners can view their own orders" ON orders;

CREATE OR REPLACE FUNCTION public.partner_orders()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  customer_id UUID,
  preparation_method TEXT,
  roast_level TEXT,
  amount_grams INTEGER,
  bag_count BIGINT,
  total_price NUMERIC,
  fulfillment_status fulfillment_status_type,
  payment_status payment_status_type,
  origin_notes TEXT,
  inventory_id UUID,
  bag_type_id UUID,
  order_date TIMESTAMPTZ,
  company_name TEXT,
  partner_id UUID,
  item_name TEXT,
  customer_name TEXT,
  customer_phone TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.user_id, o.customer_id, o.preparation_method, o.roast_level,
         o.amount_grams, o.bag_count, o.total_price, o.fulfillment_status,
         o.payment_status, o.origin_notes, o.inventory_id, o.bag_type_id,
         o.order_date, o.company_name, o.partner_id,
         i.item_name, c.full_name, c.phone
  FROM orders o
  JOIN b2b_partners p ON p.id = o.partner_id
  LEFT JOIN inventory i ON i.id = o.inventory_id
  LEFT JOIN customers c ON c.id = o.customer_id
  WHERE p.partner_user_id = auth.uid()
    AND p.status = 'active'
$$;

REVOKE EXECUTE ON FUNCTION public.partner_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partner_orders() TO authenticated;

-- ---------- Workers: only touch their own pending logs ----------
DROP POLICY IF EXISTS "Workers can manage their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Workers can view their own time logs" ON time_logs;
DROP POLICY IF EXISTS "Workers can log their own time" ON time_logs;
DROP POLICY IF EXISTS "Workers can edit their pending time logs" ON time_logs;
DROP POLICY IF EXISTS "Workers can delete their pending time logs" ON time_logs;

CREATE POLICY "Workers can view their own time logs"
  ON time_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.id = time_logs.worker_id
    AND team_members.worker_user_id = auth.uid()
  ));

CREATE POLICY "Workers can log their own time"
  ON time_logs FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = time_logs.worker_id
      AND team_members.worker_user_id = auth.uid()
    )
  );

CREATE POLICY "Workers can edit their pending time logs"
  ON time_logs FOR UPDATE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = time_logs.worker_id
      AND team_members.worker_user_id = auth.uid()
    )
  )
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.id = time_logs.worker_id
    AND team_members.worker_user_id = auth.uid()
  ));

CREATE POLICY "Workers can delete their pending time logs"
  ON time_logs FOR DELETE TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = time_logs.worker_id
      AND team_members.worker_user_id = auth.uid()
    )
  );

-- Workers may only set times and notes; pay fields stay under the roaster's control.
CREATE OR REPLACE FUNCTION public.time_logs_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roaster UUID;
  v_rate NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / SQL editor
  END IF;

  SELECT roaster_user_id, hourly_rate INTO v_roaster, v_rate
  FROM team_members
  WHERE id = CASE WHEN TG_OP = 'INSERT' THEN NEW.worker_id ELSE OLD.worker_id END;

  IF v_roaster = auth.uid() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.roaster_user_id := v_roaster;
    NEW.rate_snapshot := v_rate;
    NEW.status := 'pending';
    NEW.adjusted_hours := NULL;
    NEW.adjustment_note := NULL;
  ELSE
    NEW.worker_id := OLD.worker_id;
    NEW.roaster_user_id := OLD.roaster_user_id;
    NEW.rate_snapshot := OLD.rate_snapshot;
    NEW.status := OLD.status;
    NEW.adjusted_hours := OLD.adjusted_hours;
    NEW.adjustment_note := OLD.adjustment_note;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.time_logs_guard() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS time_logs_guard ON time_logs;
CREATE TRIGGER time_logs_guard
  BEFORE INSERT OR UPDATE ON time_logs
  FOR EACH ROW EXECUTE FUNCTION public.time_logs_guard();

-- ---------- Atomic green-lot shipping ----------
CREATE OR REPLACE FUNCTION public.ship_lot(p_id UUID, p_kg NUMERIC)
RETURNS green_coffee_lots
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_lot green_coffee_lots;
  v_available NUMERIC;
BEGIN
  IF p_kg IS NULL OR p_kg <= 0 THEN
    RAISE EXCEPTION 'Quantity to ship must be greater than 0.';
  END IF;

  UPDATE green_coffee_lots
  SET quantity_shipped_kg = quantity_shipped_kg + p_kg
  WHERE id = p_id
    AND (quantity_kg IS NULL OR quantity_shipped_kg + p_kg <= quantity_kg)
  RETURNING * INTO v_lot;

  IF NOT FOUND THEN
    SELECT quantity_kg - quantity_shipped_kg INTO v_available
    FROM green_coffee_lots WHERE id = p_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Lot not found.';
    END IF;
    RAISE EXCEPTION 'Cannot ship % kg — only % kg available', p_kg, round(v_available, 2);
  END IF;

  RETURN v_lot;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ship_lot(UUID, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ship_lot(UUID, NUMERIC) TO authenticated;

-- ---------- USD → business currency rate for USD-priced coffee ----------
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS usd_exchange_rate NUMERIC;
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_usd_exchange_rate_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_usd_exchange_rate_check
  CHECK (usd_exchange_rate IS NULL OR usd_exchange_rate > 0);

-- ---------- Deleting a customer/partner/worker must not erase history ----------
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;

ALTER TABLE roasting_orders DROP CONSTRAINT IF EXISTS roasting_orders_partner_id_fkey;
ALTER TABLE roasting_orders ADD CONSTRAINT roasting_orders_partner_id_fkey
  FOREIGN KEY (partner_id) REFERENCES b2b_partners(id) ON DELETE RESTRICT;

ALTER TABLE time_logs DROP CONSTRAINT IF EXISTS time_logs_worker_id_fkey;
ALTER TABLE time_logs ADD CONSTRAINT time_logs_worker_id_fkey
  FOREIGN KEY (worker_id) REFERENCES team_members(id) ON DELETE RESTRICT;
