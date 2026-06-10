// Central configuration for the roasting service calculator.
// All pricing, machine specs, and service options live here —
// business logic in src/utils/roasting-calculator.ts must never hardcode these values.

export interface Machine {
  id: string
  name: string
  capacityGrams: number
  /** Fraction of rated capacity actually loaded per batch (0–1). */
  workloadPercent: number
  batchesPerHour: number
  isSampleOnly: boolean
  /** Optional per-machine override of the global roastLoss. */
  roastLossOverride?: number
}

export interface GreenCoffeeTier {
  id: string
  label: string
  /** Minimum billable quantity in grams — smaller orders are charged as this amount. */
  minGrams: number
  pricePerKg: number
}

export interface BagSize {
  id: string
  label: string
  grams: number
}

export interface BagOption {
  id: string
  label: string
  pricePerUnit: number
  sizes: BagSize[]
}

export interface RoastingConfig {
  machines: Machine[]
  labor: {
    /** CRC per hour */
    hourlyRate: number
  }
  energy: {
    provider: string
    /** CRC per kWh */
    kwhRate: number
    /** kWh consumed per hour of operation, per machine id (power draw while roasting). */
    machineConsumption: Record<string, number>
  }
  greenCoffee: {
    providedByUs: GreenCoffeeTier[]
  }
  bags: BagOption[]
  /** Global roast weight loss fraction (0–1). */
  roastLoss: number
  grindingEnabled: boolean
  grinding: {
    mode: 'FLAT' | 'PER_KG'
    /** CRC, applied once per order when mode is FLAT. */
    flatRate: number
    /** CRC per kg of roasted output when mode is PER_KG. */
    perKgRate: number
  }
  /** Auto-select uses the sample machine only when requested output is at or below this. */
  sampleThresholdGrams: number
}

const BAG_SIZES: BagSize[] = [
  { id: '250g', label: '250 g', grams: 250 },
  { id: '500g', label: '500 g', grams: 500 },
  { id: '1kg', label: '1 kg', grams: 1000 },
]

export const MACHINE_AUTO_SELECT = 'AUTO'

export const defaultRoastingConfig: RoastingConfig = {
  machines: [
    {
      id: 'kaleido-m1',
      name: 'Kaleido M1',
      capacityGrams: 200,
      workloadPercent: 0.9,
      batchesPerHour: 3,
      isSampleOnly: true,
    },
    {
      id: 'kaleido-m10',
      name: 'Kaleido M10',
      capacityGrams: 1200,
      workloadPercent: 0.9,
      batchesPerHour: 2,
      isSampleOnly: false,
    },
  ],
  labor: {
    hourlyRate: 1625,
  },
  energy: {
    provider: 'Coopelesca',
    kwhRate: 92,
    machineConsumption: {
      'kaleido-m1': 1.6,
      'kaleido-m10': 7.0,
    },
  },
  greenCoffee: {
    providedByUs: [
      { id: 'standard', label: 'Standard', minGrams: 1000, pricePerKg: 3000 },
      { id: 'premium', label: 'Premium', minGrams: 1000, pricePerKg: 4500 },
    ],
  },
  bags: [
    { id: 'budget', label: 'Budget', pricePerUnit: 50, sizes: BAG_SIZES },
    { id: 'premium', label: 'Premium', pricePerUnit: 280, sizes: BAG_SIZES },
  ],
  roastLoss: 0.2,
  grindingEnabled: true,
  grinding: {
    mode: 'PER_KG',
    flatRate: 1000,
    perKgRate: 500,
  },
  sampleThresholdGrams: 200,
}
