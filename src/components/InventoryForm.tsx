'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormCard } from '@/components/ui/form-card'
import type { InventoryRecord, UserSettingsRecord } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useCreateInventoryItem, useUpdateInventoryItem } from '@/hooks/queries'
import { toast } from 'sonner'

const inventorySchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  stock_grams: z.number().min(0, 'Quantity cannot be negative'),
  cost_per_kg: z.number().nullable().optional(),
  notes: z.string().optional(),
})

type InventoryFormValues = z.infer<typeof inventorySchema>

interface InventoryFormProps {
  initialData?: InventoryRecord
  settings?: UserSettingsRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function InventoryForm({ initialData, settings, onSuccess, onCancel, inline = false }: InventoryFormProps) {
  const { t } = useTranslation()

  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      item_name: initialData?.item_name || '',
      category: initialData?.category || 'green_coffee',
      stock_grams: initialData?.stock_grams ?? ('' as unknown as number),
      cost_per_kg: initialData?.cost_per_kg ?? ('' as unknown as number),
      notes: initialData?.notes || '',
    }
  })

  const category = watch('category')
  const stockGrams = watch('stock_grams')

  const createMutation = useCreateInventoryItem()
  const updateMutation = useUpdateInventoryItem()
  const isPending = createMutation.isPending || updateMutation.isPending

  const roastLossPercentage = settings?.roast_loss_percentage ?? 20
  const lossRatio = 1 - (roastLossPercentage / 100)

  // Calculate estimated yield immediately for the UI
  const rawGrams = Number(stockGrams) || 0
  const estimatedRoastedYield = Math.floor(rawGrams * lossRatio)

  const onSubmit = (data: InventoryFormValues) => {
    const payload = {
      item_name: data.item_name,
      category: data.category,
      stock_grams: data.stock_grams,
      cost_per_kg: data.cost_per_kg || null,
      notes: data.notes || null
    }

    const onMutationSuccess = () => {
      toast.success(initialData ? 'Inventory updated successfully' : 'Inventory added successfully')
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) {
        reset()
      }
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || 'Failed to save inventory item')
    }

    if (initialData?.id) {
      updateMutation.mutate(
        { id: initialData.id, params: payload },
        { onSuccess: onMutationSuccess, onError: onMutationError }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: onMutationSuccess,
        onError: onMutationError,
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (inline && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  const title = initialData ? t('inv_form_edit') : t('inv_form_add')

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          {t('cancel')}
        </Button>
      )}
      <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? t('loading') : t('inv_form_save')}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>
        <div className="space-y-2">
          <Label htmlFor="item_name" className="text-expresso">{t('inv_form_name')} <span className="text-red-500">*</span></Label>
          <Input 
            id="item_name" 
            placeholder={t('inv_form_name_placeholder')} 
            {...register('item_name')}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
          {errors.item_name && <p className="text-red-500 text-xs font-medium">{errors.item_name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-expresso">{t('inv_form_category')}</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder={t('inv_form_select_cat')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green_coffee">{t('inv_form_cat_green')}</SelectItem>
                    <SelectItem value="merch">{t('inv_form_cat_merch')}</SelectItem>
                    <SelectItem value="equipment">{t('inv_form_cat_equipment')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && <p className="text-red-500 text-xs font-medium">{errors.category.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost_per_kg" className="text-expresso">{t('inv_form_cost')}</Label>
            <Input 
              id="cost_per_kg" 
              type="number"
              step="0.01"
              placeholder="0.00" 
              {...register('cost_per_kg', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
            />
            {errors.cost_per_kg && <p className="text-red-500 text-xs font-medium">{errors.cost_per_kg.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_grams" className="text-expresso">
            {category === 'green_coffee' ? t('inv_form_raw_stock') : t('inv_form_quantity')} <span className="text-red-500">*</span>
          </Label>
          <Input 
            id="stock_grams" 
            type="number"
            placeholder={category === 'green_coffee' ? "e.g. 20000" : "e.g. 50"}
            {...register('stock_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
          {errors.stock_grams && <p className="text-red-500 text-xs font-medium">{errors.stock_grams.message}</p>}
          
          {category === 'green_coffee' && !Number.isNaN(rawGrams) && rawGrams > 0 && (
            <p className="text-xs text-expresso/70 font-medium">
              {t('inv_form_yield_est').replace('{loss}', roastLossPercentage.toString())} <span className="text-coffee-fruit font-bold">{(estimatedRoastedYield / 1000).toFixed(2)} kg</span>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-expresso">{t('inv_form_notes')}</Label>
          <Input 
            id="notes" 
            placeholder={t('inv_form_notes_placeholder')} 
            {...register('notes')}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
          {errors.notes && <p className="text-red-500 text-xs font-medium">{errors.notes.message}</p>}
        </div>
      </FormCard>
    </form>
  )
}
