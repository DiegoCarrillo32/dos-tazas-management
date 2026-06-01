import { describe, it, expect } from 'vitest'
import type {
  EquipmentRecord,
  EquipmentInsertParams,
  MaintenanceLogRecord,
  MaintenanceLogInsertParams,
  GreenCoffeeLotRecord,
  RoastBatchRecord,
  RoastBatchInsertParams,
  OrderRecord,
  OrderWithCustomer,
} from './index'

describe('Type shapes and data contracts', () => {
  describe('EquipmentRecord', () => {
    it('should accept a valid equipment record shape', () => {
      const record: EquipmentRecord = {
        id: 'eq-001',
        user_id: 'user-001',
        name: 'Probat P12',
        type: 'roaster',
        manufacturer: 'Probat',
        model: 'P12',
        purchase_date: '2024-01-15',
        created_at: '2024-01-15T00:00:00Z',
      }
      expect(record.name).toBe('Probat P12')
      expect(record.type).toBe('roaster')
    })

    it('should allow nullable fields', () => {
      const record: EquipmentRecord = {
        id: 'eq-002',
        user_id: 'user-001',
        name: 'Grinder X',
        type: 'grinder',
        manufacturer: null,
        model: null,
        purchase_date: null,
        created_at: '2024-01-15T00:00:00Z',
      }
      expect(record.manufacturer).toBeNull()
      expect(record.model).toBeNull()
      expect(record.purchase_date).toBeNull()
    })
  })

  describe('EquipmentInsertParams', () => {
    it('should have the correct insert shape (no id, user_id, or created_at)', () => {
      const params: EquipmentInsertParams = {
        name: 'New Roaster',
        type: 'roaster',
        manufacturer: 'Diedrich',
        model: 'IR-12',
        purchase_date: '2024-06-01',
      }
      // Ensure it compiles correctly and has no id/user_id
      expect(params).not.toHaveProperty('id')
      expect(params).not.toHaveProperty('user_id')
      expect(params).not.toHaveProperty('created_at')
      expect(params.name).toBe('New Roaster')
    })
  })

  describe('MaintenanceLogRecord', () => {
    it('should accept a valid maintenance log shape', () => {
      const log: MaintenanceLogRecord = {
        id: 'ml-001',
        user_id: 'user-001',
        equipment_id: 'eq-001',
        maintenance_type: 'cleaning',
        description: 'Deep clean of burrs',
        cost: 25.0,
        date: '2024-03-15',
        created_at: '2024-03-15T00:00:00Z',
      }
      expect(log.maintenance_type).toBe('cleaning')
      expect(log.cost).toBe(25.0)
    })

    it('should allow null cost', () => {
      const log: MaintenanceLogRecord = {
        id: 'ml-002',
        user_id: 'user-001',
        equipment_id: 'eq-001',
        maintenance_type: 'inspection',
        description: 'Routine check',
        cost: null,
        date: '2024-04-01',
        created_at: '2024-04-01T00:00:00Z',
      }
      expect(log.cost).toBeNull()
    })
  })

  describe('MaintenanceLogInsertParams', () => {
    it('should include equipment_id but not id or user_id', () => {
      const params: MaintenanceLogInsertParams = {
        equipment_id: 'eq-001',
        maintenance_type: 'repair',
        description: 'Replaced heating element',
        cost: 150.0,
        date: '2024-05-20',
      }
      expect(params).not.toHaveProperty('id')
      expect(params).not.toHaveProperty('user_id')
      expect(params.equipment_id).toBe('eq-001')
    })
  })

  describe('GreenCoffeeLotRecord', () => {
    it('should accept a valid green coffee lot shape', () => {
      const lot: GreenCoffeeLotRecord = {
        id: 'lot-001',
        user_id: 'user-001',
        inventory_id: 'inv-001',
        name: 'Ethiopia Yirgacheffe Lot 23',
        origin: 'Ethiopia',
        varietal: 'Heirloom',
        process: 'Washed',
        altitude: '1900-2100 masl',
        created_at: '2024-02-01T00:00:00Z',
      }
      expect(lot.origin).toBe('Ethiopia')
      expect(lot.varietal).toBe('Heirloom')
      expect(lot.process).toBe('Washed')
    })

    it('should allow all optional fields to be null', () => {
      const lot: GreenCoffeeLotRecord = {
        id: 'lot-002',
        user_id: 'user-001',
        inventory_id: 'inv-002',
        name: 'Unknown Lot',
        origin: null,
        varietal: null,
        process: null,
        altitude: null,
        created_at: '2024-02-01T00:00:00Z',
      }
      expect(lot.origin).toBeNull()
      expect(lot.varietal).toBeNull()
    })
  })

  describe('RoastBatchRecord', () => {
    it('should accept a valid roast batch shape', () => {
      const batch: RoastBatchRecord = {
        id: 'rb-001',
        user_id: 'user-001',
        equipment_id: 'eq-001',
        green_lot_id: 'lot-001',
        weight_in_grams: 12000,
        weight_out_grams: 9800,
        roast_time_minutes: 14.5,
        notes: 'First crack at 10 min, city roast',
        created_at: '2024-03-10T00:00:00Z',
      }
      expect(batch.weight_in_grams).toBe(12000)
      expect(batch.weight_out_grams).toBe(9800)
    })

    it('should compute yield correctly from batch data', () => {
      const batch: RoastBatchRecord = {
        id: 'rb-002',
        user_id: 'user-001',
        equipment_id: null,
        green_lot_id: 'lot-001',
        weight_in_grams: 10000,
        weight_out_grams: 8200,
        roast_time_minutes: null,
        notes: null,
        created_at: '2024-03-10T00:00:00Z',
      }
      const yieldPct = (batch.weight_out_grams / batch.weight_in_grams) * 100
      expect(yieldPct).toBe(82)
    })

    it('should have optional joined fields for equipment_name and green_lot_name', () => {
      const batch: RoastBatchRecord = {
        id: 'rb-003',
        user_id: 'user-001',
        equipment_id: 'eq-001',
        green_lot_id: 'lot-001',
        weight_in_grams: 5000,
        weight_out_grams: 4100,
        roast_time_minutes: 12,
        notes: null,
        created_at: '2024-03-10T00:00:00Z',
        equipment_name: 'Probat P12',
        green_lot_name: 'Ethiopia Yirgacheffe',
      }
      expect(batch.equipment_name).toBe('Probat P12')
      expect(batch.green_lot_name).toBe('Ethiopia Yirgacheffe')
    })
  })

  describe('RoastBatchInsertParams', () => {
    it('should omit id, user_id, created_at, and joined fields', () => {
      const params: RoastBatchInsertParams = {
        equipment_id: 'eq-001',
        green_lot_id: 'lot-001',
        weight_in_grams: 10000,
        weight_out_grams: 8200,
        roast_time_minutes: 13,
        notes: 'Smooth roast',
      }
      expect(params).not.toHaveProperty('id')
      expect(params).not.toHaveProperty('user_id')
      expect(params).not.toHaveProperty('created_at')
      expect(params).not.toHaveProperty('equipment_name')
      expect(params).not.toHaveProperty('green_lot_name')
    })
  })

  describe('OrderRecord with B2B company_name', () => {
    it('should support company_name for B2B orders', () => {
      const order: OrderRecord = {
        id: 'ord-001',
        user_id: 'user-001',
        customer_id: 'cust-001',
        partner_id: null,
        preparation_method: 'Whole Bean',
        roast_level: 'Medium',
        amount_grams: 5000,
        total_price: 150.0,
        fulfillment_status: 'pending',
        payment_status: 'pending',
        origin_notes: null,
        inventory_id: 'inv-001',
        order_date: '2024-05-01T00:00:00Z',
        bag_count: 5,
        total_cost: 80.0,
        cost_breakdown: null,
        company_name: 'Central Perk Cafe',
      }
      expect(order.company_name).toBe('Central Perk Cafe')
    })

    it('should allow null company_name for non-B2B orders', () => {
      const order: OrderRecord = {
        id: 'ord-002',
        user_id: 'user-001',
        customer_id: 'cust-002',
        partner_id: null,
        preparation_method: 'Drip',
        roast_level: 'Dark',
        amount_grams: 500,
        total_price: 12.0,
        fulfillment_status: 'delivered',
        payment_status: 'paid',
        origin_notes: 'Guatemala SHB',
        inventory_id: null,
        order_date: '2024-05-10T00:00:00Z',
        bag_count: 1,
        total_cost: 5.5,
        cost_breakdown: { coffee: 3, bag: 0.5, sticker: 0.15, electricity: 0.6, fuel: 0.4, roasting_time: 0.85 },
        company_name: null,
      }
      expect(order.company_name).toBeNull()
      expect(order.cost_breakdown?.coffee).toBe(3)
    })
  })

  describe('OrderWithCustomer joined type', () => {
    it('should include nested customer and optional inventory data', () => {
      const order: OrderWithCustomer = {
        id: 'ord-001',
        user_id: 'user-001',
        customer_id: 'cust-001',
        partner_id: null,
        preparation_method: 'Whole Bean',
        roast_level: 'Medium',
        amount_grams: 5000,
        total_price: 150.0,
        fulfillment_status: 'pending',
        payment_status: 'pending',
        origin_notes: null,
        inventory_id: 'inv-001',
        order_date: '2024-05-01T00:00:00Z',
        bag_count: 5,
        total_cost: 80.0,
        cost_breakdown: null,
        company_name: 'Central Perk',
        customers: {
          full_name: 'Gunther',
          phone: '555-1234',
        },
        inventory: {
          item_name: 'Ethiopian Sidamo',
        },
      }
      expect(order.customers.full_name).toBe('Gunther')
      expect(order.inventory?.item_name).toBe('Ethiopian Sidamo')
    })
  })
})
