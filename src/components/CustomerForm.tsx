'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { CustomerRecord } from '@/types'
import { useTranslation } from '@/i18n/LanguageProvider'
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/queries'

interface CustomerFormProps {
  initialData?: CustomerRecord
  onSuccess?: (customer: CustomerRecord) => void
  onCancel?: () => void
  inline?: boolean
}

export function CustomerForm({ initialData, onSuccess, onCancel, inline = false }: CustomerFormProps) {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  
  const [fullName, setFullName] = useState(initialData?.full_name || '')
  const [phone, setPhone] = useState(initialData?.phone || '')
  const [address, setAddress] = useState(initialData?.address || '')

  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName) {
      setError('Full name is required.')
      return
    }

    const customerData = {
      full_name: fullName,
      phone: phone || null,
      address: address || null
    }

    const onMutationSuccess = (savedCustomer: CustomerRecord) => {
      if (onSuccess) onSuccess(savedCustomer)
      if (!onSuccess) {
        setFullName('')
        setPhone('')
        setAddress('')
      }
    }

    const onMutationError = (err: Error) => {
      setError(err.message || 'Failed to save customer')
    }

    if (initialData?.id) {
      updateMutation.mutate(
        { id: initialData.id, params: customerData },
        { onSuccess: onMutationSuccess, onError: onMutationError }
      )
    } else {
      createMutation.mutate(customerData, {
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
          {initialData?.id ? t('cust_form_edit') : t('cust_form_add')}
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
            error={error} fullName={fullName} setFullName={setFullName}
            phone={phone} setPhone={setPhone}
            address={address} setAddress={setAddress}
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
            error={error} fullName={fullName} setFullName={setFullName}
            phone={phone} setPhone={setPhone}
            address={address} setAddress={setAddress}
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
  fullName: string
  setFullName: (val: string) => void
  phone: string
  setPhone: (val: string) => void
  address: string
  setAddress: (val: string) => void
  ContentWrapper: React.ElementType
  inline: boolean
}

function FormContent({ 
  error, fullName, setFullName, phone, setPhone, address, setAddress, ContentWrapper, inline 
}: FormContentProps) {
  const { t } = useTranslation()
  return (
    <ContentWrapper className={inline ? "space-y-3" : "space-y-4 px-6 pb-6 pt-4 m-0"}>
      {error && <div className="text-red-500 text-sm font-medium">{error}</div>}
      
      <div className="space-y-2">
        <Label htmlFor="full_name" className="text-expresso">{t('cust_form_full_name')} <span className="text-red-500">*</span></Label>
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
        <Label htmlFor="phone" className="text-expresso">{t('cust_form_phone')}</Label>
        <Input 
          id="phone" 
          placeholder="e.g. +1 234 567 8900" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          className="border-warm-roast/30 focus-visible:ring-coffee-fruit"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address" className="text-expresso">{t('cust_form_address')}</Label>
        <Input 
          id="address" 
          placeholder="e.g. 123 Coffee St, Bean City" 
          value={address} 
          onChange={(e) => setAddress(e.target.value)}
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
          {isPending ? t('loading') : t('cust_form_save')}
        </Button>
      ) : (
        <Button type="button" onClick={handleSubmit} size={inline ? "sm" : "default"} disabled={isPending} className="bg-coffee-fruit hover:bg-warm-roast text-white">
          {isPending ? t('loading') : t('cust_form_save')}
        </Button>
      )}
    </FooterWrapper>
  )
}
