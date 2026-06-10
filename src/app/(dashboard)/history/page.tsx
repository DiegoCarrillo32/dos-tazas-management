'use client'

import { useState } from 'react'
import { useCompletedOrders, useCustomers, useInventory, useSettings } from '@/hooks/queries'
import { OrderCard } from '@/components/OrderCard'
import { CheckCircle, Search } from 'lucide-react'
import { PageSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/PageHeader'

export default function HistoryPage() {
  const { t } = useTranslation()

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')

  const { data, isLoading: loadingOrders } = useCompletedOrders(currentPage, pageSize)
  const { data: customers, isLoading: loadingCustomers } = useCustomers()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings } = useSettings()

  const isLoading = loadingOrders || loadingCustomers || loadingInventory

  if (isLoading) {
    return <PageSkeleton rows={3} />
  }

  const orders = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const activePage = Math.min(currentPage, totalPages)

  const coffeeInventory = (inventoryItems || []).filter(item => item.category === 'green_coffee')

  // Client-side filtering on current page
  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const customerName = order.customers?.full_name?.toLowerCase() || ''
    const customerPhone = order.customers?.phone?.toLowerCase() || ''
    const itemName = order.inventory?.item_name?.toLowerCase() || ''
    return (
      customerName.includes(query) ||
      customerPhone.includes(query) ||
      itemName.includes(query)
    )
  })

  const showingStart = total === 0 ? 0 : (activePage - 1) * pageSize + 1
  const showingEnd = Math.min(activePage * pageSize, total)
  const showingText = t('pag_showing')
    .replace('{start}', String(showingStart))
    .replace('{end}', String(showingEnd))
    .replace('{total}', String(total))

  return (
    <div className="w-full max-w-7xl mx-auto">
      <PageHeader title={t('history_title')} subtitle={t('history_subtitle')} />

      {/* Search and Page Size Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-expresso/40" />
          <Input
            type="text"
            placeholder={t('pag_search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 rounded-full"
          />
        </div>

        {/* Page Size Select */}
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

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white-pergamino rounded-xl border-2 border-dashed border-warm-roast/20">
          <CheckCircle className="h-16 w-16 text-warm-roast/30 mx-auto mb-4" />
          <h3 className="text-xl font-heading text-expresso mb-2">{t('history_no_orders')}</h3>
          <p className="text-expresso/60">{t('history_no_orders_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} customers={customers || []} inventoryItems={coffeeInventory} settings={settings} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4 mt-6 bg-warm-roast/5 rounded-lg border border-warm-roast/10">
          <div className="text-xs text-expresso/60 font-bold">
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
              // Show current page, first, last, and pages around current page
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
    </div>
  )
}
