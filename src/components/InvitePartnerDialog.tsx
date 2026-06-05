'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Plus, Check } from 'lucide-react'
import { generateInvite } from '@/actions/b2bPartners'
import { GenericModal } from '@/components/ui/GenericModal'

export function InvitePartnerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(formData: FormData) {
    setIsGenerating(true)
    setError(null)
    try {
      const companyName = formData.get('companyName') as string
      const contactName = formData.get('contactName') as string
      const contactPhone = formData.get('contactPhone') as string
      const email = formData.get('email') as string
      
      const partner = await generateInvite(
        companyName,
        contactName || null,
        contactPhone || null,
        email || null
      )
      
      setInviteCode(partner.invite_code)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate invite'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  function handleCopy() {
    if (inviteCode) {
      const origin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
      const inviteLink = `${origin}/join?code=${inviteCode}`
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <GenericModal
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setInviteCode(null)
          setError(null)
        }
      }}
      trigger={
        <Button className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-full px-4 shadow-sm transition-all">
          <Plus className="mr-2 h-4 w-4" /> Add Partner
        </Button>
      }
      contentClassName="sm:max-w-[425px] bg-white-pergamino p-4 sm:p-6 border-warm-roast/10 shadow-2xl overflow-hidden"
      hideTitle={true}
      hideFooter={true}
      title="Add B2B Partner"
    >
      <div className="text-xl font-heading text-expresso mb-4">
        Add B2B Partner
      </div>
      
      {inviteCode ? (
        <div className="py-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-2">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-expresso">Partner Added!</h3>
          <p className="text-sm text-expresso/70">
            You can now manage their custom pricing and standing orders internally. If you want them to have their own portal access, share this link with them.
          </p>
          
          <div className="mt-6 flex items-center justify-between p-3 bg-white border border-warm-roast/20 rounded-lg">
            <code className="text-coffee-fruit font-mono font-bold text-lg">{inviteCode}</code>
            <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy Link'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-4 space-y-4">
          <p className="text-sm text-expresso/70 mb-4">
            Add a new wholesale client to manage their pricing and standing orders. An optional invite link will be generated if you want to give them portal access.
          </p>
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form action={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-expresso text-xs font-bold uppercase tracking-wider">Company Name *</Label>
              <Input 
                id="companyName" 
                name="companyName" 
                required 
                placeholder="e.g. Central Perk Cafe"
                className=""
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-expresso text-xs font-bold uppercase tracking-wider">Contact Name</Label>
                <Input 
                  id="contactName" 
                  name="contactName" 
                  placeholder="e.g. Gunther"
                  className=""
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-expresso text-xs font-bold uppercase tracking-wider">Phone</Label>
                <Input 
                  id="contactPhone" 
                  name="contactPhone" 
                  placeholder="e.g. 555-0123"
                  className=""
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-expresso text-xs font-bold uppercase tracking-wider">Email Address (Optional)</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                placeholder="e.g. orders@centralperk.com"
                className=""
              />
            </div>
            
            <div className="pt-4 border-t border-warm-roast/10 flex justify-end gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="text-expresso/60 hover:text-expresso hover:bg-warm-roast/10"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isGenerating}
                className="bg-coffee-fruit hover:bg-warm-roast text-white rounded-xl shadow-sm"
              >
                {isGenerating ? 'Adding...' : 'Add Partner'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </GenericModal>
  )
}
