import { describe, it, expect } from 'vitest'
import { calculateHoursWorked, calculateTotalPay, buildTimestamp, previewHours } from './tracker-logic'

describe('Time Tracker Logic', () => {
  describe('buildTimestamp', () => {
    it('builds ISO string from date and time inputs', () => {
      const result = buildTimestamp('2026-06-03', '08:00')
      expect(result).not.toBeNull()
      expect(new Date(result!).getTime()).not.toBeNaN()
    })

    it('builds ISO string with seconds in time', () => {
      const result = buildTimestamp('2026-06-03', '08:00:00')
      expect(result).not.toBeNull()
      expect(new Date(result!).getTime()).not.toBeNaN()
    })

    it('returns null for empty date', () => {
      expect(buildTimestamp('', '08:00')).toBeNull()
    })

    it('returns null for empty time', () => {
      expect(buildTimestamp('2026-06-03', '')).toBeNull()
    })

    it('returns null for invalid date string', () => {
      expect(buildTimestamp('not-a-date', '08:00')).toBeNull()
    })

    it('produces consistent output for HH:MM and HH:MM:SS', () => {
      const short = buildTimestamp('2026-06-03', '08:00')
      const long = buildTimestamp('2026-06-03', '08:00:00')
      expect(short).toBe(long)
    })

    it('two timestamps from same date produce correct difference', () => {
      const start = buildTimestamp('2026-06-03', '08:00')!
      const end = buildTimestamp('2026-06-03', '10:00')!
      const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60)
      expect(diff).toBe(2)
    })
  })

  describe('calculateHoursWorked', () => {
    it('calculates exactly 1 hour with UTC timestamps', () => {
      expect(calculateHoursWorked('2026-06-03T09:00:00Z', '2026-06-03T10:00:00Z')).toBe(1)
    })

    it('calculates exactly 2 hours', () => {
      expect(calculateHoursWorked('2026-06-03T08:00:00Z', '2026-06-03T10:00:00Z')).toBe(2)
    })

    it('calculates fractional hours correctly (1.5 hours)', () => {
      expect(calculateHoursWorked('2026-06-03T09:00:00Z', '2026-06-03T10:30:00Z')).toBe(1.5)
    })

    it('returns 0 if end time is before start time', () => {
      expect(calculateHoursWorked('2026-06-03T10:00:00Z', '2026-06-03T09:00:00Z')).toBe(0)
    })

    it('returns 0 for same start and end time', () => {
      expect(calculateHoursWorked('2026-06-03T09:00:00Z', '2026-06-03T09:00:00Z')).toBe(0)
    })

    it('handles invalid dates gracefully', () => {
      expect(calculateHoursWorked('invalid-date', '2026-06-03T10:00:00Z')).toBe(0)
      expect(calculateHoursWorked('2026-06-03T10:00:00Z', 'invalid-date')).toBe(0)
      expect(calculateHoursWorked('invalid', 'invalid')).toBe(0)
    })

    it('returns 0 for empty strings', () => {
      expect(calculateHoursWorked('', '2026-06-03T10:00:00Z')).toBe(0)
      expect(calculateHoursWorked('2026-06-03T10:00:00Z', '')).toBe(0)
      expect(calculateHoursWorked('', '')).toBe(0)
    })

    it('returns 0 for bare time strings without date (no valid ISO)', () => {
      expect(calculateHoursWorked('08:00:00', '10:00:00')).toBe(0)
    })

    // Supabase format tests
    it('handles Supabase "+00:00" offset format', () => {
      expect(calculateHoursWorked('2026-06-03T09:00:00+00:00', '2026-06-03T11:00:00+00:00')).toBe(2)
    })

    it('handles timestamps with non-UTC timezone offsets', () => {
      expect(calculateHoursWorked('2026-06-03T08:00:00-06:00', '2026-06-03T10:00:00-06:00')).toBe(2)
    })

    it('handles Supabase ISO8601 with milliseconds', () => {
      expect(calculateHoursWorked('2026-06-03T14:00:00.000Z', '2026-06-03T16:00:00.000Z')).toBe(2)
    })

    it('handles Supabase format with microseconds', () => {
      expect(calculateHoursWorked('2026-06-03T08:00:00.000000+00:00', '2026-06-03T10:30:00.000000+00:00')).toBe(2.5)
    })

    it('handles Supabase space-separated format', () => {
      expect(calculateHoursWorked('2026-06-03 14:00:00+00', '2026-06-03 16:00:00+00')).toBe(2)
    })

    // Form submission simulation
    it('calculates correctly with ISO strings produced by form submission logic', () => {
      const startIso = buildTimestamp('2026-06-03', '08:00')!
      const endIso = buildTimestamp('2026-06-03', '10:00')!
      expect(calculateHoursWorked(startIso, endIso)).toBe(2)
    })

    it('calculates correctly with form submission for 8h shift', () => {
      const startIso = buildTimestamp('2026-06-03', '07:00')!
      const endIso = buildTimestamp('2026-06-03', '15:00')!
      expect(calculateHoursWorked(startIso, endIso)).toBe(8)
    })

    it('handles form submission with minutes', () => {
      const startIso = buildTimestamp('2026-06-03', '09:15')!
      const endIso = buildTimestamp('2026-06-03', '11:45')!
      expect(calculateHoursWorked(startIso, endIso)).toBe(2.5)
    })

    it('calculates 15 minute intervals correctly', () => {
      expect(calculateHoursWorked('2026-06-03T09:00:00Z', '2026-06-03T09:15:00Z')).toBe(0.25)
    })

    it('calculates overnight shifts correctly', () => {
      expect(calculateHoursWorked('2026-06-03T22:00:00Z', '2026-06-04T06:00:00Z')).toBe(8)
    })
  })

  describe('calculateTotalPay', () => {
    it('multiplies hours by rate', () => {
      expect(calculateTotalPay(4, 15)).toBe(60)
    })

    it('handles fractional hours', () => {
      expect(calculateTotalPay(4.5, 20)).toBe(90)
    })

    it('returns 0 for negative hours', () => {
      expect(calculateTotalPay(-5, 15)).toBe(0)
    })

    it('returns 0 for negative rate', () => {
      expect(calculateTotalPay(5, -10)).toBe(0)
    })

    it('returns 0 for zero hours', () => {
      expect(calculateTotalPay(0, 15)).toBe(0)
    })

    it('returns 0 for zero rate', () => {
      expect(calculateTotalPay(5, 0)).toBe(0)
    })

    it('handles typical CRC hourly rate (8h at 2500/hr)', () => {
      expect(calculateTotalPay(8, 2500)).toBe(20000)
    })

    it('handles fractional pay (2.5h at 1500/hr)', () => {
      expect(calculateTotalPay(2.5, 1500)).toBe(3750)
    })
  })

  describe('previewHours', () => {
    it('returns hours for valid date + time inputs', () => {
      expect(previewHours('2026-06-03', '08:00', '10:00')).toBe(2)
    })

    it('returns 0 for missing date', () => {
      expect(previewHours('', '08:00', '10:00')).toBe(0)
    })

    it('returns 0 for missing start time', () => {
      expect(previewHours('2026-06-03', '', '10:00')).toBe(0)
    })

    it('returns 0 for missing end time', () => {
      expect(previewHours('2026-06-03', '08:00', '')).toBe(0)
    })

    it('returns 0 when end time equals start time', () => {
      expect(previewHours('2026-06-03', '10:00', '10:00')).toBe(0)
    })

    it('returns 0 when end time is before start time', () => {
      expect(previewHours('2026-06-03', '10:00', '08:00')).toBe(0)
    })

    it('handles fractional hours preview', () => {
      expect(previewHours('2026-06-03', '09:15', '11:45')).toBe(2.5)
    })

    it('handles short shifts', () => {
      expect(previewHours('2026-06-03', '14:00', '14:30')).toBe(0.5)
    })
  })

  describe('end-to-end form data flow simulation', () => {
    it('simulates full round trip for 2 hour shift', () => {
      // Step 1: User input
      const dateInput = '2026-06-03'
      const startInput = '08:00'
      const endInput = '10:00'

      // Step 2: buildTimestamp converts to ISO
      const startIso = buildTimestamp(dateInput, startInput)
      const endIso = buildTimestamp(dateInput, endInput)

      // Verify the ISO strings are valid
      expect(startIso).not.toBeNull()
      expect(endIso).not.toBeNull()
      expect(new Date(startIso!).getTime()).not.toBeNaN()
      expect(new Date(endIso!).getTime()).not.toBeNaN()

      // Step 3: After storing in DB and reading back, calculateHoursWorked processes them
      const hours = calculateHoursWorked(startIso!, endIso!)
      expect(hours).toBe(2)

      // Step 4: Pay calculation
      const pay = calculateTotalPay(hours, 2500) // 2500 CRC/hr
      expect(pay).toBe(5000)
    })

    it('simulates full round trip for 30 min shift', () => {
      const startIso = buildTimestamp('2026-06-03', '14:00')!
      const endIso = buildTimestamp('2026-06-03', '14:30')!
      expect(calculateHoursWorked(startIso, endIso)).toBe(0.5)
    })

    it('simulates full round trip for 8 hour shift with CRC pay', () => {
      const startIso = buildTimestamp('2026-06-03', '07:00')!
      const endIso = buildTimestamp('2026-06-03', '15:00')!
      const hours = calculateHoursWorked(startIso, endIso)
      expect(hours).toBe(8)
      expect(calculateTotalPay(hours, 1800)).toBe(14400) // 1800 CRC/hr
    })
  })
})
