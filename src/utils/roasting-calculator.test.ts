import { describe, it, expect } from 'vitest'
import {
  inputPerBatch,
  outputPerBatch,
  selectMachine,
  calculateBagsNeeded,
  calculateQuote,
  type RoastingQuoteInput,
} from './roasting-calculator'
import { defaultRoastingConfig, MACHINE_AUTO_SELECT, type RoastingConfig } from '@/config/roastingConfig'

const config: RoastingConfig = defaultRoastingConfig
const m1 = config.machines.find(m => m.id === 'kaleido-m1')!
const m10 = config.machines.find(m => m.id === 'kaleido-m10')!

const baseInput: RoastingQuoteInput = {
  quantityGrams: 1000,
  quantityBasis: 'ROASTED_OUTPUT',
  greenSource: 'CLIENT_PROVIDED',
  packaging: 'CLIENT_HANDLES',
  grinding: 'CLIENT_HANDLES',
  machinePreference: MACHINE_AUTO_SELECT,
}

describe('roasting-calculator', () => {
  describe('batch math', () => {
    it('M1 loads 180g per batch and yields 144g at 20% loss', () => {
      expect(inputPerBatch(m1)).toBe(180)
      expect(outputPerBatch(m1, config)).toBeCloseTo(144)
    })

    it('M10 loads 1080g per batch and yields 864g at 20% loss', () => {
      expect(inputPerBatch(m10)).toBe(1080)
      expect(outputPerBatch(m10, config)).toBeCloseTo(864)
    })

    it('respects per-machine roast loss override', () => {
      const custom: RoastingConfig = {
        ...config,
        machines: [{ ...m10, roastLossOverride: 0.15 }],
      }
      expect(outputPerBatch(custom.machines[0], custom)).toBeCloseTo(1080 * 0.85)
    })
  })

  describe('selectMachine', () => {
    it('auto-selects M1 for sample quantities', () => {
      const { machine } = selectMachine(config, { ...baseInput, quantityGrams: 150 })
      expect(machine.id).toBe('kaleido-m1')
    })

    it('auto-selects M10 for production quantities', () => {
      const { machine } = selectMachine(config, { ...baseInput, quantityGrams: 5000 })
      expect(machine.id).toBe('kaleido-m10')
    })

    it('switches an over-capacity M1 request to M10 with a warning', () => {
      const { machine, warnings } = selectMachine(config, {
        ...baseInput,
        quantityGrams: 1000,
        machinePreference: 'kaleido-m1',
      })
      expect(machine.id).toBe('kaleido-m10')
      expect(warnings).toContain('SAMPLE_MACHINE_OVER_CAPACITY')
    })

    it('honors an explicit M1 choice within the sample threshold', () => {
      const { machine, warnings } = selectMachine(config, {
        ...baseInput,
        quantityGrams: 150,
        machinePreference: 'kaleido-m1',
      })
      expect(machine.id).toBe('kaleido-m1')
      expect(warnings).toHaveLength(0)
    })
  })

  describe('calculateBagsNeeded', () => {
    it('rounds up to whole bags', () => {
      expect(calculateBagsNeeded(1728, 250)).toBe(7)
      expect(calculateBagsNeeded(1000, 500)).toBe(2)
      expect(calculateBagsNeeded(1000, 1000)).toBe(1)
    })
  })

  describe('calculateQuote', () => {
    it('computes batches, grams, and hours for a roasted-output request', () => {
      // 1000g out on M10: ceil(1000 / 864) = 2 batches -> 2160g in, 1728g out, 1h
      const quote = calculateQuote(config, baseInput)
      expect(quote.machine.id).toBe('kaleido-m10')
      expect(quote.batchesNeeded).toBe(2)
      expect(quote.greenGramsIn).toBe(2160)
      expect(quote.roastedGramsOut).toBe(1728)
      expect(quote.hoursRequired).toBe(1)
    })

    it('computes batches and output for a green-input request', () => {
      // 2000g green on M10: ceil(2000 / 1080) = 2 batches, output 2000 * 0.8 = 1600g
      const quote = calculateQuote(config, {
        ...baseInput,
        quantityGrams: 2000,
        quantityBasis: 'GREEN_INPUT',
      })
      expect(quote.batchesNeeded).toBe(2)
      expect(quote.greenGramsIn).toBe(2000)
      expect(quote.roastedGramsOut).toBe(1600)
    })

    it('charges labor and energy from hours required', () => {
      const quote = calculateQuote(config, baseInput) // 1 hour on M10
      expect(quote.lineItems.labor).toBe(Math.round(config.labor.hourlyRate))
      expect(quote.lineItems.energy).toBe(
        Math.round(config.energy.machineConsumption['kaleido-m10'] * config.energy.kwhRate)
      )
    })

    it('charges nothing for client-provided green coffee', () => {
      const quote = calculateQuote(config, baseInput)
      expect(quote.lineItems.greenCoffee).toBeNull()
    })

    it('prices our green coffee by input grams and tier', () => {
      // 2160g in at ₡3000/kg = ₡6480
      const quote = calculateQuote(config, {
        ...baseInput,
        greenSource: 'WE_PROVIDE',
        greenTierId: 'standard',
      })
      expect(quote.lineItems.greenCoffee).toBe(6480)
      expect(quote.warnings).not.toContain('BELOW_TIER_MINIMUM')
    })

    it('bills the tier minimum and warns when below it', () => {
      // 150g out on M1 -> 180g in, below the 1000g minimum -> billed 1kg at ₡3000
      const quote = calculateQuote(config, {
        ...baseInput,
        quantityGrams: 150,
        greenSource: 'WE_PROVIDE',
        greenTierId: 'standard',
      })
      expect(quote.machine.id).toBe('kaleido-m1')
      expect(quote.lineItems.greenCoffee).toBe(3000)
      expect(quote.warnings).toContain('BELOW_TIER_MINIMUM')
    })

    it('prices packaging per bag unit', () => {
      // 1728g out into 250g bags = 7 bags; budget = ₡50 each
      const quote = calculateQuote(config, {
        ...baseInput,
        packaging: 'WE_PACKAGE',
        bagOptionId: 'budget',
        bagSizeId: '250g',
      })
      expect(quote.bagsNeeded).toBe(7)
      expect(quote.lineItems.packaging).toBe(350)
    })

    it('prices grinding per kg of roasted output', () => {
      // 1728g out at ₡500/kg = ₡864
      const quote = calculateQuote(config, { ...baseInput, grinding: 'WE_GRIND' })
      expect(quote.lineItems.grinding).toBe(864)
    })

    it('uses the flat grinding rate when configured', () => {
      const flatConfig: RoastingConfig = {
        ...config,
        grinding: { ...config.grinding, mode: 'FLAT' },
      }
      const quote = calculateQuote(flatConfig, { ...baseInput, grinding: 'WE_GRIND' })
      expect(quote.lineItems.grinding).toBe(config.grinding.flatRate)
    })

    it('skips grinding when disabled in config', () => {
      const disabled: RoastingConfig = { ...config, grindingEnabled: false }
      const quote = calculateQuote(disabled, { ...baseInput, grinding: 'WE_GRIND' })
      expect(quote.lineItems.grinding).toBeNull()
    })

    it('totals all applicable line items', () => {
      const quote = calculateQuote(config, {
        ...baseInput,
        greenSource: 'WE_PROVIDE',
        greenTierId: 'standard',
        packaging: 'WE_PACKAGE',
        bagOptionId: 'premium',
        bagSizeId: '500g',
        grinding: 'WE_GRIND',
      })
      const { labor, energy, greenCoffee, packaging, grinding } = quote.lineItems
      expect(quote.totalCost).toBe(labor + energy + greenCoffee! + packaging! + grinding!)
    })
  })
})
