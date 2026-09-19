'use client'

import { useOrders, usePartnerRecurringOrders, usePartners } from '@/hooks/queries'
import type { B2BPartnerRecord } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import type { OrderWithCustomer } from '@/types'
import { formatKg } from '@/lib/format'
import { useTranslation } from '@/i18n/LanguageProvider'
import { RefreshCw, Package, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

const fulfillmentTone = (status: string): StatusTone =>
  status === 'delivered' ? 'success' : status === 'roasted' ? 'accent' : 'info'

export default function PartnerDashboard() {
  const { t } = useTranslation()
  const { data: orders, isLoading: ordersLoading } = useOrders()
  const { data: partnerData } = usePartners()
  const partnerDataArray = Array.isArray(partnerData) ? partnerData : []
  const partnerId = partnerDataArray[0]?.id || (partnerData as B2BPartnerRecord)?.id
  const { data: recurringOrders, isLoading: recurringLoading } = usePartnerRecurringOrders(partnerId || '')
  const activeRecurringCount = (recurringOrders || []).filter((o) => o.is_active).length

  const pendingOrders = (orders || []).filter(o => o.fulfillment_status === 'pending' || o.fulfillment_status === 'roasted')
  const recentOrders = (orders || []).slice(0, 5)

  const columns: ResponsiveListColumn<OrderWithCustomer>[] = [
    {
      id: 'coffee',
      role: 'title',
      header: t('common_coffee'),
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
      // Folded into the coffee cell on desktop; its own line on the card.
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
      id: 'date',
      header: t('common_date'),
      cell: (o) => new Date(o.order_date).toLocaleDateString(),
    },
    {
      id: 'amount',
      header: t('common_amount'),
      cell: (o) => <span className="font-medium text-expresso">{formatKg(o.amount_grams)}</span>,
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
        title={t('partner_dash_title')}
        subtitle={t('partner_dash_subtitle')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card/90 backdrop-blur-sm border-warm-roast/10 shadow-sm shadow-warm-roast/5 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading text-expresso flex items-center gap-2">
              <Clock className="w-5 h-5 text-warm-roast" /> {t('partner_active_orders')}
            </CardTitle>
            <CardDescription className="text-expresso/60">
              {t('partner_active_orders_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="h-8 w-16 bg-warm-roast/10 animate-pulse rounded-lg mt-2" />
            ) : (
              <div className="text-4xl font-bold text-coffee-fruit mt-2">
                {pendingOrders.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/90 backdrop-blur-sm border-warm-roast/10 shadow-sm shadow-warm-roast/5 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading text-expresso flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-warm-roast" /> {t('partner_recurring_orders')}
            </CardTitle>
            <CardDescription className="text-expresso/60">
              {t('partner_recurring_orders_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recurringLoading ? (
              <div className="h-8 w-16 bg-warm-roast/10 animate-pulse rounded-lg mt-2" />
            ) : (
              <div className="text-4xl font-bold text-coffee-fruit mt-2">
                {activeRecurringCount}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading text-expresso flex items-center gap-2">
            <Package className="w-5 h-5 text-warm-roast" /> {t('partner_recent_orders')}
          </h3>
          <Link href="/orders" className="text-sm font-medium text-coffee-fruit hover:text-warm-roast flex items-center">
            {t('partner_view_all')} <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <ResponsiveList
          data={recentOrders}
          columns={columns}
          rowKey={(o) => o.id}
          isLoading={ordersLoading}
          caption={t('partner_recent_orders')}
          emptyState={<span>{t('partner_no_orders')}</span>}
        />

      </div>
    </div>
  )
}
