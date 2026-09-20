'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { bagTypeSchema } from '@/lib/schemas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FormCard } from '@/components/ui/form-card'
import type { BagTypeRecord } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useCreateBagType, useUpdateBagType } from '@/hooks/queries'
import { toast } from 'sonner'

type BagTypeFormValues = z.infer<typeof bagTypeSchema>

interface BagTypeFormProps {
  initialData?: BagTypeRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function BagTypeForm({ initialData, onSuccess, onCancel, inline = false }: BagTypeFormProps) {
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BagTypeFormValues>({
    resolver: zodResolver(bagTypeSchema),
    defaultValues: {
      name: initialData?.name || '',
      size_grams: initialData?.size_grams ?? undefined,
      cost: initialData?.cost ?? 0,
    }
  })

  const createMutation = useCreateBagType()
  const updateMutation = useUpdateBagType()
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: BagTypeFormValues) => {
    const payload = {
      name: data.name,
      size_grams: data.size_grams || null,
      cost: data.cost,
    }

    const onMutationSuccess = () => {
      toast.success(initialData ? t('bag_type_updated') : t('bag_type_created'))
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) {
        reset()
      }
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || t('bag_type_save_failed'))
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

  const title = initialData ? t('bag_type_edit') : t('bag_type_add')

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          {t('cancel')}
        </Button>
      )}
      <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? t('loading') : t('bag_type_save')}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-expresso">{t('bag_type_name')} <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            placeholder={t('bag_type_name_placeholder')}
            {...register('name')}
            className=""
          />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="size_grams" className="text-expresso">
              {t('bag_type_size')} <span className="text-expresso/50 font-normal text-xs ml-1">{t('order_form_optional')}</span>
            </Label>
            <Input
              id="size_grams"
              type="number"
              step="1"
              min="0"
              placeholder="e.g. 250"
              {...register('size_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className=""
            />
            {errors.size_grams && <p className="text-red-500 text-xs font-medium">{errors.size_grams.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost" className="text-expresso">{t('bag_type_cost')} <span className="text-red-500">*</span></Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              {...register('cost', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className=""
            />
            {errors.cost && <p className="text-red-500 text-xs font-medium">{errors.cost.message}</p>}
          </div>
        </div>
      </FormCard>
    </form>
  )
}
