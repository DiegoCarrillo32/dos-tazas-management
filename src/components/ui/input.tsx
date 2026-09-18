"use client"

import * as React from "react"
import { Input as DesignSystemInput } from "dos-tazas-design-system"

import { cn } from "@/lib/utils"

/**
 * The app's input is the design system's input.
 *
 * Two things the design system's version does not carry are kept here because
 * the app's forms rely on them: `aria-invalid` (which react-hook-form sets, and
 * which the design system spells `invalid`) and the `text-base md:text-sm`
 * sizing that stops iOS zooming the page on focus.
 */
function Input({
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<typeof DesignSystemInput>) {
  const invalid =
    props.invalid ?? (ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false")

  return (
    <DesignSystemInput
      data-slot="input"
      aria-invalid={ariaInvalid}
      {...props}
      invalid={invalid}
      className={cn(
        "text-base md:text-sm file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
    />
  )
}

export { Input }
