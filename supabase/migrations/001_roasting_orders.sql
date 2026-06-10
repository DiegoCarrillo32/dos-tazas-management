-- ============================================================
-- Roasting Orders (B2B roasting service requests)
-- ============================================================
-- A roasting order is a partner asking their roaster to roast coffee as a
-- service. Unlike a regular `orders` row (a finished-coffee sale), it captures
-- the roasting-service cost breakdown (labor, energy, green coffee, packaging,
-- grinding) produced by the roasting calculator.
--
-- Idempotent: safe to run on an existing database. Also included at the end of
-- schema.sql for fresh setups.
-- ============================================================

CREATE TABLE IF NOT EXISTS roasting_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES b2b_partners(id) ON DELETE CASCADE,
  roaster_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Roast configuration (the partner's inputs)
  quantity_grams INTEGER NOT NULL,
  quantity_basis TEXT NOT NULL,        -- 'GREEN_INPUT' | 'ROASTED_OUTPUT'
  green_source TEXT NOT NULL,          -- 'CLIENT_PROVIDED' | 'WE_PROVIDE'
  green_tier_id TEXT,
  packaging TEXT NOT NULL,             -- 'CLIENT_HANDLES' | 'WE_PACKAGE'
  bag_option_id TEXT,
  bag_size_id TEXT,
  grinding TEXT NOT NULL,              -- 'CLIENT_HANDLES' | 'WE_GRIND'
  machine_id TEXT NOT NULL,

  -- Computed snapshot at submission time (authoritative, server-recomputed)
  green_grams_in INTEGER NOT NULL,
  roasted_grams_out INTEGER NOT NULL,
  batches_needed INTEGER NOT NULL,
  hours_required NUMERIC(10, 2) NOT NULL,
  bags_needed INTEGER,
  cost_breakdown JSONB NOT NULL,       -- { labor, energy, greenCoffee, packaging, grinding }
  total_cost NUMERIC(12, 2) NOT NULL,

  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'completed' | 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_roasting_orders_partner ON roasting_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_roasting_orders_roaster ON roasting_orders(roaster_user_id);

ALTER TABLE roasting_orders ENABLE ROW LEVEL SECURITY;

-- Roaster can see and manage roasting orders addressed to them.
DROP POLICY IF EXISTS "Roasters can manage their roasting orders" ON roasting_orders;
CREATE POLICY "Roasters can manage their roasting orders"
  ON roasting_orders FOR ALL TO authenticated
  USING (auth.uid() = roaster_user_id)
  WITH CHECK (auth.uid() = roaster_user_id);

-- Partner can see and manage roasting orders for their own partnership.
DROP POLICY IF EXISTS "Partners can manage their roasting orders" ON roasting_orders;
CREATE POLICY "Partners can manage their roasting orders"
  ON roasting_orders FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = roasting_orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = roasting_orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
    )
  );
