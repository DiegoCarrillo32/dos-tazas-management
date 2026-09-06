'use client'

import { usePartnerRecurringOrders, useInventory, usePartners, useDeleteRecurringOrder } from '@/hooks/queries'
import type { B2BPartnerRecord } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { TableRowSkeleton } from '@/components/Skeletons'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenericModal } from '@/components/ui/GenericModal'
import { RecurringOrderForm } from '@/components/RecurringOrderForm'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatKg, formatRecurringSchedule } from '@/lib/format'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useState } from 'react'

export default function PartnerRecurringOrders() {
  const { t } = useTranslation()
  const { data: partnerData } = usePartners()
  const partnerDataArray = Array.isArray(partnerData) ? partnerData : []
  const partnerId = partnerDataArray[0]?.id || (partnerData as B2BPartnerRecord)?.id
  const { data: recurringOrders, isLoading } = usePartnerRecurringOrders(partnerId || '')
  const { data: inventoryItems } = useInventory()
  const deleteMutation = useDeleteRecurringOrder(partnerId || '')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHeader
          title={t('partner_recurring_title')}
          subtitle={t('partner_recurring_subtitle')}
        />
        {partnerId && (
          <GenericModal
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            trigger={
              <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-xl shadow-md transition-all gap-2 h-11 px-6">
                <Plus className="h-4 w-4" />
                {t('partner_new_standing')}
              </Button>
            }
            contentClassName="sm:max-w-[600px] bg-white-pergamino p-0 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            hideTitle={true}
            hideFooter={true}
            title={t('partner_new_standing')}
          >
            <div className="p-6">
              <RecurringOrderForm 
                partnerId={partnerId} 
                inventoryItems={(inventoryItems || []).filter(i => i.category === 'green_coffee')} 
                onSuccess={() => setIsDialogOpen(false)} 
                onCancel={() => setIsDialogOpen(false)} 
              />
            </div>
          </GenericModal>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
            ))
          ) : !recurringOrders || recurringOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-expresso/50">
              <RefreshCw className="h-8 w-8 opacity-20" />
              <p>{t('partner_no_recurring')}</p>
              <p className="text-xs">{t('partner_no_recurring_desc')}</p>
            </div>
          ) : (
            recurringOrders.map((order) => (
              <div key={order.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                  <div>
                    <div className="font-bold text-coffee-fruit text-base">{order.inventory?.item_name || t('partner_standard_coffee')}</div>
                    <div className="text-xs text-expresso/60 mt-0.5 capitalize">
                      {order.roast_level} {t('common_roast_suffix')} • {order.preparation_method}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <StatusBadge tone={order.is_active ? 'success' : 'danger'}>
                      {order.is_active ? t('common_active') : t('common_paused')}
                    </StatusBadge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(order.id)}
                      disabled={deleteMutation.isPending}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_amount')}</div>
                    <div className="font-medium text-expresso">{formatKg(order.amount_grams)}</div>
                    <div className="text-xs text-expresso/60">({t('common_bags').replace('{count}', String(order.bag_count))})</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_frequency')}</div>
                    <div className="font-medium text-expresso capitalize">
                      {formatRecurringSchedule(order.frequency, order.day_of_week, t)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">{t('common_coffee')}</th>
                <th scope="col" className="px-6 py-4">{t('common_amount')}</th>
                <th scope="col" className="px-6 py-4">{t('common_frequency')}</th>
                <th scope="col" className="px-6 py-4">{t('common_status')}</th>
                <th scope="col" className="px-6 py-4 text-right">{t('common_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowSkeleton cols={5} rows={4} />
              ) : !recurringOrders || recurringOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-expresso/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-8 w-8 opacity-20" />
                      <p>{t('partner_no_recurring')}</p>
                      <p className="text-xs">{t('partner_no_recurring_desc')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recurringOrders.map((order) => (
                  <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-coffee-fruit">
                      {order.inventory?.item_name || t('partner_standard_coffee')}
                      <div className="text-xs font-normal text-expresso/60 mt-0.5 capitalize">
                        {order.roast_level} {t('common_roast_suffix')} • {order.preparation_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso">
                      {formatKg(order.amount_grams)}
                      <span className="text-xs text-expresso/60 ml-1">({t('common_bags').replace('{count}', String(order.bag_count))})</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso capitalize">
                      {formatRecurringSchedule(order.frequency, order.day_of_week, t)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={order.is_active ? 'success' : 'danger'}>
                        {order.is_active ? t('common_active') : t('common_paused')}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(order.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
