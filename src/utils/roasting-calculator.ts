import type { Machine, RoastingConfig } from '@/config/roastingConfig'
import { MACHINE_AUTO_SELECT } from '@/config/roastingConfig'

export type QuantityBasis = 'GREEN_INPUT' | 'ROASTED_OUTPUT'
export type GreenSource = 'CLIENT_PROVIDED' | 'WE_PROVIDE'
export type PackagingOption = 'CLIENT_HANDLES' | 'WE_PACKAGE'
export type GrindingOption = 'CLIENT_HANDLES' | 'WE_GRIND'

export type RoastingWarning =
  | 'SAMPLE_MACHINE_OVER_CAPACITY'
  | 'BELOW_TIER_MINIMUM'

export interface RoastingQuoteInput {
  quantityGrams: number
  /** Whether quantityGrams is green coffee going in or desired roasted output. */
  quantityBasis: QuantityBasis
  greenSource: GreenSource
  greenTierId?: string
  packaging: PackagingOption
  bagOptionId?: string
  bagSizeId?: string
  grinding: GrindingOption
  /** Machine id or MACHINE_AUTO_SELECT. */
  machinePreference: string
}

export interface RoastingLineItems {
  labor: number
  energy: number
  /** null when the line does not apply to this quote. */
  greenCoffee: number | null
  packaging: number | null
  grinding: number | null
}

export interface RoastingQuote {
  machine: Machine
  batchesNeeded: number
  hoursRequired: number
  greenGramsIn: number
  roastedGramsOut: number
  bagsNeeded: number | null
  lineItems: RoastingLineItems
  totalCost: number
  warnings: RoastingWarning[]
}

export function roastLossFor(machine: Machine, config: RoastingConfig): number {
  return machine.roastLossOverride ?? config.roastLoss
}

export function inputPerBatch(machine: Machine): number {
  return machine.capacityGrams * machine.workloadPercent
}

export function outputPerBatch(machine: Machine, config: RoastingConfig): number {
  return inputPerBatch(machine) * (1 - roastLossFor(machine, config))
}

/** Requested quantity expressed as roasted output grams, regardless of basis. */
export function requestedOutputGrams(
  quantityGrams: number,
  basis: QuantityBasis,
  machine: Machine,
  config: RoastingConfig
): number {
  if (basis === 'GREEN_INPUT') {
    return quantityGrams * (1 - roastLossFor(machine, config))
  }
  return quantityGrams
}

export function selectMachine(config: RoastingConfig, input: RoastingQuoteInput): {
  machine: Machine
  warnings: RoastingWarning[]
} {
  const production = config.machines.filter(m => !m.isSampleOnly)
  const fallback = production[0] ?? config.machines[0]
  const warnings: RoastingWarning[] = []

  if (input.machinePreference !== MACHINE_AUTO_SELECT) {
    const preferred = config.machines.find(m => m.id === input.machinePreference)
    if (!preferred) return { machine: fallback, warnings }
    if (preferred.isSampleOnly) {
      const output = requestedOutputGrams(input.quantityGrams, input.quantityBasis, preferred, config)
      if (output > config.sampleThresholdGrams) {
        warnings.push('SAMPLE_MACHINE_OVER_CAPACITY')
        return { machine: fallback, warnings }
      }
    }
    return { machine: preferred, warnings }
  }

  const sample = config.machines.find(m => m.isSampleOnly)
  if (sample) {
    const output = requestedOutputGrams(input.quantityGrams, input.quantityBasis, sample, config)
    if (output > 0 && output <= config.sampleThresholdGrams) {
      return { machine: sample, warnings }
    }
  }
  return { machine: fallback, warnings }
}

export function calculateBagsNeeded(outputGrams: number, bagSizeGrams: number): number {
  if (bagSizeGrams <= 0) return 0
  return Math.ceil(outputGrams / bagSizeGrams)
}

export function calculateQuote(config: RoastingConfig, input: RoastingQuoteInput): RoastingQuote {
  const { machine, warnings } = selectMachine(config, input)
  const loss = roastLossFor(machine, config)
  const batchInput = inputPerBatch(machine)
  const batchOutput = outputPerBatch(machine, config)

  let batchesNeeded: number
  let greenGramsIn: number
  let roastedGramsOut: number

  if (input.quantityBasis === 'GREEN_INPUT') {
    greenGramsIn = input.quantityGrams
    batchesNeeded = Math.ceil(greenGramsIn / batchInput)
    roastedGramsOut = greenGramsIn * (1 - loss)
  } else {
    batchesNeeded = Math.ceil(input.quantityGrams / batchOutput)
    greenGramsIn = batchesNeeded * batchInput
    roastedGramsOut = batchesNeeded * batchOutput
  }

  const hoursRequired = batchesNeeded / machine.batchesPerHour

  const labor = hoursRequired * config.labor.hourlyRate
  const energy =
    hoursRequired * (config.energy.machineConsumption[machine.id] ?? 0) * config.energy.kwhRate

  let greenCoffee: number | null = null
  if (input.greenSource === 'WE_PROVIDE') {
    const tier =
      config.greenCoffee.providedByUs.find(t => t.id === input.greenTierId) ??
      config.greenCoffee.providedByUs[0]
    if (tier) {
      if (greenGramsIn < tier.minGrams) warnings.push('BELOW_TIER_MINIMUM')
      const billableGrams = Math.max(greenGramsIn, tier.minGrams)
      greenCoffee = (billableGrams / 1000) * tier.pricePerKg
    }
  }

  let packaging: number | null = null
  let bagsNeeded: number | null = null
  if (input.packaging === 'WE_PACKAGE') {
    const bag = config.bags.find(b => b.id === input.bagOptionId) ?? config.bags[0]
    const size = bag?.sizes.find(s => s.id === input.bagSizeId) ?? bag?.sizes[0]
    if (bag && size) {
      bagsNeeded = calculateBagsNeeded(roastedGramsOut, size.grams)
      packaging = bagsNeeded * bag.pricePerUnit
    }
  }

  let grinding: number | null = null
  if (config.grindingEnabled && input.grinding === 'WE_GRIND') {
    grinding =
      config.grinding.mode === 'FLAT'
        ? config.grinding.flatRate
        : (roastedGramsOut / 1000) * config.grinding.perKgRate
  }

  const lineItems: RoastingLineItems = {
    labor: Math.round(labor),
    energy: Math.round(energy),
    greenCoffee: greenCoffee === null ? null : Math.round(greenCoffee),
    packaging: packaging === null ? null : Math.round(packaging),
    grinding: grinding === null ? null : Math.round(grinding),
  }

  const totalCost =
    lineItems.labor +
    lineItems.energy +
    (lineItems.greenCoffee ?? 0) +
    (lineItems.packaging ?? 0) +
    (lineItems.grinding ?? 0)

  return {
    machine,
    batchesNeeded,
    hoursRequired,
    greenGramsIn: Math.round(greenGramsIn),
    roastedGramsOut: Math.round(roastedGramsOut),
    bagsNeeded,
    lineItems,
    totalCost,
    warnings,
  }
}
