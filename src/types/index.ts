// ============================================================
// Centralized types for Dos Tazas Management
// ============================================================

export type FulfillmentStatus = 'pending' | 'roasted' | 'delivered'
export type PaymentStatus = 'pending' | 'paid'

// Database row types
export type CustomerRecord = {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  address: string | null
  created_at: string
}

export type CustomerWithLastPurchase = CustomerRecord & {
  last_purchase_date: string | null
}

export type OrderRecord = {
  id: string
  user_id: string
  customer_id: string
  preparation_method: string
  roast_level: string
  amount_grams: number
  total_price: number
  fulfillment_status: FulfillmentStatus
  payment_status: PaymentStatus
  origin_notes: string | null
  inventory_id: string | null
  order_date: string
}

// Joined type for order + customer
export type OrderWithCustomer = OrderRecord & {
  customers: {
    full_name: string
    phone: string | null
  }
}

// Insert params (user_id is set server-side)
export type OrderInsertParams = {
  customer_id: string
  preparation_method: string
  roast_level: string
  amount_grams: number
  total_price: number
  origin_notes?: string | null
  inventory_id?: string | null
}

export type OrderUpdateParams = Partial<OrderInsertParams>

export type CustomerInsertParams = {
  full_name: string
  phone?: string | null
  address?: string | null
}

export type CustomerUpdateParams = Partial<CustomerInsertParams>

// Analytics types
export type AnalyticsFilters = {
  startDate?: string
  endDate?: string
  paymentStatus?: PaymentStatus | 'all'
  fulfillmentStatus?: FulfillmentStatus | 'all'
}

export type AnalyticsSummary = {
  totalRevenue: number
  totalCoffeeSoldGrams: number
  totalOrders: number
}

export type RevenueDataPoint = {
  date: string
  revenue: number
  orders: number
}

export type BreakdownItem = {
  name: string
  value: number
  count: number
}

// Inventory types
export type InventoryRecord = {
  id: string
  user_id: string
  item_name: string
  category: string
  stock_grams: number
  cost_per_kg: number | null
  notes: string | null
  created_at: string
}

export type InventoryInsertParams = {
  item_name: string
  category?: string
  stock_grams: number
  cost_per_kg?: number | null
  notes?: string | null
}

export type InventoryUpdateParams = Partial<InventoryInsertParams>

// --- Settings ---
export type UserSettingsRecord = {
  id: string
  user_id: string
  business_name: string | null
  roast_loss_percentage: number
  currency_symbol: string
  updated_at: string
}

export type UserSettingsUpdateParams = {
  business_name?: string | null
  roast_loss_percentage?: number
  currency_symbol?: string
}
