'use client'

import { useOrders } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { TableRowSkeleton } from '@/components/Skeletons'
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge'
import { formatCurrency, formatKg } from '@/lib/format'
import { useTranslation } from '@/i18n/LanguageProvider'
import { Package } from 'lucide-react'

const fulfillmentTone = (status: string): StatusTone =>
  status === 'delivered' ? 'success' : status === 'roasted' ? 'accent' : 'info'

export default function PartnerOrders() {
  const { t } = useTranslation()
  const { data: orders, isLoading } = useOrders()

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title={t('partner_orders_title')}
        subtitle={t('partner_orders_subtitle')}
      />

      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
            ))
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-expresso/50">
              <Package className="h-8 w-8 opacity-20" />
              <p>{t('partner_no_history')}</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                  <div>
                    <div className="font-bold text-coffee-fruit text-base">{order.inventory?.item_name || t('partner_coffee_bean')}</div>
                    <div className="text-xs text-expresso/60 mt-0.5 capitalize">
                      {order.roast_level} {t('common_roast_suffix')} • {order.preparation_method}
                    </div>
                  </div>
                  <StatusBadge tone={fulfillmentTone(order.fulfillment_status)}>
                    {order.fulfillment_status}
                  </StatusBadge>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_date')}</div>
                    <div className="font-medium text-expresso">{new Date(order.order_date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_amount')}</div>
                    <div className="font-medium text-expresso">{formatKg(order.amount_grams)}</div>
                    <div className="text-xs text-expresso/60">({t('common_bags').replace('{count}', String(order.bag_count))})</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">{t('common_total')}</div>
                    <div className="font-bold text-warm-roast">{formatCurrency(order.total_price)}</div>
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
                <th scope="col" className="px-6 py-4">{t('common_date')}</th>
                <th scope="col" className="px-6 py-4">{t('partner_coffee_details')}</th>
                <th scope="col" className="px-6 py-4">{t('common_amount')}</th>
                <th scope="col" className="px-6 py-4">{t('common_total')}</th>
                <th scope="col" className="px-6 py-4">{t('common_status')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowSkeleton cols={5} rows={5} />
              ) : !orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-expresso/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-8 w-8 opacity-20" />
                      <p>{t('partner_no_history')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-coffee-fruit">
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
                      <span className="text-xs text-expresso/60 ml-1">({t('common_bags').replace('{count}', String(order.bag_count))})</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-warm-roast">
                      {formatCurrency(order.total_price)}
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
