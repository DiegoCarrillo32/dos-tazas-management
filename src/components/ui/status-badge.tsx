import {
  StatusPill,
  statusPillVariants,
  type StatusPillProps,
  type StatusTone,
} from "dos-tazas-design-system"

/**
 * The app's status badge is the design system's `StatusPill`.
 *
 * Same seven tones and the same tints, so tables and detail modals render
 * unchanged apart from the shape: the design system's pill is `rounded-full`
 * where this used to be `rounded`. Kept under the old name and export so the
 * ten call sites did not have to move.
 */
const StatusBadge = StatusPill

export { StatusBadge, statusPillVariants as statusBadgeVariants }
export type { StatusPillProps as StatusBadgeProps, StatusTone }
