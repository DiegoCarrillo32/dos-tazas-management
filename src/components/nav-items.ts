import {
  Calculator,
  Settings,
  BarChart3,
  Users,
  Home,
  History,
  Package,
  Clock,
  Flame,
  Briefcase,
  Wrench,
  LayoutDashboard,
  RefreshCw,
  ShoppingCart,
  LucideProps,
} from "lucide-react"
import type { ForwardRefExoticComponent, RefAttributes } from "react"
import type { DictionaryKey } from "@/i18n/dictionaries"

export type NavItem = {
  titleKey: DictionaryKey
  url: string
  icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
}

export type NavSection = {
  labelKey: DictionaryKey
  items: NavItem[]
}

/**
 * The one nav definition. The sidebar and the mobile tab bar both read it, so
 * the two can't drift apart.
 */
export const sections: NavSection[] = [
  {
    labelKey: "sidebar_section_overview",
    items: [
      { titleKey: "nav_dashboard", url: "/", icon: Home },
      { titleKey: "nav_tracker", url: "/tracker", icon: Clock },
      { titleKey: "nav_analytics", url: "/analytics", icon: BarChart3 },
      { titleKey: "nav_history", url: "/history", icon: History },
    ],
  },
  {
    labelKey: "sidebar_section_operations",
    items: [
      { titleKey: "nav_inventory", url: "/inventory", icon: Package },
      { titleKey: "nav_roasts", url: "/roasts", icon: Flame },
      { titleKey: "nav_calculator", url: "/calculator", icon: Calculator },
      { titleKey: "nav_equipment", url: "/equipment", icon: Wrench },
    ],
  },
  {
    labelKey: "sidebar_section_sales",
    items: [
      { titleKey: "nav_customers", url: "/customers", icon: Users },
      { titleKey: "nav_b2b", url: "/b2b", icon: Briefcase },
      { titleKey: "nav_team", url: "/team", icon: Users },
    ],
  },
  {
    labelKey: "sidebar_section_partner",
    items: [
      { titleKey: "nav_partner_dashboard", url: "/dashboard", icon: LayoutDashboard },
      { titleKey: "nav_partner_roasting", url: "/roasting", icon: Flame },
      { titleKey: "nav_partner_orders", url: "/orders", icon: ShoppingCart },
      { titleKey: "nav_partner_recurring", url: "/recurring", icon: RefreshCw },
    ],
  },
  {
    labelKey: "sidebar_section_system",
    items: [{ titleKey: "nav_settings", url: "/settings", icon: Settings }],
  },
]

/** Partner role: own-data modules plus the B2B pages of the roaster that invited them. */
const partnerAllowedKeys: DictionaryKey[] = [
  "nav_dashboard",
  "nav_analytics",
  "nav_history",
  "nav_inventory",
  "nav_roasts",
  "nav_calculator",
  "nav_equipment",
  "nav_settings",
  "nav_partner_dashboard",
  "nav_partner_roasting",
  "nav_partner_orders",
  "nav_partner_recurring",
]

export function sectionsForRole(userRole: string): NavSection[] {
  return sections
    .map((section) => {
      let allowedItems = section.items

      if (userRole === "worker") {
        // Workers only see Orders, Tracker, History and Settings.
        allowedItems = section.items.filter((item) =>
          ["nav_dashboard", "nav_tracker", "nav_history", "nav_settings"].includes(item.titleKey)
        )
      } else if (userRole === "partner") {
        allowedItems = section.items.filter((item) => partnerAllowedKeys.includes(item.titleKey))
      } else {
        // Roasters track their own hours elsewhere, and the partner section is
        // for partner accounts only.
        allowedItems = section.items.filter(
          (item) => item.titleKey !== "nav_tracker" && !item.titleKey.startsWith("nav_partner_")
        )
      }

      return { ...section, items: allowedItems }
    })
    .filter((section) => section.items.length > 0)
}

/**
 * The four destinations that earn a slot in the phone tab bar, per role — where
 * the day actually goes. Everything else stays one tap away behind "More".
 */
const PRIMARY_BY_ROLE: Record<string, DictionaryKey[]> = {
  roaster: ["nav_dashboard", "nav_inventory", "nav_b2b", "nav_customers"],
  worker: ["nav_dashboard", "nav_tracker", "nav_history"],
  partner: ["nav_partner_dashboard", "nav_partner_roasting", "nav_partner_orders"],
}

export function primaryNavForRole(userRole: string): NavItem[] {
  const allowed = sectionsForRole(userRole).flatMap((s) => s.items)
  const wanted = PRIMARY_BY_ROLE[userRole] ?? PRIMARY_BY_ROLE.roaster

  const primary = wanted
    .map((key) => allowed.find((item) => item.titleKey === key))
    .filter((item): item is NavItem => Boolean(item))

  // If a role's picks aren't all available, top up from what it can reach so the
  // bar never renders half-empty.
  for (const item of allowed) {
    if (primary.length >= 4) break
    if (!primary.some((p) => p.titleKey === item.titleKey)) primary.push(item)
  }

  return primary.slice(0, 4)
}
