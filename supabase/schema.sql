-- ============================================================
-- Dos Tazas Management — Database Schema (Multi-User)
-- ============================================================
-- Run this in Supabase SQL Editor to set up your database.
-- This replaces the previous schema. If tables exist, drop them first.
-- ============================================================

-- Drop existing policies and tables if they exist (for clean migration)
DROP POLICY IF EXISTS "Allow full access to authenticated users for orders" ON orders;
DROP POLICY IF EXISTS "Allow full access to authenticated users for customers" ON customers;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS customers;
DROP TYPE IF EXISTS fulfillment_status_type;
DROP TYPE IF EXISTS payment_status_type;

-- Enum definitions
CREATE TYPE fulfillment_status_type AS ENUM ('pending', 'roasted', 'delivered');
CREATE TYPE payment_status_type AS ENUM ('pending', 'paid');

-- Customers table (scoped to user)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders table (scoped to user)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  preparation_method TEXT NOT NULL,
  roast_level TEXT NOT NULL,
  amount_grams INTEGER NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL,
  fulfillment_status fulfillment_status_type NOT NULL DEFAULT 'pending',
  payment_status payment_status_type NOT NULL DEFAULT 'pending',
  origin_notes TEXT,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for user_id lookups
CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can manage their own customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Inventory Module
-- ============================================================

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'green_coffee',
  stock_grams INTEGER NOT NULL DEFAULT 0,
  cost_per_kg NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_inventory_user_id ON inventory(user_id);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inventory"
  ON inventory
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can view roaster inventory"
  ON inventory FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.roaster_user_id = inventory.user_id
      AND b2b_partners.partner_user_id = auth.uid()
    )
  );

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  roast_loss_percentage INTEGER NOT NULL DEFAULT 20,
  currency_symbol TEXT NOT NULL DEFAULT '$',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Cost & Revenue Tracking
-- ============================================================

-- Overhead cost rates in user_settings
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS cost_per_bag NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS cost_per_sticker NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS cost_electricity_per_order NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS cost_fuel_per_order NUMERIC(10,2) NOT NULL DEFAULT 0;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS cost_roasting_time_per_order NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Per-order cost tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bag_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_cost NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cost_breakdown JSONB;

-- ============================================================
-- Cropster-inspired Enhancements
-- ============================================================

-- Equipment Table
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., 'roaster', 'espresso_machine', 'grinder'
  manufacturer TEXT,
  model TEXT,
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_equipment_user_id ON equipment(user_id);
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own equipment"
  ON equipment FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Maintenance Logs Table
CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- e.g., 'cleaning', 'repair', 'part_replacement'
  description TEXT NOT NULL,
  cost NUMERIC(10, 2) DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_maintenance_logs_user_id ON maintenance_logs(user_id);
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own maintenance_logs"
  ON maintenance_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Green Coffee Lots Table
CREATE TABLE green_coffee_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  origin TEXT,
  varietal TEXT,
  process TEXT,
  altitude TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_green_coffee_lots_user_id ON green_coffee_lots(user_id);
ALTER TABLE green_coffee_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own green_coffee_lots"
  ON green_coffee_lots FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Roast Batches Table
CREATE TABLE roast_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  green_lot_id UUID NOT NULL REFERENCES green_coffee_lots(id) ON DELETE CASCADE,
  weight_in_grams INTEGER NOT NULL,
  weight_out_grams INTEGER NOT NULL,
  roast_time_minutes NUMERIC(5, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_roast_batches_user_id ON roast_batches(user_id);
ALTER TABLE roast_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own roast_batches"
  ON roast_batches FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- B2B Partner Portal
-- ============================================================

-- User Profiles: distinguishes roasters from partners and workers
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'roaster', -- 'roaster' | 'partner' | 'worker'
  linked_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- partner/worker → roaster link
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- B2B Partners: connection between roaster and wholesale client
CREATE TABLE b2b_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roaster_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- null until partner creates account
  invite_code TEXT NOT NULL UNIQUE,
  invite_email TEXT,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active' | 'revoked'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_b2b_partners_roaster ON b2b_partners(roaster_user_id);
CREATE INDEX idx_b2b_partners_partner ON b2b_partners(partner_user_id);
CREATE INDEX idx_b2b_partners_invite_code ON b2b_partners(invite_code);
ALTER TABLE b2b_partners ENABLE ROW LEVEL SECURITY;
-- Roaster can see their own partners
CREATE POLICY "Roasters can manage their partners"
  ON b2b_partners FOR ALL TO authenticated
  USING (auth.uid() = roaster_user_id) WITH CHECK (auth.uid() = roaster_user_id);
-- Partners can see their own connection
CREATE POLICY "Partners can view own row"
  ON b2b_partners FOR SELECT TO authenticated
  USING (partner_user_id = auth.uid());

CREATE POLICY "Partners can claim invite"
  ON b2b_partners FOR UPDATE TO authenticated
  USING (status = 'pending' AND invite_code IS NOT NULL)
  WITH CHECK (status = 'active' AND partner_user_id = auth.uid());
-- Anyone can view pending invites to validate code
CREATE POLICY "Anyone can view pending invites"
  ON b2b_partners FOR SELECT TO anon
  USING (status = 'pending');
CREATE POLICY "Authenticated users can view pending invites"
  ON b2b_partners FOR SELECT TO authenticated
  USING (status = 'pending');

-- B2B Custom Pricing: per-partner, per-inventory-item pricing
CREATE TABLE b2b_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES b2b_partners(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  price_per_kg NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(partner_id, inventory_id)
);

CREATE INDEX idx_b2b_pricing_partner ON b2b_pricing(partner_id);
ALTER TABLE b2b_pricing ENABLE ROW LEVEL SECURITY;
-- Roaster manages pricing through partner ownership
CREATE POLICY "Roasters can manage pricing"
  ON b2b_pricing FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_pricing.partner_id
      AND b2b_partners.roaster_user_id = auth.uid()
    )
  );
-- Partners can view their own pricing
CREATE POLICY "Partners can view their pricing"
  ON b2b_pricing FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_pricing.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
    )
  );

-- B2B Recurring Order Templates
CREATE TABLE b2b_recurring_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES b2b_partners(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  preparation_method TEXT NOT NULL,
  roast_level TEXT NOT NULL,
  amount_grams INTEGER NOT NULL,
  bag_count INTEGER NOT NULL DEFAULT 1,
  frequency TEXT NOT NULL DEFAULT 'weekly', -- 'weekly' | 'biweekly' | 'monthly'
  day_of_week INTEGER NOT NULL DEFAULT 1,   -- 0=Sun, 1=Mon, ... 6=Sat
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_b2b_recurring_partner ON b2b_recurring_orders(partner_id);
ALTER TABLE b2b_recurring_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Roasters can manage recurring orders"
  ON b2b_recurring_orders FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_recurring_orders.partner_id
      AND b2b_partners.roaster_user_id = auth.uid()
    )
  );
CREATE POLICY "Partners can manage their recurring orders"
  ON b2b_recurring_orders FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = b2b_recurring_orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
    )
  );

-- ============================================================
-- B2B Orders Integration
-- ============================================================

-- Make orders B2B friendly
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES b2b_partners(id) ON DELETE SET NULL;

CREATE POLICY "Partners can view their own orders"
  ON orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM b2b_partners
      WHERE b2b_partners.id = orders.partner_id
      AND b2b_partners.partner_user_id = auth.uid()
    )
  );

-- ============================================================
-- Team & Time Tracker Module
-- ============================================================

-- Team Members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roaster_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  worker_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT '',
  invite_code TEXT NOT NULL UNIQUE,
  hourly_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'active'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_team_members_roaster ON team_members(roaster_user_id);
CREATE INDEX idx_team_members_worker ON team_members(worker_user_id);
CREATE INDEX idx_team_members_invite_code ON team_members(invite_code);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roasters can manage their team"
  ON team_members FOR ALL TO authenticated
  USING (auth.uid() = roaster_user_id) WITH CHECK (auth.uid() = roaster_user_id);

CREATE POLICY "Workers can view own row"
  ON team_members FOR SELECT TO authenticated
  USING (worker_user_id = auth.uid());

CREATE POLICY "Workers can claim invite"
  ON team_members FOR UPDATE TO authenticated
  USING (status = 'pending' AND invite_code IS NOT NULL)
  WITH CHECK (status = 'active' AND worker_user_id = auth.uid());

CREATE POLICY "Anyone can view pending team invites"
  ON team_members FOR SELECT TO anon
  USING (status = 'pending');
CREATE POLICY "Authenticated users can view pending team invites"
  ON team_members FOR SELECT TO authenticated
  USING (status = 'pending');

-- Time Logs
CREATE TABLE time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  roaster_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_time_logs_worker ON time_logs(worker_id);
CREATE INDEX idx_time_logs_roaster ON time_logs(roaster_user_id);
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roasters can manage team time logs"
  ON time_logs FOR ALL TO authenticated
  USING (auth.uid() = roaster_user_id) WITH CHECK (auth.uid() = roaster_user_id);

CREATE POLICY "Workers can manage their own time logs"
  ON time_logs FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = time_logs.worker_id
      AND team_members.worker_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.id = time_logs.worker_id
      AND team_members.worker_user_id = auth.uid()
    )
  );

-- Allow workers to view their roaster's orders
CREATE POLICY "Workers can view roaster orders"
  ON orders FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.roaster_user_id = orders.user_id
      AND team_members.worker_user_id = auth.uid()
    )
  );

-- ============================================================
-- Roasting Orders (B2B roasting service requests)
-- ============================================================
-- A partner asks their roaster to roast coffee as a service. Captures the
-- roasting-service cost breakdown from the roasting calculator. Distinct from a
-- regular `orders` row (a finished-coffee sale).

CREATE TABLE roasting_orders (
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

CREATE INDEX idx_roasting_orders_partner ON roasting_orders(partner_id);
CREATE INDEX idx_roasting_orders_roaster ON roasting_orders(roaster_user_id);

ALTER TABLE roasting_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roasters can manage their roasting orders"
  ON roasting_orders FOR ALL TO authenticated
  USING (auth.uid() = roaster_user_id)
  WITH CHECK (auth.uid() = roaster_user_id);

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
