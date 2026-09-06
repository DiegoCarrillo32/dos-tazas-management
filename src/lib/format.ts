import type { RecurringFrequency, UserSettingsRecord } from "@/types"
import type { DictionaryKey } from "@/i18n/dictionaries"

type CurrencySettings = Pick<UserSettingsRecord, "currency_symbol"> | null | undefined

/**
 * Format a money amount using the business' configured currency symbol.
 * Centralises what used to be ad-hoc `settings?.currency_symbol || '$'` +
 * `.toFixed(2)` calls (and a hardcoded es-CR/CRC Intl formatter) scattered
 * across the B2B, partner and team modules.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  settings?: CurrencySettings
): string {
  const symbol = settings?.currency_symbol || "$"
  const value = Number(amount ?? 0)
  const safe = Number.isFinite(value) ? value : 0
  return `${symbol}${safe.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const crcFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
})

/**
 * Format a Costa Rican colón amount. Roasting-service pricing is intrinsically
 * CRC (it comes from the roasting calculator config, not the business' display
 * currency), so it keeps its own formatter — centralised here so the b2b,
 * partner and detail-modal roasting views stay in sync.
 */
export function formatCRC(amount: number | string | null | undefined): string {
  const value = Number(amount ?? 0)
  return crcFormatter.format(Number.isFinite(value) ? value : 0)
}

/** Format a gram quantity as kilograms, e.g. 1500 -> "1.50 kg". */
export function formatKg(grams: number | null | undefined): string {
  const value = Number(grams ?? 0)
  const safe = Number.isFinite(value) ? value : 0
  return `${(safe / 1000).toFixed(2)} kg`
}

type Translate = (key: DictionaryKey) => string

/**
 * Human-readable description of a standing order's cadence, e.g.
 * "Weekly · monday" or "Monthly · first monday".
 *
 * Replaces the `WEEKDAYS[day_of_week] + "s"` string that the b2b and partner
 * views each hardcoded — that read as "monthly (Mondays)" for monthly
 * templates, which is not what the schedule means.
 */
export function formatRecurringSchedule(
  frequency: RecurringFrequency,
  dayOfWeek: number,
  t: Translate
): string {
  const dayKey = `weekday_${Math.min(Math.max(dayOfWeek ?? 0, 0), 6)}` as DictionaryKey
  const day = t(dayKey)

  const frequencyLabel =
    frequency === 'biweekly'
      ? t('freq_biweekly')
      : frequency === 'monthly'
        ? t('freq_monthly')
        : t('freq_weekly')

  const dayLabel =
    frequency === 'monthly' ? t('sched_first_weekday').replace('{day}', day) : day

  return `${frequencyLabel} · ${dayLabel}`
}
