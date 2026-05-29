import type { CostBreakdown, UserSettingsRecord } from '@/types'

export interface CostCalculationParams {
  amountGrams: number
  bagCount: number
  settings: UserSettingsRecord
  costPerKg?: number | null
}

export interface CostCalculationResult {
  coffeeCost: number
  bagCost: number
  stickerCost: number
  electricityCost: number
  fuelCost: number
  roastingTimeCost: number
  costBreakdown: CostBreakdown
  totalCost: number
  rawGramsUsed: number
}

export function calculateRawGrams(amountGrams: number, roastLossPercentage: number): number {
  const lossRatio = 1 - (roastLossPercentage / 100)
  return Math.ceil(amountGrams / lossRatio)
}

export function calculateOrderCosts({
  amountGrams,
  bagCount,
  settings,
  costPerKg
}: CostCalculationParams): CostCalculationResult {
  const rawGramsUsed = calculateRawGrams(amountGrams, settings.roast_loss_percentage)

  const coffeeCost = costPerKg
    ? Math.round((rawGramsUsed / 1000) * Number(costPerKg) * 100) / 100
    : 0

  const bagCost = Math.round(bagCount * Number(settings.cost_per_bag) * 100) / 100
  const stickerCost = Math.round(bagCount * Number(settings.cost_per_sticker) * 100) / 100
  const electricityCost = Number(settings.cost_electricity_per_order)
  const fuelCost = Number(settings.cost_fuel_per_order)
  const roastingTimeCost = Number(settings.cost_roasting_time_per_order)

  const costBreakdown: CostBreakdown = {
    coffee: coffeeCost,
    bag: bagCost,
    sticker: stickerCost,
    electricity: electricityCost,
    fuel: fuelCost,
    roasting_time: roastingTimeCost
  }

  const totalCost = Math.round(
    Object.values(costBreakdown).reduce((sum, v) => sum + v, 0) * 100
  ) / 100

  return {
    coffeeCost,
    bagCost,
    stickerCost,
    electricityCost,
    fuelCost,
    roastingTimeCost,
    costBreakdown,
    totalCost,
    rawGramsUsed
  }
}
