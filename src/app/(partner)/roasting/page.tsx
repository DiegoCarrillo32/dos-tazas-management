'use client'

import { useState } from 'react'
import { Flame, Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { GenericModal } from '@/components/ui/GenericModal'
import { RoastingCalculator } from '@/components/RoastingCalculator'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import { formatCRC, formatKg } from '@/lib/format'
import { useRoastingOrders, useCreateRoastingOrder, useCancelRoastingOrder } from '@/hooks/queries'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { RoastingOrderStatus, RoastingOrderRecord } from '@/types'
import { toast } from 'sonner'

const statusTones: Record<RoastingOrderStatus, StatusTone> = {
  pending: 'info',
  accepted: 'accent',
  completed: 'success',
  cancelled: 'danger',
}

const statusKeys: Record<RoastingOrderStatus, DictionaryKey> = {
  pending: 'roasting_status_pending',
  accepted: 'roasting_status_accepted',
  completed: 'roasting_status_completed',
  cancelled: 'roasting_status_cancelled',
}

export default function PartnerRoastingOrders() {
  const { t } = useTranslation()
  const { data: orders, isLoading } = useRoastingOrders()
  const createMutation = useCreateRoastingOrder()
  const cancelMutation = useCancelRoastingOrder()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const rowActions = (order: RoastingOrderRecord) =>
    order.status === 'pending' ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          cancelMutation.mutate(order.id, {
            onSuccess: () => toast.success(t('roasting_order_cancelled')),
            onError: (err: Error) => toast.error(err.message),
          })
        }
        disabled={cancelMutation.isPending}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg gap-1 max-md:min-h-11"
      >
        <X className="h-4 w-4" /> {t('roasting_order_cancel')}
      </Button>
    ) : null

  const columns: ResponsiveListColumn<RoastingOrderRecord>[] = [
    {
      id: 'output',
      role: 'title',
      header: t('roasting_col_output'),
      cell: (o) => (
        <>
          <span className="font-medium text-expresso">{formatKg(o.roasted_grams_out)}</span>
          <div className="text-xs text-expresso/60">
            {formatKg(o.green_grams_in)} {t('roasting_green_in')}
          </div>
        </>
      ),
      cardCell: (o) => formatKg(o.roasted_grams_out),
    },
    {
      id: 'date',
      role: 'meta',
      header: t('roasting_col_date'),
      cell: (o) => (
        <span className="font-bold text-coffee-fruit">
          {new Date(o.created_at).toLocaleDateString()}
        </span>
      ),
      cardCell: (o) => new Date(o.created_at).toLocaleDateString(),
    },
    {
      id: 'batches',
      header: t('roasting_col_batches'),
      cell: (o) => `${o.batches_needed} · ${Number(o.hours_required).toFixed(1)} h`,
    },
    {
      id: 'cost',
      header: t('roasting_col_service_cost'),
      cell: (o) => <span className="font-bold text-warm-roast">{formatCRC(o.total_cost)}</span>,
    },
    {
      id: 'status',
      header: t('roasting_col_status'),
      cell: (o) => <StatusBadge tone={statusTones[o.status]}>{t(statusKeys[o.status])}</StatusBadge>,
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('roasting_orders_title')}
        subtitle={t('roasting_orders_subtitle')}
        action={
          <GenericModal
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            hideFooter={true}
            hideTitle={true}
            title={t('roasting_order_new')}
            contentClassName="sm:max-w-[900px] bg-white-pergamino p-6 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            trigger={
              <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-full px-6 shadow-sm shadow-warm-roast/20 transition-all gap-2">
                <Plus className="h-4 w-4" /> {t('roasting_order_new')}
              </Button>
            }
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-heading text-expresso">{t('roasting_order_new')}</h2>
                <p className="text-expresso/70 font-medium text-sm mt-1">{t('roasting_orders_subtitle')}</p>
              </div>
              <RoastingCalculator
                isSubmitting={createMutation.isPending}
                onPlaceOrder={(input) =>
                  createMutation.mutate(input, {
                    onSuccess: () => {
                      toast.success(t('roasting_order_success'))
                      setIsDialogOpen(false)
                    },
                    onError: (err: Error) => {
                      toast.error(err.message || 'Failed to place roasting order')
                    },
                  })
                }
              />
            </div>
          </GenericModal>
        }
      />

      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        <ResponsiveList
          data={orders ?? []}
          columns={columns}
          rowKey={(o) => o.id}
          actions={rowActions}
          actionsHeader={t('roasting_col_actions')}
          isLoading={isLoading}
          loadingRows={4}
          caption={t('roasting_orders_title')}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-2">
              <Flame className="h-8 w-8 opacity-20" />
              <p>{t('roasting_orders_empty')}</p>
            </div>
          }
        />

      </div>
    </div>
  )
}
