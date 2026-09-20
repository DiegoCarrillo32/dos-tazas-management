import type { CostBreakdown, UserSettingsRecord, OrderRecord } from '@/types'

export interface CostCalculationParams {
  amountGrams: number
  bagCount: number
  settings: UserSettingsRecord
  costPerKg?: number | null
  /** Cost of the bag type used for this order. Falls back to `settings.cost_per_bag` when not given. */
  bagUnitCost?: number | null
}

export interface CostCalculationResult {
  coffeeCost: number
  bagCost: number
  stickerCost: number
  electricityCost: number
  fuelCost: number
  laborCost: number
  costBreakdown: CostBreakdown
  totalCost: number
  rawGramsUsed: number
}

type RoasterSpec = Pick<UserSettingsRecord, 'green_input_per_roast_grams' | 'roasted_output_per_roast_grams'>
type LaborRateSpec = Pick<UserSettingsRecord, 'labor_hourly_rate' | 'roasts_per_hour'>
type LaborSpec = LaborRateSpec & Pick<UserSettingsRecord, 'roasted_output_per_roast_grams'>

/**
 * Roast yield %, derived from a roast's green input and roasted output —
 * never stored directly, so it can't disagree with the input/output pair.
 */
export function roastYieldPercentage(settings: RoasterSpec): number {
  const greenIn = Number(settings.green_input_per_roast_grams)
  if (!greenIn || greenIn <= 0) return 0
  return (Number(settings.roasted_output_per_roast_grams) / greenIn) * 100
}

/** Roast weight-loss %, the complement of {@link roastYieldPercentage}. */
export function roastLossPercentage(settings: RoasterSpec): number {
  return 100 - roastYieldPercentage(settings)
}

/** Roasting labor cost for one full roast: hourly rate ÷ roasts per hour. */
export function laborCostPerRoast(settings: LaborRateSpec): number {
  const roastsPerHour = Number(settings.roasts_per_hour)
  if (!roastsPerHour || roastsPerHour <= 0) return 0
  return Number(settings.labor_hourly_rate) / roastsPerHour
}

/** Roasting labor cost per gram of roasted output, spreading a roast's labor cost across its yield. */
export function laborCostPerGram(settings: LaborSpec): number {
  const roastedOutput = Number(settings.roasted_output_per_roast_grams)
  if (!roastedOutput || roastedOutput <= 0) return 0
  return laborCostPerRoast(settings) / roastedOutput
}

export function calculateRawGrams(amountGrams: number, roastLossPercentage: number): number {
  if (roastLossPercentage >= 100) return 0
  const lossRatio = 1 - (roastLossPercentage / 100)
  return Math.ceil(amountGrams / lossRatio)
}

export function calculateOrderCosts({
  amountGrams,
  bagCount,
  settings,
  costPerKg,
  bagUnitCost
}: CostCalculationParams): CostCalculationResult {
  const rawGramsUsed = calculateRawGrams(amountGrams, roastLossPercentage(settings))

  const coffeeCost = costPerKg
    ? Math.round((rawGramsUsed / 1000) * Number(costPerKg) * 100) / 100
    : 0

  const bagUnitPrice = bagUnitCost ?? Number(settings.cost_per_bag)
  const bagCost = Math.round(bagCount * bagUnitPrice * 100) / 100
  const stickerCost = Math.round(bagCount * Number(settings.cost_per_sticker) * 100) / 100
  const electricityCost = Number(settings.cost_electricity_per_order)
  const fuelCost = Number(settings.cost_fuel_per_order)
  const laborCost = Math.round(amountGrams * laborCostPerGram(settings) * 100) / 100

  const costBreakdown: CostBreakdown = {
    coffee: coffeeCost,
    bag: bagCost,
    sticker: stickerCost,
    electricity: electricityCost,
    fuel: fuelCost,
    labor: laborCost
  }

  const totalCost = Math.round(
    Object.values(costBreakdown).reduce((sum: number, v) => sum + (v ?? 0), 0) * 100
  ) / 100

  return {
    coffeeCost,
    bagCost,
    stickerCost,
    electricityCost,
    fuelCost,
    laborCost,
    costBreakdown,
    totalCost,
    rawGramsUsed
  }
}

export function calculateYieldPercentage(weightIn: number, weightOut: number): number {
  if (weightIn <= 0) return 0
  return Number(((weightOut / weightIn) * 100).toFixed(1))
}

/**
 * Sum pending wholesale orders by bean, for the roast-to-order schedule.
 * An order counts as B2B when it carries a company name or is linked to a
 * partner — the same test the B2B page uses to build its order list.
 */
export function aggregatePendingB2BOrders(orders: Partial<OrderRecord>[]): Record<string, number> {
  const pendingB2B = orders.filter(
    (o) => o.fulfillment_status === 'pending' && (!!o.company_name || !!o.partner_id)
  )
  return pendingB2B.reduce((acc: Record<string, number>, order) => {
    if (order.inventory_id) {
      acc[order.inventory_id] = (acc[order.inventory_id] || 0) + (order.amount_grams || 0)
    }
    return acc
  }, {})
}
