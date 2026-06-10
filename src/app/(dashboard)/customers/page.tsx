'use client'

import { useState } from 'react'
import { useCustomers, useDeleteCustomer } from '@/hooks/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Users, Edit, Search, Trash2 } from 'lucide-react'
import { CustomerForm } from '@/components/CustomerForm'
import { TableSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GenericModal } from '@/components/ui/GenericModal'
import { PageHeader } from '@/components/PageHeader'

export default function CustomersPage() {
  const { t } = useTranslation()
  const { data: customers, isLoading } = useCustomers()
  const deleteMutation = useDeleteCustomer()

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  if (isLoading) {
    return <TableSkeleton cols={6} rows={4} />
  }

  const items = customers || []

  // Filter items
  const filteredItems = items.filter(customer => {
    const query = searchQuery.toLowerCase()
    return (
      customer.full_name?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    )
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
      <PageHeader
        title={t('customers_title')}
        subtitle={t('customers_subtitle')}
        action={
          <GenericModal
            hideFooter={true}
            hideTitle={true}
            title={t('customers_new_title') || "New Customer"}
            contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
            trigger={
              <Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline font-bold">{t('customers_new')}</span>
              </Button>
            }
          >
            <CustomerForm />
          </GenericModal>
        }
      />

      <Card className="shadow-lg border-warm-roast/10">
        <CardHeader className="bg-white-pergamino dark:bg-card border-b border-warm-roast/5 dark:border-border pt-4 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-heading text-expresso flex items-center gap-2">
              <Users className="h-5 w-5 text-coffee-fruit" />
              {t('customers_directory')}
            </CardTitle>
            <CardDescription className="text-expresso/60">
              {filteredItems.length === items.length
                ? `${items.length} total`
                : `${filteredItems.length} ${t('orders_pending').toLowerCase()} (${items.length} total)`}
            </CardDescription>
          </div>

          {/* Search and Page Size Controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
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
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="md:hidden">
            {paginatedItems.length === 0 ? (
              <div className="px-6 py-12 text-center text-expresso/60">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Users className="h-12 w-12 text-warm-roast/20" />
                  <p className="text-lg font-medium">{t('customers_no_found')}</p>
                  <p className="text-sm">{t('customers_no_found_desc')}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 p-4 bg-warm-roast/5">
                {paginatedItems.map((customer) => (
                  <div key={customer.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                      <div className="font-bold text-expresso text-base">{customer.full_name}</div>
                      <div className="flex items-center gap-1">
                        <GenericModal
                          hideFooter={true}
                          hideTitle={true}
                          title={t('cust_form_edit') || "Edit Customer"}
                          contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
                          trigger={
                            <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('edit')}</span>
                            </Button>
                          }
                        >
                          <CustomerForm initialData={customer} />
                        </GenericModal>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                          onClick={() => {
                            showConfirm(
                              t('customers_delete_title'),
                              t('customers_delete_confirm'),
                              () => deleteMutation.mutate(customer.id),
                              "destructive"
                            )
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t('delete')}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Content Grid */}
                    <div className="p-4 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                          {t('customers_col_phone')}
                        </div>
                        <div className="font-medium text-expresso text-sm">
                          {customer.phone || <span className="text-expresso/40 italic font-normal">{t('customers_not_provided')}</span>}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                          {t('customers_col_last_purchase')}
                        </div>
                        <div className="font-medium text-expresso text-sm">
                          {customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : <span className="text-expresso/40 italic font-normal">{t('customers_never')}</span>}
                        </div>
                      </div>
                      
                      {customer.address && (
                        <div className="col-span-2 pt-2 border-t border-warm-roast/5">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                            {t('customers_col_address')}
                          </div>
                          <div className="text-sm text-expresso/80 truncate" title={customer.address}>
                            {customer.address}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs uppercase bg-warm-roast/5 text-expresso/70 font-bold border-b border-warm-roast/10">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">{t('customers_col_name')}</th>
                  <th scope="col" className="px-6 py-4">{t('customers_col_phone')}</th>
                  <th scope="col" className="px-6 py-4">{t('customers_col_address')}</th>
                  <th scope="col" className="px-6 py-4">{t('customers_col_added')}</th>
                  <th scope="col" className="px-6 py-4">{t('customers_col_last_purchase')}</th>
                  <th scope="col" className="px-6 py-4 text-right rounded-tr-lg">{t('customers_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-expresso/60 border-b border-warm-roast/10">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Users className="h-12 w-12 text-warm-roast/20" />
                        <p className="text-lg font-medium">{t('customers_no_found')}</p>
                        <p className="text-sm">{t('customers_no_found_desc')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((customer) => (
                    <tr key={customer.id} className="border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-expresso">
                        {customer.full_name}
                      </td>
                      <td className="px-6 py-4 text-expresso/80">
                        {customer.phone || <span className="text-expresso/40 italic">{t('customers_not_provided')}</span>}
                      </td>
                      <td className="px-6 py-4 text-expresso/80 max-w-xs truncate" title={customer.address || ''}>
                        {customer.address || <span className="text-expresso/40 italic">{t('customers_not_provided')}</span>}
                      </td>
                      <td className="px-6 py-4 text-expresso/70">
                        {new Date(customer.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-expresso/80 font-medium">
                        {customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : <span className="text-expresso/40 italic">{t('customers_never')}</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <GenericModal
                            hideFooter={true}
                            hideTitle={true}
                            title={t('cust_form_edit') || "Edit Customer"}
                            contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
                            trigger={
                              <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full">
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">{t('edit')}</span>
                              </Button>
                            }
                          >
                            <CustomerForm initialData={customer} />
                          </GenericModal>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-full"
                            onClick={() => {
                              showConfirm(
                                t('customers_delete_title'),
                                t('customers_delete_confirm'),
                                () => deleteMutation.mutate(customer.id),
                                "destructive"
                              )
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">{t('delete')}</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 gap-4 border-t border-warm-roast/10 bg-warm-roast/5 rounded-b-lg">
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
        </CardContent>
      </Card>

      <GenericModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        onConfirm={modalState.onConfirm}
        confirmVariant={modalState.confirmVariant}
      >
        <p>{modalState.message}</p>
      </GenericModal>
    </div>
  )
}
