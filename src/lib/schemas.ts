import * as z from 'zod'

export const customerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
})

export const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  purchase_date: z.string().optional(),
})

export const greenCoffeeLotSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  origin: z.string().optional(),
  varietal: z.string().optional(),
  process: z.string().optional(),
  altitude: z.string().optional(),
  harvest_date: z.string().optional(),
  crop_year: z.string().optional(),
  quantity_kg: z.number().min(0, 'Must be 0 or more').nullable().optional(),
  quantity_shipped_kg: z.number().min(0, 'Must be 0 or more').optional(),
  cupping_score: z.number().min(0).max(100).nullable().optional(),
  moisture_content: z.number().min(0).max(100).nullable().optional(),
  screen_size: z.string().optional(),
  bag_count: z.number().int().min(0).nullable().optional(),
  bag_weight_kg: z.number().min(0).nullable().optional(),
})

export const inventorySchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  stock_grams: z.number().min(0, 'Quantity cannot be negative'),
  cost_per_kg: z.number().nullable().optional(),
  cost_currency: z.string().nullable().optional(),
  notes: z.string().optional(),
  low_stock_threshold_kg: z.number().min(0).nullable().optional(),
})

export const maintenanceSchema = z.object({
  maintenance_type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
})

export const orderSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  inventory_id: z.string().optional().nullable(),
  preparation_method: z.string().min(1, 'Preparation method is required'),
  roast_level: z.string().min(1, 'Roast level is required'),
  amount_grams: z.number().min(1, 'Amount must be greater than 0'),
  bag_count: z.number().min(1, 'At least 1 bag required').optional().nullable(),
  total_price: z.number().min(0, 'Cannot be negative'),
  origin_notes: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  partner_id: z.string().optional().nullable(),
})

export const recurringSchema = z.object({
  inventory_id: z.string().optional(),
  preparation_method: z.string().min(1, 'Preparation method is required'),
  roast_level: z.string().min(1, 'Roast level is required'),
  amount_grams: z.number().min(1, 'Amount must be greater than 0'),
  bag_count: z.number().min(1, 'At least 1 bag required'),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  day_of_week: z.number().min(0).max(6),
})

export const roastBatchSchema = z.object({
  equipment_id: z.string().optional().nullable(),
  green_lot_id: z.string().min(1, 'Green coffee lot is required'),
  weight_in_grams: z.number().min(1, 'Weight in must be greater than 0'),
  weight_out_grams: z.number().min(1, 'Weight out must be greater than 0'),
  roast_time_minutes: z.number().nullable().optional(),
  notes: z.string().optional(),
})

export const settingsSchema = z.object({
  business_name: z.string().optional(),
  roast_loss_percentage: z.number().min(0).max(100),
  currency_symbol: z.string().max(3, 'Max 3 chars').min(1, 'Required'),
  cost_per_bag: z.number().min(0),
  cost_per_sticker: z.number().min(0),
  cost_electricity: z.number().min(0),
  cost_fuel: z.number().min(0),
  cost_roasting_time: z.number().min(0),
  worker_name: z.string().optional(),
})
