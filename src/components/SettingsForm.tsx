'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateSettings } from '@/actions/settings'
import type { UserSettingsRecord } from '@/types'
import { Save, Building2, Percent, DollarSign } from 'lucide-react'

export function SettingsForm({ initialData }: { initialData: UserSettingsRecord }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)

  const [businessName, setBusinessName] = useState(initialData.business_name || '')
  const [roastLossPercentage, setRoastLossPercentage] = useState(initialData.roast_loss_percentage)
  const [currencySymbol, setCurrencySymbol] = useState(initialData.currency_symbol || '$')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      try {
        await updateSettings({
          business_name: businessName || null,
          roast_loss_percentage: Number(roastLossPercentage),
          currency_symbol: currencySymbol || '$'
        })
        setSuccess(true)
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update settings')
      }
    })
  }

  return (
    <Card className="max-w-2xl shadow-lg border-warm-roast/20">
      <CardHeader className="bg-white-pergamino border-b border-warm-roast/10 px-6 py-5">
        <CardTitle className="text-xl font-heading text-expresso">Business Preferences</CardTitle>
        <CardDescription className="text-expresso/70">
          Update your roasting math and application settings.
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 px-6 py-6">
          {error && <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">{error}</div>}
          {success && <div className="text-emerald-600 text-sm font-medium bg-emerald-50 p-3 rounded-md">Settings updated successfully!</div>}

          <div className="space-y-2">
            <Label htmlFor="business_name" className="text-expresso flex items-center gap-2">
              <Building2 className="h-4 w-4 text-warm-roast" />
              Business Name
            </Label>
            <Input 
              id="business_name" 
              placeholder="e.g. Dos Tazas Coffee Roasters" 
              value={businessName} 
              onChange={(e) => setBusinessName(e.target.value)}
              className="border-warm-roast/30 focus-visible:ring-coffee-fruit max-w-md"
            />
            <p className="text-xs text-expresso/60">Optional. Used for invoices and UI personalization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="roast_loss_percentage" className="text-expresso flex items-center gap-2">
                <Percent className="h-4 w-4 text-warm-roast" />
                Roasting Loss (%)
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
                Default: 20%. This automatically scales raw inventory deductions when roasted orders are created.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency_symbol" className="text-expresso flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-warm-roast" />
                Currency Symbol
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
                Default: $. Used across the dashboard for prices.
              </p>
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
            {isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
