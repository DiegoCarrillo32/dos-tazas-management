-- ============================================================
-- Security hardening + atomic stock adjustments
-- ============================================================
-- * Invites are no longer readable/claimable through table policies; they are
--   validated and claimed through SECURITY DEFINER functions.
-- * Users can no longer change their own role / linked_to.
-- * Revoked partners lose access (every partner policy checks status).
-- * Partners can only read + insert roasting orders; cancel via RPC.
-- * Stock is adjusted in a single UPDATE (no read-modify-write races) and
--   orders remember how much raw coffee they consumed.
--
-- Idempotent: safe to run on an existing database. Also mirrored in schema.sql.
-- ============================================================

-- ---------- Invites ----------
DROP POLICY IF EXISTS "Anyone can view pending invites" ON b2b_partners;
DROP POLICY IF EXISTS "Authenticated users can view pending invites" ON b2b_partners;
DROP POLICY IF EXISTS "Partners can claim invite" ON b2b_partners;
DROP POLICY IF EXISTS "Anyone can view pending team invites" ON team_members;
DROP POLICY IF EXISTS "Authenticated users can view pending team invites" ON team_members;
DROP POLICY IF EXISTS "Workers can claim invite" ON team_members;

-- Returns the kind of a pending invite ('partner' | 'worker'), or no row.
CREATE OR REPLACE FUNCTION get_invite(p_code TEXT)
RETURNS TABLE (kind TEXT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT 'partner' FROM b2b_partners WHERE invite_code = p_code AND status = 'pending'
  UNION ALL
  SELECT 'worker' FROM team_members WHERE invite_code = p_code AND status = 'pending'
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION get_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_invite(TEXT) TO anon, authenticated;

-- Claims a pending invite for the current user and sets their profile.
-- Returns the kind claimed.
CREATE OR REPLACE FUNCTION claim_invite(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_roaster UUID;
  v_kind TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_uid AND role IN ('partner', 'worker'))
     OR EXISTS (SELECT 1 FROM b2b_partners WHERE roaster_user_id = v_uid)
     OR EXISTS (SELECT 1 FROM team_members WHERE roaster_user_id = v_uid) THEN
    RAISE EXCEPTION 'This account is already linked to a business.';
  END IF;

  UPDATE b2b_partners SET partner_user_id = v_uid, status = 'active'
  WHERE invite_code = p_code AND status = 'pending'
  RETURNING roaster_user_id INTO v_roaster;

  IF FOUND THEN
    v_kind := 'partner';
  ELSE
    UPDATE team_members SET worker_user_id = v_uid, status = 'active'
    WHERE invite_code = p_code AND status = 'pending'
    RETURNING roaster_user_id INTO v_roaster;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid or expired invite code.';
    END IF;
    v_kind := 'worker';
  END IF;

  INSERT INTO user_profiles (user_id, role, linked_to)
  VALUES (v_uid, v_kind, v_roaster)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, linked_to = EXCLUDED.linked_to;

  RETURN v_kind;
END;
$$;
REVOKE ALL ON FUNCTION claim_invite(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION claim_invite(TEXT) TO authenticated;

-- ---------- User profiles ----------
-- Users may only create a plain roaster profile for themselves; partner/worker
-- profiles come from claim_invite. No self-updates.
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'roaster' AND linked_to IS NULL);

-- ---------- Workers ----------
CREATE OR REPLACE FUNCTION update_my_worker_name(p_name TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE team_members SET name = left(trim(p_name), 100)
  WHERE worker_user_id = auth.uid() AND status = 'active';
END;
$$;
REVOKE ALL ON FUNCTION update_my_worker_name(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_my_worker_name(TEXT) TO authenticated;

-- ---------- Partner policies: require an active partnership ----------
DROP POLICY IF EXISTS "Partners can view roaster inventory" ON inventory;
CREATE POLICY "Partners can view roaster inventory"
  ON inventory FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.roaster_user_id = inventory.user_id
      AND b2b_partners.partner_user_id = auth.uid()
      AND b2b_partners.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Roasters can manage pricing" ON b2b_pricing;
CREATE POLICY "Roasters can manage pricing"
  ON b2b_pricing FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_pricing.partner_id
      AND b2b_partners.roaster_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_pricing.partner_id
      AND b2b_partners.roaster_user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM inventory
      WHERE inventory.id = b2b_pricing.inventory_id
      AND inventory.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partners can view their pricing" ON b2b_pricing;
CREATE POLICY "Partners can view their pricing"
  ON b2b_pricing FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_pricing.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
      AND b2b_partners.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Partners can manage their recurring orders" ON b2b_recurring_orders;
CREATE POLICY "Partners can manage their recurring orders"
  ON b2b_recurring_orders FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_recurring_orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
      AND b2b_partners.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Partners can view their own orders" ON orders;
CREATE POLICY "Partners can view their own orders"
  ON orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
      AND b2b_partners.status = 'active'
    )
  );

-- ---------- Roasting orders: partners read + insert only ----------
DROP POLICY IF EXISTS "Partners can manage their roasting orders" ON roasting_orders;
DROP POLICY IF EXISTS "Partners can view their roasting orders" ON roasting_orders;
DROP POLICY IF EXISTS "Partners can create roasting orders" ON roasting_orders;
CREATE POLICY "Partners can view their roasting orders"
  ON roasting_orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = roasting_orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
      AND b2b_partners.status = 'active'
    )
  );
CREATE POLICY "Partners can create roasting orders"
  ON roasting_orders FOR INSERT TO authenticated
  WITH CHECK (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = roasting_orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
      AND b2b_partners.roaster_user_id = roasting_orders.roaster_user_id
      AND b2b_partners.status = 'active'
    )
  );

CREATE OR REPLACE FUNCTION cancel_roasting_order(p_id UUID)
RETURNS roasting_orders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_row roasting_orders;
BEGIN
  UPDATE roasting_orders SET status = 'cancelled'
  WHERE id = p_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = roasting_orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
      AND b2b_partners.status = 'active'
    )
  RETURNING * INTO v_row;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only your own pending roasting orders can be cancelled.';
  END IF;
  RETURN v_row;
END;
$$;
REVOKE ALL ON FUNCTION cancel_roasting_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_roasting_order(UUID) TO authenticated;

-- ---------- Stock ----------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS raw_grams_used INTEGER;

-- Atomically adds p_delta grams (negative to deduct). Runs as the caller, so
-- inventory RLS limits it to the owner. Returns the new stock level.
CREATE OR REPLACE FUNCTION adjust_stock(p_inventory_id UUID, p_delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  UPDATE inventory SET stock_grams = stock_grams + p_delta
  WHERE id = p_inventory_id AND user_id = auth.uid()
  RETURNING stock_grams INTO v_stock;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inventory item not found.';
  END IF;
  RETURN v_stock;
END;
$$;
REVOKE ALL ON FUNCTION adjust_stock(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION adjust_stock(UUID, INTEGER) TO authenticated;

-- ---------- Indexes ----------
CREATE INDEX IF NOT EXISTS idx_orders_user_status_date
  ON orders(user_id, fulfillment_status, payment_status, order_date DESC);
