'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { AnalyticsDataset } from '@/types'
import type { AnalyticsReport } from '@/utils/analytics-insights'
import { downloadAnalyticsCsv, type CsvExportKind } from '@/utils/exportAnalyticsCsv'

const KINDS: CsvExportKind[] = ['orders', 'customers', 'products', 'roasting']

export function ExportMenu({ dataset, report, disabled }: { dataset: AnalyticsDataset; report: AnalyticsReport; disabled?: boolean }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            disabled={disabled}
            className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6 max-sm:w-full"
          >
            <Download className="h-5 w-5" />
            <span className="font-bold">{t('analytics_export')}</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64 p-2 bg-white-pergamino border-warm-roast/10 rounded-xl shadow-xl">
        <p className="px-2 pt-1 text-xs text-expresso/60">{t('analytics_export_hint')}</p>
        <ul className="flex flex-col">
          {KINDS.map((kind) => (
            <li key={kind}>
              <button
                type="button"
                onClick={() => {
                  downloadAnalyticsCsv(kind, dataset, report)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-expresso hover:bg-warm-roast/10 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-warm-roast" />
                {t(`analytics_export_${kind}`)}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
