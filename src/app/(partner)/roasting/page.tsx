'use client'

import { useState } from 'react'
import { Flame, Plus, X } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { GenericModal } from '@/components/ui/GenericModal'
import { TableRowSkeleton } from '@/components/Skeletons'
import { RoastingCalculator } from '@/components/RoastingCalculator'
import { useRoastingOrders, useCreateRoastingOrder, useCancelRoastingOrder } from '@/hooks/queries'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { DictionaryKey } from '@/i18n/dictionaries'
import type { RoastingOrderStatus } from '@/types'
import { toast } from 'sonner'

const crcFormatter = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

const statusStyles: Record<RoastingOrderStatus, string> = {
  pending: 'bg-blue-100 text-blue-800',
  accepted: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
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
        <div className="overflow-x-auto">
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
                      {(order.roasted_grams_out / 1000).toFixed(2)} kg
                      <div className="text-xs text-expresso/60">
                        {(order.green_grams_in / 1000).toFixed(2)} kg {t('roasting_green_in')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-expresso/80">
                      {order.batches_needed} · {Number(order.hours_required).toFixed(1)} h
                    </td>
                    <td className="px-6 py-4 font-bold text-warm-roast">
                      {crcFormatter.format(Number(order.total_cost))}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyles[order.status]}`}>
                        {t(statusKeys[order.status])}
                      </span>
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg gap-1"
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
