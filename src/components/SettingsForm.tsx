'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSettings } from '@/actions/settings'
import type { UserSettingsRecord } from '@/types'
import { Save, Building2, Percent, DollarSign, Globe, Coins } from 'lucide-react'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { Language } from '@/i18n/dictionaries'

export function SettingsForm({ initialData }: { initialData: UserSettingsRecord }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const { language, setLanguage, t } = useTranslation()

  const [businessName, setBusinessName] = useState(initialData.business_name || '')
  const [roastLossPercentage, setRoastLossPercentage] = useState(initialData.roast_loss_percentage)
  const [currencySymbol, setCurrencySymbol] = useState(initialData.currency_symbol || '$')
  const [costPerBag, setCostPerBag] = useState(initialData.cost_per_bag || 0)
  const [costPerSticker, setCostPerSticker] = useState(initialData.cost_per_sticker || 0)
  const [costElectricity, setCostElectricity] = useState(initialData.cost_electricity_per_order || 0)
  const [costFuel, setCostFuel] = useState(initialData.cost_fuel_per_order || 0)
  const [costRoastingTime, setCostRoastingTime] = useState(initialData.cost_roasting_time_per_order || 0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      try {
        await updateSettings({
          business_name: businessName || null,
          roast_loss_percentage: Number(roastLossPercentage),
          currency_symbol: currencySymbol || '$',
          cost_per_bag: Number(costPerBag),
          cost_per_sticker: Number(costPerSticker),
          cost_electricity_per_order: Number(costElectricity),
          cost_fuel_per_order: Number(costFuel),
          cost_roasting_time_per_order: Number(costRoastingTime)
        })
        setSuccess(true)
        
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update settings')
      }
    })
  }

  return (
    <Card className="max-w-2xl shadow-lg border-warm-roast/20">
      <CardHeader className="bg-white-pergamino border-b border-warm-roast/10 px-6 py-5">
        <CardTitle className="text-xl font-heading text-expresso">{t('settings_title')}</CardTitle>
        <CardDescription className="text-expresso/70">
          {t('settings_subtitle')}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 px-6 py-6">
          {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">{error}</div>}
          {success && <div className="text-emerald-600 text-sm font-medium bg-emerald-50 p-3 rounded-md">{t('settings_success')}</div>}

          <div className="space-y-2">
            <Label htmlFor="business_name" className="text-expresso flex items-center gap-2">
              <Building2 className="h-4 w-4 text-warm-roast" />
              {t('settings_business_name')}
            </Label>
            <Input 
              id="business_name" 
              placeholder={t('settings_business_name_placeholder')} 
              value={businessName} 
              onChange={(e) => setBusinessName(e.target.value)}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-md"
            />
            <p className="text-xs text-expresso/60">{t('settings_business_name_hint')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="roast_loss_percentage" className="text-expresso flex items-center gap-2">
                <Percent className="h-4 w-4 text-warm-roast" />
                {t('settings_roast_loss')}
              </Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="roast_loss_percentage" 
                  type="number"
                  min="0"
                  max="100"
                  value={roastLossPercentage} 
                  onChange={(e) => setRoastLossPercentage(Number(e.target.value))}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[120px]"
                  required
                />
                <span className="text-expresso font-medium">%</span>
              </div>
              <p className="text-xs text-expresso/60">
                {t('settings_roast_loss_hint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency_symbol" className="text-expresso flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-warm-roast" />
                {t('settings_currency')}
              </Label>
              <Input 
                id="currency_symbol" 
                placeholder="$" 
                value={currencySymbol} 
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[120px]"
                maxLength={3}
                required
              />
              <p className="text-xs text-expresso/60">
                {t('settings_currency_hint')}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app_language" className="text-expresso flex items-center gap-2">
                <Globe className="h-4 w-4 text-warm-roast" />
                {t('settings_language')}
              </Label>
              <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit w-full md:max-w-[150px]">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-expresso/60">
                {t('settings_language_hint')}
              </p>
            </div>
          </div>

          <div className="border-t border-warm-roast/10 pt-6 mt-6">
            <h3 className="text-lg font-heading text-expresso flex items-center gap-2">
              <Coins className="h-5 w-5 text-warm-roast" />
              {t('settings_costs_title')}
            </h3>
            <p className="text-xs text-expresso/60 mb-4">{t('settings_costs_subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="cost_per_bag" className="text-expresso flex items-center gap-2">
                  <Coins className="h-4 w-4 text-warm-roast" />
                  {t('settings_cost_per_bag')}
                </Label>
                <Input
                  id="cost_per_bag"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerBag}
                  onChange={(e) => setCostPerBag(Number(e.target.value))}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
                />
                <p className="text-xs text-expresso/60">{t('settings_cost_hint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_sticker" className="text-expresso flex items-center gap-2">
                  <Coins className="h-4 w-4 text-warm-roast" />
                  {t('settings_cost_per_sticker')}
                </Label>
                <Input
                  id="cost_per_sticker"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerSticker}
                  onChange={(e) => setCostPerSticker(Number(e.target.value))}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
                />
                <p className="text-xs text-expresso/60">{t('settings_cost_hint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_electricity" className="text-expresso flex items-center gap-2">
                  <Coins className="h-4 w-4 text-warm-roast" />
                  {t('settings_cost_electricity')}
                </Label>
                <Input
                  id="cost_electricity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costElectricity}
                  onChange={(e) => setCostElectricity(Number(e.target.value))}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
                />
                <p className="text-xs text-expresso/60">{t('settings_cost_hint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_fuel" className="text-expresso flex items-center gap-2">
                  <Coins className="h-4 w-4 text-warm-roast" />
                  {t('settings_cost_fuel')}
                </Label>
                <Input
                  id="cost_fuel"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costFuel}
                  onChange={(e) => setCostFuel(Number(e.target.value))}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
                />
                <p className="text-xs text-expresso/60">{t('settings_cost_hint')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_roasting_time" className="text-expresso flex items-center gap-2">
                  <Coins className="h-4 w-4 text-warm-roast" />
                  {t('settings_cost_roasting_time')}
                </Label>
                <Input
                  id="cost_roasting_time"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costRoastingTime}
                  onChange={(e) => setCostRoastingTime(Number(e.target.value))}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
                />
                <p className="text-xs text-expresso/60">{t('settings_cost_hint')}</p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-expresso/5 border-t border-warm-roast/10 px-6 py-4 flex justify-end">
          <Button 
            type="submit" 
            disabled={isPending} 
            className="bg-coffee-fruit hover:bg-warm-roast text-white gap-2 px-6"
          >
            <Save className="h-4 w-4" />
            {isPending ? t('settings_saving') : t('settings_save_button')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
