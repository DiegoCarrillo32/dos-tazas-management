'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormCard } from '@/components/ui/form-card'
import type { MaintenanceLogRecord } from '@/types'
import { useCreateMaintenanceLog, useUpdateMaintenanceLog } from '@/hooks/queries'
import { toast } from 'sonner'

const maintenanceSchema = z.object({
  maintenance_type: z.string().min(1, 'Type is required'),
  description: z.string().min(1, 'Description is required'),
  cost: z.number().nullable().optional(),
  date: z.string().min(1, 'Date is required'),
})

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>

interface MaintenanceLogFormProps {
  equipmentId: string
  initialData?: MaintenanceLogRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function MaintenanceLogForm({ equipmentId, initialData, onSuccess, onCancel, inline = false }: MaintenanceLogFormProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenance_type: initialData?.maintenance_type || 'cleaning',
      description: initialData?.description || '',
      cost: initialData?.cost ?? ('' as unknown as number),
      date: initialData?.date || new Date().toISOString().split('T')[0],
    }
  })

  const createMutation = useCreateMaintenanceLog(equipmentId)
  const updateMutation = useUpdateMaintenanceLog(equipmentId)
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: MaintenanceFormValues) => {
    const payload = {
      equipment_id: equipmentId,
      maintenance_type: data.maintenance_type,
      description: data.description,
      cost: data.cost || null,
      date: data.date
    }

    const onMutationSuccess = () => {
      toast.success(initialData ? 'Log updated successfully' : 'Log added successfully')
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) {
        reset()
      }
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || 'Failed to save log')
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

  const title = initialData ? 'Edit Log' : 'Add Maintenance Log'

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          Cancel
        </Button>
      )}
      <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? 'Saving...' : 'Save Log'}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="maintenance_type" className="text-expresso">Type</Label>
            <Controller
              control={control}
              name="maintenance_type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="part_replacement">Part Replacement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.maintenance_type && <p className="text-red-500 text-xs font-medium">{errors.maintenance_type.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-expresso">Date</Label>
            <Input 
              id="date" 
              type="date"
              {...register('date')}
              className=""
            />
            {errors.date && <p className="text-red-500 text-xs font-medium">{errors.date.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-expresso">Description <span className="text-red-500">*</span></Label>
          <Input 
            id="description" 
            placeholder="e.g. Descaled boiler" 
            {...register('description')}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
          {errors.description && <p className="text-red-500 text-xs font-medium">{errors.description.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost" className="text-expresso">Cost ($)</Label>
          <Input 
            id="cost" 
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('cost', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
          {errors.cost && <p className="text-red-500 text-xs font-medium">{errors.cost.message}</p>}
        </div>
      </FormCard>
    </form>
  )
}
