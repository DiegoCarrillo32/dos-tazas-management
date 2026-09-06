"use client"

import { useState } from "react"
import { usePartnerPricing, useSetPartnerPricing, useDeletePartnerPricing, usePartnerRecurringOrders, useConfirmOrderFromTemplate, useInventory, useDeletePartner, useRevokePartner, useRestorePartner, useDeleteRecurringOrder, useUpdateRecurringOrder, useSettings } from "@/hooks/queries"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Settings2, DollarSign, RefreshCw, Trash2, CheckCircle2, Plus, AlertCircle, Ban, Copy, Link, Undo2, Pencil, Pause, Play } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecurringOrderForm } from "@/components/RecurringOrderForm"
import { GenericModal } from "@/components/ui/GenericModal"
import { formatCurrency, formatKg, formatRecurringSchedule } from "@/lib/format"
import { useTranslation } from "@/i18n/LanguageProvider"
import type { B2BPartnerRecord, B2BRecurringOrderRecord } from "@/types"

interface PartnerManagementModalProps {
  partner: B2BPartnerRecord
  /** Stretch the trigger to fill its container (mobile card layout). */
  fullWidthTrigger?: boolean
}

export function PartnerManagementModal({ partner, fullWidthTrigger = false }: PartnerManagementModalProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("pricing")
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<B2BRecurringOrderRecord | null>(null)
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

  const { data: pricing, isLoading: isLoadingPricing } = usePartnerPricing(partner.id)
  const { data: recurringOrders, isLoading: isLoadingRecurring } = usePartnerRecurringOrders(partner.id)
  const { data: inventoryItems } = useInventory()
  const { data: settings } = useSettings()

  const setPricingMutation = useSetPartnerPricing(partner.id)
  const deletePricingMutation = useDeletePartnerPricing(partner.id)
  const confirmOrderMutation = useConfirmOrderFromTemplate()
  const deletePartnerMutation = useDeletePartner()
  const revokePartnerMutation = useRevokePartner()
  const restorePartnerMutation = useRestorePartner()
  const deleteRecurringOrderMutation = useDeleteRecurringOrder(partner.id)
  const updateRecurringOrderMutation = useUpdateRecurringOrder(partner.id)

  const coffeeInventory = (inventoryItems || []).filter(i => i.category === 'green_coffee')

  const handleSetPricing = () => {
    const parsedPrice = Number(newPrice)
    if (!selectedInventory) return
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toast.error(t('pm_price_invalid'))
      return
    }

    setPricingMutation.mutate({
      inventoryId: selectedInventory,
      pricePerKg: parsedPrice
    }, {
      onSuccess: () => {
        toast.success(t('pm_price_added'))
        setNewPrice("")
        setSelectedInventory("")
      },
      onError: (err) => toast.error(err.message)
    })
  }

  const handleDeletePricing = (pricingId: string) => {
    showConfirm(
      t('pm_price_delete_title'),
      t('pm_price_delete_msg'),
      () => {
        deletePricingMutation.mutate(pricingId, {
          onSuccess: () => toast.success(t('pm_price_deleted')),
          onError: (err) => toast.error(err.message)
        })
      },
      "destructive"
    )
  }

  const handleGenerateOrder = (recurringId: string) => {
    confirmOrderMutation.mutate(recurringId, {
      onSuccess: () => toast.success(t('pm_order_generated')),
      onError: (err) => toast.error(err.message)
    })
  }

  const handleToggleActive = (order: B2BRecurringOrderRecord) => {
    updateRecurringOrderMutation.mutate(
      { id: order.id, params: { is_active: !order.is_active } },
      {
        onSuccess: () => toast.success(order.is_active ? t('pm_standing_paused') : t('pm_standing_resumed')),
        onError: (err) => toast.error(err.message)
      }
    )
  }

  /**
   * Why "Create Order" can't run for a template. Generation needs a bean and a
   * price per kg for it, and the server throws without them — surface that here
   * instead of letting the roaster click into an error.
   */
  const blockedReason = (order: B2BRecurringOrderRecord): { message: string; fixable: boolean } | null => {
    if (!order.is_active) return { message: t('pm_blocked_paused'), fixable: false }
    if (!order.inventory_id) return { message: t('pm_blocked_no_bean'), fixable: false }
    if (isLoadingPricing) return null
    if (!pricing?.some(p => p.inventory_id === order.inventory_id)) {
      return { message: t('pm_blocked_no_price'), fixable: true }
    }
    return null
  }

  const closeRecurringForm = () => {
    setIsRecurringFormOpen(false)
    setEditingOrder(null)
  }

  return (
    <>
      <GenericModal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <Button variant="outline" className={`text-coffee-fruit hover:bg-warm-roast/10 rounded-lg text-xs border-coffee-fruit/20 ${fullWidthTrigger ? 'w-full' : ''}`}>
            <Settings2 className="mr-2 h-4 w-4" />
            {t('pm_manage')}
          </Button>
        }
        contentClassName="sm:w-full sm:max-w-[700px] bg-white-pergamino p-4 sm:p-6 border-warm-roast/10 shadow-2xl max-h-[90vh] overflow-y-auto"
        hideTitle={true}
        hideFooter={true}
        title={t('pm_title').replace('{company}', partner.company_name)}
      >
        <div className="text-xl sm:text-2xl font-heading text-expresso mb-4 break-words">
          {t('pm_title').replace('{company}', partner.company_name)}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 max-w-full">
          <TabsList className="bg-card border border-warm-roast/10 rounded-xl p-1 h-auto w-full flex flex-row gap-1">
            <TabsTrigger value="pricing" className="flex-1 min-w-0 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
              <DollarSign className="w-4 h-4 mr-1 shrink-0" />
              <span className="truncate">{t('pm_tab_pricing')}</span>
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1 min-w-0 rounded-lg data-[state=active]:bg-coffee-fruit/10 data-[state=active]:text-coffee-fruit text-expresso/70 transition-all py-2 text-xs sm:text-sm">
              <RefreshCw className="w-4 h-4 mr-1 shrink-0" />
              <span className="truncate">{t('pm_tab_orders')}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1 min-w-0 rounded-lg data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400 text-expresso/70 transition-all py-2 text-xs sm:text-sm">
              <Settings2 className="w-4 h-4 mr-1 shrink-0" />
              <span className="truncate">{t('pm_tab_settings')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-4 outline-none">
            <div className="bg-card p-4 rounded-xl border border-warm-roast/10 space-y-4">
              <h3 className="font-bold text-expresso">{t('pm_price_add_title')}</h3>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
                <div className="w-full sm:flex-1 space-y-2">
                  <Label>{t('common_coffee')}</Label>
                  <Select value={selectedInventory} onValueChange={(val) => setSelectedInventory(val || "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('pm_select_bean')} />
                    </SelectTrigger>
                    <SelectContent>
                      {coffeeInventory.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.item_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-32 space-y-2">
                  <Label>{t('b2b_price_per_kg')}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
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
                  {t('pm_price_set')}
                </Button>
              </div>
            </div>

            {isLoadingPricing ? (
              <div className="h-24 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
            ) : pricing && pricing.length > 0 ? (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden flex flex-col gap-3">
                  {pricing.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-3 bg-card rounded-xl border border-warm-roast/10 shadow-sm p-4">
                      <div className="min-w-0">
                        <div className="font-medium text-coffee-fruit truncate">{p.inventory?.item_name || t('b2b_unknown_bean')}</div>
                        <div className="text-sm font-bold text-warm-roast mt-0.5">
                          {formatCurrency(p.price_per_kg, settings)} <span className="text-xs font-normal text-expresso/60">/ kg</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePricing(p.id)}
                        disabled={deletePricingMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-card rounded-xl shadow-sm border border-warm-roast/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white-pergamino text-xs uppercase text-expresso/60">
                        <tr>
                          <th className="px-6 py-3">{t('common_coffee')}</th>
                          <th className="px-6 py-3">{t('pm_price_col_custom')}</th>
                          <th className="px-6 py-3 text-right">{t('common_actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricing.map(p => (
                          <tr key={p.id} className="border-t border-warm-roast/10">
                            <td className="px-6 py-4 font-medium text-coffee-fruit">{p.inventory?.item_name || t('b2b_unknown_bean')}</td>
                            <td className="px-6 py-4 font-bold text-warm-roast">{formatCurrency(p.price_per_kg, settings)}</td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePricing(p.id)}
                                disabled={deletePricingMutation.isPending}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 px-4 py-8 text-center text-expresso/50">
                {t('pm_price_none')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="recurring" className="space-y-4 outline-none w-full max-w-full min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
              <h3 className="font-bold text-expresso">{t('pm_standing_title')}</h3>
              <Button
                onClick={() => {
                  setEditingOrder(null)
                  setIsRecurringFormOpen(true)
                }}
                className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-lg h-9 text-xs transition-all w-full sm:w-auto"
              >
                <Plus className="h-3 w-3 mr-1" />
                {t('pm_standing_new')}
              </Button>
            </div>

            {isLoadingRecurring ? (
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-28 bg-card rounded-xl border border-warm-roast/10 animate-pulse" />
                ))}
              </div>
            ) : !recurringOrders || recurringOrders.length === 0 ? (
              <div className="bg-card rounded-xl shadow-sm border border-warm-roast/10 px-4 py-8 text-center text-expresso/50">
                {t('pm_standing_none')}
              </div>
            ) : (
              <div className="space-y-3 w-full">
                {recurringOrders.map(order => {
                  const blocked = blockedReason(order)
                  return (
                    <div key={order.id} className="bg-card rounded-xl shadow-sm border border-warm-roast/10 p-4 space-y-3 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-coffee-fruit truncate">
                            {order.inventory?.item_name || t('b2b_unknown_bean')}
                          </div>
                          <div className="text-xs text-expresso/60 mt-1 break-words">
                            <span className="capitalize">{order.roast_level}</span> {t('common_roast_suffix')} • {order.preparation_method} • {formatKg(order.amount_grams)} • {t('common_bags').replace('{count}', String(order.bag_count))}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('pm_standing_edit')}
                            onClick={() => {
                              setEditingOrder(order)
                              setIsRecurringFormOpen(true)
                            }}
                            className="text-expresso/70 hover:text-coffee-fruit hover:bg-warm-roast/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={order.is_active ? t('pm_standing_pause') : t('pm_standing_resume')}
                            onClick={() => handleToggleActive(order)}
                            disabled={updateRecurringOrderMutation.isPending}
                            className="text-expresso/70 hover:text-coffee-fruit hover:bg-warm-roast/10"
                          >
                            {order.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('delete')}
                            onClick={() => {
                              showConfirm(
                                t('pm_standing_delete_title'),
                                t('pm_standing_delete_msg'),
                                () => {
                                  deleteRecurringOrderMutation.mutate(order.id, {
                                    onSuccess: () => toast.success(t('pm_standing_deleted')),
                                    onError: (err) => toast.error(err.message)
                                  })
                                },
                                "destructive"
                              )
                            }}
                            disabled={deleteRecurringOrderMutation.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-warm-roast/10">
                        <div className="text-sm font-medium text-expresso capitalize">
                          {formatRecurringSchedule(order.frequency, order.day_of_week, t)}
                        </div>
                        <Button
                          onClick={() => handleGenerateOrder(order.id)}
                          disabled={confirmOrderMutation.isPending || !!blocked}
                          className="bg-coffee-fruit/10 text-coffee-fruit hover:bg-coffee-fruit hover:text-white transition-colors duration-200 text-xs h-8 px-3 w-full sm:w-auto"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          {t('pm_standing_create_order')}
                        </Button>
                      </div>

                      {blocked && (
                        <div className="flex flex-wrap items-center gap-2 text-xs text-expresso/70 bg-warm-roast/5 border border-warm-roast/10 rounded-lg px-3 py-2">
                          <AlertCircle className="h-3.5 w-3.5 text-warm-roast shrink-0" />
                          <span className="min-w-0">{blocked.message}</span>
                          {blocked.fixable && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('pricing')}
                              className="font-bold text-coffee-fruit hover:underline"
                            >
                              {t('pm_blocked_go_pricing')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
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
                    <h3 className="font-bold text-expresso text-base sm:text-lg">{t('pm_link_title')}</h3>
                    <p className="text-xs sm:text-sm text-expresso/70 mt-1">
                      {t('pm_link_desc')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-3 bg-white-pergamino border border-warm-roast/20 rounded-lg">
                  <code className="text-coffee-fruit font-mono font-bold text-base sm:text-lg truncate">{partner.invite_code}</code>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2 shrink-0 w-full sm:w-auto">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? t('pm_copied') : t('b2b_copy_invite')}
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
                  <h3 className="font-bold text-red-900 dark:text-red-300 text-base sm:text-lg">{t('pm_danger_title')}</h3>
                  <p className="text-xs sm:text-sm text-red-700/80 dark:text-red-400/80 mt-1">
                    {t('pm_danger_desc')}
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-red-200/50 dark:border-red-900/30">
                <div className="space-y-2">
                  <div>
                    <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">{t('pm_access_title')}</h4>
                    <p className="text-xs text-red-700/70 dark:text-red-400/70 mt-0.5">
                      {partner.status === 'revoked'
                        ? t('pm_access_revoked_desc')
                        : t('pm_access_active_desc')}
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
                            toast.success(t('pm_access_restored'))
                            setIsOpen(false)
                          },
                          onError: (err) => toast.error(err.message)
                        })
                      }}
                    >
                      <Undo2 className="mr-2 h-4 w-4" />
                      {t('pm_restore_access')}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-900/20 w-full sm:w-auto"
                      disabled={revokePartnerMutation.isPending}
                      onClick={() => {
                        showConfirm(
                          t('b2b_revoke_access'),
                          t('pm_revoke_msg'),
                          () => {
                            revokePartnerMutation.mutate(partner.id, {
                              onSuccess: () => {
                                toast.success(t('pm_access_revoked'))
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
                      {t('b2b_revoke_access')}
                    </Button>
                  )}
                </div>

                <div className="space-y-2 pt-3 border-t border-red-200/50 dark:border-red-900/30">
                  <div>
                    <h4 className="font-bold text-red-900 dark:text-red-300 text-sm">{t('pm_delete_title')}</h4>
                    <p className="text-xs text-red-700/70 dark:text-red-400/70 mt-0.5">
                      {t('pm_delete_desc')}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    disabled={deletePartnerMutation.isPending}
                    onClick={() => {
                      showConfirm(
                        t('pm_delete_btn'),
                        t('pm_delete_msg'),
                        () => {
                          deletePartnerMutation.mutate(partner.id, {
                            onSuccess: () => {
                              toast.success(t('pm_deleted'))
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
                    {t('pm_delete_btn')}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </GenericModal>

      <GenericModal
        isOpen={isRecurringFormOpen}
        onOpenChange={(open) => { if (!open) closeRecurringForm() }}
        contentClassName="sm:w-full sm:max-w-[600px] bg-white-pergamino p-0 border-warm-roast/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        hideTitle={true}
        hideFooter={true}
        title={editingOrder ? t('pm_standing_edit') : t('pm_standing_new')}
      >
        <div className="p-4 sm:p-6">
          <RecurringOrderForm
            key={editingOrder?.id || 'new'}
            partnerId={partner.id}
            inventoryItems={coffeeInventory}
            initialData={editingOrder ?? undefined}
            onSuccess={closeRecurringForm}
            onCancel={closeRecurringForm}
          />
        </div>
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
