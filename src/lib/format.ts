import type { UserSettingsRecord } from "@/types"

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
