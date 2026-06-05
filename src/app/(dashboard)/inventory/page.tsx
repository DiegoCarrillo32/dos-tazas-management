'use client'

import { useState } from 'react'
import { useInventory, useSettings } from '@/hooks/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, PackageSearch, Coffee, Edit, Search } from 'lucide-react'
import { InventoryForm } from '@/components/InventoryForm'
import { GreenCoffeeLotsDialog } from '@/components/GreenCoffeeLotsDialog'
import { TableSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GenericModal } from '@/components/ui/GenericModal'

export default function InventoryPage() {
  const { t } = useTranslation()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings, isLoading: loadingSettings } = useSettings()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso">{t('inventory_title')}</h1>
          <p className="text-expresso/70 font-medium text-sm">{t('inventory_subtitle')}</p>
        </div>
        
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
      </div>

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
                  ? `${items.length} items`
                  : `${filteredItems.length} found (${items.length} total)`}
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
                <span className="text-xs text-expresso/60 font-semibold">{t('pag_page_size')}:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="text-xs bg-warm-roast/5 border border-warm-roast/10 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-warm-roast/30 focus:border-warm-roast text-expresso font-semibold"
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
              { id: 'all', label: t('pag_all') },
              { id: 'green_coffee', label: t('inv_form_cat_green') },
              { id: 'merchandise', label: t('inv_form_cat_merch') },
              { id: 'equipment', label: t('inv_form_cat_equipment') }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setCategoryFilter(tab.id)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 border cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-warm-roast text-white border-warm-roast shadow-sm'
                    : 'bg-warm-roast/5 text-expresso/70 border-warm-roast/10 hover:bg-warm-roast/10'
                }`}
              >
                {tab.label}
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
                  const isLowStock = isCoffee && item.stock_grams < 5000

                  return (
                    <div key={item.id} className="flex flex-col bg-white rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                      {/* Header */}
                      <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                        <div>
                          <div className="font-bold text-expresso text-base mb-1">{item.item_name}</div>
                          <span className="text-xs bg-warm-roast/10 text-expresso/70 px-2 py-0.5 rounded-full capitalize">
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
                                  <span className="sr-only">Edit</span>
                              </Button>
                            }
                          >
                            <InventoryForm initialData={item} settings={settings} />
                          </GenericModal>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                            {t('inventory_col_raw')}
                          </div>
                          <div className={`font-semibold ${isLowStock ? 'text-red-500' : 'text-expresso'}`}>
                            {isCoffee ? `${(item.stock_grams / 1000).toFixed(2)} kg` : item.stock_grams}
                            {isLowStock && <span className="text-red-500 text-xs ml-1 font-normal">⚠ Low</span>}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                            {t('inventory_col_cost')}
                          </div>
                          <div className="font-semibold text-expresso">
                            {item.cost_per_kg ? `$${item.cost_per_kg}` : <span className="text-expresso/40 italic font-normal">N/A</span>}
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
                    const isLowStock = isCoffee && item.stock_grams < 5000

                    return (
                      <tr key={item.id} className="border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                        <td className="px-6 py-4 font-medium text-expresso">
                          {item.item_name}
                          {item.notes && <p className="text-xs text-expresso/50 font-normal mt-1 truncate max-w-[200px]">{item.notes}</p>}
                        </td>
                        <td className="px-6 py-4 text-expresso/80 capitalize">
                          {item.category.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${isLowStock ? 'text-red-500' : 'text-expresso'}`}>
                            {isCoffee ? `${(item.stock_grams / 1000).toFixed(2)} kg` : item.stock_grams}
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
                          {item.cost_per_kg ? `$${item.cost_per_kg}` : <span className="text-expresso/40 italic">N/A</span>}
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
                                <span className="sr-only">Edit</span>
                              </Button>
                            }
                          >
                            <InventoryForm initialData={item} settings={settings} />
                          </GenericModal>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4 border-t border-warm-roast/10 bg-warm-roast/5 rounded-b-lg">
              <div className="text-xs text-expresso/60 font-semibold">
                {showingText}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="h-8 text-xs font-bold text-expresso border-warm-roast/20 hover:bg-warm-roast/10"
                >
                  {t('pag_previous')}
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const page = idx + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - activePage) <= 1
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={activePage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 p-0 text-xs font-bold ${
                          activePage === page
                            ? "bg-warm-roast hover:bg-coffee-fruit text-white"
                            : "text-expresso border-warm-roast/20 hover:bg-warm-roast/10"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  }
                  if (
                    page === 2 ||
                    page === totalPages - 1
                  ) {
                    return (
                      <span key={page} className="px-1 text-expresso/40 text-xs select-none">...</span>
                    );
                  }
                  return null;
                })}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="h-8 text-xs font-bold text-expresso border-warm-roast/20 hover:bg-warm-roast/10"
                >
                  {t('pag_next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
