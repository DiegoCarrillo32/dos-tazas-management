'use client'

import { useMemo, useState } from 'react'
import { Calculator, ChevronDown, ChevronUp, Coffee, Flame, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'
import { defaultRoastingConfig, MACHINE_AUTO_SELECT, type RoastingConfig } from '@/config/roastingConfig'
import {
  calculateQuote,
  type GreenSource,
  type GrindingOption,
  type PackagingOption,
  type QuantityBasis,
  type RoastingQuoteInput,
  type RoastingWarning,
} from '@/utils/roasting-calculator'

const crcFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

const warningKeys: Record<RoastingWarning, DictionaryKey> = {
  SAMPLE_MACHINE_OVER_CAPACITY: 'calc_warning_sample_capacity',
  BELOW_TIER_MINIMUM: 'calc_warning_below_minimum',
}

interface RoastingCalculatorProps {
  config?: RoastingConfig
  /** When provided, a submit button appears under the results, passing the
   *  resolved quote input so the parent can persist it (e.g. a partner order). */
  onPlaceOrder?: (input: RoastingQuoteInput) => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function RoastingCalculator({
  config = defaultRoastingConfig,
  onPlaceOrder,
  isSubmitting = false,
  submitLabel,
}: RoastingCalculatorProps) {
  const { t } = useTranslation()

  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState<'g' | 'kg'>('kg')
  const [basis, setBasis] = useState<QuantityBasis>('ROASTED_OUTPUT')
  const [greenSource, setGreenSource] = useState<GreenSource>('CLIENT_PROVIDED')
  const [greenTierId, setGreenTierId] = useState(config.greenCoffee.providedByUs[0]?.id ?? '')
  const [packaging, setPackaging] = useState<PackagingOption>('CLIENT_HANDLES')
  const [bagOptionId, setBagOptionId] = useState(config.bags[0]?.id ?? '')
  const [bagSizeId, setBagSizeId] = useState(config.bags[0]?.sizes[0]?.id ?? '')
  const [grinding, setGrinding] = useState<GrindingOption>('CLIENT_HANDLES')
  const [machinePreference, setMachinePreference] = useState(MACHINE_AUTO_SELECT)
  const [showDetails, setShowDetails] = useState(true)

  const quantityGrams = useMemo(() => {
    const parsed = parseFloat(quantity)
    if (isNaN(parsed) || parsed <= 0) return 0
    return unit === 'kg' ? parsed * 1000 : parsed
  }, [quantity, unit])

  const quoteInput = useMemo<RoastingQuoteInput>(() => ({
    quantityGrams,
    quantityBasis: basis,
    greenSource,
    greenTierId,
    packaging,
    bagOptionId,
    bagSizeId,
    grinding,
    machinePreference,
  }), [quantityGrams, basis, greenSource, greenTierId, packaging, bagOptionId, bagSizeId, grinding, machinePreference])

  const quote = useMemo(() => {
    if (quantityGrams <= 0) return null
    return calculateQuote(config, quoteInput)
  }, [config, quantityGrams, quoteInput])

  const selectedBag = config.bags.find(b => b.id === bagOptionId) ?? config.bags[0]

  const formatHours = (hours: number) =>
    hours < 1 ? `${Math.round(hours * 60)} min` : `${(Math.round(hours * 10) / 10).toLocaleString()} h`

  const lineItems = quote
    ? ([
        { key: 'calc_line_labor', value: quote.lineItems.labor },
        { key: 'calc_line_energy', value: quote.lineItems.energy },
        { key: 'calc_line_green', value: quote.lineItems.greenCoffee },
        { key: 'calc_line_packaging', value: quote.lineItems.packaging },
        { key: 'calc_line_grinding', value: quote.lineItems.grinding },
      ] as { key: DictionaryKey; value: number | null }[]).filter(item => item.value !== null)
    : []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Inputs */}
      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-6 space-y-5">
        <h2 className="text-xl font-heading text-expresso flex items-center gap-2">
          <Coffee className="h-5 w-5 text-coffee-fruit" />
          {t('calc_inputs_title')}
        </h2>

        <div className="space-y-2">
          <Label className="text-expresso">{t('calc_quantity_label')}</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="rounded-lg border-warm-roast/30 focus:ring-coffee-fruit"
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as 'g' | 'kg')}>
              <SelectTrigger className="w-28 border-warm-roast/30 focus:ring-coffee-fruit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">{t('calc_unit_grams')}</SelectItem>
                <SelectItem value="kg">{t('calc_unit_kg')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-expresso">{t('calc_basis_label')}</Label>
          <Select value={basis} onValueChange={(v) => setBasis(v as QuantityBasis)}>
            <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ROASTED_OUTPUT">{t('calc_basis_roasted')}</SelectItem>
              <SelectItem value="GREEN_INPUT">{t('calc_basis_green')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-expresso">{t('calc_green_source_label')}</Label>
          <Select value={greenSource} onValueChange={(v) => setGreenSource(v as GreenSource)}>
            <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLIENT_PROVIDED">{t('calc_source_client')}</SelectItem>
              <SelectItem value="WE_PROVIDE">{t('calc_source_us')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {greenSource === 'WE_PROVIDE' && (
          <div className="space-y-2">
            <Label className="text-expresso">{t('calc_coffee_select_label')}</Label>
            <Select value={greenTierId} onValueChange={(v) => v && setGreenTierId(v)}>
              <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {config.greenCoffee.providedByUs.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.label} — {crcFormatter.format(tier.pricePerKg)}/kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-expresso">{t('calc_packaging_label')}</Label>
          <Select value={packaging} onValueChange={(v) => setPackaging(v as PackagingOption)}>
            <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLIENT_HANDLES">{t('calc_packaging_client')}</SelectItem>
              <SelectItem value="WE_PACKAGE">{t('calc_packaging_us')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {packaging === 'WE_PACKAGE' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-expresso">{t('calc_bag_type_label')}</Label>
              <Select value={bagOptionId} onValueChange={(v) => v && setBagOptionId(v)}>
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {config.bags.map((bag) => (
                    <SelectItem key={bag.id} value={bag.id}>
                      {bag.label} — {crcFormatter.format(bag.pricePerUnit)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-expresso">{t('calc_bag_size_label')}</Label>
              <Select value={bagSizeId} onValueChange={(v) => v && setBagSizeId(v)}>
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedBag?.sizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {config.grindingEnabled && (
          <div className="space-y-2">
            <Label className="text-expresso">{t('calc_grinding_label')}</Label>
            <Select value={grinding} onValueChange={(v) => setGrinding(v as GrindingOption)}>
              <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLIENT_HANDLES">{t('calc_grinding_client')}</SelectItem>
                <SelectItem value="WE_GRIND">{t('calc_grinding_us')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-expresso">{t('calc_machine_label')}</Label>
          <Select value={machinePreference} onValueChange={(v) => v && setMachinePreference(v)}>
            <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={MACHINE_AUTO_SELECT}>{t('calc_machine_auto')}</SelectItem>
              {config.machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id}>
                  {machine.name}
                  {machine.isSampleOnly ? ` (${t('calc_machine_sample_badge')})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-6 space-y-4 lg:sticky lg:top-6">
        <h2 className="text-xl font-heading text-expresso flex items-center gap-2">
          <Calculator className="h-5 w-5 text-coffee-fruit" />
          {t('calc_results_title')}
        </h2>

        {!quote ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-expresso/50">
            <Flame className="h-8 w-8 opacity-20" />
            <p className="text-sm">{t('calc_enter_quantity')}</p>
          </div>
        ) : (
          <>
            {quote.warnings.map((warning) => (
              <div
                key={warning}
                className="flex items-start gap-2 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg p-3"
              >
                <TriangleAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{t(warningKeys[warning])}</p>
              </div>
            ))}

            <div className="grid grid-cols-2 gap-4">
              <SummaryStat label={t('calc_summary_green_in')} value={`${quote.greenGramsIn.toLocaleString()} g`} />
              <SummaryStat label={t('calc_summary_roasted_out')} value={`${quote.roastedGramsOut.toLocaleString()} g`} />
              <SummaryStat label={t('calc_machine_used')} value={quote.machine.name} />
              <SummaryStat
                label={t('calc_batches')}
                value={`${quote.batchesNeeded} · ${formatHours(quote.hoursRequired)}`}
              />
              {quote.bagsNeeded !== null && (
                <SummaryStat label={t('calc_bags_needed')} value={quote.bagsNeeded.toLocaleString()} />
              )}
            </div>

            <div className="border-t border-warm-roast/10 pt-4 space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10 -ml-2 h-8 gap-1"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showDetails ? t('calc_hide_details') : t('calc_show_details')}
              </Button>

              {showDetails && (
                <div className="space-y-1">
                  {lineItems.map((item) => (
                    <div key={item.key} className="flex justify-between text-sm text-expresso/80 py-1">
                      <span>{t(item.key)}</span>
                      <span className="font-medium text-expresso">{crcFormatter.format(item.value!)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                className={cn(
                  'flex justify-between items-center rounded-xl bg-coffee-fruit/10 px-4 py-3',
                  showDetails && 'mt-2'
                )}
              >
                <span className="font-bold text-expresso">{t('calc_total')}</span>
                <span className="text-2xl font-heading text-coffee-fruit">
                  {crcFormatter.format(quote.totalCost)}
                </span>
              </div>
            </div>

            {onPlaceOrder && (
              <Button
                onClick={() => onPlaceOrder(quoteInput)}
                disabled={isSubmitting}
                className="w-full bg-coffee-fruit hover:bg-warm-roast text-white rounded-full shadow-sm shadow-warm-roast/20 transition-all"
              >
                {isSubmitting ? t('loading') : (submitLabel ?? t('roasting_order_place'))}
              </Button>
            )}

            <p className="text-xs text-expresso/50">{t('calc_disclaimer')}</p>
          </>
        )}
      </div>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{label}</div>
      <div className="font-medium text-expresso text-sm">{value}</div>
    </div>
  )
}
