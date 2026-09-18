"use client"

import {
  Button as DesignSystemButton,
  buttonVariants,
  type ButtonProps as DesignSystemButtonProps,
} from "dos-tazas-design-system"

import { cn } from "@/lib/utils"

/**
 * The app's button is the design system's button.
 *
 * Call sites keep the shadcn vocabulary they were written against
 * (`variant="ghost"`, `size="icon-sm"`) and this module translates it, so
 * adopting the design system did not mean touching 124 call sites. New code can
 * use either vocabulary — the design system's own props (`pill`, `loading`,
 * `leadingIcon`, `trailingIcon`) pass straight through.
 */

type AppVariant =
  | "default"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link"

type AppSize =
  | "default"
  | "xs"
  | "sm"
  | "lg"
  | "icon"
  | "icon-xs"
  | "icon-sm"
  | "icon-lg"

/**
 * `default` is the coffee-fruit fill, which the design system calls `accent`;
 * `secondary` is the warm-roast fill it calls `primary`. The names cross over —
 * the colours do not.
 */
const VARIANTS: Record<AppVariant, NonNullable<DesignSystemButtonProps["variant"]>> = {
  default: "accent",
  secondary: "primary",
  outline: "outline",
  ghost: "ghost",
  destructive: "destructive",
  link: "link",
}

/** The design system has three heights; these are the closest matches. */
const SIZES: Record<AppSize, NonNullable<DesignSystemButtonProps["size"]>> = {
  default: "sm",
  xs: "sm",
  sm: "sm",
  lg: "md",
  icon: "sm",
  "icon-xs": "sm",
  "icon-sm": "sm",
  "icon-lg": "md",
}

/** Sizes the design system has no variant for: squared off, or tighter than `sm`. */
const SIZE_OVERRIDES: Partial<Record<AppSize, string>> = {
  xs: "h-6 px-2 text-xs [&_svg]:size-3",
  icon: "size-8 p-0",
  "icon-xs": "size-6 p-0 [&_svg]:size-3",
  "icon-sm": "size-7 p-0 [&_svg]:size-3.5",
  "icon-lg": "size-10 p-0 [&_svg]:size-5",
}

export interface ButtonProps
  extends Omit<DesignSystemButtonProps, "variant" | "size"> {
  variant?: AppVariant
  size?: AppSize
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <DesignSystemButton
      data-slot="button"
      variant={VARIANTS[variant]}
      size={SIZES[size]}
      className={cn(SIZE_OVERRIDES[size], className)}
      {...props}
    />
  )
}

export { Button, buttonVariants }
