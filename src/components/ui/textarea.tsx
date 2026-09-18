"use client"

import * as React from "react"
import { Textarea as DesignSystemTextarea } from "dos-tazas-design-system"

import { cn } from "@/lib/utils"

/** The app's textarea is the design system's textarea; see `input.tsx` for why `aria-invalid` is bridged. */
function Textarea({
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<typeof DesignSystemTextarea>) {
  const invalid =
    props.invalid ?? (ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false")

  return (
    <DesignSystemTextarea
      data-slot="textarea"
      aria-invalid={ariaInvalid}
      {...props}
      invalid={invalid}
      className={cn("field-sizing-content text-base md:text-sm", className)}
    />
  )
}

export { Textarea }
