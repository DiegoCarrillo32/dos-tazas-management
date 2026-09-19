'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus, Flame, Edit, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { RoastBatchForm } from '@/components/RoastBatchForm'
import { useRoastBatches } from '@/hooks/queries'
import { GenericModal } from '@/components/ui/GenericModal'
import { StatusBadge } from '@/components/ui/status-badge'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import type { RoastBatchRecord } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'

export default function RoastsPage() {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { data: roasts, isLoading } = useRoastBatches()

  const filteredRoasts = roasts?.filter(r => 
    r.green_lot_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const yieldOf = (b: RoastBatchRecord) =>
    b.weight_in_grams && b.weight_out_grams && b.weight_in_grams > 0
      ? ((b.weight_out_grams / b.weight_in_grams) * 100).toFixed(1)
      : null

  const rowActions = (batch: RoastBatchRecord) => (
    <GenericModal
      variant="bare"
      title={t('roasts_edit')}
      contentClassName="sm:max-w-[600px]"
      trigger={
        <Button variant="ghost" size="icon-sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 rounded-full max-md:size-11">
          <Edit className="h-4 w-4" />
          <span className="sr-only">{t('edit')}</span>
        </Button>
      }
    >
      <RoastBatchForm initialData={batch} />
    </GenericModal>
  )

  const columns: ResponsiveListColumn<RoastBatchRecord>[] = [
    {
      id: 'lot',
      role: 'title',
      header: t('roasts_col_lot'),
      cell: (b) => (
        <>
          <span className="font-bold text-coffee-fruit">{b.green_lot_name || t('roasts_unknown_lot')}</span>
          {b.notes && <p className="text-xs text-expresso/60 truncate max-w-[200px] mt-1">{b.notes}</p>}
        </>
      ),
      cardCell: (b) => b.green_lot_name || t('roasts_unknown_lot'),
    },
    {
      id: 'date',
      role: 'meta',
      header: t('roasts_col_date'),
      cell: (b) => (
        <div className="flex flex-col font-medium text-expresso">
          <span>{new Date(b.created_at).toLocaleDateString()}</span>
          {b.roast_time_minutes && (
            <span className="text-xs text-expresso/50">
              {b.roast_time_minutes} {t('roasts_minutes')}
            </span>
          )}
        </div>
      ),
      cardCell: (b) => (
        <span className="bg-warm-roast/10 text-expresso/70 px-2 py-0.5 rounded-full">
          {new Date(b.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'in',
      header: `${t('roasts_col_weight_in')} (g)`,
      cardLabel: t('roasts_col_weight_in'),
      cell: (b) => <span className="font-medium">{b.weight_in_grams}</span>,
      cardCell: (b) => `${b.weight_in_grams} g`,
    },
    {
      id: 'out',
      header: `${t('roasts_col_weight_out')} (g)`,
      cardLabel: t('roasts_col_weight_out'),
      cell: (b) => <span className="font-medium">{b.weight_out_grams}</span>,
      cardCell: (b) => `${b.weight_out_grams} g`,
    },
    {
      id: 'yield',
      header: `${t('roasts_col_yield')} (%)`,
      cardLabel: t('roasts_col_yield'),
      cell: (b) => {
        const y = yieldOf(b)
        return (
          <StatusBadge tone={Number(y) < 80 ? 'danger' : 'success'}>
            {y ? `${y}%` : '—'}
          </StatusBadge>
        )
      },
    },
    {
      id: 'roaster',
      header: t('roasts_col_roaster'),
      cell: (b) => b.equipment_name || <span className="text-expresso/40 italic font-normal">—</span>,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('roasts_title')}
        subtitle={t('roasts_subtitle')}
        action={
          <GenericModal
            variant="bare"
            isOpen={isAddOpen}
            onOpenChange={setIsAddOpen}
            title={t('roasts_log')}
            contentClassName="sm:max-w-[600px]"
            trigger={
              <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-full px-6 shadow-sm shadow-warm-roast/20 transition-all">
                <Plus className="mr-2 h-4 w-4" /> {t('roasts_log')}
              </Button>
            }
          >
            <RoastBatchForm onSuccess={() => setIsAddOpen(false)} onCancel={() => setIsAddOpen(false)} />
          </GenericModal>
        }
      />

      {/* Filters & Search */}
      <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-expresso/40" />
            <Input
              placeholder={t('roasts_search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Roasts Table */}
      <div className="bg-card rounded-xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        <ResponsiveList
          data={filteredRoasts}
          columns={columns}
          rowKey={(b) => b.id}
          actions={rowActions}
          actionsHeader={t('roasts_col_actions')}
          isLoading={isLoading}
          caption={t('roasts_title')}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-2">
              <Flame className="h-8 w-8 opacity-20" />
              <p>{t('roasts_no_found')}</p>
            </div>
          }
        />

      </div>
    </div>
  )
}
