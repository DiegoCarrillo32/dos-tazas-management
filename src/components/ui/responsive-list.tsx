"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Where a column shows up on the mobile card.
 *
 * - `title`  the card headline. At most one column should claim it.
 * - `meta`   sits under the title, value only, no label (dates, badges, subtitles).
 * - `field`  the default: a label/value pair in the card's two-column body.
 * - `none`   desktop only; left off the card entirely.
 */
export type CardRole = "title" | "meta" | "field" | "none"

export interface ResponsiveListColumn<T> {
  /** Stable id, also the React key for the cell. */
  id: string
  /** Already translated by the call site — this primitive never calls t(). */
  header: React.ReactNode
  /** The desktop cell, and the card value unless `cardCell` overrides it. */
  cell: (row: T, index: number) => React.ReactNode
  /** Card value renderer, for when the phone wants different markup. */
  cardCell?: (row: T, index: number) => React.ReactNode
  /** Card label; defaults to `header`. */
  cardLabel?: React.ReactNode
  role?: CardRole
  align?: "left" | "right" | "center"
  headerClassName?: string
  cellClassName?: string
  /** A `field` that spans both card columns instead of one — addresses, notes. */
  cardFullWidth?: boolean
  /**
   * Card-only: left out of the table entirely. For a subtitle that the desktop
   * table folds into another cell but the card wants as its own `meta` line.
   * A `cardOnly` column still needs a `header` for its card label, and its
   * `cell` is never called.
   */
  cardOnly?: boolean
}

export interface ResponsiveListProps<T> {
  /**
   * `readonly T[]` on purpose: it makes call sites pass their already-paginated,
   * non-nullable array rather than the `T[] | undefined` a query hook returns,
   * which would infer `T = Row | undefined`.
   */
  data: readonly T[]
  columns: ResponsiveListColumn<T>[]
  rowKey: (row: T, index: number) => React.Key
  /** Already-translated node. Rendered in the table's colSpan cell and in the card area. */
  emptyState: React.ReactNode
  /** Per-row buttons: the last right-aligned cell, and the card header's right side. */
  actions?: (row: T) => React.ReactNode
  actionsHeader?: React.ReactNode
  /**
   * Card header's right side, when it should differ from `actions` — a row
   * checkbox, say, while the buttons go to `cardFooter`. Defaults to `actions`.
   */
  cardActions?: (row: T) => React.ReactNode
  /**
   * A strip along the bottom of the card. Where a row's buttons belong when
   * they are too wide or too many for the header at phone width.
   */
  cardFooter?: (row: T) => React.ReactNode
  onRowClick?: (row: T) => void
  isLoading?: boolean
  loadingRows?: number
  minTableWidth?: string
  rowClassName?: (row: T, index: number) => string | undefined
  /** Accessible table caption, already translated. */
  caption?: string
  className?: string
}

const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const

/**
 * One column definition, two presentations: a real table from `md` up, a stacked
 * card list below it. Both branches render on the server and the switch is a CSS
 * breakpoint, so there is no `useIsMobile()` and no first-paint flash.
 */
export function ResponsiveList<T>({
  data,
  columns,
  rowKey,
  emptyState,
  actions,
  actionsHeader,
  cardActions,
  cardFooter,
  onRowClick,
  isLoading = false,
  loadingRows = 3,
  minTableWidth = "min-w-[800px]",
  rowClassName,
  caption,
  className,
}: ResponsiveListProps<T>) {
  const roleOf = (c: ResponsiveListColumn<T>) => c.role ?? "field"
  const titleCol = columns.find((c) => roleOf(c) === "title") ?? columns[0]
  const metaCols = columns.filter((c) => roleOf(c) === "meta")
  // Full-width fields sort last. Column order is the table's business; if a
  // spanning field sat between two half-width ones it would push them onto
  // separate rows and leave holes in the card's two-column grid.
  const fieldCols = columns
    .filter((c) => roleOf(c) === "field" && c !== titleCol)
    .sort((a, b) => Number(a.cardFullWidth ?? false) - Number(b.cardFullWidth ?? false))
  const tableCols = columns.filter((c) => !c.cardOnly)
  const colCount = tableCols.length + (actions ? 1 : 0)
  const isEmpty = !isLoading && data.length === 0

  const cardValue = (c: ResponsiveListColumn<T>, row: T, i: number) =>
    (c.cardCell ?? c.cell)(row, i)

  return (
    <div className={cn("w-full", className)}>
      {/* ── Cards, below md ───────────────────────────────────────────────── */}
      <div className="md:hidden">
        {isLoading ? (
          <div className="flex flex-col gap-4 p-4 bg-warm-roast/5 dark:bg-muted/10">
            {Array.from({ length: loadingRows }).map((_, i) => (
              <div
                key={i}
                className="h-28 rounded-2xl border border-warm-roast/10 bg-card animate-pulse"
              />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="px-6 py-12 text-center text-expresso/60">{emptyState}</div>
        ) : (
          <div className="flex flex-col gap-4 p-4 bg-warm-roast/5 dark:bg-muted/10">
            {data.map((row, i) => {
              const headerActions = (cardActions ?? actions)?.(row)
              const footer = cardFooter?.(row)
              return (
                <div
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            onRowClick(row)
                          }
                        }
                      : undefined
                  }
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border border-warm-roast/10 bg-card shadow-sm shadow-warm-roast/5",
                    onRowClick && "cursor-pointer transition-shadow hover:shadow-md",
                    rowClassName?.(row, i)
                  )}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-warm-roast/5 bg-white-pergamino/30 dark:bg-muted/20 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-expresso">
                        {cardValue(titleCol, row, i)}
                      </div>
                      {metaCols.length > 0 && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-expresso/60">
                          {metaCols.map((c) => (
                            <span key={c.id}>{cardValue(c, row, i)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {headerActions ? (
                      // Row actions must never fall through to onRowClick.
                      <div
                        className="flex shrink-0 items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {headerActions}
                      </div>
                    ) : null}
                  </div>

                  {fieldCols.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 p-4">
                      {fieldCols.map((c) => (
                        <div key={c.id} className={cn(c.cardFullWidth && "col-span-2")}>
                          <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-expresso/50">
                            {c.cardLabel ?? c.header}
                          </div>
                          <div className="text-sm font-medium text-expresso">
                            {cardValue(c, row, i)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {footer ? (
                    <div
                      className="flex flex-wrap items-center gap-2 border-t border-warm-roast/5 px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {footer}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Table, md and up ──────────────────────────────────────────────── */}
      <div className="hidden overflow-x-auto md:block">
        <table className={cn("w-full text-left text-sm", minTableWidth)}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="border-b border-warm-roast/10 bg-warm-roast/5 text-xs font-bold uppercase text-expresso/70">
            <tr>
              {tableCols.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={cn("px-6 py-4", ALIGN[c.align ?? "left"], c.headerClassName)}
                >
                  {c.header}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-6 py-4 text-right">
                  {actionsHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: loadingRows }).map((_, i) => (
                <tr key={i} className="border-b border-warm-roast/5">
                  {Array.from({ length: colCount }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-full animate-pulse rounded bg-warm-roast/10" />
                    </td>
                  ))}
                </tr>
              ))
            ) : isEmpty ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="border-b border-warm-roast/10 px-6 py-12 text-center text-expresso/60"
                >
                  {emptyState}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "group border-b border-warm-roast/5 transition-colors hover:bg-warm-roast/5",
                    onRowClick && "cursor-pointer",
                    rowClassName?.(row, i)
                  )}
                >
                  {tableCols.map((c) => (
                    <td
                      key={c.id}
                      className={cn(
                        "px-6 py-4 text-expresso/80",
                        ALIGN[c.align ?? "left"],
                        c.cellClassName
                      )}
                    >
                      {c.cell(row, i)}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
