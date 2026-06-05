'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { customerSchema } from '@/lib/schemas'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FormCard } from '@/components/ui/form-card'
import type { CustomerRecord } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/queries'
import { toast } from 'sonner'



type CustomerFormValues = z.infer<typeof customerSchema>

interface CustomerFormProps {
  initialData?: CustomerRecord
  onSuccess?: (customer: CustomerRecord) => void
  onCancel?: () => void
  inline?: boolean
}

export function CustomerForm({ initialData, onSuccess, onCancel, inline = false }: CustomerFormProps) {
  const { t } = useTranslation()

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      full_name: initialData?.full_name || '',
      phone: initialData?.phone || '',
      address: initialData?.address || '',
    }
  })

  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: CustomerFormValues) => {
    const payload = {
      full_name: data.full_name,
      phone: data.phone || null,
      address: data.address || null
    }

    const onMutationSuccess = (savedCustomer: CustomerRecord) => {
      toast.success(initialData ? 'Customer updated successfully' : 'Customer created successfully')
      if (onSuccess) onSuccess(savedCustomer)
      if (!onSuccess && !initialData) {
        reset()
      }
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || 'Failed to save customer')
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

  const title = initialData?.id ? t('cust_form_edit') : t('cust_form_add')

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          {t('cancel')}
        </Button>
      )}
      <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? t('loading') : t('cust_form_save')}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-expresso">{t('cust_form_full_name')} <span className="text-red-500">*</span></Label>
          <Input 
            id="full_name" 
            placeholder="e.g. John Doe" 
            {...register('full_name')}
            className=""
          />
          {errors.full_name && <p className="text-red-500 text-xs font-medium">{errors.full_name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-expresso">{t('cust_form_phone')}</Label>
          <Input 
            id="phone" 
            placeholder="e.g. +1 234 567 8900" 
            {...register('phone')}
            className=""
          />
          {errors.phone && <p className="text-red-500 text-xs font-medium">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="text-expresso">{t('cust_form_address')}</Label>
          <Input 
            id="address" 
            placeholder="e.g. 123 Coffee St, Bean City" 
            {...register('address')}
            className=""
          />
          {errors.address && <p className="text-red-500 text-xs font-medium">{errors.address.message}</p>}
        </div>
      </FormCard>
    </form>
  )
}
