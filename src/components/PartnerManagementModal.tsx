"use client"

import { useState } from "react"
import { usePartnerPricing, useSetPartnerPricing, useDeletePartnerPricing, usePartnerRecurringOrders, useConfirmOrderFromTemplate, useInventory, useDeletePartner, useRevokePartner, useRestorePartner, useDeleteRecurringOrder } from "@/hooks/queries"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings2, DollarSign, RefreshCw, Trash2, CheckCircle2, Plus, AlertCircle, Ban, Copy, Link, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecurringOrderForm } from "@/components/RecurringOrderForm"
import { GenericModal } from "@/components/ui/GenericModal"
import type { B2BPartnerRecord } from "@/types"

export function PartnerManagementModal({ partner }: { partner: B2BPartnerRecord }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false)
  const [newPrice, setNewPrice] = useState("")
  const [selectedInventory, setSelectedInventory] = useState("")
  const [copied, setCopied] = useState(false)

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title?: string
    message?: string
    onConfirm?: () => void
    confirmVariant?: "default" | "destructive"
  }>({ isOpen: false })

  const showConfirm = (title: string, message: string, onConfirm: () => void, confirmVariant: "default" | "destructive" = "default") => {
    setModalState({ isOpen: true, title, message, onConfirm, confirmVariant })
  }

  const handleCopy = () => {
    if (partner.invite_code) {
      const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
      const inviteLink = `${origin}/join?code=${partner.invite_code}`
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const { data: pricing } = usePartnerPricing(partner.id)
  const { data: recurringOrders } = usePartnerRecurringOrders(partner.id)
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
    <>
      <GenericModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <Button variant="outline" className="text-coffee-fruit hover:bg-warm-roast/10 rounded-lg text-xs border-coffee-fruit/20">
            <Settings2 className="mr-2 h-4 w-4" />
            Manage
          </Button>
        }
        contentClassName="sm:w-full sm:max-w-[700px] bg-white-pergamino p-4 sm:p-6 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        hideTitle={true}
        hideFooter={true}
        title={`Manage ${partner.company_name}`}
      >
        <div className="text-2xl font-heading text-expresso mb-4">
          Manage {partner.company_name}
        </div>

        <Tabs defaultValue="pricing" className="w-full space-y-4 max-w-full">
          <TabsList className="bg-card border border-warm-roast/10 rounded-xl p-1 h-auto w-full flex flex-row gap-1">
            <TabsTrigger value="pricing" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
              <DollarSign className="w-4 h-4 mr-1 shrink-0" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
              <RefreshCw className="w-4 h-4 mr-1 shrink-0" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 text-expresso/70 transition-all py-2 text-xs sm:text-sm">
              <Settings2 className="w-4 h-4 mr-1 shrink-0" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-4 outline-none">
            <div className="bg-card p-4 rounded-xl border border-warm-roast/10 space-y-4">
              <h3 className="font-bold text-expresso">Add Custom Price Override</h3>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="w-full sm:flex-1 space-y-2">
                  <Label>Coffee Bean</Label>
                  <Select value={selectedInventory} onValueChange={(val) => setSelectedInventory(val || "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select coffee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryItems?.filter(i => i.category === 'green_coffee').map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.item_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-32 space-y-2">
                  <Label>Price per Kg</Label>
                  <Input 
                    type="number" 
                    placeholder="e.g. 25.50" 
                    value={newPrice} 
                    onChange={e => setNewPrice(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button 
                  onClick={handleSetPricing} 
                  disabled={setPricingMutation.isPending || !selectedInventory || !newPrice}
                  className="bg-coffee-fruit hover:bg-warm-roast text-white w-full sm:w-auto"
                >
                  Set Price
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-white-pergamino text-xs uppercase text-expresso/60">
                    <tr>
                      <th className="px-4 sm:px-6 py-3">Coffee Bean</th>
                      <th className="px-4 sm:px-6 py-3">Custom Price (per kg)</th>
                      <th className="px-4 sm:px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricing?.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 sm:px-6 py-8 text-center text-expresso/50">No custom pricing set.</td></tr>
                    ) : (
                      pricing?.map(p => (
                        <tr key={p.id} className="border-t border-warm-roast/10">
                          <td className="px-4 sm:px-6 py-4 font-medium text-coffee-fruit">{p.inventory?.item_name || 'Unknown'}</td>
                          <td className="px-4 sm:px-6 py-4 font-bold">${p.price_per_kg}</td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deletePricingMutation.mutate(p.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
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
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4 outline-none w-full max-w-full min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
              <h3 className="font-bold text-expresso">Manage Standing Orders</h3>
              <GenericModal
                isOpen={isRecurringFormOpen}
                onOpenChange={setIsRecurringFormOpen}
                trigger={
                  <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-lg h-9 text-xs transition-all w-full sm:w-auto">
                    <Plus className="h-3 w-3 mr-1" />
                    New Standing Order
                  </Button>
                }
                contentClassName="sm:w-full sm:max-w-[600px] bg-white-pergamino p-0 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                hideTitle={true}
                hideFooter={true}
                title="New Standing Order"
              >
                <div className="p-6">
                  <RecurringOrderForm 
                    partnerId={partner.id} 
                    inventoryItems={inventoryItems || []} 
                    onSuccess={() => setIsRecurringFormOpen(false)} 
                    onCancel={() => setIsRecurringFormOpen(false)} 
                  />
                </div>
              </GenericModal>
            </div>
            
            {recurringOrders?.length === 0 ? (
              <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 px-4 py-8 text-center text-expresso/50">
                No standing orders setup by partner.
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {recurringOrders?.map(order => (
                  <div key={order.id} className="bg-card rounded-xl shadow-sm border border-warm-roast/10 p-4 space-y-3 w-full">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-coffee-fruit truncate">
                          {order.inventory?.item_name || 'Standard Coffee'}
                        </div>
                        <div className="text-xs text-expresso/60 capitalize mt-1 break-words">
                          {order.roast_level} Roast • {order.preparation_method} • {(order.amount_grams/1000).toFixed(2)}kg • {order.bag_count} bags
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          showConfirm(
                            "Delete Standing Order",
                            "Are you sure you want to delete this standing order?",
                            () => {
                              deleteRecurringOrderMutation.mutate(order.id, {
                                onSuccess: () => toast.success("Standing order deleted"),
                                onError: (err) => toast.error(err.message)
                              })
                            },
                            "destructive"
                          )
                        }}
                        disabled={deleteRecurringOrderMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-warm-roast/10">
                      <div className="text-sm capitalize font-medium text-expresso">
                        {order.frequency}
                        <span className="text-xs text-expresso/60 ml-1">
                          ({['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][order.day_of_week]}s)
                        </span>
                      </div>
                      <Button 
                        onClick={() => handleGenerateOrder(order.id)}
                        disabled={confirmOrderMutation.isPending || !order.is_active}
                        className="bg-coffee-fruit/10 text-coffee-fruit hover:bg-coffee-fruit hover:text-white transition-colors duration-200 text-xs h-8 px-3 shrink-0"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        Create Order
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 outline-none">
            {partner.status === 'pending' && partner.invite_code && (
              <div className="bg-card p-4 sm:p-6 rounded-xl border border-warm-roast/10 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-coffee-fruit/10 p-2 rounded-full shrink-0">
                    <Link className="h-5 w-5 text-coffee-fruit" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-expresso text-base sm:text-lg">Portal Access Link</h3>
                    <p className="text-xs sm:text-sm text-expresso/70 mt-1">
                      Share this unique link with your partner so they can create an account and manage their own orders.
                    </p>
                  </div>
                </div>
                    
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-white-pergamino border border-warm-roast/20 rounded-lg">
                  <code className="text-coffee-fruit font-mono font-bold text-base sm:text-lg truncate">{partner.invite_code}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 shrink-0 w-full sm:w-auto">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy Link'}
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-red-50 dark:bg-red-900/20 p-4 sm:p-6 rounded-xl border border-red-200 dark:border-red-900/40 space-y-5">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 dark:bg-red-900/40 p-2 rounded-full shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-red-900 dark:text-red-300 text-base sm:text-lg">Danger Zone</h3>
                  <p className="text-xs sm:text-sm text-red-700/80 dark:text-red-400/80 mt-1">
                    {"These actions are destructive and will immediately affect this partner's access and data."}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-red-200/50 dark:border-red-900/30">
                <div className="space-y-2">
                  <div>
                    <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">Portal Access</h4>
                    <p className="text-xs text-red-700/70 dark:text-red-400/70 mt-0.5">
                      {partner.status === 'revoked' 
                        ? 'They currently cannot log in. You can restore their access.' 
                        : 'Stops them from logging in, but keeps their order history, pricing, and recurring setup intact.'}
                    </p>
                  </div>
                  {partner.status === 'revoked' ? (
                    <Button 
                      variant="outline" 
                      className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-900/40 dark:text-green-400 dark:hover:bg-green-900/20 w-full sm:w-auto"
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
                      className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20 w-full sm:w-auto"
                      disabled={revokePartnerMutation.isPending}
                      onClick={() => {
                        showConfirm(
                          "Revoke Access",
                          "Are you sure you want to revoke this partner's access?",
                          () => {
                            revokePartnerMutation.mutate(partner.id, {
                              onSuccess: () => {
                                toast.success("Access revoked")
                                setIsOpen(false)
                              },
                              onError: (err) => toast.error(err.message)
                            })
                          },
                          "destructive"
                        )
                      }}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Revoke Access
                    </Button>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-red-200/50">
                  <div>
                    <h4 className="font-bold text-red-900 text-sm">Permanently Delete Partner</h4>
                    <p className="text-xs text-red-700/70 mt-0.5">
                      Deletes their custom pricing, standing orders, and disconnects them. Order history is kept but unlinked.
                    </p>
                  </div>
                  <Button 
                    variant="destructive"
                    className="w-full sm:w-auto"
                    disabled={deletePartnerMutation.isPending}
                    onClick={() => {
                      showConfirm(
                        "Delete Partner",
                        "Are you SURE? This will delete all custom pricing and standing orders for this partner. This cannot be undone.",
                        () => {
                          deletePartnerMutation.mutate(partner.id, {
                            onSuccess: () => {
                              toast.success("Partner deleted successfully")
                              setIsOpen(false)
                            },
                            onError: (err) => toast.error(err.message)
                          })
                        },
                        "destructive"
                      )
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
      </GenericModal>

      <GenericModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        onConfirm={modalState.onConfirm}
        confirmVariant={modalState.confirmVariant}
      >
        <p>{modalState.message}</p>
      </GenericModal>
    </>
  )
}
