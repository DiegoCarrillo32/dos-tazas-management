'use client'

import { useOrders } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import { formatCurrency, formatKg } from '@/lib/format'
import { useTranslation } from '@/i18n/LanguageProvider'
import { Package } from 'lucide-react'
import type { OrderWithCustomer } from '@/types'

const fulfillmentTone = (status: string): StatusTone =>
  status === 'delivered' ? 'success' : status === 'roasted' ? 'accent' : 'info'

export default function PartnerOrders() {
  const { t } = useTranslation()
  const { data: orders, isLoading } = useOrders()

  const columns: ResponsiveListColumn<OrderWithCustomer>[] = [
    {
      id: 'coffee',
      role: 'title',
      header: t('partner_coffee_details'),
      cell: (o) => (
        <>
          <span className="font-bold text-coffee-fruit">
            {o.inventory?.item_name || t('partner_coffee_bean')}
          </span>
          <div className="text-xs font-normal text-expresso/60 mt-0.5 capitalize">
            {o.roast_level} {t('common_roast_suffix')} • {o.preparation_method}
          </div>
        </>
      ),
      cardCell: (o) => o.inventory?.item_name || t('partner_coffee_bean'),
    },
    {
      // The table folds this under the coffee name; the card wants it as its own
      // line under the title, so it is card-only rather than an empty column.
      id: 'detail',
      role: 'meta',
      cardOnly: true,
      header: t('partner_coffee_details'),
      cell: (o) => (
        <span className="capitalize">
          {o.roast_level} {t('common_roast_suffix')} • {o.preparation_method}
        </span>
      ),
    },
    {
      id: 'date',
      header: t('common_date'),
      cell: (o) => new Date(o.order_date).toLocaleDateString(),
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
      id: 'total',
      header: t('common_total'),
      cell: (o) => <span className="font-bold text-warm-roast">{formatCurrency(o.total_price)}</span>,
    },
    {
      id: 'status',
      header: t('common_status'),
      cell: (o) => (
        <StatusBadge tone={fulfillmentTone(o.fulfillment_status)}>{o.fulfillment_status}</StatusBadge>
      ),
    },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('partner_orders_title')}
        subtitle={t('partner_orders_subtitle')}
      />

      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        <ResponsiveList
          data={orders ?? []}
          columns={columns}
          rowKey={(o) => o.id}
          isLoading={isLoading}
          loadingRows={5}
          caption={t('partner_orders_title')}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-2">
              <Package className="h-8 w-8 opacity-20" />
              <p>{t('partner_no_history')}</p>
            </div>
          }
        />
      </div>
    </div>
  )
}
