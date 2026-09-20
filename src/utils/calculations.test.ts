import { describe, it, expect } from 'vitest'
import {
  calculateRawGrams,
  calculateOrderCosts,
  calculateYieldPercentage,
  roastYieldPercentage,
  roastLossPercentage,
  laborCostPerRoast,
  laborCostPerGram,
  aggregatePendingB2BOrders,
} from './calculations'
import type { UserSettingsRecord } from '@/types'

describe('calculations', () => {
  // green 1000g -> roasted 800g: 80% yield, 20% loss — chosen so the raw-gram
  // math below matches the well-known "1000 / 0.8" case.
  const mockSettings: UserSettingsRecord = {
    id: 'test-settings-id',
    user_id: 'test-user-id',
    business_name: 'Test Roastery',
    currency_symbol: '$',
    cost_per_bag: 0.50,
    cost_per_sticker: 0.15,
    cost_electricity_per_order: 1.20,
    cost_fuel_per_order: 0.80,
    roaster_capacity_grams: 1200,
    green_input_per_roast_grams: 1000,
    roasted_output_per_roast_grams: 800,
    labor_hourly_rate: 1600,
    roasts_per_hour: 4, // -> 400/roast, 0.5/g
    updated_at: new Date().toISOString()
  }

  // The app's real defaults, for the worked example in the plan: capacity
  // 1200g, green 960g in / 760g out per roast, ₡1,600/hr at 3 roasts/hr.
  const defaultSettings: UserSettingsRecord = {
    ...mockSettings,
    roaster_capacity_grams: 1200,
    green_input_per_roast_grams: 960,
    roasted_output_per_roast_grams: 760,
    labor_hourly_rate: 1600,
    roasts_per_hour: 3,
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

    it('returns 0 when loss is 100% or more, instead of dividing by zero', () => {
      expect(calculateRawGrams(500, 100)).toBe(0)
      expect(calculateRawGrams(500, 120)).toBe(0)
    })
  })

  describe('roastYieldPercentage / roastLossPercentage', () => {
    it('derives yield and loss from green input and roasted output', () => {
      expect(roastYieldPercentage(mockSettings)).toBe(80)
      expect(roastLossPercentage(mockSettings)).toBe(20)
    })

    it('matches the plan defaults: 960g in / 760g out -> 79.2% yield, 20.8% loss', () => {
      expect(roastYieldPercentage(defaultSettings)).toBeCloseTo(79.1667, 3)
      expect(Number(roastYieldPercentage(defaultSettings).toFixed(1))).toBe(79.2)
      expect(Number(roastLossPercentage(defaultSettings).toFixed(1))).toBe(20.8)
    })

    it('returns 0 yield (100% loss) when green input is 0, instead of dividing by zero', () => {
      const settings = { ...mockSettings, green_input_per_roast_grams: 0 }
      expect(roastYieldPercentage(settings)).toBe(0)
      expect(roastLossPercentage(settings)).toBe(100)
    })
  })

  describe('laborCostPerRoast / laborCostPerGram', () => {
    it('derives labor cost per roast and per gram', () => {
      expect(laborCostPerRoast(mockSettings)).toBe(400)
      expect(laborCostPerGram(mockSettings)).toBe(0.5)
    })

    it('matches the plan defaults: ₡1,600/hr at 3 roasts/hr -> ₡533.33/roast', () => {
      expect(laborCostPerRoast(defaultSettings)).toBeCloseTo(533.33, 2)
      expect(laborCostPerGram(defaultSettings)).toBeCloseTo(0.7018, 4)
    })

    it('returns 0 when roasts per hour is 0, instead of dividing by zero', () => {
      const settings = { ...mockSettings, roasts_per_hour: 0 }
      expect(laborCostPerRoast(settings)).toBe(0)
      expect(laborCostPerGram(settings)).toBe(0)
    })

    it('returns 0 per-gram cost when roasted output is 0, instead of dividing by zero', () => {
      const settings = { ...mockSettings, roasted_output_per_roast_grams: 0 }
      expect(laborCostPerGram(settings)).toBe(0)
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
      expect(result.electricityCost).toBe(1.20)
      expect(result.fuelCost).toBe(0.80)

      // Labor: 1000g * 0.5/g = 500.00
      expect(result.laborCost).toBe(500)

      // Breakdown matches expectation:
      expect(result.costBreakdown).toEqual({
        coffee: 12.50,
        bag: 1.00,
        sticker: 0.30,
        electricity: 1.20,
        fuel: 0.80,
        labor: 500
      })

      // Total cost: 12.50 + 1.00 + 0.30 + 1.20 + 0.80 + 500 = 515.80
      expect(result.totalCost).toBe(515.80)
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

      // Labor: 500g * 0.5/g = 250.00
      expect(result.laborCost).toBe(250)

      // Total cost: 0 + 0.50 + 0.15 + 1.20 + 0.80 + 250 = 252.65
      expect(result.totalCost).toBe(252.65)
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

      // Sum of breakdown: 7.71 + 1.00 + 0.33 + 1.20 + 0.80 + 250 = 261.04
      expect(result.totalCost).toBe(261.04)
    })

    it('uses bagUnitCost (a bag type\'s cost) over settings.cost_per_bag when given', () => {
      const result = calculateOrderCosts({
        amountGrams: 500,
        bagCount: 2,
        settings: mockSettings,
        costPerKg: null,
        bagUnitCost: 2.75
      })

      // Bag: 2 * 2.75 = 5.50, not 2 * 0.50
      expect(result.bagCost).toBe(5.50)
    })

    it('falls back to settings.cost_per_bag when bagUnitCost is not given', () => {
      const result = calculateOrderCosts({
        amountGrams: 500,
        bagCount: 2,
        settings: mockSettings,
        costPerKg: null
      })

      expect(result.bagCost).toBe(1.00) // 2 * 0.50
    })

    it('matches the plan\'s worked example: 250g at the app defaults', () => {
      // green 960g / roasted 760g -> 79.1667% yield -> 20.8333% loss
      // labor: 1600/3 = 533.33/roast -> /760 = 0.70175/g
      const result = calculateOrderCosts({
        amountGrams: 250,
        bagCount: 1,
        settings: defaultSettings,
        costPerKg: 3000, // ₡3,000/kg green coffee
        bagUnitCost: 280 // premium bag
      })

      // green needed: ceil(250 / 0.791667) = 316g
      expect(result.rawGramsUsed).toBe(316)
      // coffee: 316/1000 * 3000 = 948
      expect(result.coffeeCost).toBe(948)
      // labor: 250 * 0.70175 = 175.4386... -> rounds to 175.44
      expect(result.laborCost).toBeCloseTo(175.44, 2)
      // bag: 1 * 280
      expect(result.bagCost).toBe(280)
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

      // @ts-expect-error Mock data doesn't match full OrderRecord type
      const result = aggregatePendingB2BOrders(mockOrders)
      expect(result).toEqual({
        'inv-1': 3000,
        'inv-2': 500
      })
    })
  })
})
