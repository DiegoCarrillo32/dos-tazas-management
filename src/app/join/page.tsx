'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { KeyRound, Mail, User, Store } from 'lucide-react'
import { signup } from '@/actions/auth'

function JoinForm() {
  const searchParams = useSearchParams()
  const codeParam = searchParams?.get('code')
  
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState(codeParam || '')

  useEffect(() => {
    if (codeParam) {
      setInviteCode(codeParam)
    }
  }, [codeParam])

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto z-10 px-4">
      {/* Premium Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-coffee-fruit/10 rounded-full blur-[80px] -z-10 animate-pulse duration-[8s]" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-warm-roast/10 rounded-full blur-[80px] -z-10 animate-pulse duration-[6s]" />

      {/* Floating Logo Badge & Title */}
      <div className="flex flex-col items-center justify-center mb-8 gap-2">
        <div className="bg-card/90 p-3 rounded-2xl shadow-xl hover:rotate-6 transition-transform duration-300 cursor-pointer border border-warm-roast/10 flex items-center justify-center">
          <Image 
            src="/favicon.svg" 
            alt="Dos Tazas Logo" 
            width={48} 
            height={48} 
            className="animate-bounce" 
            style={{ animationDuration: '3s' }}
          />
        </div>
        <h2 className="font-heading text-4xl text-expresso tracking-tight mt-2">Partner Portal</h2>
        <p className="text-[10px] text-expresso/60 uppercase tracking-[0.2em] font-bold">Connect to your Roaster</p>
      </div>
      
      {/* Glassmorphic Join Card */}
      <Card className="shadow-2xl border-warm-roast/10 bg-card/70 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1.5 text-center pb-4 pt-6">
          <CardTitle className="text-xl font-bold text-expresso">
            Create your account
          </CardTitle>
          <CardDescription className="text-expresso/60 text-sm">
            Enter your invite code and credentials to link with your roaster.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3.5 rounded-2xl text-sm mb-5 border border-destructive/20 font-medium">
              {error}
            </div>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-expresso text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pl-1">
                <Store className="h-3.5 w-3.5 text-warm-roast" />
                Invite Code
              </Label>
              <Input 
                id="inviteCode" 
                name="inviteCode"
                type="text" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="e.g. ABCDEF12" 
                required 
                className="border-warm-roast/20 bg-background/60 focus:bg-background focus-visible:ring-coffee-fruit rounded-2xl h-11 transition-all pl-4 text-expresso font-mono font-bold tracking-widest uppercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-expresso text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pl-1">
                <User className="h-3.5 w-3.5 text-warm-roast" />
                Full Name
              </Label>
              <Input 
                id="fullName" 
                name="fullName"
                type="text" 
                placeholder="Gunther" 
                required 
                className="border-warm-roast/20 bg-background/60 focus:bg-background focus-visible:ring-coffee-fruit rounded-2xl h-11 transition-all pl-4 text-expresso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-expresso text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pl-1">
                <Mail className="h-3.5 w-3.5 text-warm-roast" />
                Email Address
              </Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="m@example.com" 
                required 
                className="border-warm-roast/20 bg-background/60 focus:bg-background focus-visible:ring-coffee-fruit rounded-2xl h-11 transition-all pl-4 text-expresso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-expresso text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pl-1">
                <KeyRound className="h-3.5 w-3.5 text-warm-roast" />
                Password
              </Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required 
                className="border-warm-roast/20 bg-background/60 focus:bg-background focus-visible:ring-coffee-fruit rounded-2xl h-11 transition-all pl-4 text-expresso"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-coffee-fruit to-warm-roast hover:from-warm-roast hover:to-expresso text-white font-bold transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg rounded-2xl h-11 cursor-pointer"
                disabled={isPending}
              >
                {isPending ? 'Connecting...' : 'Connect Account'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen text-expresso">Loading...</div>}>
      <JoinForm />
    </Suspense>
  )
}
