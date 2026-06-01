'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormCard } from '@/components/ui/form-card'
import type { RoastBatchRecord, GreenCoffeeLotRecord } from '@/types'
import { useCreateRoastBatch, useUpdateRoastBatch, useEquipment } from '@/hooks/queries'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

const roastBatchSchema = z.object({
  equipment_id: z.string().optional().nullable(),
  green_lot_id: z.string().min(1, 'Green coffee lot is required'),
  weight_in_grams: z.number().min(1, 'Weight in must be greater than 0'),
  weight_out_grams: z.number().min(1, 'Weight out must be greater than 0'),
  roast_time_minutes: z.number().nullable().optional(),
  notes: z.string().optional(),
})

type RoastBatchFormValues = z.infer<typeof roastBatchSchema>

interface RoastBatchFormProps {
  initialData?: RoastBatchRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function RoastBatchForm({ initialData, onSuccess, onCancel, inline = false }: RoastBatchFormProps) {
  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<RoastBatchFormValues>({
    resolver: zodResolver(roastBatchSchema),
    defaultValues: {
      equipment_id: initialData?.equipment_id || '',
      green_lot_id: initialData?.green_lot_id || '',
      weight_in_grams: initialData?.weight_in_grams ?? ('' as unknown as number),
      weight_out_grams: initialData?.weight_out_grams ?? ('' as unknown as number),
      roast_time_minutes: initialData?.roast_time_minutes ?? ('' as unknown as number),
      notes: initialData?.notes || '',
    }
  })

  const { data: equipment } = useEquipment()
  const roasters = equipment?.filter(e => e.type === 'roaster') || []
  
  // To get green_coffee_lots, we need to fetch them. Since we don't have a global hook for all lots,
  // we might just select from `inventory` where category === 'green_coffee', and then assume the lot is the inventory item itself.
  // Wait, the schema expects `green_lot_id` which references `green_coffee_lots` table.
  // Since we don't have a global fetch for all green_coffee_lots, let's fetch them here directly.
  const [lots, setLots] = useState<(GreenCoffeeLotRecord & { inventory?: { item_name: string } | null })[]>([])

  useEffect(() => {
    async function fetchLots() {
      try {
        const res = await fetch('/api/inventory/all-lots') // Need to create this or adjust logic
        // Actually, let's just make a global lot fetcher or a simple supabase call here for simplicity,
        // since we didn't build a `/all-lots` API. I'll just use a fetch to a new endpoint I'll create.
        if (res.ok) {
          const data = await res.json()
          setLots(data)
        }
      } catch(e) {
        console.error(e)
      }
    }
    fetchLots()
  }, [])

  const createMutation = useCreateRoastBatch()
  const updateMutation = useUpdateRoastBatch()
  const isPending = createMutation.isPending || updateMutation.isPending

  // eslint-disable-next-line react-hooks/incompatible-library
  const weightIn = watch('weight_in_grams')
  const weightOut = watch('weight_out_grams')
  const yieldPercent = (weightIn && weightOut && weightIn > 0) ? ((weightOut / weightIn) * 100).toFixed(1) : null

  const onSubmit = (data: RoastBatchFormValues) => {
    const payload = {
      equipment_id: data.equipment_id || null,
      green_lot_id: data.green_lot_id,
      weight_in_grams: data.weight_in_grams,
      weight_out_grams: data.weight_out_grams,
      roast_time_minutes: data.roast_time_minutes || null,
      notes: data.notes || null,
    }

    const onMutationSuccess = () => {
      toast.success(initialData ? 'Roast updated successfully' : 'Roast logged successfully')
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) {
        reset()
      }
    }

    const onMutationError = (err: Error) => {
      toast.error(err.message || 'Failed to save roast')
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

  const title = initialData ? 'Edit Roast Log' : 'Log New Roast'

  const footer = (
    <>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          Cancel
        </Button>
      )}
      <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
        {isPending ? 'Saving...' : 'Save Roast'}
      </Button>
    </>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="w-full">
      <FormCard inline={inline} title={title} footer={footer}>
        
        <div className="space-y-2">
          <Label htmlFor="green_lot_id" className="text-expresso">Green Coffee Lot <span className="text-red-500">*</span></Label>
          <Controller
            control={control}
            name="green_lot_id"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                  <SelectValue placeholder="Select green coffee lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.length === 0 ? (
                    <SelectItem value="none" disabled>No lots available</SelectItem>
                  ) : (
                    lots.map(lot => (
                      <SelectItem key={lot.id} value={lot.id}>{lot.name} ({lot.inventory?.item_name || 'Unknown'})</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          />
          {errors.green_lot_id && <p className="text-red-500 text-xs font-medium">{errors.green_lot_id.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="equipment_id" className="text-expresso">Roaster</Label>
            <Controller
              control={control}
              name="equipment_id"
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
                    <SelectValue placeholder="Select roaster" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {roasters.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roast_time_minutes" className="text-expresso">Roast Time (min)</Label>
            <Input 
              id="roast_time_minutes" 
              type="number"
              step="0.1"
              placeholder="e.g. 12.5" 
              {...register('roast_time_minutes', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className=""
            />
            {errors.roast_time_minutes && <p className="text-red-500 text-xs font-medium">{errors.roast_time_minutes.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="weight_in_grams" className="text-expresso">Weight In (g) <span className="text-red-500">*</span></Label>
            <Input 
              id="weight_in_grams" 
              type="number"
              placeholder="e.g. 15000" 
              {...register('weight_in_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className=""
            />
            {errors.weight_in_grams && <p className="text-red-500 text-xs font-medium">{errors.weight_in_grams.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight_out_grams" className="text-expresso">Weight Out (g) <span className="text-red-500">*</span></Label>
            <Input 
              id="weight_out_grams" 
              type="number"
              placeholder="e.g. 12000" 
              {...register('weight_out_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
              className=""
            />
            {errors.weight_out_grams && <p className="text-red-500 text-xs font-medium">{errors.weight_out_grams.message}</p>}
            {yieldPercent && (
              <p className="text-xs text-expresso/70 mt-1">
                Yield: <span className="font-bold text-coffee-fruit">{yieldPercent}%</span>
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-expresso">Roast Notes</Label>
          <Input 
            id="notes" 
            placeholder="e.g. First crack at 9:00, development 20%" 
            {...register('notes')}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
          {errors.notes && <p className="text-red-500 text-xs font-medium">{errors.notes.message}</p>}
        </div>
      </FormCard>
    </form>
  )
}
