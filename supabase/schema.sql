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
