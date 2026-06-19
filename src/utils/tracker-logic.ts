import type { TimeLogRecord } from '@/types'

/**
 * Returns the effective hours for a log: adjusted_hours when set by admin,
 * otherwise the clock-derived value.
 */
export function resolveHours(log: TimeLogRecord): number {
  if (log.adjusted_hours != null) return log.adjusted_hours
  return calculateHoursWorked(log.start_time, log.end_time)
}

/**
 * Builds a UTC ISO string from separate date and time inputs.
 * @param dateStr - Date string in YYYY-MM-DD format (from input type="date")
 * @param timeStr - Time string in HH:MM or HH:MM:SS format (from input type="time")
 * @returns ISO 8601 UTC string, or null if inputs are invalid
 */
export function buildTimestamp(dateStr: string, timeStr: string): string | null {
  if (!dateStr || !timeStr) return null

  // Normalize time to always have seconds
  const normalizedTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr

  // Build the full ISO string with explicit local time parsing
  const localDateStr = `${dateStr}T${normalizedTime}`
  const parsed = new Date(localDateStr)

  if (isNaN(parsed.getTime())) return null

  return parsed.toISOString()
}

/**
 * Calculates hours worked between two ISO timestamp strings.
 * Handles all common timestamp formats:
 * - Full ISO 8601: "2026-06-03T14:00:00.000Z"
 * - With timezone offset: "2026-06-03T14:00:00+00:00" 
 * - Supabase format: "2026-06-03 14:00:00+00"
 * - With microseconds: "2026-06-03T14:00:00.000000+00:00"
 * 
 * @returns Hours worked as a number, or 0 if inputs are invalid or end <= start
 */
export function calculateHoursWorked(startTimeIso: string, endTimeIso: string): number {
  if (!startTimeIso || !endTimeIso) return 0

  const start = new Date(startTimeIso).getTime()
  const end = new Date(endTimeIso).getTime()
  
  if (isNaN(start) || isNaN(end)) {
    console.error('[tracker-logic] Invalid timestamp:', { startTimeIso, endTimeIso, start, end })
    return 0
  }
  
  if (end <= start) {
    return 0 // Invalid: end time is at or before start time
  }

  const ms = end - start
  return ms / (1000 * 60 * 60)
}

/**
 * Calculates total pay for given hours worked at a given hourly rate.
 * @returns Total pay as a number, or 0 if inputs are invalid
 */
export function calculateTotalPay(hours: number, hourlyRate: number): number {
  if (hours <= 0 || hourlyRate <= 0) return 0
  return hours * hourlyRate
}

/**
 * Previews hours that would be logged from the form's date + time inputs.
 * Used to show a real-time preview before the user submits.
 * @returns Hours as a number, or 0 if inputs are incomplete/invalid
 */
export function previewHours(dateStr: string, startTimeStr: string, endTimeStr: string): number {
  const startIso = buildTimestamp(dateStr, startTimeStr)
  const endIso = buildTimestamp(dateStr, endTimeStr)

  if (!startIso || !endIso) return 0

  return calculateHoursWorked(startIso, endIso)
}
