-- ============================================================
-- Production Cost Model
-- ============================================================
-- Replaces the hand-typed `roast_loss_percentage` with a roaster spec
-- (capacity, green input and roasted output per roast) that yield/loss is
-- derived from, adds an hourly-rate + roasts-per-hour labor model that
-- roasting labor cost is derived from, and adds a `bag_types` catalog so
-- each order can carry its own bag cost instead of one global rate.
--
-- Idempotent: safe to run on an existing database. Also included at the end
-- of schema.sql for fresh setups.
-- ============================================================

-- Roaster spec (replaces roast_loss_percentage — yield/loss is now derived
-- from green_input_per_roast_grams and roasted_output_per_roast_grams).
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS roaster_capacity_grams INTEGER NOT NULL DEFAULT 1200;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS green_input_per_roast_grams INTEGER NOT NULL DEFAULT 960;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS roasted_output_per_roast_grams INTEGER NOT NULL DEFAULT 760;
ALTER TABLE user_settings DROP COLUMN IF EXISTS roast_loss_percentage;

-- Roasting labor (replaces the flat cost_roasting_time_per_order — labor
-- cost per unit is now derived from hourly rate and roasts per hour).
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS labor_hourly_rate NUMERIC(10,2) NOT NULL DEFAULT 1600;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS roasts_per_hour NUMERIC(10,2) NOT NULL DEFAULT 3;
ALTER TABLE user_settings DROP COLUMN IF EXISTS cost_roasting_time_per_order;

-- Bag types — each bag type has its own cost (and size, if relevant), so an
-- order's bag cost reflects the actual bag used instead of one flat rate.
CREATE TABLE IF NOT EXISTS bag_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size_grams INTEGER,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bag_types_user_id ON bag_types(user_id);

ALTER TABLE bag_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own bag types" ON bag_types;
CREATE POLICY "Users can manage their own bag types"
  ON bag_types
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Orders reference the bag type used for their production cost breakdown.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bag_type_id UUID REFERENCES bag_types(id) ON DELETE SET NULL;
ALTER TABLE b2b_recurring_orders ADD COLUMN IF NOT EXISTS bag_type_id UUID REFERENCES bag_types(id) ON DELETE SET NULL;
