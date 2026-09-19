"use client"

/**
 * The phone's top bar. Stays in normal flow rather than fixed — that is what
 * lets the app skip `viewport-fit: cover`, so iOS keeps insetting the layout
 * viewport and the bar never slides under the status bar in standalone PWA mode.
 *
 * No menu button: secondary navigation lives in the tab bar's "More" sheet, so
 * the sidebar drawer would be a second way to reach the same destinations.
 */
export function MobileTopBar({ businessName }: { businessName: string }) {
  return (
    <header className="md:hidden sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-warm-roast/10 bg-white-pergamino/95 px-4 backdrop-blur-sm">
      <span className="truncate font-heading text-lg text-expresso">{businessName}</span>
    </header>
  )
}
