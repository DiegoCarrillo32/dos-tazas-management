import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/**
 * True below 768px — the one breakpoint the whole app turns on.
 *
 * useSyncExternalStore rather than useEffect + setState: the old version seeded
 * `undefined` and only resolved in a timeout, so on a real phone the desktop
 * tree mounted first and then swapped. Prefer a CSS breakpoint over this hook
 * wherever the difference is only layout; it exists for the cases that genuinely
 * need a different component tree, like the sidebar's drawer.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    // The server has no viewport; assume desktop, as the markup already does.
    () => false
  )
}
