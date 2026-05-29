'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { updateSettings } from '@/actions/settings'
import type { UserSettingsRecord } from '@/types'
import { Save, Building2, Percent, DollarSign, Globe, Coins, SunMoon } from 'lucide-react'
import { useTranslation } from '@/i18n/LanguageProvider'
import type { Language } from '@/i18n/dictionaries'
import { useTheme } from '@/providers/ThemeProvider'
import { toast } from 'sonner'

const settingsSchema = z.object({
  business_name: z.string().optional(),
  roast_loss_percentage: z.number().min(0).max(100),
  currency_symbol: z.string().max(3, 'Max 3 chars').min(1, 'Required'),
  cost_per_bag: z.number().min(0),
  cost_per_sticker: z.number().min(0),
  cost_electricity: z.number().min(0),
  cost_fuel: z.number().min(0),
  cost_roasting_time: z.number().min(0),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

export function SettingsForm({ initialData }: { initialData: UserSettingsRecord }) {
  const [isPending, startTransition] = useTransition()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useTranslation()

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      business_name: initialData.business_name || '',
      roast_loss_percentage: initialData.roast_loss_percentage ?? 20,
      currency_symbol: initialData.currency_symbol || '$',
      cost_per_bag: initialData.cost_per_bag ?? 0,
      cost_per_sticker: initialData.cost_per_sticker ?? 0,
      cost_electricity: initialData.cost_electricity_per_order ?? 0,
      cost_fuel: initialData.cost_fuel_per_order ?? 0,
      cost_roasting_time: initialData.cost_roasting_time_per_order ?? 0,
    }
  })

  const onSubmit = (data: SettingsFormValues) => {
    startTransition(async () => {
      try {
        await updateSettings({
          business_name: data.business_name || null,
          roast_loss_percentage: data.roast_loss_percentage,
          currency_symbol: data.currency_symbol || '$',
          cost_per_bag: data.cost_per_bag,
          cost_per_sticker: data.cost_per_sticker,
          cost_electricity_per_order: data.cost_electricity,
          cost_fuel_per_order: data.cost_fuel,
          cost_roasting_time_per_order: data.cost_roasting_time
        })
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
          <div className="space-y-2">
            <Label htmlFor="business_name" className="text-expresso flex items-center gap-2">
              <Building2 className="h-4 w-4 text-warm-roast" />
              {t('settings_business_name')}
            </Label>
            <Input 
              id="business_name" 
              placeholder={t('settings_business_name_placeholder')} 
              {...register('business_name')}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-md"
            />
            {errors.business_name && <p className="text-red-500 text-xs">{errors.business_name.message}</p>}
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
                  {...register('roast_loss_percentage', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[120px]"
                />
                <span className="text-expresso font-medium">%</span>
              </div>
              {errors.roast_loss_percentage && <p className="text-red-500 text-xs">{errors.roast_loss_percentage.message}</p>}
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
                maxLength={3}
                {...register('currency_symbol')}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[120px]"
              />
              {errors.currency_symbol && <p className="text-red-500 text-xs">{errors.currency_symbol.message}</p>}
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
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
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
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
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
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
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
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
                />
                {errors.cost_fuel && <p className="text-red-500 text-xs">{errors.cost_fuel.message}</p>}
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
                  {...register('cost_roasting_time', { setValueAs: (v) => v === '' ? undefined : Number(v) })}
                  className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-[150px]"
                />
                {errors.cost_roasting_time && <p className="text-red-500 text-xs">{errors.cost_roasting_time.message}</p>}
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
