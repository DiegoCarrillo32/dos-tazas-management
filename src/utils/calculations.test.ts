import { describe, it, expect } from 'vitest'
import { calculateRawGrams, calculateOrderCosts, calculateYieldPercentage, calculateGreenCoffeeNeeded, aggregatePendingB2BOrders } from './calculations'
import type { UserSettingsRecord } from '@/types'

describe('calculations', () => {
  const mockSettings: UserSettingsRecord = {
    id: 'test-settings-id',
    user_id: 'test-user-id',
    business_name: 'Test Roastery',
    roast_loss_percentage: 20, // 20% loss means yield is 80% of raw grams
    currency_symbol: '$',
    cost_per_bag: 0.50,
    cost_per_sticker: 0.15,
    cost_electricity_per_order: 1.20,
    cost_fuel_per_order: 0.80,
    cost_roasting_time_per_order: 3.50,
    updated_at: new Date().toISOString()
  }

  describe('calculateRawGrams', () => {
    it('calculates raw grams correctly with 20% roast loss', () => {
      // 1000g of roasted yield at 20% loss needs 1000 / 0.8 = 1250g
      const result = calculateRawGrams(1000, 20)
      expect(result).toBe(1250)
    })

    it('rounds up to the nearest integer', () => {
      // 343g yield at 15% loss: 343 / 0.85 = 403.529g -> rounded up to 404g
      const result = calculateRawGrams(343, 15)
      expect(result).toBe(404)
    })

    it('handles 0% roast loss', () => {
      const result = calculateRawGrams(500, 0)
      expect(result).toBe(500)
    })
  })

  describe('calculateOrderCosts', () => {
    it('calculates order cost details correctly when coffee bean is provided', () => {
      // Inputs: 1000g coffee, 2 bags, $10.00/kg coffee bean cost
      const result = calculateOrderCosts({
        amountGrams: 1000,
        bagCount: 2,
        settings: mockSettings,
        costPerKg: 10.00
      })

      // Raw grams needed: 1000 / 0.8 = 1250g
      // Coffee cost: (1250 / 1000) * $10.00 = $12.50
      expect(result.rawGramsUsed).toBe(1250)
      expect(result.coffeeCost).toBe(12.50)

      // Packaging costs:
      // Bag: 2 * $0.50 = $1.00
      // Sticker: 2 * $0.15 = $0.30
      expect(result.bagCost).toBe(1.00)
      expect(result.stickerCost).toBe(0.30)

      // Fixed costs:
      // Electricity: $1.20
      // Fuel: $0.80
      // Roasting: $3.50
      expect(result.electricityCost).toBe(1.20)
      expect(result.fuelCost).toBe(0.80)
      expect(result.roastingTimeCost).toBe(3.50)

      // Breakdown matches expectation:
      expect(result.costBreakdown).toEqual({
        coffee: 12.50,
        bag: 1.00,
        sticker: 0.30,
        electricity: 1.20,
        fuel: 0.80,
        roasting_time: 3.50
      })

      // Total cost: 12.50 + 1.00 + 0.30 + 1.20 + 0.80 + 3.50 = 19.30
      expect(result.totalCost).toBe(19.30)
    })

    it('calculates cost breakdown correctly when no coffee bean is provided (manual input)', () => {
      const result = calculateOrderCosts({
        amountGrams: 500,
        bagCount: 1,
        settings: mockSettings,
        costPerKg: null
      })

      // No bean: coffee cost should be 0
      expect(result.coffeeCost).toBe(0)
      expect(result.bagCost).toBe(0.50)
      expect(result.stickerCost).toBe(0.15)
      
      // Total cost: 0 + 0.50 + 0.15 + 1.20 + 0.80 + 3.50 = 6.15
      expect(result.totalCost).toBe(6.15)
    })

    it('rounds currency results to 2 decimal places correctly', () => {
      // Let's use cost parameters that produce fractional cents
      const oddSettings: UserSettingsRecord = {
        ...mockSettings,
        cost_per_bag: 0.333,
        cost_per_sticker: 0.111
      }

      const result = calculateOrderCosts({
        amountGrams: 500,
        bagCount: 3,
        settings: oddSettings,
        costPerKg: 12.34
      })

      // Raw: 500 / 0.8 = 625g
      // Coffee cost: (625 / 1000) * 12.34 = 7.7125 -> rounds to 7.71
      expect(result.coffeeCost).toBe(7.71)

      // Bag: 3 * 0.333 = 0.999 -> rounds to 1.00
      expect(result.bagCost).toBe(1.00)

      // Sticker: 3 * 0.111 = 0.333 -> rounds to 0.33
      expect(result.stickerCost).toBe(0.33)

      // Sum of breakdown: 7.71 + 1.00 + 0.33 + 1.20 + 0.80 + 3.50 = 14.54
      expect(result.totalCost).toBe(14.54)
    })
  })

  describe('calculateYieldPercentage', () => {
    it('calculates the yield correctly', () => {
      const result = calculateYieldPercentage(1200, 1000)
      expect(result).toBe(83.3)
    })

    it('returns 0 if weightIn is 0', () => {
      const result = calculateYieldPercentage(0, 1000)
      expect(result).toBe(0)
    })
  })

  describe('calculateGreenCoffeeNeeded', () => {
    it('calculates correctly with 20% loss', () => {
      const result = calculateGreenCoffeeNeeded(1000, 20)
      expect(result).toBe(1250)
    })

    it('returns 0 if loss percentage is >= 100', () => {
      const result = calculateGreenCoffeeNeeded(1000, 100)
      expect(result).toBe(0)
    })
  })

  describe('aggregatePendingB2BOrders', () => {
    it('aggregates pending b2b orders by inventory_id', () => {
      const mockOrders = [
        { fulfillment_status: 'pending', company_name: 'Cafe A', inventory_id: 'inv-1', amount_grams: 1000 },
        { fulfillment_status: 'pending', company_name: 'Cafe B', inventory_id: 'inv-1', amount_grams: 2000 },
        { fulfillment_status: 'pending', company_name: 'Cafe C', inventory_id: 'inv-2', amount_grams: 500 },
        { fulfillment_status: 'delivered', company_name: 'Cafe D', inventory_id: 'inv-1', amount_grams: 3000 }, // should be ignored
        { fulfillment_status: 'pending', company_name: null, inventory_id: 'inv-2', amount_grams: 1000 }, // should be ignored
        { fulfillment_status: 'pending', company_name: 'Cafe E', inventory_id: null, amount_grams: 500 }, // should be ignored
      ]

      const result = aggregatePendingB2BOrders(mockOrders)
      expect(result).toEqual({
        'inv-1': 3000,
        'inv-2': 500
      })
    })
  })
})
