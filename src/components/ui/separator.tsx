"use client"

import * as React from "react"
import { Divider } from "dos-tazas-design-system"

import { cn } from "@/lib/utils"

/**
 * The app's separator is the design system's `Divider`.
 *
 * Kept under the `Separator` name for the sidebar, and still accepting
 * `orientation`; `Divider` also takes a `label` for the "or" rule, which the
 * old base-ui separator could not draw.
 */
function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof Divider>) {
  return (
    <Divider
      data-slot="separator"
      orientation={orientation}
      className={cn(className)}
      {...props}
    />
  )
}

export { Separator }
