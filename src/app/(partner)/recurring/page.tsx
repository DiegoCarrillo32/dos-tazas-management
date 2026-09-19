'use client'

import { usePartnerRecurringOrders, useInventory, usePartners, useDeleteRecurringOrder } from '@/hooks/queries'
import type { B2BPartnerRecord } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import type { B2BRecurringOrderRecord } from '@/types'
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
  const rowActions = (order: B2BRecurringOrderRecord) => (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => deleteMutation.mutate(order.id)}
      disabled={deleteMutation.isPending}
      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg size-11 md:size-8"
    >
      <Trash2 className="h-4 w-4" />
      <span className="sr-only">{t('delete')}</span>
    </Button>
  )

  const columns: ResponsiveListColumn<B2BRecurringOrderRecord>[] = [
    {
      id: 'coffee',
      role: 'title',
      header: t('common_coffee'),
      cell: (o) => (
        <>
          <span className="font-bold text-coffee-fruit">
            {o.inventory?.item_name || t('partner_standard_coffee')}
          </span>
          <div className="text-xs font-normal text-expresso/60 mt-0.5 capitalize">
            {o.roast_level} {t('common_roast_suffix')} • {o.preparation_method}
          </div>
        </>
      ),
      cardCell: (o) => o.inventory?.item_name || t('partner_standard_coffee'),
    },
    {
      id: 'detail',
      role: 'meta',
      cardOnly: true,
      header: t('common_coffee'),
      cell: (o) => (
        <span className="capitalize">
          {o.roast_level} {t('common_roast_suffix')} • {o.preparation_method}
        </span>
      ),
    },
    {
      id: 'amount',
      header: t('common_amount'),
      cell: (o) => (
        <>
          <span className="font-medium text-expresso">{formatKg(o.amount_grams)}</span>
          <span className="text-xs text-expresso/60 ml-1">
            ({t('common_bags').replace('{count}', String(o.bag_count))})
          </span>
        </>
      ),
    },
    {
      id: 'frequency',
      header: t('common_frequency'),
      cell: (o) => (
        <span className="capitalize">{formatRecurringSchedule(o.frequency, o.day_of_week, t)}</span>
      ),
    },
    {
      id: 'status',
      header: t('common_status'),
      cell: (o) => (
        <StatusBadge tone={o.is_active ? 'success' : 'danger'}>
          {o.is_active ? t('common_active') : t('common_paused')}
        </StatusBadge>
      ),
    },
  ]

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
        <ResponsiveList
          data={recurringOrders ?? []}
          columns={columns}
          rowKey={(o) => o.id}
          actions={rowActions}
          actionsHeader={t('common_actions')}
          isLoading={isLoading}
          caption={t('partner_recurring_title')}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-8 w-8 opacity-20" />
              <p>{t('partner_no_recurring')}</p>
              <p className="text-xs">{t('partner_no_recurring_desc')}</p>
            </div>
          }
        />

      </div>
    </div>
  )
}
