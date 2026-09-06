import { describe, it, expect } from 'vitest'
import {
  calculateYieldPercentage,
  calculateGreenCoffeeNeeded,
  aggregatePendingB2BOrders,
  calculateRawGrams,
} from '@/utils/calculations'
import { formatRecurringSchedule } from '@/lib/format'
import { dictionaries } from '@/i18n/dictionaries'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { OrderWithCustomer } from '@/types'

const t = (key: DictionaryKey) => dictionaries.en[key]

/**
 * Tests for the B2B / Wholesale business logic:
 *  - Filtering B2B vs regular orders
 *  - Aggregating pending B2B orders for roast schedule
 *  - Computing green coffee needed from roasted targets
 *  - Yield percentage calculations for roast batches
 *  - Inventory deduction logic (unit math)
 */

// ─── Fixtures ────────────────────────────────────────────────

function makeOrder(overrides: Partial<OrderWithCustomer> = {}): OrderWithCustomer {
  return {
    id: 'ord-default',
    user_id: 'user-001',
    customer_id: 'cust-001',
    partner_id: null,
    preparation_method: 'Whole Bean',
    roast_level: 'Medium',
    amount_grams: 1000,
    total_price: 25.0,
    fulfillment_status: 'pending',
    payment_status: 'pending',
    origin_notes: null,
    inventory_id: 'inv-001',
    order_date: '2024-06-01T00:00:00Z',
    bag_count: 1,
    total_cost: null,
    cost_breakdown: null,
    company_name: null,
    customers: { full_name: 'Test Customer', phone: null },
    ...overrides,
  }
}


// ─── Tests ───────────────────────────────────────────────────

describe('B2B Order Filtering', () => {
  it('should correctly identify B2B orders (those with a company_name)', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: 'Cafe Alpha' }),
      makeOrder({ id: 'o2', company_name: null }),
      makeOrder({ id: 'o3', company_name: 'Restaurant Beta' }),
      makeOrder({ id: 'o4', company_name: null }),
      makeOrder({ id: 'o5', company_name: '' }), // empty string is falsy
    ]

    const b2bOrders = orders.filter(o => !!o.company_name)
    expect(b2bOrders).toHaveLength(2)
    expect(b2bOrders.map(o => o.id)).toEqual(['o1', 'o3'])
  })

  it('should filter pending B2B orders only', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: 'Cafe A', fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe B', fulfillment_status: 'delivered' }),
      makeOrder({ id: 'o3', company_name: 'Cafe C', fulfillment_status: 'roasted' }),
      makeOrder({ id: 'o4', company_name: 'Cafe D', fulfillment_status: 'pending' }),
    ]

    const pendingB2B = orders.filter(
      o => !!o.company_name && o.fulfillment_status === 'pending'
    )
    expect(pendingB2B).toHaveLength(2)
    expect(pendingB2B.map(o => o.id)).toEqual(['o1', 'o4'])
  })
})

describe('Roast Schedule Aggregation', () => {
  it('aggregates pending B2B orders by inventory_id', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: 'Cafe A', inventory_id: 'inv-001', amount_grams: 2000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe B', inventory_id: 'inv-001', amount_grams: 3000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o3', company_name: 'Cafe C', inventory_id: 'inv-002', amount_grams: 1500, fulfillment_status: 'pending' }),
    ]

    const result = aggregatePendingB2BOrders(orders)
    expect(result).toEqual({
      'inv-001': 5000,
      'inv-002': 1500,
    })
  })

  it('ignores delivered orders', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: 'Cafe A', inventory_id: 'inv-001', amount_grams: 2000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe B', inventory_id: 'inv-001', amount_grams: 5000, fulfillment_status: 'delivered' }),
    ]

    const result = aggregatePendingB2BOrders(orders)
    expect(result).toEqual({ 'inv-001': 2000 })
  })

  it('ignores non-B2B orders (no company_name)', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: null, inventory_id: 'inv-001', amount_grams: 2000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe B', inventory_id: 'inv-001', amount_grams: 1000, fulfillment_status: 'pending' }),
    ]

    const result = aggregatePendingB2BOrders(orders)
    expect(result).toEqual({ 'inv-001': 1000 })
  })

  it('ignores orders without an inventory_id', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: 'Cafe A', inventory_id: null, amount_grams: 2000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe B', inventory_id: 'inv-001', amount_grams: 1000, fulfillment_status: 'pending' }),
    ]

    const result = aggregatePendingB2BOrders(orders)
    expect(result).toEqual({ 'inv-001': 1000 })
  })

  it('counts partner-linked orders that carry no company name', () => {
    // Orders created from a standing order are linked by partner_id; the
    // company name may be absent, but they still need roasting.
    const orders = [
      makeOrder({ id: 'o1', company_name: null, partner_id: 'p-1', inventory_id: 'inv-001', amount_grams: 4000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe B', inventory_id: 'inv-001', amount_grams: 1000, fulfillment_status: 'pending' }),
    ]

    const result = aggregatePendingB2BOrders(orders)
    expect(result).toEqual({ 'inv-001': 5000 })
  })

  it('still ignores retail orders with neither a company nor a partner', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: null, partner_id: null, inventory_id: 'inv-001', amount_grams: 2000, fulfillment_status: 'pending' }),
    ]

    expect(aggregatePendingB2BOrders(orders)).toEqual({})
  })

  it('returns empty object when no qualifying orders exist', () => {
    const orders = [
      makeOrder({ id: 'o1', company_name: null, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe', fulfillment_status: 'delivered' }),
    ]

    const result = aggregatePendingB2BOrders(orders)
    expect(result).toEqual({})
  })
})

describe('Green Coffee Needed Calculation', () => {
  it('calculates green coffee needed for 20% roast loss', () => {
    // Need 1000g roasted → 1000 / 0.8 = 1250g green
    expect(calculateGreenCoffeeNeeded(1000, 20)).toBe(1250)
  })

  it('calculates green coffee needed for 15% roast loss', () => {
    // Need 1000g roasted → 1000 / 0.85 = 1177g green (rounded up)
    expect(calculateGreenCoffeeNeeded(1000, 15)).toBe(1177)
  })

  it('handles 0% loss (no shrinkage)', () => {
    expect(calculateGreenCoffeeNeeded(1000, 0)).toBe(1000)
  })

  it('handles 100% loss edge case (returns 0 since it is impossible)', () => {
    expect(calculateGreenCoffeeNeeded(1000, 100)).toBe(0)
  })

  it('handles large wholesale quantities', () => {
    // 50kg roasted at 18% loss → 50000 / 0.82 = 60976g
    expect(calculateGreenCoffeeNeeded(50000, 18)).toBe(60976)
  })

  it('matches the existing calculateRawGrams function (they are equivalent)', () => {
    // Both functions compute the same formula
    expect(calculateGreenCoffeeNeeded(2000, 20)).toBe(calculateRawGrams(2000, 20))
    expect(calculateGreenCoffeeNeeded(1500, 15)).toBe(calculateRawGrams(1500, 15))
  })
})

describe('Roast Batch Yield Calculations', () => {
  it('calculates typical yield for a medium roast', () => {
    // 10kg in, 8.2kg out → 82%
    const yld = calculateYieldPercentage(10000, 8200)
    expect(yld).toBe(82)
  })

  it('calculates low yield for a dark roast', () => {
    // 10kg in, 7.5kg out → 75%
    const yld = calculateYieldPercentage(10000, 7500)
    expect(yld).toBe(75)
  })

  it('calculates high yield for a light roast', () => {
    // 10kg in, 8.8kg out → 88%
    const yld = calculateYieldPercentage(10000, 8800)
    expect(yld).toBe(88)
  })

  it('returns 0 when weight_in is 0 (prevents division by zero)', () => {
    expect(calculateYieldPercentage(0, 5000)).toBe(0)
  })

  it('returns 0 when weight_in is negative', () => {
    expect(calculateYieldPercentage(-1000, 5000)).toBe(0)
  })

  it('handles fractional yields correctly', () => {
    // 1200g in, 1000g out → 83.3%
    const yld = calculateYieldPercentage(1200, 1000)
    expect(yld).toBe(83.3)
  })
})

describe('Inventory Deduction Logic', () => {
  it('correctly computes remaining stock after a roast batch', () => {
    const currentStock = 50000 // 50kg
    const weightIn = 12000 // 12kg batch
    const remaining = Math.max(0, currentStock - weightIn)
    expect(remaining).toBe(38000)
  })

  it('never goes below 0 stock', () => {
    const currentStock = 5000 // 5kg
    const weightIn = 12000 // 12kg batch (more than available)
    const remaining = Math.max(0, currentStock - weightIn)
    expect(remaining).toBe(0)
  })

  it('handles exact depletion', () => {
    const currentStock = 12000
    const weightIn = 12000
    const remaining = Math.max(0, currentStock - weightIn)
    expect(remaining).toBe(0)
  })

  it('handles multiple sequential roast deductions', () => {
    let stock = 50000

    // Batch 1: 12kg
    stock = Math.max(0, stock - 12000)
    expect(stock).toBe(38000)

    // Batch 2: 15kg
    stock = Math.max(0, stock - 15000)
    expect(stock).toBe(23000)

    // Batch 3: 10kg
    stock = Math.max(0, stock - 10000)
    expect(stock).toBe(13000)
  })
})

describe('End-to-End Roast Schedule Scenario', () => {
  it('computes a full roast schedule from B2B orders', () => {
    const roastLoss = 20 // 20% loss

    // Simulate 3 pending B2B orders across 2 coffees
    const orders = [
      makeOrder({ id: 'o1', company_name: 'Cafe A', inventory_id: 'inv-eth', amount_grams: 5000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o2', company_name: 'Cafe B', inventory_id: 'inv-eth', amount_grams: 3000, fulfillment_status: 'pending' }),
      makeOrder({ id: 'o3', company_name: 'Cafe C', inventory_id: 'inv-col', amount_grams: 2000, fulfillment_status: 'pending' }),
    ]

    // Step 1: Aggregate
    const aggregated = aggregatePendingB2BOrders(orders)
    expect(aggregated).toEqual({
      'inv-eth': 8000,   // 8kg roasted needed
      'inv-col': 2000,   // 2kg roasted needed
    })

    // Step 2: Calculate green coffee needed for each
    const greenNeeded: Record<string, number> = {}
    for (const [invId, amountNeeded] of Object.entries(aggregated)) {
      greenNeeded[invId] = calculateGreenCoffeeNeeded(amountNeeded, roastLoss)
    }

    expect(greenNeeded).toEqual({
      'inv-eth': 10000,  // 8000 / 0.8 = 10000g green
      'inv-col': 2500,   // 2000 / 0.8 = 2500g green
    })

    // Step 3: Check if we have enough stock
    const inventory: Record<string, number> = {
      'inv-eth': 15000,  // 15kg on hand
      'inv-col': 2000,   // 2kg on hand (not enough!)
    }

    const shortages: Record<string, number> = {}
    for (const [invId, needed] of Object.entries(greenNeeded)) {
      const available = inventory[invId] || 0
      if (needed > available) {
        shortages[invId] = needed - available
      }
    }

    expect(shortages).toEqual({
      'inv-col': 500, // Short 500g for Colombia
    })
  })
})

describe('Recurring Schedule Formatting', () => {
  it('names the delivery weekday for weekly templates', () => {
    expect(formatRecurringSchedule('weekly', 1, t)).toBe('Weekly · Monday')
  })

  it('names the delivery weekday for bi-weekly templates', () => {
    expect(formatRecurringSchedule('biweekly', 5, t)).toBe('Bi-weekly · Friday')
  })

  it('does not claim a monthly template repeats every week', () => {
    // The old code rendered "monthly (Mondays)", which is not what
    // day_of_week means for a monthly cadence.
    expect(formatRecurringSchedule('monthly', 1, t)).toBe('Monthly · first Monday')
  })

  it('handles Sunday (day 0) and clamps out-of-range days', () => {
    expect(formatRecurringSchedule('weekly', 0, t)).toBe('Weekly · Sunday')
    expect(formatRecurringSchedule('weekly', 9, t)).toBe('Weekly · Saturday')
    expect(formatRecurringSchedule('weekly', -2, t)).toBe('Weekly · Sunday')
  })
})
