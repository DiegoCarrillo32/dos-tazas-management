"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import { LogOut } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/i18n/LanguageProvider"
import { sectionsForRole, primaryNavForRole } from "@/components/nav-items"
import { logout } from "@/actions/auth"
import { cn } from "@/lib/utils"

/**
 * Everything that didn't earn a slot in the tab bar, as a bottom sheet.
 *
 * Deliberately a Sheet rather than the app's GenericModal: GenericModal is a
 * centred dialog that only becomes a sheet below `sm` (640px), and this is
 * reachable up to 768px — the band where the tab bar exists but that dialog
 * would still be centred. A bottom-anchored Sheet is a sheet at every width it
 * can be opened at.
 */
export function MobileMoreSheet({
  open,
  onOpenChange,
  userRole = "roaster",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: string
}) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [isLoggingOut, startTransition] = useTransition()

  // Whatever the tab bar already shows doesn't need repeating here.
  const inTabBar = new Set(primaryNavForRole(userRole).map((i) => i.titleKey))
  const sections = sectionsForRole(userRole)
    .map((section) => ({ ...section, items: section.items.filter((i) => !inTabBar.has(i.titleKey)) }))
    .filter((section) => section.items.length > 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="gap-0 px-4">
        <div
          aria-hidden="true"
          className="mx-auto mt-3 h-1.5 w-10 shrink-0 rounded-full bg-warm-roast/20"
        />

        <SheetHeader className="px-0 pb-2">
          <SheetTitle className="text-xl">{t("sidebar_more")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("sidebar_order_management")}
          </SheetDescription>
        </SheetHeader>

        <nav className="flex flex-col gap-5 pb-2">
          {sections.map((section) => (
            <div key={section.labelKey}>
              <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-warm-roast/60">
                {t(section.labelKey)}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {section.items.map((item) => {
                  const isActive = pathname === item.url
                  return (
                    <Link
                      key={item.titleKey}
                      href={item.url}
                      onClick={() => onOpenChange(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "border-coffee-fruit/30 bg-coffee-fruit/10 text-coffee-fruit"
                          : "border-warm-roast/10 bg-warm-roast/5 text-expresso hover:bg-warm-roast/10"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="min-w-0 leading-tight">{t(item.titleKey)}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-2 border-t border-warm-roast/10 pt-3">
          <Button
            variant="ghost"
            onClick={() => startTransition(() => { logout() })}
            disabled={isLoggingOut}
            className="min-h-12 w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-5 w-5" />
            {t("sidebar_logout")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
