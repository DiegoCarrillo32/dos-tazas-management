'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createInventoryItem, updateInventoryItem } from '@/actions/inventory'
import type { InventoryRecord, UserSettingsRecord } from '@/types'

interface InventoryFormProps {
  initialData?: InventoryRecord
  settings?: UserSettingsRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function InventoryForm({ initialData, settings, onSuccess, onCancel, inline = false }: InventoryFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [itemName, setItemName] = useState(initialData?.item_name || '')
  const [category, setCategory] = useState(initialData?.category || 'green_coffee')
  const [stockGrams, setStockGrams] = useState<number | ''>(initialData?.stock_grams || '')
  const [costPerKg, setCostPerKg] = useState<number | ''>(initialData?.cost_per_kg || '')
  const [notes, setNotes] = useState(initialData?.notes || '')

  const roastLossPercentage = settings?.roast_loss_percentage ?? 20
  const lossRatio = 1 - (roastLossPercentage / 100)

  // Calculate estimated yield immediately for the UI
  const rawGrams = Number(stockGrams) || 0
  const estimatedRoastedYield = Math.floor(rawGrams * lossRatio)

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(null)

    if (!itemName || stockGrams === '') {
      setError('Item name and stock amount are required.')
      return
    }

    startTransition(async () => {
      try {
        const payload = {
          item_name: itemName,
          category,
          stock_grams: Number(stockGrams),
          cost_per_kg: costPerKg ? Number(costPerKg) : null,
          notes: notes || null
        }

        if (initialData?.id) {
          await updateInventoryItem(initialData.id, payload)
        } else {
          await createInventoryItem(payload)
        }

        if (onSuccess) onSuccess()
        
        if (!onSuccess && !initialData) {
          setItemName('')
          setCategory('green_coffee')
          setStockGrams('')
          setCostPerKg('')
          setNotes('')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save inventory item')
      }
    })
  }

  const Wrapper = inline ? 'div' : Card
  const HeaderWrapper = inline ? 'div' : CardHeader
  const ContentWrapper = inline ? 'div' : CardContent
  const FooterWrapper = inline ? 'div' : CardFooter

  return (
    <Wrapper className={inline ? "space-y-4 p-4 border border-dashed border-warm-roast/30 rounded-lg bg-expresso/5" : "w-full shadow-lg border-warm-roast/20"}>
      <HeaderWrapper className={inline ? "pb-2 border-b border-warm-roast/10 mb-4" : "bg-white-pergamino border-b border-warm-roast/10 px-6 py-5 m-0"}>
        <CardTitle className={`${inline ? "text-lg" : "text-xl"} font-heading text-expresso`}>
          {initialData ? 'Edit Inventory Item' : 'Add Inventory Item'}
        </CardTitle>
      </HeaderWrapper>
      
      {inline ? (
        <div onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit(e)
          }
        }}>
          <FormContent 
            error={error} itemName={itemName} setItemName={setItemName}
            category={category} setCategory={setCategory}
            stockGrams={stockGrams} setStockGrams={setStockGrams}
            costPerKg={costPerKg} setCostPerKg={setCostPerKg}
            notes={notes} setNotes={setNotes}
            estimatedRoastedYield={estimatedRoastedYield}
            roastLossPercentage={roastLossPercentage}
            ContentWrapper={ContentWrapper}
            inline={inline}
          />
          <FormFooter 
            onCancel={onCancel} isPending={isPending} 
            handleSubmit={handleSubmit} inline={inline} 
            FooterWrapper={FooterWrapper}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col">
          <FormContent 
            error={error} itemName={itemName} setItemName={setItemName}
            category={category} setCategory={setCategory}
            stockGrams={stockGrams} setStockGrams={setStockGrams}
            costPerKg={costPerKg} setCostPerKg={setCostPerKg}
            notes={notes} setNotes={setNotes}
            estimatedRoastedYield={estimatedRoastedYield}
            roastLossPercentage={roastLossPercentage}
            ContentWrapper={ContentWrapper}
            inline={inline}
          />
          <FormFooter 
            onCancel={onCancel} isPending={isPending} 
            handleSubmit={handleSubmit} inline={inline} 
            FooterWrapper={FooterWrapper}
            isNativeForm={true}
          />
        </form>
      )}
    </Wrapper>
  )
}

interface FormContentProps {
  error: string | null
  itemName: string
  setItemName: (val: string) => void
  category: string
  setCategory: (val: string) => void
  stockGrams: number | ''
  setStockGrams: (val: number | '') => void
  costPerKg: number | ''
  setCostPerKg: (val: number | '') => void
  notes: string
  setNotes: (val: string) => void
  estimatedRoastedYield: number
  roastLossPercentage: number
  ContentWrapper: React.ElementType
  inline: boolean
}

function FormContent({ 
  error, itemName, setItemName, category, setCategory, stockGrams, setStockGrams, 
  costPerKg, setCostPerKg, notes, setNotes, estimatedRoastedYield, roastLossPercentage, ContentWrapper, inline
}: FormContentProps) {
  return (
    <ContentWrapper className={inline ? "space-y-3" : "space-y-4 px-6 pb-6 pt-4 m-0"}>
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
      
      <div className="space-y-2">
        <Label htmlFor="item_name" className="text-expresso">Item Name / Origin <span className="text-red-500">*</span></Label>
        <Input 
          id="item_name" 
          placeholder="e.g. Green Beans - Finca El Paraiso" 
          value={itemName} 
          onChange={(e) => setItemName(e.target.value)}
          className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-expresso">Category</Label>
          <Select value={category} onValueChange={(val) => setCategory(val || 'green_coffee')}>
            <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="green_coffee">Green Coffee</SelectItem>
              <SelectItem value="merch">Merchandise</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_per_kg" className="text-expresso">Cost per kg ($)</Label>
          <Input 
            id="cost_per_kg" 
            type="number"
            step="0.01"
            placeholder="0.00" 
            value={costPerKg} 
            onChange={(e) => setCostPerKg(e.target.value ? Number(e.target.value) : '')}
            className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stock_grams" className="text-expresso">
          {category === 'green_coffee' ? 'Raw Stock (grams)' : 'Quantity'} <span className="text-red-500">*</span>
        </Label>
        <Input 
          id="stock_grams" 
          type="number"
          placeholder={category === 'green_coffee' ? "e.g. 20000" : "e.g. 50"}
          value={stockGrams} 
          onChange={(e) => setStockGrams(e.target.value ? Number(e.target.value) : '')}
          className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          required
        />
        {category === 'green_coffee' && stockGrams !== '' && (
          <p className="text-xs text-expresso/70 font-medium">
            Estimated Roasted Yield (-{roastLossPercentage}% loss): <span className="text-coffee-fruit font-bold">{(estimatedRoastedYield / 1000).toFixed(2)} kg</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-expresso">Notes (Origin details, etc.)</Label>
        <Input 
          id="notes" 
          placeholder="e.g. Washed process, harvest 2026" 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)}
          className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
        />
      </div>
    </ContentWrapper>
  )
}

interface FormFooterProps {
  onCancel?: () => void
  isPending: boolean
  handleSubmit: (e: React.SyntheticEvent) => void
  inline: boolean
  FooterWrapper: React.ElementType
  isNativeForm?: boolean
}

function FormFooter({ onCancel, isPending, handleSubmit, inline, FooterWrapper, isNativeForm = false }: FormFooterProps) {
  return (
    <FooterWrapper className={inline ? "flex justify-end gap-2 mt-4" : "flex justify-end gap-3 border-t border-warm-roast/10 bg-expresso/5 p-4 m-0"}>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          Cancel
        </Button>
      )}
      {isNativeForm ? (
        <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
          {isPending ? 'Saving...' : 'Save Item'}
        </Button>
      ) : (
        <Button type="button" onClick={handleSubmit} size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
          {isPending ? 'Saving...' : 'Save Item'}
        </Button>
      )}
    </FooterWrapper>
  )
}
