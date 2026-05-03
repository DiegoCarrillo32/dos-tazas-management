'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createCustomer } from '@/actions/customers'
import type { CustomerRecord } from '@/types'

interface CustomerFormProps {
  onSuccess?: (customer: CustomerRecord) => void
  onCancel?: () => void
  inline?: boolean
}

export function CustomerForm({ onSuccess, onCancel, inline = false }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName) {
      setError('Full name is required.')
      return
    }

    startTransition(async () => {
      try {
        const newCustomer = await createCustomer({
          full_name: fullName,
          phone: phone || null,
          address: address || null
        })

        if (onSuccess) onSuccess(newCustomer)
        
        if (!onSuccess) {
          setFullName('')
          setPhone('')
          setAddress('')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save customer')
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
          New Customer
        </CardTitle>
      </HeaderWrapper>
      
      {inline ? (
        <div onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit(e)
          }
        }}>
          <ContentWrapper className="space-y-3">
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-expresso">Full Name <span className="text-red-500">*</span></Label>
              <Input 
                id="full_name" 
                placeholder="e.g. John Doe" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-expresso">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="e.g. +1 234 567 8900" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-expresso">Address</Label>
              <Input 
                id="address" 
                placeholder="e.g. 123 Coffee St, Bean City" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
              />
            </div>
          </ContentWrapper>

          <FooterWrapper className="flex justify-end gap-2 mt-4">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isPending} className="text-expresso">
                Cancel
              </Button>
            )}
            <Button type="button" onClick={handleSubmit} size="sm" disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
              {isPending ? 'Saving...' : 'Save Customer'}
            </Button>
          </FooterWrapper>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col">
          <ContentWrapper className="space-y-4 px-6 pb-6 pt-4 m-0">
            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-expresso">Full Name <span className="text-red-500">*</span></Label>
              <Input 
                id="full_name" 
                placeholder="e.g. John Doe" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-expresso">Phone Number</Label>
              <Input 
                id="phone" 
                placeholder="e.g. +1 234 567 8900" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-expresso">Address</Label>
              <Input 
                id="address" 
                placeholder="e.g. 123 Coffee St, Bean City" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
                className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
              />
            </div>
          </ContentWrapper>

          <FooterWrapper className="flex justify-end gap-3 border-t border-warm-roast/10 bg-expresso/5 p-4 m-0">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} className="text-expresso">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
              {isPending ? 'Saving...' : 'Save Customer'}
            </Button>
          </FooterWrapper>
        </form>
      )}
    </Wrapper>
  )
}
