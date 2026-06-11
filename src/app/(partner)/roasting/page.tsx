'use client'

import { useState } from 'react'
import { Flame, Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { GenericModal } from '@/components/ui/GenericModal'
import { TableRowSkeleton } from '@/components/Skeletons'
import { RoastingCalculator } from '@/components/RoastingCalculator'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { formatCRC, formatKg } from '@/lib/format'
import { useRoastingOrders, useCreateRoastingOrder, useCancelRoastingOrder } from '@/hooks/queries'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { RoastingOrderStatus } from '@/types'
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
        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
            ))
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-expresso/50">
              <Flame className="h-8 w-8 opacity-20" />
              <p>{t('roasting_orders_empty')}</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                  <div>
                    <div className="font-bold text-coffee-fruit text-base">{formatKg(order.roasted_grams_out)}</div>
                    <div className="text-xs text-expresso/60 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge tone={statusTones[order.status]}>
                    {t(statusKeys[order.status])}
                  </StatusBadge>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('roasting_col_batches')}</div>
                    <div className="font-medium text-expresso">{order.batches_needed} · {Number(order.hours_required).toFixed(1)} h</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('roasting_col_service_cost')}</div>
                    <div className="font-bold text-warm-roast">{formatCRC(order.total_cost)}</div>
                  </div>
                </div>
                {order.status === 'pending' && (
                  <div className="px-4 pb-4">
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
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg gap-1 w-full"
                    >
                      <X className="h-4 w-4" /> {t('roasting_order_cancel')}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">{t('roasting_col_date')}</th>
                <th scope="col" className="px-6 py-4">{t('roasting_col_output')}</th>
                <th scope="col" className="px-6 py-4">{t('roasting_col_batches')}</th>
                <th scope="col" className="px-6 py-4">{t('roasting_col_service_cost')}</th>
                <th scope="col" className="px-6 py-4">{t('roasting_col_status')}</th>
                <th scope="col" className="px-6 py-4 text-right">{t('roasting_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowSkeleton cols={6} rows={4} />
              ) : !orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-expresso/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Flame className="h-8 w-8 opacity-20" />
                      <p>{t('roasting_orders_empty')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-coffee-fruit">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso">
                      {formatKg(order.roasted_grams_out)}
                      <div className="text-xs text-expresso/60">
                        {formatKg(order.green_grams_in)} {t('roasting_green_in')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-expresso/80">
                      {order.batches_needed} · {Number(order.hours_required).toFixed(1)} h
                    </td>
                    <td className="px-6 py-4 font-bold text-warm-roast">
                      {formatCRC(order.total_cost)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={statusTones[order.status]}>
                        {t(statusKeys[order.status])}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {order.status === 'pending' && (
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg gap-1"
                        >
                          <X className="h-4 w-4" /> {t('roasting_order_cancel')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
