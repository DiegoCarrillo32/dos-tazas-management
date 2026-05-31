"use client"

import { useState } from "react"
import { usePartnerPricing, useSetPartnerPricing, useDeletePartnerPricing, usePartnerRecurringOrders, useConfirmOrderFromTemplate, useInventory, useDeletePartner, useRevokePartner, useRestorePartner, useDeleteRecurringOrder } from "@/hooks/queries"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings2, DollarSign, RefreshCw, Trash2, CheckCircle2, Plus, AlertCircle, Ban, Copy, Link, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecurringOrderForm } from "@/components/RecurringOrderForm"
import type { B2BPartnerRecord } from "@/types"

export function PartnerManagementModal({ partner }: { partner: B2BPartnerRecord }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [selectedInventory, setSelectedInventory] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (partner.invite_code) {
      const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
      const inviteLink = `${origin}/join?code=${partner.invite_code}`
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const { data: pricing, isLoading: pricingLoading } = usePartnerPricing(partner.id)
  const { data: recurringOrders, isLoading: recurringLoading } = usePartnerRecurringOrders(partner.id)
  const { data: inventoryItems } = useInventory()
  
  const setPricingMutation = useSetPartnerPricing(partner.id)
  const deletePricingMutation = useDeletePartnerPricing(partner.id)
  const confirmOrderMutation = useConfirmOrderFromTemplate()
  const deletePartnerMutation = useDeletePartner()
  const revokePartnerMutation = useRevokePartner()
  const restorePartnerMutation = useRestorePartner()
  const deleteRecurringOrderMutation = useDeleteRecurringOrder(partner.id)

  const handleSetPricing = () => {
    if (!selectedInventory || !newPrice) return
    setPricingMutation.mutate({
      inventoryId: selectedInventory,
      pricePerKg: Number(newPrice)
    }, {
      onSuccess: () => {
        toast.success("Custom price added")
        setNewPrice("")
        setSelectedInventory("")
      },
      onError: (err) => toast.error(err.message)
    })
  }

  const handleGenerateOrder = (recurringId: string) => {
    confirmOrderMutation.mutate(recurringId, {
      onSuccess: () => toast.success("Order generated successfully!"),
      onError: (err) => toast.error(err.message)
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={
        <Button variant="outline" className="text-coffee-fruit hover:bg-warm-roast/10 rounded-lg text-xs border-coffee-fruit/20">
          <Settings2 className="mr-2 h-4 w-4" />
          Manage
        </Button>
      } />
      <DialogContent className="sm:max-w-[700px] bg-white-pergamino p-6 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-2xl font-heading text-expresso mb-4">
          Manage {partner.company_name}
        </DialogTitle>

        <Tabs defaultValue="pricing" className="w-full space-y-4">
          <TabsList className="bg-white border border-warm-roast/10 rounded-xl p-1 h-12 w-full flex">
            <TabsTrigger value="pricing" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all">
              <DollarSign className="w-4 h-4 mr-2" />
              Custom Pricing
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all">
              <RefreshCw className="w-4 h-4 mr-2" />
              Standing Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 text-expresso/70 transition-all">
              <Settings2 className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-4 outline-none">
            <div className="bg-white p-4 rounded-xl border border-warm-roast/10 space-y-4">
              <h3 className="font-semibold text-expresso">Add Custom Price Override</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Coffee Bean</Label>
                  <Select value={selectedInventory} onValueChange={(val) => setSelectedInventory(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select coffee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems?.filter(i => i.category === 'green_coffee').map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.item_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-32 space-y-2">
                  <Label>Price per Kg</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 25.50" 
                    value={newPrice} 
                    onChange={e => setNewPrice(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleSetPricing} 
                  disabled={setPricingMutation.isPending || !selectedInventory || !newPrice}
                  className="bg-coffee-fruit hover:bg-warm-roast text-white"
                >
                  Set Price
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-warm-roast/10 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-white-pergamino text-xs uppercase text-expresso/60">
                  <tr>
                    <th className="px-6 py-3">Coffee Bean</th>
                    <th className="px-6 py-3">Custom Price (per kg)</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pricing?.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-expresso/50">No custom pricing set.</td></tr>
                  ) : (
                    pricing?.map(p => (
                      <tr key={p.id} className="border-t border-warm-roast/10">
                        <td className="px-6 py-4 font-medium text-coffee-fruit">{p.inventory?.item_name || 'Unknown'}</td>
                        <td className="px-6 py-4 font-bold">${p.price_per_kg}</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deletePricingMutation.mutate(p.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4 outline-none">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-expresso">Manage Standing Orders</h3>
              <Dialog open={isRecurringFormOpen} onOpenChange={setIsRecurringFormOpen}>
                <DialogTrigger render={
                  <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-lg h-9 text-xs transition-all">
                    <Plus className="h-3 w-3 mr-1" />
                    New Standing Order
                  </Button>
                } />
                <DialogContent className="sm:max-w-[600px] bg-white-pergamino p-0 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <RecurringOrderForm 
                      partnerId={partner.id} 
                      inventoryItems={inventoryItems || []} 
                      onSuccess={() => setIsRecurringFormOpen(false)} 
                      onCancel={() => setIsRecurringFormOpen(false)} 
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-warm-roast/10 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-white-pergamino text-xs uppercase text-expresso/60">
                  <tr>
                    <th className="px-6 py-3">Order Details</th>
                    <th className="px-6 py-3">Frequency</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recurringOrders?.length === 0 ? (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-expresso/50">No standing orders setup by partner.</td></tr>
                  ) : (
                    recurringOrders?.map(order => (
                      <tr key={order.id} className="border-t border-warm-roast/10">
                        <td className="px-6 py-4">
                          <div className="font-bold text-coffee-fruit">
                            {order.inventory?.item_name || 'Standard Coffee'}
                          </div>
                          <div className="text-xs text-expresso/60 capitalize mt-1">
                            {order.roast_level} Roast • {(order.amount_grams/1000).toFixed(2)}kg • {order.bag_count} bags
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize font-medium text-expresso">
                          {order.frequency}
                          <div className="text-xs text-expresso/60">
                            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][order.day_of_week]}s
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button 
                              onClick={() => handleGenerateOrder(order.id)}
                              disabled={confirmOrderMutation.isPending || !order.is_active}
                              className="bg-coffee-fruit/10 text-coffee-fruit hover:bg-coffee-fruit hover:text-white transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Create Order Now
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this standing order?")) {
                                  deleteRecurringOrderMutation.mutate(order.id, {
                                    onSuccess: () => toast.success("Standing order deleted"),
                                    onError: (err) => toast.error(err.message)
                                  })
                                }
                              }}
                              disabled={deleteRecurringOrderMutation.isPending}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 outline-none">
            {partner.status === 'pending' && partner.invite_code && (
              <div className="bg-white p-6 rounded-xl border border-warm-roast/10 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-coffee-fruit/10 p-2 rounded-full">
                    <Link className="h-6 w-6 text-coffee-fruit" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-expresso text-lg">Portal Access Link</h3>
                    <p className="text-sm text-expresso/70 mt-1">
                      Share this unique link with your partner so they can create an account and manage their own orders.
                    </p>
                    
                    <div className="mt-4 flex items-center justify-between p-3 bg-white-pergamino border border-warm-roast/20 rounded-lg">
                      <code className="text-coffee-fruit font-mono font-bold text-lg">{partner.invite_code}</code>
                      <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                        {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy Link'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-red-50 p-6 rounded-xl border border-red-200 space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-red-900 text-lg">Danger Zone</h3>
                  <p className="text-sm text-red-700/80 mt-1">
                    These actions are destructive and will immediately affect this partner's access and data.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-red-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-900">Portal Access</h4>
                    <p className="text-xs text-red-700/70 max-w-[300px]">
                      {partner.status === 'revoked' 
                        ? 'They currently cannot log in. You can restore their access.' 
                        : 'Stops them from logging in, but keeps their order history, pricing, and recurring setup intact.'}
                    </p>
                  </div>
                  {partner.status === 'revoked' ? (
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-700 hover:bg-green-100"
                      disabled={restorePartnerMutation.isPending}
                      onClick={() => {
                        restorePartnerMutation.mutate(partner.id, {
                          onSuccess: () => {
                            toast.success("Access restored")
                            setIsOpen(false)
                          },
                          onError: (err) => toast.error(err.message)
                        })
                      }}
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      Restore Access
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="border-red-300 text-red-700 hover:bg-red-100"
                      disabled={revokePartnerMutation.isPending}
                      onClick={() => {
                        if (confirm("Are you sure you want to revoke this partner's access?")) {
                          revokePartnerMutation.mutate(partner.id, {
                            onSuccess: () => {
                              toast.success("Access revoked")
                              setIsOpen(false)
                            },
                            onError: (err) => toast.error(err.message)
                          })
                        }
                      }}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Revoke Access
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-red-900">Permanently Delete Partner</h4>
                    <p className="text-xs text-red-700/70 max-w-[300px]">
                      Deletes their custom pricing, standing orders, and disconnects them. Order history is kept but unlinked.
                    </p>
                  </div>
                  <Button 
                    variant="destructive"
                    disabled={deletePartnerMutation.isPending}
                    onClick={() => {
                      if (confirm("Are you SURE? This will delete all custom pricing and standing orders for this partner. This cannot be undone.")) {
                        deletePartnerMutation.mutate(partner.id, {
                          onSuccess: () => {
                            toast.success("Partner deleted successfully")
                            setIsOpen(false)
                          },
                          onError: (err) => toast.error(err.message)
                        })
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Partner
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
