'use client'

import { useOrders, usePartnerRecurringOrders, usePartners } from '@/hooks/queries'
import type { B2BPartnerRecord } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableRowSkeleton } from '@/components/Skeletons'
import { RefreshCw, Package, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

export default function PartnerDashboard() {
  const { data: orders, isLoading: ordersLoading } = useOrders()
  const { data: partnerData } = usePartners()
  const partnerDataArray = Array.isArray(partnerData) ? partnerData : []
  const partnerId = partnerDataArray[0]?.id || (partnerData as B2BPartnerRecord)?.id
  usePartnerRecurringOrders(partnerId || '')

  const pendingOrders = (orders || []).filter(o => o.fulfillment_status === 'pending' || o.fulfillment_status === 'roasted')
  const recentOrders = (orders || []).slice(0, 5)

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Partner Dashboard"
        subtitle="Track your current orders and manage your recurring subscriptions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-card/90 backdrop-blur-sm border-warm-roast/10 shadow-sm shadow-warm-roast/5 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading text-expresso flex items-center gap-2">
              <Clock className="w-5 h-5 text-warm-roast" /> Active Orders
            </CardTitle>
            <CardDescription className="text-expresso/60">
              Orders currently being processed
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
              <RefreshCw className="w-5 h-5 text-warm-roast" /> Recurring Orders
            </CardTitle>
            <CardDescription className="text-expresso/60">
              Your weekly standing orders
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="text-4xl font-bold text-coffee-fruit mt-2">
                —
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading text-expresso flex items-center gap-2">
            <Package className="w-5 h-5 text-warm-roast" /> Recent Orders
          </h3>
          <Link href="/orders" className="text-sm font-medium text-coffee-fruit hover:text-warm-roast flex items-center">
            View All <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-semibold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Date</th>
                <th scope="col" className="px-6 py-4">Coffee</th>
                <th scope="col" className="px-6 py-4">Amount</th>
                <th scope="col" className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {ordersLoading ? (
                <TableRowSkeleton cols={4} rows={3} />
              ) : recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-expresso/50">
                    No orders found.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors">
                    <td className="px-6 py-4 text-expresso">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-bold text-coffee-fruit">
                      {order.inventory?.item_name || 'Coffee Bean'}
                      <div className="text-xs font-normal text-expresso/60 mt-0.5 capitalize">
                        {order.roast_level} Roast • {order.preparation_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso">
                      {(order.amount_grams / 1000).toFixed(2)} kg
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        order.fulfillment_status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.fulfillment_status === 'roasted' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.fulfillment_status}
                      </span>
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
