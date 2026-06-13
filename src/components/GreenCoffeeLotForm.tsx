'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { greenCoffeeLotSchema } from '@/lib/schemas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormCard } from '@/components/ui/form-card'
import type { GreenCoffeeLotRecord } from '@/types'
import { useCreateGreenCoffeeLot, useUpdateGreenCoffeeLot } from '@/hooks/queries'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/LanguageProvider'

type GreenCoffeeLotFormValues = z.infer<typeof greenCoffeeLotSchema>

interface GreenCoffeeLotFormProps {
  inventoryId: string
  initialData?: GreenCoffeeLotRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function GreenCoffeeLotForm({ inventoryId, initialData, onSuccess, onCancel, inline = false }: GreenCoffeeLotFormProps) {
  const { t } = useTranslation()

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<GreenCoffeeLotFormValues>({
    resolver: zodResolver(greenCoffeeLotSchema),
    defaultValues: {
      name: initialData?.name || '',
      origin: initialData?.origin || '',
      varietal: initialData?.varietal || '',
      process: initialData?.process || 'washed',
      altitude: initialData?.altitude || '',
      harvest_date: initialData?.harvest_date || '',
      crop_year: initialData?.crop_year || '',
      quantity_kg: initialData?.quantity_kg ?? ('' as unknown as number),
      quantity_shipped_kg: initialData?.quantity_shipped_kg ?? 0,
      cupping_score: initialData?.cupping_score ?? ('' as unknown as number),
      moisture_content: initialData?.moisture_content ?? ('' as unknown as number),
      screen_size: initialData?.screen_size || '',
      bag_count: initialData?.bag_count ?? ('' as unknown as number),
      bag_weight_kg: initialData?.bag_weight_kg ?? ('' as unknown as number),
    }
  })

  const quantityKg = watch('quantity_kg')
  const quantityShippedKg = watch('quantity_shipped_kg')
  const availableKg = (Number(quantityKg) || 0) - (Number(quantityShippedKg) || 0)

  const createMutation = useCreateGreenCoffeeLot(inventoryId)
  const updateMutation = useUpdateGreenCoffeeLot(inventoryId)
  const isPending = createMutation.isPending || updateMutation.isPending

  const toNullableNumber = (v: unknown) => (v === '' || v === null || v === undefined) ? null : Number(v)
  const toOptionalNumber = (v: unknown) => (v === '' || v === null || v === undefined) ? undefined : Number(v)

  const onSubmit = (data: GreenCoffeeLotFormValues) => {
    const payload = {
      inventory_id: inventoryId,
      name: data.name,
      origin: data.origin || null,
      varietal: data.varietal || null,
      process: data.process || null,
      altitude: data.altitude || null,
      harvest_date: data.harvest_date || null,
      crop_year: data.crop_year || null,
      quantity_kg: toNullableNumber(data.quantity_kg),
      quantity_shipped_kg: toOptionalNumber(data.quantity_shipped_kg) ?? 0,
      cupping_score: toNullableNumber(data.cupping_score),
      moisture_content: toNullableNumber(data.moisture_content),
      screen_size: data.screen_size || null,
      bag_count: toNullableNumber(data.bag_count) !== null ? Math.round(toNullableNumber(data.bag_count)!) : null,
      bag_weight_kg: toNullableNumber(data.bag_weight_kg),
    }

    const onMutationSuccess = () => {
      toast.success(initialData ? t('lot_toast_updated') : t('lot_toast_created'))
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) reset()
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || t('lot_toast_error'))
    }

    if (initialData?.id) {
      updateMutation.mutate({ id: initialData.id, params: payload }, { onSuccess: onMutationSuccess, onError: onMutationError })
    } else {
      createMutation.mutate(payload, { onSuccess: onMutationSuccess, onError: onMutationError })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (inline && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  const title = initialData ? t('lot_form_title_edit') : t('lot_form_title_add')

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? 'sm' : 'default'} onClick={onCancel} disabled={isPending} className="text-expresso">
          {t('cancel')}
        </Button>
      )}
      <Button type="submit" size={inline ? 'sm' : 'default'} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? t('loading') : t('lot_form_save')}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>

        {/* ── Identity ── */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-expresso">{t('lot_form_name')} <span className="text-red-500">*</span></Label>
          <Input id="name" placeholder={t('lot_form_name_placeholder')} {...register('name')} />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin" className="text-expresso">{t('lot_form_origin')}</Label>
            <Input id="origin" placeholder="e.g. Colombia, Cauca" {...register('origin')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="varietal" className="text-expresso">{t('lot_form_varietal')}</Label>
            <Input id="varietal" placeholder="e.g. Castillo, Geisha" {...register('varietal')} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="process" className="text-expresso">{t('lot_form_process')}</Label>
            <Controller
              control={control}
              name="process"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder="Select process" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="washed">Washed</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="honey">Honey</SelectItem>
                    <SelectItem value="anaerobic">Anaerobic</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="altitude" className="text-expresso">{t('lot_form_altitude')}</Label>
            <Input id="altitude" placeholder="e.g. 1900" {...register('altitude')} />
          </div>
        </div>

        {/* ── Harvest ── */}
        <div className="pt-2 border-t border-warm-roast/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-3">{t('lot_form_section_harvest')}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="harvest_date" className="text-expresso">{t('lot_form_harvest_date')}</Label>
              <Input id="harvest_date" type="date" {...register('harvest_date')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crop_year" className="text-expresso">{t('lot_form_crop_year')}</Label>
              <Input id="crop_year" placeholder={t('lot_form_crop_year_placeholder')} {...register('crop_year')} />
            </div>
          </div>
        </div>

        {/* ── Quantity ── */}
        <div className="pt-2 border-t border-warm-roast/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-3">{t('lot_form_section_quantity')}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity_kg" className="text-expresso">{t('lot_form_quantity_kg')}</Label>
              <Input
                id="quantity_kg"
                type="number"
                step="0.01"
                placeholder="e.g. 250"
                {...register('quantity_kg', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              />
              {errors.quantity_kg && <p className="text-red-500 text-xs font-medium">{errors.quantity_kg.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_shipped_kg" className="text-expresso">{t('lot_form_shipped_kg')}</Label>
              <Input
                id="quantity_shipped_kg"
                type="number"
                step="0.01"
                placeholder="0"
                {...register('quantity_shipped_kg', { setValueAs: (v) => v === '' ? 0 : Number(v) })}
              />
              {errors.quantity_shipped_kg && <p className="text-red-500 text-xs font-medium">{errors.quantity_shipped_kg.message}</p>}
            </div>
          </div>

          {Number(quantityKg) > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-warm-roast/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-coffee-fruit rounded-full transition-all"
                  style={{ width: `${Math.min(100, ((Number(quantityShippedKg) || 0) / Number(quantityKg)) * 100)}%` }}
                />
              </div>
              <span className={`text-xs font-bold ${availableKg < 0 ? 'text-red-500' : 'text-coffee-fruit'}`}>
                {t('lot_form_available').replace('{available}', availableKg.toFixed(2))}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bag_count" className="text-expresso">{t('lot_form_bag_count')}</Label>
              <Input
                id="bag_count"
                type="number"
                step="1"
                placeholder="e.g. 10"
                {...register('bag_count', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bag_weight_kg" className="text-expresso">{t('lot_form_bag_weight')}</Label>
              <Input
                id="bag_weight_kg"
                type="number"
                step="0.01"
                placeholder="e.g. 25"
                {...register('bag_weight_kg', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              />
            </div>
          </div>
        </div>

        {/* ── Quality ── */}
        <div className="pt-2 border-t border-warm-roast/10">
          <p className="text-[10px] font-bold uppercase tracking-wider text-expresso/50 mb-3">{t('lot_form_section_quality')}</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cupping_score" className="text-expresso">{t('lot_form_cupping')}</Label>
              <Input
                id="cupping_score"
                type="number"
                step="0.25"
                min="0"
                max="100"
                placeholder="e.g. 86.5"
                {...register('cupping_score', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              />
              {errors.cupping_score && <p className="text-red-500 text-xs font-medium">{errors.cupping_score.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="moisture_content" className="text-expresso">{t('lot_form_moisture')}</Label>
              <Input
                id="moisture_content"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g. 11.5"
                {...register('moisture_content', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="screen_size" className="text-expresso">{t('lot_form_screen_size')}</Label>
              <Input id="screen_size" placeholder="e.g. 15/16" {...register('screen_size')} />
            </div>
          </div>
        </div>

      </FormCard>
    </form>
  )
}
