'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { InventoryRecord, UserSettingsRecord } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useCreateInventoryItem, useUpdateInventoryItem } from '@/hooks/queries'

interface InventoryFormProps {
  initialData?: InventoryRecord
  settings?: UserSettingsRecord
  onSuccess?: () => void
  onCancel?: () => void
  inline?: boolean
}

export function InventoryForm({ initialData, settings, onSuccess, onCancel, inline = false }: InventoryFormProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  
  const [itemName, setItemName] = useState(initialData?.item_name || '')
  const [category, setCategory] = useState(initialData?.category || 'green_coffee')
  const [stockGrams, setStockGrams] = useState<number | ''>(initialData?.stock_grams || '')
  const [costPerKg, setCostPerKg] = useState<number | ''>(initialData?.cost_per_kg || '')
  const [notes, setNotes] = useState(initialData?.notes || '')

  const createMutation = useCreateInventoryItem()
  const updateMutation = useUpdateInventoryItem()
  const isPending = createMutation.isPending || updateMutation.isPending

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

    const payload = {
      item_name: itemName,
      category,
      stock_grams: Number(stockGrams),
      cost_per_kg: costPerKg ? Number(costPerKg) : null,
      notes: notes || null
    }

    const onMutationSuccess = () => {
      if (onSuccess) onSuccess()
      if (!onSuccess && !initialData) {
        setItemName('')
        setCategory('green_coffee')
        setStockGrams('')
        setCostPerKg('')
        setNotes('')
      }
    }

    const onMutationError = (err: Error) => {
      setError(err.message || 'Failed to save inventory item')
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

  const Wrapper = inline ? 'div' : Card
  const HeaderWrapper = inline ? 'div' : CardHeader
  const ContentWrapper = inline ? 'div' : CardContent
  const FooterWrapper = inline ? 'div' : CardFooter

  return (
    <Wrapper className={inline ? "space-y-4 p-4 border border-dashed border-warm-roast/30 rounded-lg bg-expresso/5" : "w-full shadow-lg border-warm-roast/20"}>
      <HeaderWrapper className={inline ? "pb-2 border-b border-warm-roast/10 mb-4" : "bg-white-pergamino border-b border-warm-roast/10 px-6 py-5 m-0"}>
        <CardTitle className={`${inline ? "text-lg" : "text-xl"} font-heading text-expresso`}>
          {initialData ? t('inv_form_edit') : t('inv_form_add')}
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
  const { t } = useTranslation()
  return (
    <ContentWrapper className={inline ? "space-y-3" : "space-y-4 px-6 pb-6 pt-4 m-0"}>
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
      
      <div className="space-y-2">
        <Label htmlFor="item_name" className="text-expresso">{t('inv_form_name')} <span className="text-red-500">*</span></Label>
        <Input 
          id="item_name" 
          placeholder={t('inv_form_name_placeholder')} 
          value={itemName} 
          onChange={(e) => setItemName(e.target.value)}
          className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-expresso">{t('inv_form_category')}</Label>
          <Select value={category} onValueChange={(val) => setCategory(val || 'green_coffee')}>
            <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit">
              <SelectValue placeholder={t('inv_form_select_cat')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="green_coffee">{t('inv_form_cat_green')}</SelectItem>
              <SelectItem value="merch">{t('inv_form_cat_merch')}</SelectItem>
              <SelectItem value="equipment">{t('inv_form_cat_equipment')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost_per_kg" className="text-expresso">{t('inv_form_cost')}</Label>
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
          {category === 'green_coffee' ? t('inv_form_raw_stock') : t('inv_form_quantity')} <span className="text-red-500">*</span>
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
            {t('inv_form_yield_est').replace('{loss}', roastLossPercentage.toString())} <span className="text-coffee-fruit font-bold">{(estimatedRoastedYield / 1000).toFixed(2)} kg</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-expresso">{t('inv_form_notes')}</Label>
        <Input 
          id="notes" 
          placeholder={t('inv_form_notes_placeholder')} 
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
  const { t } = useTranslation()
  return (
    <FooterWrapper className={inline ? "flex justify-end gap-2 mt-4" : "flex justify-end gap-3 border-t border-warm-roast/10 bg-expresso/5 p-4 m-0"}>
      {onCancel && (
        <Button type="button" variant="outline" size={inline ? "sm" : "default"} onClick={onCancel} disabled={isPending} className="text-expresso">
          {t('cancel')}
        </Button>
      )}
      {isNativeForm ? (
        <Button type="submit" size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
          {isPending ? t('loading') : t('inv_form_save')}
        </Button>
      ) : (
        <Button type="button" onClick={handleSubmit} size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
          {isPending ? t('loading') : t('inv_form_save')}
        </Button>
      )}
    </FooterWrapper>
  )
}
