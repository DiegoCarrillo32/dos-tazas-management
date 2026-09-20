'use client'

import { useBagTypes, useDeleteBagType, useSettings } from '@/hooks/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Package, Edit, Trash2 } from 'lucide-react'
import { BagTypeForm } from '@/components/BagTypeForm'
import { TableSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'
import { GenericModal } from '@/components/ui/GenericModal'
import { ResponsiveList, type ResponsiveListColumn } from '@/components/ui/responsive-list'
import { formatCurrency } from '@/lib/format'
import type { BagTypeRecord } from '@/types'
import { toast } from 'sonner'

export function BagTypesSection() {
  const { t } = useTranslation()
  const { data: bagTypes, isLoading } = useBagTypes()
  const { data: settings } = useSettings()
  const deleteMutation = useDeleteBagType()

  if (isLoading) {
    return <TableSkeleton cols={3} rows={2} />
  }

  const items = bagTypes || []
  const dash = <span className="text-expresso/40 italic font-normal">—</span>

  const rowActions = (item: BagTypeRecord) => (
    <>
      <GenericModal
        variant="bare"
        title={t('bag_type_edit')}
        contentClassName="sm:max-w-[420px]"
        trigger={
          <Button variant="ghost" size="icon-sm" className="text-coffee-fruit hover:text-warm-roast hover:bg-warm-roast/10 rounded-full max-md:size-11">
            <Edit className="h-4 w-4" />
            <span className="sr-only">{t('edit')}</span>
          </Button>
        }
      >
        <BagTypeForm initialData={item} />
      </GenericModal>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => {
          if (!confirm(t('bag_type_delete_confirm').replace('{name}', item.name))) return
          deleteMutation.mutate(item.id, {
            onSuccess: () => toast.success(t('bag_type_deleted')),
            onError: (err) => toast.error(err.message || t('bag_type_delete_failed')),
          })
        }}
        disabled={deleteMutation.isPending}
        className="text-expresso/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full max-md:size-11 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">{t('delete')}</span>
      </Button>
    </>
  )

  const columns: ResponsiveListColumn<BagTypeRecord>[] = [
    {
      id: 'name',
      role: 'title',
      header: t('bag_type_name'),
      cell: (bt) => <span className="font-medium text-expresso">{bt.name}</span>,
    },
    {
      id: 'size',
      role: 'meta',
      header: t('bag_type_size'),
      cell: (bt) => bt.size_grams ? `${bt.size_grams} g` : dash,
    },
    {
      id: 'cost',
      header: t('bag_type_cost'),
      cell: (bt) => <span className="font-medium">{formatCurrency(bt.cost, settings)}</span>,
    },
  ]

  return (
    <Card className="max-w-2xl shadow-lg border-warm-roast/20 mt-6">
      <CardHeader className="bg-white-pergamino border-b border-warm-roast/10 px-6 py-5 flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-heading text-expresso flex items-center gap-2">
            <Package className="h-5 w-5 text-warm-roast" />
            {t('bag_types_title')}
          </CardTitle>
          <CardDescription className="text-expresso/70">
            {t('bag_types_subtitle')}
          </CardDescription>
        </div>
        <GenericModal
          variant="bare"
          title={t('bag_type_add')}
          contentClassName="sm:max-w-[420px]"
          trigger={
            <Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-4 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">{t('bag_type_add')}</span>
            </Button>
          }
        >
          <BagTypeForm />
        </GenericModal>
      </CardHeader>
      <CardContent className="p-0">
        <ResponsiveList
          data={items}
          columns={columns}
          rowKey={(bt) => bt.id}
          actions={rowActions}
          actionsHeader={t('common_actions')}
          caption={t('bag_types_title')}
          emptyState={
            <div className="flex flex-col items-center justify-center gap-3">
              <Package className="h-12 w-12 text-warm-roast/20" />
              <p className="text-lg font-medium">{t('bag_types_empty')}</p>
              <p className="text-sm">{t('bag_types_empty_desc')}</p>
            </div>
          }
        />
      </CardContent>
    </Card>
  )
}
