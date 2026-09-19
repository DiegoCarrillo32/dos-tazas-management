"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { MoreHorizontal } from "lucide-react"

import { useTranslation } from "@/i18n/LanguageProvider"
import { primaryNavForRole } from "@/components/nav-items"
import { MobileMoreSheet } from "@/components/MobileMoreSheet"
import { cn } from "@/lib/utils"

/**
 * The phone's main navigation: four thumb-reachable destinations plus More,
 * which opens the existing sidebar as a drawer. Hidden from `md` up, where the
 * sidebar itself is always on screen.
 */
export function MobileTabBar({ userRole = "roaster" }: { userRole?: string }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const items = primaryNavForRole(userRole)

  return (
    <>
    <nav
      aria-label={t("sidebar_order_management")}
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-40 flex items-start",
        "border-t border-warm-roast/10 bg-card/95 backdrop-blur-sm",
        "px-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_-4px_rgba(65,5,5,0.08)]"
      )}
    >
      {items.map((item) => {
        const isActive = pathname === item.url
        return (
          <Link
            key={item.titleKey}
            href={item.url}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex h-[60px] flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl",
              "transition-colors",
              isActive ? "text-coffee-fruit" : "text-expresso/55 hover:text-expresso"
            )}
          >
            {/* The one accent on this bar marks the one active tab. */}
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 h-[3px] w-7 rounded-full bg-coffee-fruit"
              />
            )}
            <item.icon className="h-[22px] w-[22px] shrink-0" />
            {/* One line, always: a wrapped label would push this tab's baseline
                out of line with the rest of the row. */}
            <span
              className={cn(
                "max-w-full truncate whitespace-nowrap px-0.5 text-[10px] leading-3",
                isActive && "font-bold"
              )}
            >
              {t(item.tabKey ?? item.titleKey)}
            </span>
          </Link>
        )
      })}

      <button
        type="button"
        onClick={() => setMoreOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        className={cn(
          "relative flex h-[60px] flex-1 basis-0 flex-col items-center justify-center gap-1 rounded-xl transition-colors",
          moreOpen ? "text-coffee-fruit" : "text-expresso/55 hover:text-expresso"
        )}
      >
        <MoreHorizontal className="h-[22px] w-[22px] shrink-0" />
        <span className="max-w-full truncate whitespace-nowrap px-0.5 text-[10px] leading-3">
          {t("sidebar_more")}
        </span>
      </button>
    </nav>

    <MobileMoreSheet open={moreOpen} onOpenChange={setMoreOpen} userRole={userRole} />
    </>
  )
}
