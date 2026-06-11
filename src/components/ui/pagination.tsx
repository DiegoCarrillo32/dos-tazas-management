'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/LanguageProvider'

type PaginationProps = {
  /** 1-based current page (already clamped to [1, totalPages] by the caller). */
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  /** Pre-formatted "Showing X–Y of Z" string. */
  showingText?: string
  className?: string
}

/**
 * Shared paginator extracted from the inventory, customers, equipment and
 * history pages, which all shipped the same ~40-line windowed pager.
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showingText,
  className,
}: PaginationProps) {
  const { t } = useTranslation()

  if (totalPages <= 1) return null

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4 border-t border-warm-roast/10 bg-warm-roast/5 rounded-b-lg',
        className
      )}
    >
      {showingText && (
        <div className="text-xs text-expresso/60 font-bold">{showingText}</div>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          className="h-8 text-xs font-bold text-expresso border-warm-roast/20 hover:bg-warm-roast/10"
        >
          {t('pag_previous')}
        </Button>
        {Array.from({ length: totalPages }).map((_, idx) => {
          const page = idx + 1
          if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className={cn(
                  'h-8 w-8 p-0 text-xs font-bold',
                  currentPage === page
                    ? 'bg-warm-roast hover:bg-coffee-fruit text-white'
                    : 'text-expresso border-warm-roast/20 hover:bg-warm-roast/10'
                )}
              >
                {page}
              </Button>
            )
          }
          if (page === 2 || page === totalPages - 1) {
            return (
              <span key={page} className="px-1 text-expresso/40 text-xs select-none">
                ...
              </span>
            )
          }
          return null
        })}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          className="h-8 text-xs font-bold text-expresso border-warm-roast/20 hover:bg-warm-roast/10"
        >
          {t('pag_next')}
        </Button>
      </div>
    </div>
  )
}
