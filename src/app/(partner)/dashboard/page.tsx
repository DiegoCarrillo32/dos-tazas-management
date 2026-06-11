'use client'

import { useOrders, usePartnerRecurringOrders, usePartners } from '@/hooks/queries'
import type { B2BPartnerRecord } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableRowSkeleton } from '@/components/Skeletons'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
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

        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-3">
          {ordersLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-warm-roast/5 rounded-xl border border-warm-roast/10 animate-pulse" />
            ))
          ) : recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-expresso/50">{t('partner_no_orders')}</div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="flex items-start justify-between gap-3 bg-white-pergamino/30 rounded-xl border border-warm-roast/10 p-4">
                <div className="min-w-0">
                  <div className="font-bold text-coffee-fruit truncate">{order.inventory?.item_name || t('partner_coffee_bean')}</div>
                  <div className="text-xs text-expresso/60 mt-0.5 capitalize">
                    {order.roast_level} {t('common_roast_suffix')} • {order.preparation_method}
                  </div>
                  <div className="text-xs text-expresso/60 mt-1">
                    {new Date(order.order_date).toLocaleDateString()} • {formatKg(order.amount_grams)}
                  </div>
                </div>
                <StatusBadge tone={fulfillmentTone(order.fulfillment_status)}>
                  {order.fulfillment_status}
                </StatusBadge>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">{t('common_date')}</th>
                <th scope="col" className="px-6 py-4">{t('common_coffee')}</th>
                <th scope="col" className="px-6 py-4">{t('common_amount')}</th>
                <th scope="col" className="px-6 py-4">{t('common_status')}</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <TableRowSkeleton cols={4} rows={3} />
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-expresso/50">
                    {t('partner_no_orders')}
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors">
                    <td className="px-6 py-4 text-expresso">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-coffee-fruit">
                      {order.inventory?.item_name || t('partner_coffee_bean')}
                      <div className="text-xs font-normal text-expresso/60 mt-0.5 capitalize">
                        {order.roast_level} {t('common_roast_suffix')} • {order.preparation_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso">
                      {formatKg(order.amount_grams)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge tone={fulfillmentTone(order.fulfillment_status)}>
                        {order.fulfillment_status}
                      </StatusBadge>
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
