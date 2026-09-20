'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { settingsSchema } from '@/lib/schemas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSettings } from '@/actions/settings'
import { updateMyWorkerName } from '@/actions/team'
import type { UserSettingsRecord } from '@/types'
import { Save, Building2, DollarSign, Globe, Coins, SunMoon, User, Scale, Clock } from 'lucide-react'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { Language } from '@/i18n/dictionaries'
import { useTheme } from '@/providers/ThemeProvider'
import { roastYieldPercentage, roastLossPercentage, laborCostPerRoast, laborCostPerGram } from '@/utils/calculations'
import { toast } from 'sonner'



type SettingsFormValues = z.infer<typeof settingsSchema>

export function SettingsForm({ initialData, userRole = 'roaster', workerName = '' }: { initialData: UserSettingsRecord, userRole?: string, workerName?: string }) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useTranslation()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      business_name: initialData.business_name || '',
      currency_symbol: initialData.currency_symbol || '₡',
      cost_per_bag: initialData.cost_per_bag ?? 0,
      cost_per_sticker: initialData.cost_per_sticker ?? 0,
      cost_electricity: initialData.cost_electricity_per_order ?? 0,
      cost_fuel: initialData.cost_fuel_per_order ?? 0,
      roaster_capacity_grams: initialData.roaster_capacity_grams ?? 1200,
      green_input_per_roast_grams: initialData.green_input_per_roast_grams ?? 960,
      roasted_output_per_roast_grams: initialData.roasted_output_per_roast_grams ?? 760,
      labor_hourly_rate: initialData.labor_hourly_rate ?? 1600,
      roasts_per_hour: initialData.roasts_per_hour ?? 3,
      worker_name: workerName,
    }
  })

  // Live readouts — recompute from the watched inputs so the roaster sees
  // yield/loss and labor cost update as they type, before saving.
  const watchedGreenInput = watch('green_input_per_roast_grams')
  const watchedRoastedOutput = watch('roasted_output_per_roast_grams')
  const watchedHourlyRate = watch('labor_hourly_rate')
  const watchedRoastsPerHour = watch('roasts_per_hour')

  const roasterSpec = {
    green_input_per_roast_grams: watchedGreenInput || 0,
    roasted_output_per_roast_grams: watchedRoastedOutput || 0,
  }
  const laborSpec = {
    labor_hourly_rate: watchedHourlyRate || 0,
    roasts_per_hour: watchedRoastsPerHour || 0,
    roasted_output_per_roast_grams: watchedRoastedOutput || 0,
  }
  const liveYield = roastYieldPercentage(roasterSpec)
  const liveLoss = roastLossPercentage(roasterSpec)
  const liveLaborPerRoast = laborCostPerRoast(laborSpec)
  const liveLaborPerKg = laborCostPerGram(laborSpec) * 1000

  const onSubmit = (data: SettingsFormValues) => {
    startTransition(async () => {
      try {
        if (userRole !== 'worker') {
          await updateSettings({
            business_name: data.business_name || null,
            currency_symbol: data.currency_symbol || '₡',
            cost_per_bag: data.cost_per_bag,
            cost_per_sticker: data.cost_per_sticker,
            cost_electricity_per_order: data.cost_electricity,
            cost_fuel_per_order: data.cost_fuel,
            roaster_capacity_grams: data.roaster_capacity_grams,
            green_input_per_roast_grams: data.green_input_per_roast_grams,
            roasted_output_per_roast_grams: data.roasted_output_per_roast_grams,
            labor_hourly_rate: data.labor_hourly_rate,
            roasts_per_hour: data.roasts_per_hour
          })
        }

        if (userRole === 'worker' && data.worker_name !== undefined) {
          await updateMyWorkerName(data.worker_name)
        }

        toast.success(t('settings_success'))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update settings')
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
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 px-6 py-6">
          {userRole !== 'worker' && (
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-expresso flex items-center gap-2">
                <Building2 className="h-4 w-4 text-warm-roast" />
                {t('settings_business_name')}
              </Label>
              <Input 
                id="business_name" 
                placeholder={t('settings_business_name_placeholder')} 
                {...register('business_name')}
                className="max-w-md"
              />
              {errors.business_name && <p className="text-red-500 text-xs">{errors.business_name.message}</p>}
              <p className="text-xs text-expresso/60">{t('settings_business_name_hint')}</p>
            </div>
          )}

          {userRole === 'worker' && (
            <div className="space-y-2 mb-6">
              <Label htmlFor="worker_name" className="text-expresso flex items-center gap-2">
                <User className="h-4 w-4 text-warm-roast" />
                Your Name
              </Label>
              <Input 
                id="worker_name" 
                placeholder="Enter your name" 
                {...register('worker_name')}
                className="max-w-md"
              />
              {errors.worker_name && <p className="text-red-500 text-xs">{errors.worker_name.message}</p>}
              <p className="text-xs text-expresso/60">This name will be displayed on the team roster and timesheets.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userRole !== 'worker' && (
              <div className="space-y-2">
                <Label htmlFor="currency_symbol" className="text-expresso flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-warm-roast" />
                  {t('settings_currency')}
                </Label>
                <Input
                  id="currency_symbol"
                  placeholder="₡"
                  maxLength={3}
                  {...register('currency_symbol')}
                  className="max-w-[120px]"
                />
                {errors.currency_symbol && <p className="text-red-500 text-xs">{errors.currency_symbol.message}</p>}
                <p className="text-xs text-expresso/60">
                  {t('settings_currency_hint')}
                </p>
              </div>
            )}
            
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

            <div className="space-y-2">
              <Label htmlFor="app_theme" className="text-expresso flex items-center gap-2">
                <SunMoon className="h-4 w-4 text-warm-roast" />
                {t('settings_theme')}
              </Label>
              <Select value={theme} onValueChange={(val) => setTheme(val as "light" | "dark" | "system")}>
                <SelectTrigger className="border-warm-roast/30 focus:ring-coffee-fruit w-full md:max-w-[180px]">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('settings_theme_light')}</SelectItem>
                  <SelectItem value="dark">{t('settings_theme_dark')}</SelectItem>
                  <SelectItem value="system">{t('settings_theme_system')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-expresso/60">
                {t('settings_theme_hint')}
              </p>
            </div>
          </div>

          {userRole !== 'worker' && (
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
                    {...register('cost_per_bag', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.cost_per_bag && <p className="text-red-500 text-xs">{errors.cost_per_bag.message}</p>}
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
                    {...register('cost_per_sticker', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.cost_per_sticker && <p className="text-red-500 text-xs">{errors.cost_per_sticker.message}</p>}
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
                    {...register('cost_electricity', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.cost_electricity && <p className="text-red-500 text-xs">{errors.cost_electricity.message}</p>}
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
                    {...register('cost_fuel', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.cost_fuel && <p className="text-red-500 text-xs">{errors.cost_fuel.message}</p>}
                  <p className="text-xs text-expresso/60">{t('settings_cost_hint')}</p>
                </div>
              </div>
            </div>
          )}

          {userRole !== 'worker' && (
            <div className="border-t border-warm-roast/10 pt-6 mt-6">
              <h3 className="text-lg font-heading text-expresso flex items-center gap-2">
                <Scale className="h-5 w-5 text-warm-roast" />
                {t('settings_roaster_title')}
              </h3>
              <p className="text-xs text-expresso/60 mb-4">{t('settings_roaster_subtitle')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="roaster_capacity_grams" className="text-expresso flex items-center gap-2">
                    <Scale className="h-4 w-4 text-warm-roast" />
                    {t('settings_roaster_capacity')}
                  </Label>
                  <Input
                    id="roaster_capacity_grams"
                    type="number"
                    step="1"
                    min="1"
                    {...register('roaster_capacity_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.roaster_capacity_grams && <p className="text-red-500 text-xs">{errors.roaster_capacity_grams.message}</p>}
                  <p className="text-xs text-expresso/60">{t('settings_roaster_capacity_hint')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="green_input_per_roast_grams" className="text-expresso flex items-center gap-2">
                    <Scale className="h-4 w-4 text-warm-roast" />
                    {t('settings_roaster_green_input')}
                  </Label>
                  <Input
                    id="green_input_per_roast_grams"
                    type="number"
                    step="1"
                    min="1"
                    {...register('green_input_per_roast_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.green_input_per_roast_grams && <p className="text-red-500 text-xs">{errors.green_input_per_roast_grams.message}</p>}
                  <p className="text-xs text-expresso/60">{t('settings_roaster_green_input_hint')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roasted_output_per_roast_grams" className="text-expresso flex items-center gap-2">
                    <Scale className="h-4 w-4 text-warm-roast" />
                    {t('settings_roaster_roasted_output')}
                  </Label>
                  <Input
                    id="roasted_output_per_roast_grams"
                    type="number"
                    step="1"
                    min="1"
                    {...register('roasted_output_per_roast_grams', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.roasted_output_per_roast_grams && <p className="text-red-500 text-xs">{errors.roasted_output_per_roast_grams.message}</p>}
                  <p className="text-xs text-expresso/60">{t('settings_roaster_roasted_output_hint')}</p>
                </div>
              </div>

              <p className="text-sm text-coffee-fruit font-medium mt-4">
                {t('settings_roaster_derived')
                  .replace('{yield}', liveYield.toFixed(1))
                  .replace('{loss}', liveLoss.toFixed(1))}
              </p>
            </div>
          )}

          {userRole !== 'worker' && (
            <div className="border-t border-warm-roast/10 pt-6 mt-6">
              <h3 className="text-lg font-heading text-expresso flex items-center gap-2">
                <Clock className="h-5 w-5 text-warm-roast" />
                {t('settings_labor_title')}
              </h3>
              <p className="text-xs text-expresso/60 mb-4">{t('settings_labor_subtitle')}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="labor_hourly_rate" className="text-expresso flex items-center gap-2">
                    <Coins className="h-4 w-4 text-warm-roast" />
                    {t('settings_labor_hourly_rate')}
                  </Label>
                  <Input
                    id="labor_hourly_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('labor_hourly_rate', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.labor_hourly_rate && <p className="text-red-500 text-xs">{errors.labor_hourly_rate.message}</p>}
                  <p className="text-xs text-expresso/60">{t('settings_labor_hourly_rate_hint')}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roasts_per_hour" className="text-expresso flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warm-roast" />
                    {t('settings_labor_roasts_per_hour')}
                  </Label>
                  <Input
                    id="roasts_per_hour"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register('roasts_per_hour', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                    className="max-w-[150px]"
                  />
                  {errors.roasts_per_hour && <p className="text-red-500 text-xs">{errors.roasts_per_hour.message}</p>}
                  <p className="text-xs text-expresso/60">{t('settings_labor_roasts_per_hour_hint')}</p>
                </div>
              </div>

              <p className="text-sm text-coffee-fruit font-medium mt-4">
                {t('settings_labor_derived')
                  .replace('{perRoast}', liveLaborPerRoast.toFixed(2))
                  .replace('{perKg}', liveLaborPerKg.toFixed(2))}
              </p>
            </div>
          )}
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
