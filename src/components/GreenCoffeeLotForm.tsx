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



type GreenCoffeeLotFormValues = z.infer<typeof greenCoffeeLotSchema>

interface GreenCoffeeLotFormProps {
  inventoryId: string
  initialData?: GreenCoffeeLotRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function GreenCoffeeLotForm({ inventoryId, initialData, onSuccess, onCancel, inline = false }: GreenCoffeeLotFormProps) {
  const { register, handleSubmit, control, formState: { errors }, reset } = useForm<GreenCoffeeLotFormValues>({
    resolver: zodResolver(greenCoffeeLotSchema),
    defaultValues: {
      name: initialData?.name || '',
      origin: initialData?.origin || '',
      varietal: initialData?.varietal || '',
      process: initialData?.process || 'washed',
      altitude: initialData?.altitude || '',
    }
  })

  const createMutation = useCreateGreenCoffeeLot(inventoryId)
  const updateMutation = useUpdateGreenCoffeeLot(inventoryId)
  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: GreenCoffeeLotFormValues) => {
    const payload = {
      inventory_id: inventoryId,
      name: data.name,
      origin: data.origin || null,
      varietal: data.varietal || null,
      process: data.process || null,
      altitude: data.altitude || null,
    }

    const onMutationSuccess = () => {
      toast.success(initialData ? 'Lot updated successfully' : 'Lot added successfully')
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) {
        reset()
      }
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || 'Failed to save lot')
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

  const title = initialData ? 'Edit Lot Details' : 'Add Lot Details'

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          Cancel
        </Button>
      )}
      <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? 'Saving...' : 'Save Lot'}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>
        <div className="space-y-2">
          <Label htmlFor="name" className="text-expresso">Lot Name / Farm <span className="text-red-500">*</span></Label>
          <Input 
            id="name" 
            placeholder="e.g. Finca El Paraiso" 
            {...register('name')}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
          {errors.name && <p className="text-red-500 text-xs font-medium">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin" className="text-expresso">Origin (Country/Region)</Label>
            <Input 
              id="origin" 
              placeholder="e.g. Colombia, Cauca" 
              {...register('origin')}
              className=""
            />
            {errors.origin && <p className="text-red-500 text-xs font-medium">{errors.origin.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="varietal" className="text-expresso">Varietal</Label>
            <Input 
              id="varietal" 
              placeholder="e.g. Castillo, Geisha" 
              {...register('varietal')}
              className=""
            />
            {errors.varietal && <p className="text-red-500 text-xs font-medium">{errors.varietal.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="process" className="text-expresso">Process</Label>
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
            {errors.process && <p className="text-red-500 text-xs font-medium">{errors.process.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="altitude" className="text-expresso">Altitude (masl)</Label>
            <Input 
              id="altitude" 
              placeholder="e.g. 1900m" 
              {...register('altitude')}
              className=""
            />
            {errors.altitude && <p className="text-red-500 text-xs font-medium">{errors.altitude.message}</p>}
          </div>
        </div>
      </FormCard>
    </form>
  )
}
