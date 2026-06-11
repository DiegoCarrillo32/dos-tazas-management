import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Soft-tinted status pill used in tables and detail modals.
 *
 * Every tone ships its `dark:` variant in one place, replacing the dozen
 * copy-pasted `bg-green-100 text-green-800` (light-only) badges that rendered
 * as pale pastels on the dark surface.
 */
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap capitalize",
  {
    variants: {
      tone: {
        success:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        warning:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        danger:
          "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        info:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        accent:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        emerald:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        neutral: "bg-warm-roast/10 text-expresso/70",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
)

export type StatusTone = NonNullable<
  VariantProps<typeof statusBadgeVariants>["tone"]
>

function StatusBadge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusBadgeVariants>) {
  return (
    <span
      data-slot="status-badge"
      className={cn(statusBadgeVariants({ tone }), className)}
      {...props}
    />
  )
}

export { StatusBadge, statusBadgeVariants }
