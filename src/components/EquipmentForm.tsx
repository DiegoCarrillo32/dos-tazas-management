'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { equipmentSchema } from '@/lib/schemas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormCard } from '@/components/ui/form-card'
import type { EquipmentRecord } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useCreateEquipment, useUpdateEquipment } from '@/hooks/queries'
import { toast } from 'sonner'



type EquipmentFormValues = z.infer<typeof equipmentSchema>

interface EquipmentFormProps {
  initialData?: EquipmentRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function EquipmentForm({ initialData, onSuccess, onCancel, inline = false }: EquipmentFormProps) {
  const { t } = useTranslation()

  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<EquipmentFormValues>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'roaster',
      manufacturer: initialData?.manufacturer || '',
      model: initialData?.model || '',
      purchase_date: initialData?.purchase_date || '',
    }
  })

  const createMutation = useCreateEquipment()
  const updateMutation = useUpdateEquipment()
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: EquipmentFormValues) => {
    const payload = {
      name: data.name,
      type: data.type,
      manufacturer: data.manufacturer || null,
      model: data.model || null,
      purchase_date: data.purchase_date || null
    }

    const onMutationSuccess = () => {
      toast.success(initialData ? 'Equipment updated successfully' : 'Equipment added successfully')
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) {
        reset()
      }
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || 'Failed to save equipment')
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

  const title = initialData ? 'Edit Equipment' : 'Add Equipment'

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          {t('cancel')}
        </Button>
      )}
      <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? t('loading') : 'Save Equipment'}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-expresso">Name <span className="text-red-500">*</span></Label>
          <Input 
            id="name" 
            placeholder="e.g. Main Roaster" 
            {...register('name')}
            className=""
          />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-expresso">Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="roaster">Roaster</SelectItem>
                    <SelectItem value="espresso_machine">Espresso Machine</SelectItem>
                    <SelectItem value="grinder">Grinder</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && <p className="text-red-500 text-xs font-medium">{errors.type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_date" className="text-expresso">Purchase Date</Label>
            <Input 
              id="purchase_date" 
              type="date"
              {...register('purchase_date')}
              className=""
            />
            {errors.purchase_date && <p className="text-red-500 text-xs font-medium">{errors.purchase_date.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="manufacturer" className="text-expresso">Manufacturer</Label>
            <Input 
              id="manufacturer" 
              placeholder="e.g. Probat" 
              {...register('manufacturer')}
              className=""
            />
            {errors.manufacturer && <p className="text-red-500 text-xs font-medium">{errors.manufacturer.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className="text-expresso">Model</Label>
            <Input 
              id="model" 
              placeholder="e.g. P12" 
              {...register('model')}
              className=""
            />
            {errors.model && <p className="text-red-500 text-xs font-medium">{errors.model.message}</p>}
          </div>
        </div>
      </FormCard>
    </form>
  )
}
