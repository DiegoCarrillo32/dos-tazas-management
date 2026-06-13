'use client'

import { useState } from 'react'
import { useInventory, useSettings, useDeleteInventoryItem } from '@/hooks/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, PackageSearch, Coffee, Edit, Search, Trash2, Leaf, ShoppingBag, Wrench } from 'lucide-react'
import { InventoryForm } from '@/components/InventoryForm'
import { GreenCoffeeLotsDialog } from '@/components/GreenCoffeeLotsDialog'
import { InventorySummaryHeader } from '@/components/InventorySummaryHeader'
import { TableSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GenericModal } from '@/components/ui/GenericModal'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/ui/pagination'
import { toast } from 'sonner'

export default function InventoryPage() {
  const { t } = useTranslation()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings, isLoading: loadingSettings } = useSettings()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const deleteMutation = useDeleteInventoryItem()

  if (loadingInventory || loadingSettings) {
    return <TableSkeleton cols={6} rows={4} />
  }

  const items = inventoryItems || []
  const lossRatio = 1 - ((settings?.roast_loss_percentage || 20) / 100)

  // Filter items
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      item.item_name?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query)
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize))
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedItems = filteredItems.slice(startIndex, endIndex)

  const showingText = t('pag_showing')
    .replace('{start}', String(filteredItems.length === 0 ? 0 : startIndex + 1))
    .replace('{end}', String(Math.min(endIndex, filteredItems.length)))
    .replace('{total}', String(filteredItems.length))

  return (
    <div className="w-full max-w-7xl mx-auto">
      <InventorySummaryHeader items={items} />

      <PageHeader
        title={t('inventory_title')}
        subtitle={t('inventory_subtitle')}
        action={
          <GenericModal
            hideFooter={true}
            hideTitle={true}
            title={t('inventory_add_title') || "Add Inventory"}
            contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
            trigger={
              <Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline font-bold">{t('inventory_add')}</span>
              </Button>
            }
          >
            <InventoryForm settings={settings} />
          </GenericModal>
        }
      />

      <Card className="shadow-lg border-warm-roast/10">
        <CardHeader className="bg-white-pergamino dark:bg-card border-b border-warm-roast/5 dark:border-border pt-4 pb-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-heading text-expresso flex items-center gap-2">
                <PackageSearch className="h-5 w-5 text-coffee-fruit" />
                {t('inventory_directory')}
              </CardTitle>
              <CardDescription className="text-expresso/60">
                {filteredItems.length === items.length
                  ? t('list_items_count').replace('{count}', String(items.length))
                  : t('list_filtered_count').replace('{filtered}', String(filteredItems.length)).replace('{total}', String(items.length))}
              </CardDescription>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-expresso/40" />
                <Input
                  type="text"
                  placeholder={t('pag_search')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 rounded-full"
                />
              </div>

              {/* Page size select */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <span className="text-xs text-expresso/60 font-bold">{t('pag_page_size')}:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="text-xs bg-warm-roast/5 border border-warm-roast/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-warm-roast/30 focus:border-warm-roast text-expresso font-bold"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none border-t border-warm-roast/5 pt-3">
            {[
              { id: 'all',          label: t('pag_all'),                 Icon: PackageSearch },
              { id: 'green_coffee', label: t('inv_form_cat_green'),      Icon: Leaf },
              { id: 'supplies',     label: t('inv_form_cat_merch'),      Icon: ShoppingBag },
              { id: 'equipment',    label: t('inv_form_cat_equipment'),  Icon: Wrench },
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setCategoryFilter(id)
                  setCurrentPage(1)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 border cursor-pointer ${
                  categoryFilter === id
                    ? 'bg-warm-roast text-white border-warm-roast shadow-sm'
                    : 'bg-warm-roast/5 text-expresso/70 border-warm-roast/10 hover:bg-warm-roast/10'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="md:hidden">
            {paginatedItems.length === 0 ? (
              <div className="px-6 py-12 text-center text-expresso/60">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Coffee className="h-12 w-12 text-warm-roast/20" />
                  <p className="text-lg font-medium">{t('inventory_no_found')}</p>
                  <p className="text-sm">{t('inventory_no_found_desc')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-4 bg-warm-roast/5">
                {paginatedItems.map((item) => {
                  const isCoffee = item.category === 'green_coffee'
                  const roastedYield = isCoffee ? Math.floor(item.stock_grams * lossRatio) : null
                  const lowStockThresholdG = (item.low_stock_threshold_kg ?? 5) * 1000
                  const isLowStock = isCoffee && item.stock_grams < lowStockThresholdG
                  const CategoryIcon = isCoffee ? Leaf : item.category === 'equipment' ? Wrench : ShoppingBag

                  return (
                    <div key={item.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                        <div>
                          <div className="font-bold text-expresso text-base mb-1">{item.item_name}</div>
                          <span className="flex items-center gap-1 text-xs bg-warm-roast/10 text-expresso/70 px-2 py-0.5 rounded-full w-fit capitalize">
                            <CategoryIcon className="h-3 w-3" />
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isCoffee && (
                            <GreenCoffeeLotsDialog inventoryId={item.id} inventoryName={item.item_name} />
                          )}
                          <GenericModal
                            hideFooter={true}
                            hideTitle={true}
                            title={t('inv_form_edit') || "Edit Inventory"}
                            contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
                            trigger={
                              <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('edit')}</span>
                              </Button>
                            }
                          >
                            <InventoryForm initialData={item} settings={settings} />
                          </GenericModal>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!confirm(t('inv_delete_confirm').replace('{name}', item.item_name))) return
                              deleteMutation.mutate(item.id, {
                                onSuccess: () => toast.success(t('inv_toast_deleted').replace('{name}', item.item_name)),
                                onError: (err) => toast.error(err.message || t('inv_toast_delete_error')),
                              })
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-expresso/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                            {isCoffee ? t('inventory_col_raw') : t('inv_col_units')}
                          </div>
                          <div className={`font-bold ${isLowStock ? 'text-red-500' : 'text-expresso'}`}>
                            {isCoffee ? `${(item.stock_grams / 1000).toFixed(2)} kg` : `${item.stock_grams} units`}
                            {isLowStock && <span className="text-red-500 text-xs ml-1 font-normal">⚠ {t('inventory_low')}</span>}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                            {t('inventory_col_cost')}
                          </div>
                          <div className="font-bold text-expresso">
                            {item.cost_per_kg ? `${item.cost_currency || settings?.currency_symbol || '$'}${item.cost_per_kg}` : <span className="text-expresso/40 italic font-normal">N/A</span>}
                          </div>
                        </div>

                        {isCoffee && roastedYield !== null && (
                          <div className="col-span-2 pt-2 border-t border-warm-roast/5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                              {t('inventory_col_yield').replace('{loss}', String(settings?.roast_loss_percentage || 20))}
                            </div>
                            <span className="text-coffee-fruit font-medium bg-coffee-fruit/10 px-2.5 py-1 rounded-md inline-block text-sm">
                              {(roastedYield / 1000).toFixed(2)} kg
                            </span>
                          </div>
                        )}
                      </div>

                      {item.notes && (
                        <div className="px-4 pb-4">
                          <p className="text-xs text-expresso/60 bg-warm-roast/5 p-2 rounded-lg italic">
                            &quot;{item.notes}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs uppercase bg-warm-roast/5 text-expresso/70 font-bold border-b border-warm-roast/10">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">{t('inventory_col_item')}</th>
                  <th scope="col" className="px-6 py-4">{t('inventory_col_category')}</th>
                  <th scope="col" className="px-6 py-4">{t('inventory_col_raw')}</th>
                  <th scope="col" className="px-6 py-4">{t('inventory_col_yield').replace('{loss}', String(settings?.roast_loss_percentage || 20))}</th>
                  <th scope="col" className="px-6 py-4">{t('inventory_col_cost')}</th>
                  <th scope="col" className="px-6 py-4 text-right rounded-tr-lg">{t('customers_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-expresso/60 border-b border-warm-roast/10">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Coffee className="h-12 w-12 text-warm-roast/20" />
                        <p className="text-lg font-medium">{t('inventory_no_found')}</p>
                        <p className="text-sm">{t('inventory_no_found_desc')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const isCoffee = item.category === 'green_coffee'
                    const roastedYield = isCoffee ? Math.floor(item.stock_grams * lossRatio) : null
                    const lowStockThresholdG = (item.low_stock_threshold_kg ?? 5) * 1000
                    const isLowStock = isCoffee && item.stock_grams < lowStockThresholdG
                    const CategoryIcon = isCoffee ? Leaf : item.category === 'equipment' ? Wrench : ShoppingBag

                    return (
                      <tr key={item.id} className="border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                        <td className="px-6 py-4 font-medium text-expresso">
                          {item.item_name}
                          {item.notes && <p className="text-xs text-expresso/50 font-normal mt-1 truncate max-w-[200px]">{item.notes}</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1.5 text-expresso/80 capitalize w-fit">
                            <CategoryIcon className="h-3.5 w-3.5 text-expresso/40" />
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${isLowStock ? 'text-red-500' : 'text-expresso'}`}>
                            {isCoffee ? `${(item.stock_grams / 1000).toFixed(2)} kg` : `${item.stock_grams} units`}
                            {isLowStock && <span className="text-red-500 text-xs ml-1 font-normal">⚠ {t('inventory_low')}</span>}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isCoffee && roastedYield !== null ? (
                            <span className="text-coffee-fruit font-medium bg-coffee-fruit/10 px-2 py-1 rounded-md">
                              {(roastedYield / 1000).toFixed(2)} kg
                            </span>
                          ) : (
                            <span className="text-expresso/40">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-expresso/70">
                          {item.cost_per_kg ? `${item.cost_currency || settings?.currency_symbol || '$'}${item.cost_per_kg}` : <span className="text-expresso/40 italic">N/A</span>}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          {isCoffee && (
                            <GreenCoffeeLotsDialog inventoryId={item.id} inventoryName={item.item_name} />
                          )}
                          <GenericModal
                            hideFooter={true}
                            hideTitle={true}
                            title={t('inv_form_edit') || "Edit Inventory"}
                            contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
                            trigger={
                              <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('edit')}</span>
                              </Button>
                            }
                          >
                            <InventoryForm initialData={item} settings={settings} />
                          </GenericModal>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (!confirm(t('inv_delete_confirm').replace('{name}', item.item_name))) return
                              deleteMutation.mutate(item.id, {
                                onSuccess: () => toast.success(t('inv_toast_deleted').replace('{name}', item.item_name)),
                                onError: (err) => toast.error(err.message || t('inv_toast_delete_error')),
                              })
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-expresso/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showingText={showingText}
          />
        </CardContent>
      </Card>
    </div>
  )
}
