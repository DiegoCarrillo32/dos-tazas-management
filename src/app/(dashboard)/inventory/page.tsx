'use client'

import { useInventory, useSettings } from '@/hooks/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, PackageSearch, Coffee } from 'lucide-react'
import { InventoryForm } from '@/components/InventoryForm'
import { TableSkeleton } from '@/components/Skeletons'
import { useTranslation } from '@/i18n/LanguageProvider'

export default function InventoryPage() {
  const { t } = useTranslation()
  const { data: inventoryItems, isLoading: loadingInventory } = useInventory()
  const { data: settings, isLoading: loadingSettings } = useSettings()

  if (loadingInventory || loadingSettings) {
    return <TableSkeleton cols={5} rows={4} />
  }

  const items = inventoryItems || []
  const lossRatio = 1 - ((settings?.roast_loss_percentage || 20) / 100)

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-heading text-expresso">{t('inventory_title')}</h1>
          <p className="text-expresso/70 font-medium text-sm">{t('inventory_subtitle')}</p>
        </div>
        
        <Dialog>
          <DialogTrigger render={<Button className="bg-warm-roast hover:bg-coffee-fruit text-white gap-2 shadow-sm rounded-full px-6" />}>
            <Plus className="h-5 w-5" />
            <span className="hidden sm:inline font-bold">{t('inventory_add')}</span>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] p-0 border-none bg-transparent shadow-none" aria-describedby="new-inventory-form">
            <DialogTitle className="sr-only">{t('inventory_add_title')}</DialogTitle>
            <InventoryForm settings={settings} />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-lg border-warm-roast/10">
        <CardHeader className="bg-white-pergamino border-b border-warm-roast/5">
          <CardTitle className="text-xl font-heading text-expresso flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-coffee-fruit" />
            {t('inventory_directory')}
          </CardTitle>
          <CardDescription className="text-expresso/60">
            {items.length} items
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-warm-roast/5 text-expresso/70 font-bold border-b border-warm-roast/10">
                <tr>
                  <th scope="col" className="px-6 py-4 rounded-tl-lg">{t('inventory_col_item')}</th>
                  <th scope="col" className="px-6 py-4">{t('inventory_col_category')}</th>
                  <th scope="col" className="px-6 py-4">{t('inventory_col_raw')}</th>
                  <th scope="col" className="px-6 py-4">{t('inventory_col_yield').replace('{loss}', String(settings?.roast_loss_percentage || 20))}</th>
                  <th scope="col" className="px-6 py-4 rounded-tr-lg">{t('inventory_col_cost')}</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-expresso/60 border-b border-warm-roast/10">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Coffee className="h-12 w-12 text-warm-roast/20" />
                        <p className="text-lg font-medium">{t('inventory_no_found')}</p>
                        <p className="text-sm">{t('inventory_no_found_desc')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
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
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
