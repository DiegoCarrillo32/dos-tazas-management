import type { DictionaryKey } from "@/i18n/dictionaries"

export interface OrderOption {
  value: string
  labelKey: DictionaryKey
}

/**
 * Brew/grind options offered on an order. Shared by the order form and the
 * standing-order form so a template can only be built from values the order
 * form can also produce.
 */
export const PREPARATION_METHODS: OrderOption[] = [
  { value: "Whole Bean", labelKey: "prep_whole_bean" },
  { value: "Elec Perk", labelKey: "prep_elec_perk" },
  { value: "Drip", labelKey: "prep_drip" },
  { value: "Auto-Drip", labelKey: "prep_auto_drip" },
  { value: "Coarse", labelKey: "prep_coarse" },
]

export const ROAST_LEVELS: OrderOption[] = [
  { value: "Light", labelKey: "roast_light" },
  { value: "Medium-Light", labelKey: "roast_medium_light" },
  { value: "Medium", labelKey: "roast_medium" },
  { value: "Medium-Dark", labelKey: "roast_medium_dark" },
  { value: "Dark", labelKey: "roast_dark" },
]
