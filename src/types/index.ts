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
  company_name?: string | null
}

export type CustomerWithLastPurchase = CustomerRecord & {
  last_purchase_date: string | null
}

export type CostBreakdown = {
  coffee: number
  bag: number
  sticker: number
  electricity: number
  fuel: number
  roasting_time: number
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
  bag_count: number
  total_cost: number | null
  cost_breakdown: CostBreakdown | null
  company_name: string | null
  partner_id: string | null
}

// Joined type for order + customer
export type OrderWithCustomer = OrderRecord & {
  customers: {
    full_name: string
    phone: string | null
  }
  inventory?: {
    item_name: string
  } | null
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
  bag_count?: number
  company_name?: string | null
  partner_id?: string | null
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
  totalCost: number
  totalProfit: number
}

export type RevenueDataPoint = {
  date: string
  revenue: number
  orders: number
  cost: number
  profit: number
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
  cost_per_bag: number
  cost_per_sticker: number
  cost_electricity_per_order: number
  cost_fuel_per_order: number
  cost_roasting_time_per_order: number
  updated_at: string
}

export type UserSettingsUpdateParams = {
  business_name?: string | null
  roast_loss_percentage?: number
  currency_symbol?: string
  cost_per_bag?: number
  cost_per_sticker?: number
  cost_electricity_per_order?: number
  cost_fuel_per_order?: number
  cost_roasting_time_per_order?: number
}

// --- Equipment ---
export type EquipmentRecord = {
  id: string
  user_id: string
  name: string
  type: string
  manufacturer: string | null
  model: string | null
  purchase_date: string | null
  created_at: string
}

export type EquipmentInsertParams = Omit<EquipmentRecord, 'id' | 'user_id' | 'created_at'>
export type EquipmentUpdateParams = Partial<EquipmentInsertParams>

// --- Maintenance Logs ---
export type MaintenanceLogRecord = {
  id: string
  user_id: string
  equipment_id: string
  maintenance_type: string
  description: string
  cost: number | null
  date: string
  created_at: string
}

export type MaintenanceLogInsertParams = Omit<MaintenanceLogRecord, 'id' | 'user_id' | 'created_at'>
export type MaintenanceLogUpdateParams = Partial<MaintenanceLogInsertParams>

// --- Green Coffee Lots ---
export type GreenCoffeeLotRecord = {
  id: string
  user_id: string
  inventory_id: string
  name: string
  origin: string | null
  varietal: string | null
  process: string | null
  altitude: string | null
  created_at: string
}

export type GreenCoffeeLotInsertParams = Omit<GreenCoffeeLotRecord, 'id' | 'user_id' | 'created_at'>
export type GreenCoffeeLotUpdateParams = Partial<GreenCoffeeLotInsertParams>

// --- Roast Batches ---
export type RoastBatchRecord = {
  id: string
  user_id: string
  equipment_id: string | null
  green_lot_id: string
  weight_in_grams: number
  weight_out_grams: number
  roast_time_minutes: number | null
  notes: string | null
  created_at: string
  equipment_name?: string
  green_lot_name?: string
}

export type RoastBatchInsertParams = Omit<RoastBatchRecord, 'id' | 'user_id' | 'created_at' | 'equipment_name' | 'green_lot_name'>
export type RoastBatchUpdateParams = Partial<RoastBatchInsertParams>

// ============================================================
// B2B Partner Portal Types
// ============================================================

export type UserRole = 'roaster' | 'partner'
export type PartnerStatus = 'pending' | 'active' | 'revoked'
export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly'

export type UserProfileRecord = {
  id: string
  user_id: string
  role: UserRole
  linked_to: string | null
  created_at: string
}

export type B2BPartnerRecord = {
  id: string
  roaster_user_id: string
  partner_user_id: string | null
  invite_code: string
  invite_email: string | null
  company_name: string
  contact_name: string | null
  contact_phone: string | null
  status: PartnerStatus
  created_at: string
}

export type B2BPricingRecord = {
  id: string
  partner_id: string
  inventory_id: string
  price_per_kg: number
  created_at: string
  inventory?: {
    item_name: string
  } | null
}

export type B2BRecurringOrderRecord = {
  id: string
  partner_id: string
  inventory_id: string | null
  preparation_method: string
  roast_level: string
  amount_grams: number
  bag_count: number
  frequency: RecurringFrequency
  day_of_week: number
  is_active: boolean
  created_at: string
  inventory?: {
    item_name: string
  } | null
}

export type B2BPartnerInsertParams = Omit<B2BPartnerRecord, 'id' | 'roaster_user_id' | 'partner_user_id' | 'invite_code' | 'status' | 'created_at'>
export type B2BPricingInsertParams = Omit<B2BPricingRecord, 'id' | 'created_at'>
export type B2BPricingUpdateParams = Partial<Omit<B2BPricingRecord, 'id' | 'created_at' | 'partner_id' | 'inventory_id'>>
export type B2BRecurringOrderInsertParams = Omit<B2BRecurringOrderRecord, 'id' | 'created_at'>
export type B2BRecurringOrderUpdateParams = Partial<Omit<B2BRecurringOrderRecord, 'id' | 'created_at'>>

