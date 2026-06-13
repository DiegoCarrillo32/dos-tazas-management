'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GenericModal } from '@/components/ui/GenericModal'
import { Send } from 'lucide-react'
import { useShipGreenCoffeeLot } from '@/hooks/queries'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { GreenCoffeeLotRecord } from '@/types'

interface ShipLotModalProps {
  lot: GreenCoffeeLotRecord
  inventoryId: string
}

export function ShipLotModal({ lot, inventoryId }: ShipLotModalProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [kg, setKg] = useState('')
  const shipMutation = useShipGreenCoffeeLot(inventoryId)

  const available = (lot.quantity_kg || 0) - (lot.quantity_shipped_kg || 0)
  const kgNum = parseFloat(kg) || 0

  const handleShip = () => {
    if (kgNum <= 0) {
      toast.error(t('ship_error_zero'))
      return
    }
    shipMutation.mutate(
      { id: lot.id, kgToShip: kgNum },
      {
        onSuccess: () => {
          toast.success(t('ship_toast_success').replace('{kg}', String(kgNum)).replace('{name}', lot.name))
          setKg('')
          setOpen(false)
        },
        onError: (err) => {
          toast.error(err.message || t('ship_toast_error'))
        },
      }
    )
  }

  return (
    <GenericModal
      isOpen={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setKg('')
      }}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1 text-[10px] font-bold text-warm-roast hover:text-coffee-fruit hover:bg-warm-roast/10 rounded-full"
        >
          <Send className="h-3 w-3" />
          {t('ship_btn_record').split(' ')[0]}
        </Button>
      }
      title={t('ship_modal_title').replace('{name}', lot.name)}
      hideFooter
      contentClassName="sm:max-w-[360px]"
    >
      <div className="space-y-4 pt-1">
        <div className="bg-warm-roast/5 rounded-lg p-3 text-sm">
          <div className="flex justify-between text-expresso/60">
            <span>{t('ship_total')}</span>
            <span className="font-bold text-expresso">{(lot.quantity_kg || 0).toFixed(2)} kg</span>
          </div>
          <div className="flex justify-between text-expresso/60 mt-1">
            <span>{t('ship_already_shipped')}</span>
            <span className="font-bold text-expresso">{(lot.quantity_shipped_kg || 0).toFixed(2)} kg</span>
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-warm-roast/10">
            <span className="font-bold text-expresso/80">{t('ship_available')}</span>
            <span className="font-bold text-coffee-fruit">{available.toFixed(2)} kg</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ship-kg" className="text-expresso">
            {t('ship_quantity_label')} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="ship-kg"
            type="number"
            step="0.01"
            min="0.01"
            max={available}
            placeholder={t('ship_max_placeholder').replace('{max}', available.toFixed(2))}
            value={kg}
            onChange={(e) => setKg(e.target.value)}
            autoFocus
          />
          {kgNum > available && (
            <p className="text-red-500 text-xs font-medium">{t('ship_exceeds_stock').replace('{available}', available.toFixed(2))}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => setOpen(false)} className="text-expresso">
            {t('cancel')}
          </Button>
          <Button
            onClick={handleShip}
            disabled={shipMutation.isPending || kgNum <= 0 || kgNum > available}
            className="bg-coffee-fruit hover:bg-warm-roast text-white gap-2"
          >
            <Send className="h-4 w-4" />
            {shipMutation.isPending ? t('ship_btn_recording') : t('ship_btn_record')}
          </Button>
        </div>
      </div>
    </GenericModal>
  )
}
