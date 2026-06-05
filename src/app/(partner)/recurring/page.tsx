'use client'

import { usePartnerRecurringOrders, useInventory, usePartners, useDeleteRecurringOrder } from '@/hooks/queries'
import type { B2BPartnerRecord } from '@/types'
import { PageHeader } from '@/components/PageHeader'
import { TableRowSkeleton } from '@/components/Skeletons'
import { RefreshCw, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenericModal } from '@/components/ui/GenericModal'
import { RecurringOrderForm } from '@/components/RecurringOrderForm'
import { useState } from 'react'

export default function PartnerRecurringOrders() {
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
          title="Recurring Orders"
          subtitle="Manage your weekly standing orders and subscriptions."
        />
        {partnerId && (
          <GenericModal
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            trigger={
              <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-xl shadow-md transition-all gap-2 h-11 px-6">
                <Plus className="h-4 w-4" />
                New Standing Order
              </Button>
            }
            contentClassName="sm:max-w-[600px] bg-white-pergamino p-0 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            hideTitle={true}
            hideFooter={true}
            title="New Standing Order"
          >
            <div className="p-6">
              <RecurringOrderForm 
                partnerId={partnerId} 
                inventoryItems={inventoryItems || []} 
                onSuccess={() => setIsDialogOpen(false)} 
                onCancel={() => setIsDialogOpen(false)} 
              />
            </div>
          </GenericModal>
        )}
      </div>

      <div className="bg-card rounded-2xl shadow-sm shadow-warm-roast/5 border border-warm-roast/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="text-xs text-expresso/60 uppercase bg-white-pergamino border-b border-warm-roast/10 font-semibold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Coffee</th>
                <th scope="col" className="px-6 py-4">Amount</th>
                <th scope="col" className="px-6 py-4">Frequency</th>
                <th scope="col" className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableRowSkeleton cols={4} rows={4} />
              ) : !recurringOrders || recurringOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-expresso/50">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-8 w-8 opacity-20" />
                      <p>You have no recurring orders setup yet.</p>
                      <p className="text-xs">Contact your roaster to set up a standing order.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                recurringOrders.map((order) => (
                  <tr key={order.id} className="bg-card border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                    <td className="px-6 py-4 font-bold text-coffee-fruit">
                      {order.inventory?.item_name || 'Standard Coffee'}
                      <div className="text-xs font-normal text-expresso/60 mt-0.5 capitalize">
                        {order.roast_level} Roast • {order.preparation_method}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso">
                      {(order.amount_grams / 1000).toFixed(2)} kg
                      <span className="text-xs text-expresso/60 ml-1">({order.bag_count} bags)</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-expresso capitalize">
                      {order.frequency}
                      <div className="text-xs text-expresso/60">
                        {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][order.day_of_week] || ''}s
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        order.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {order.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(order.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
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
