import * as React from "react"
import { Skeleton as DesignSystemSkeleton } from "dos-tazas-design-system"

/**
 * The app's skeleton is the design system's skeleton — warm-roast tinted rather
 * than the neutral `bg-muted` it used to be, which is what makes a loading list
 * read as this brand instead of a generic one.
 */
function Skeleton(props: React.ComponentProps<typeof DesignSystemSkeleton>) {
  return <DesignSystemSkeleton data-slot="skeleton" {...props} />
}

export { Skeleton }
