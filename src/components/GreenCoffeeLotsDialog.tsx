'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Leaf, Trash2 } from 'lucide-react'
import { useGreenCoffeeLots, useDeleteGreenCoffeeLot } from '@/hooks/queries'
import { GreenCoffeeLotForm } from './GreenCoffeeLotForm'
import { ShipLotModal } from './ShipLotModal'
import { GenericModal } from '@/components/ui/GenericModal'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { GreenCoffeeLotRecord } from '@/types'

interface GreenCoffeeLotsDialogProps {
  inventoryId: string
  inventoryName: string
}

function LotAvailabilityBar({ lot }: { lot: GreenCoffeeLotRecord }) {
  if (!lot.quantity_kg) return null
  const pct = Math.min(100, ((lot.quantity_shipped_kg || 0) / lot.quantity_kg) * 100)
  const available = lot.quantity_kg - (lot.quantity_shipped_kg || 0)
  const isLow = available < lot.quantity_kg * 0.2

  const { t } = useTranslation()

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-expresso/50 font-bold uppercase tracking-wider">{t('lot_dialog_available')}</span>
        <span className={`text-xs font-bold ${isLow ? 'text-red-500' : 'text-coffee-fruit'}`}>
          {available.toFixed(2)} / {lot.quantity_kg.toFixed(2)} kg
        </span>
      </div>
      <div className="h-1.5 bg-warm-roast/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isLow ? 'bg-red-400' : 'bg-coffee-fruit'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function LotCard({
  lot,
  inventoryId,
  onEdit,
}: {
  lot: GreenCoffeeLotRecord
  inventoryId: string
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const deleteMutation = useDeleteGreenCoffeeLot(inventoryId)

  const handleDelete = () => {
    if (!confirm(`${t('lot_toast_deleted')}?`)) return
    deleteMutation.mutate(lot.id, {
      onSuccess: () => toast.success(t('lot_toast_deleted')),
      onError: () => toast.error(t('lot_toast_delete_error')),
    })
  }

  return (
    <div className="bg-card rounded-lg border border-warm-roast/10 p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <span className="font-bold text-expresso text-sm">{lot.name}</span>
          {lot.crop_year && (
            <span className="ml-2 text-[10px] bg-warm-roast/10 text-expresso/60 px-1.5 py-0.5 rounded font-bold">
              {lot.crop_year}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {lot.quantity_kg !== null && (lot.quantity_kg - (lot.quantity_shipped_kg || 0)) > 0 && (
            <ShipLotModal lot={lot} inventoryId={inventoryId} />
          )}
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-6 w-6 p-0 text-expresso/50 hover:text-warm-roast">
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="h-6 w-6 p-0 text-expresso/30 hover:text-red-500"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <LotAvailabilityBar lot={lot} />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-expresso/80">
        {lot.origin && (
          <div><span className="font-bold text-expresso/50 text-xs">{t('lot_card_origin')}</span><p>{lot.origin}</p></div>
        )}
        {lot.varietal && (
          <div><span className="font-bold text-expresso/50 text-xs">{t('lot_card_varietal')}</span><p>{lot.varietal}</p></div>
        )}
        {lot.process && (
          <div><span className="font-bold text-expresso/50 text-xs">{t('lot_card_process')}</span><p className="capitalize">{lot.process}</p></div>
        )}
        {lot.altitude && (
          <div><span className="font-bold text-expresso/50 text-xs">{t('lot_card_altitude')}</span><p>{lot.altitude} masl</p></div>
        )}
        {lot.harvest_date && (
          <div><span className="font-bold text-expresso/50 text-xs">{t('lot_form_harvest_date')}</span><p>{new Date(lot.harvest_date).toLocaleDateString()}</p></div>
        )}
        {lot.bag_count && lot.bag_weight_kg && (
          <div><span className="font-bold text-expresso/50 text-xs">{t('lot_card_bags')}</span><p>{lot.bag_count} × {lot.bag_weight_kg} kg</p></div>
        )}
      </div>

      {(lot.cupping_score || lot.moisture_content || lot.screen_size) && (
        <div className="pt-2 border-t border-warm-roast/5 flex flex-wrap gap-2">
          {lot.cupping_score && (
            <span className="text-xs bg-coffee-fruit/10 text-coffee-fruit px-2 py-0.5 rounded-full font-bold">
              ★ {lot.cupping_score} pts
            </span>
          )}
          {lot.moisture_content && (
            <span className="text-xs bg-warm-roast/10 text-expresso/70 px-2 py-0.5 rounded-full font-bold">
              {lot.moisture_content}% {t('lot_badge_moisture')}
            </span>
          )}
          {lot.screen_size && (
            <span className="text-xs bg-warm-roast/10 text-expresso/70 px-2 py-0.5 rounded-full font-bold">
              {t('lot_badge_screen')} {lot.screen_size}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export function GreenCoffeeLotsDialog({ inventoryId, inventoryName }: GreenCoffeeLotsDialogProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { t } = useTranslation()

  const { data: lots, isLoading } = useGreenCoffeeLots(inventoryId)

  const totalKg = lots?.reduce((sum, l) => sum + (l.quantity_kg || 0), 0) ?? 0
  const shippedKg = lots?.reduce((sum, l) => sum + (l.quantity_shipped_kg || 0), 0) ?? 0
  const availableKg = totalKg - shippedKg

  return (
    <GenericModal
      onOpenChange={(open) => {
        if (!open) {
          setIsAdding(false)
          setEditingId(null)
        }
      }}
      trigger={
        <Button variant="ghost" size="sm" className="text-warm-roast hover:text-coffee-fruit hover:bg-warm-roast/10 h-8 px-2 gap-1 rounded-full">
          <Leaf className="h-4 w-4" />
          <span className="text-xs font-bold">Lots</span>
        </Button>
      }
      contentClassName="sm:max-w-[620px] bg-white-pergamino dark:bg-card p-4 sm:p-6 border-warm-roast/10 shadow-2xl overflow-hidden"
      hideTitle={true}
      hideFooter={true}
      title={`${t('lot_dialog_subtitle')}: ${inventoryName}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-heading text-expresso">{inventoryName}</h2>
          <p className="text-xs text-expresso/50 font-bold uppercase tracking-wider mt-0.5">{t('lot_dialog_subtitle')}</p>
        </div>
        {!isAdding && !editingId && (
          <Button size="sm" onClick={() => setIsAdding(true)} className="bg-coffee-fruit hover:bg-warm-roast text-white h-8 text-xs gap-1">
            <Plus className="h-3 w-3" /> {t('lot_dialog_add')}
          </Button>
        )}
      </div>

      {/* Summary strip */}
      {totalKg > 0 && !isAdding && !editingId && (
        <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-warm-roast/5 rounded-xl border border-warm-roast/10">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-expresso/50">{t('lot_dialog_total')}</p>
            <p className="text-base font-bold text-expresso">{totalKg.toFixed(2)} kg</p>
          </div>
          <div className="text-center border-x border-warm-roast/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-expresso/50">{t('lot_dialog_shipped')}</p>
            <p className="text-base font-bold text-expresso/70">{shippedKg.toFixed(2)} kg</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-expresso/50">{t('lot_dialog_available')}</p>
            <p className={`text-base font-bold ${availableKg < totalKg * 0.2 ? 'text-red-500' : 'text-coffee-fruit'}`}>
              {availableKg.toFixed(2)} kg
            </p>
          </div>
        </div>
      )}

      <div className="py-1">
        {isAdding ? (
          <div className="bg-card rounded-lg border border-warm-roast/10 p-4">
            <GreenCoffeeLotForm
              inventoryId={inventoryId}
              onCancel={() => setIsAdding(false)}
              onSuccess={() => setIsAdding(false)}
            />
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {isLoading ? (
              <p className="text-sm text-expresso/60 text-center py-8">{t('lot_dialog_loading')}</p>
            ) : !lots || lots.length === 0 ? (
              <p className="text-sm text-expresso/60 text-center py-8">{t('lot_dialog_empty')}</p>
            ) : (
              lots.map(lot =>
                editingId === lot.id ? (
                  <div key={lot.id} className="bg-card rounded-lg border border-warm-roast/10 p-4">
                    <GreenCoffeeLotForm
                      inventoryId={inventoryId}
                      initialData={lot}
                      onCancel={() => setEditingId(null)}
                      onSuccess={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <LotCard
                    key={lot.id}
                    lot={lot}
                    inventoryId={inventoryId}
                    onEdit={() => setEditingId(lot.id)}
                  />
                )
              )
            )}
          </div>
        )}
      </div>
    </GenericModal>
  )
}
