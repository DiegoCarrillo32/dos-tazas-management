'use client'

import { useOrders } from '@/hooks/queries'
import { PageHeader } from '@/components/PageHeader'
import { TableRowSkeleton } from '@/components/Skeletons'
import { Package } from 'lucide-react'

export default function PartnerOrders() {
  const { data: orders, isLoading } = useOrders()

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Order History"
        subtitle="View all your past and current coffee orders."
      />

      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-bold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Date</th>
                <th scope="col" className="px-6 py-4">Coffee Details</th>
                <th scope="col" className="px-6 py-4">Amount</th>
                <th scope="col" className="px-6 py-4">Total</th>
                <th scope="col" className="px-6 py-4">Status</th>
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
                      <p>You have no order history yet.</p>
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
                      {order.inventory?.item_name || 'Coffee Bean'}
                      <div className="text-xs font-normal text-expresso/60 mt-0.5 capitalize">
                        {order.roast_level} Roast • {order.preparation_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso">
                      {(order.amount_grams / 1000).toFixed(2)} kg
                      <span className="text-xs text-expresso/60 ml-1">({order.bag_count} bags)</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-warm-roast">
                      ${Number(order.total_price).toFixed(2)}
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
