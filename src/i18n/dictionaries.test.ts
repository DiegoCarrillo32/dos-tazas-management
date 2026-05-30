import { describe, it, expect } from 'vitest'
import { dictionaries } from './dictionaries'
import type { Language } from './dictionaries'

describe('i18n dictionaries', () => {
  const languages = Object.keys(dictionaries) as Language[]

  it('should have en and es languages', () => {
    expect(languages).toContain('en')
    expect(languages).toContain('es')
  })

  it('should have the same keys in both en and es dictionaries', () => {
    const enKeys = Object.keys(dictionaries.en).sort()
    const esKeys = Object.keys(dictionaries.es).sort()
    expect(enKeys).toEqual(esKeys)
  })

  it('should not have any empty string values in en', () => {
    const emptyKeys = Object.entries(dictionaries.en)
      .filter(([, value]) => value === '')
      .map(([key]) => key)
    expect(emptyKeys).toEqual([])
  })

  it('should not have any empty string values in es', () => {
    const emptyKeys = Object.entries(dictionaries.es)
      .filter(([, value]) => value === '')
      .map(([key]) => key)
    expect(emptyKeys).toEqual([])
  })

  it('should have all nav_ keys present for sidebar navigation', () => {
    const requiredNavKeys = [
      'nav_dashboard',
      'nav_pos',
      'nav_inventory',
      'nav_roasts',
      'nav_b2b',
      'nav_history',
      'nav_customers',
      'nav_analytics',
      'nav_equipment',
      'nav_settings',
    ]

    for (const key of requiredNavKeys) {
      expect(dictionaries.en).toHaveProperty(key)
      expect(dictionaries.es).toHaveProperty(key)
    }
  })

  it('should have all roast level keys', () => {
    const roastKeys = [
      'roast_light',
      'roast_medium_light',
      'roast_medium',
      'roast_medium_dark',
      'roast_dark',
    ]

    for (const key of roastKeys) {
      expect(dictionaries.en).toHaveProperty(key)
      expect(dictionaries.es).toHaveProperty(key)
    }
  })

  it('should have all preparation method keys', () => {
    const prepKeys = [
      'prep_whole_bean',
      'prep_elec_perk',
      'prep_drip',
      'prep_auto_drip',
      'prep_coarse',
    ]

    for (const key of prepKeys) {
      expect(dictionaries.en).toHaveProperty(key)
      expect(dictionaries.es).toHaveProperty(key)
    }
  })
})
