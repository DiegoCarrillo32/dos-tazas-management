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
import { Pagination } from '@/components/ui/pagination'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import type { CustomerWithLastPurchase } from '@/types'

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

  const notProvided = <span className="italic font-normal text-expresso/40">{t('customers_not_provided')}</span>
  const formatDate = (value: string | null, fallback: React.ReactNode) =>
    value
      ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      : fallback

  const rowActions = (customer: CustomerWithLastPurchase) => (
    <>
      <GenericModal
        variant="bare"
        title={t('cust_form_edit') || "Edit Customer"}
        contentClassName="sm:max-w-[480px]"
        trigger={
          <Button variant="ghost" size="icon-sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 rounded-full max-md:size-11">
            <Edit className="h-4 w-4" />
            <span className="sr-only">{t('edit')}</span>
          </Button>
        }
      >
        <CustomerForm initialData={customer} />
      </GenericModal>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full max-md:size-11"
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
    </>
  )

  const columns: ResponsiveListColumn<CustomerWithLastPurchase>[] = [
    {
      id: 'name',
      role: 'title',
      header: t('customers_col_name'),
      cell: (c) => <span className="font-medium text-expresso">{c.full_name}</span>,
    },
    {
      id: 'phone',
      header: t('customers_col_phone'),
      cell: (c) => c.phone || notProvided,
    },
    {
      id: 'address',
      header: t('customers_col_address'),
      cardFullWidth: true,
      cellClassName: 'max-w-xs truncate',
      cell: (c) => c.address || notProvided,
    },
    {
      // Desktop only because the config says so, not because someone remembered
      // to leave it out of a hand-written card block.
      id: 'added',
      role: 'none',
      header: t('customers_col_added'),
      cell: (c) => formatDate(c.created_at, notProvided),
    },
    {
      id: 'last',
      header: t('customers_col_last_purchase'),
      cell: (c) => formatDate(
        c.last_purchase_date,
        <span className="italic font-normal text-expresso/40">{t('customers_never')}</span>
      ),
    },
  ]

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
            variant="bare"
            title={t('customers_new_title') || "New Customer"}
            contentClassName="sm:max-w-[480px]"
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
          <ResponsiveList
            data={paginatedItems}
            columns={columns}
            rowKey={(c) => c.id}
            actions={rowActions}
            actionsHeader={t('customers_col_actions')}
            caption={t('customers_directory')}
            emptyState={
              <div className="flex flex-col items-center justify-center gap-3">
                <Users className="h-12 w-12 text-warm-roast/20" />
                <p className="text-lg font-medium">{t('customers_no_found')}</p>
                <p className="text-sm">{t('customers_no_found_desc')}</p>
              </div>
            }
          />

          {/* Pagination Controls */}
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            showingText={showingText}
          />
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
