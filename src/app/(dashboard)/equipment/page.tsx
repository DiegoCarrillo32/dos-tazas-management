'use client'

import { useState } from 'react'
import { useEquipment } from '@/hooks/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Settings, Edit, Search } from 'lucide-react'
import { EquipmentForm } from '@/components/EquipmentForm'
import { MaintenanceLogsDialog } from '@/components/MaintenanceLogsDialog'
import { TableSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GenericModal } from '@/components/ui/GenericModal'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/ui/pagination'

export default function EquipmentPage() {
  const { t } = useTranslation()
  const { data: equipmentItems, isLoading: loadingEquipment } = useEquipment()

  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  if (loadingEquipment) {
    return <TableSkeleton cols={5} rows={4} />
  }

  const items = equipmentItems || []

  // Filter items
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase()
    return (
      item.name?.toLowerCase().includes(query) ||
      item.type?.toLowerCase().includes(query) ||
      item.manufacturer?.toLowerCase().includes(query)
    )
  })

  // Pagination
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
        title={t('equipment_title')}
        subtitle={t('equipment_subtitle')}
        action={
          <GenericModal
            hideFooter={true}
            hideTitle={true}
            title={t('equipment_add')}
            contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
            trigger={
              <Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline font-bold">{t('equipment_add')}</span>
              </Button>
            }
          >
            <EquipmentForm />
          </GenericModal>
        }
      />

      <Card className="shadow-lg border-warm-roast/10">
        <CardHeader className="bg-white-pergamino dark:bg-card border-b border-warm-roast/5 dark:border-border pt-4 pb-4 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-heading text-expresso flex items-center gap-2">
                <Settings className="h-5 w-5 text-coffee-fruit" />
                {t('equipment_list')}
              </CardTitle>
              <CardDescription className="text-expresso/60">
                {filteredItems.length === items.length
                  ? t('list_items_count').replace('{count}', String(items.length))
                  : t('list_filtered_count').replace('{filtered}', String(filteredItems.length)).replace('{total}', String(items.length))}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
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
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          <div className="md:hidden flex flex-col gap-4 p-4 bg-warm-roast/5">
            {paginatedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-expresso/60">
                <Settings className="h-12 w-12 text-warm-roast/20" />
                <p className="text-lg font-medium">{t('equipment_no_found')}</p>
                <p className="text-sm">{t('equipment_no_found_desc')}</p>
              </div>
            ) : (
              paginatedItems.map((item) => (
                <div key={item.id} className="flex flex-col bg-card rounded-xl border border-warm-roast/10 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-start justify-between p-4 border-b border-warm-roast/5 bg-white-pergamino/30">
                    <div>
                      <div className="font-bold text-expresso text-base mb-1">{item.name}</div>
                      <span className="text-xs bg-warm-roast/10 text-expresso/70 px-2 py-0.5 rounded-full capitalize">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MaintenanceLogsDialog equipmentId={item.id} equipmentName={item.name} />
                      <GenericModal
                        hideFooter={true}
                        hideTitle={true}
                        title={t('equipment_edit')}
                        contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
                        trigger={
                          <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">{t('edit')}</span>
                          </Button>
                        }
                      >
                        <EquipmentForm initialData={item} />
                      </GenericModal>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {item.model && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                          {t('equipment_col_model')}
                        </div>
                        <div className="font-medium text-expresso text-sm truncate" title={item.model}>
                          {item.model}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                        {t('equipment_col_manufacturer')}
                      </div>
                      <div className="font-medium text-expresso text-sm truncate" title={item.manufacturer || ''}>
                        {item.manufacturer || <span className="text-expresso/40 italic font-normal">—</span>}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-1">
                        {t('equipment_col_purchase_date')}
                      </div>
                      <div className="font-medium text-expresso text-sm">
                        {item.purchase_date || <span className="text-expresso/40 italic font-normal">—</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="text-xs uppercase bg-warm-roast/5 text-expresso/70 font-bold border-b border-warm-roast/10">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">{t('equipment_col_name')}</th>
                  <th scope="col" className="px-6 py-4">{t('equipment_col_type')}</th>
                  <th scope="col" className="px-6 py-4">{t('equipment_col_manufacturer')}</th>
                  <th scope="col" className="px-6 py-4">{t('equipment_col_purchase_date')}</th>
                  <th scope="col" className="px-6 py-4 text-right rounded-tr-lg">{t('equipment_col_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-expresso/60 border-b border-warm-roast/10">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Settings className="h-12 w-12 text-warm-roast/20" />
                        <p className="text-lg font-medium">{t('equipment_no_found')}</p>
                        <p className="text-sm">{t('equipment_no_found_desc')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => (
                    <tr key={item.id} className="border-b border-warm-roast/5 hover:bg-warm-roast/5 transition-colors group">
                      <td className="px-6 py-4 font-medium text-expresso">
                        {item.name}
                        {item.model && <p className="text-xs text-expresso/50 font-normal mt-1 truncate max-w-[200px]">{t('equipment_col_model')}: {item.model}</p>}
                      </td>
                      <td className="px-6 py-4 text-expresso/80 capitalize">
                        {item.type.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 text-expresso/80">
                        {item.manufacturer || <span className="text-expresso/40">—</span>}
                      </td>
                      <td className="px-6 py-4 text-expresso/70">
                        {item.purchase_date || <span className="text-expresso/40">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                        <MaintenanceLogsDialog equipmentId={item.id} equipmentName={item.name} />
                        <GenericModal
                          hideFooter={true}
                          hideTitle={true}
                          title={t('equipment_edit')}
                          contentClassName="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none"
                          trigger={
                            <Button variant="ghost" size="sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 h-8 w-8 p-0 rounded-full">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">{t('edit')}</span>
                            </Button>
                          }
                        >
                          <EquipmentForm initialData={item} />
                        </GenericModal>
                      </td>
                    </tr>
                  ))
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
