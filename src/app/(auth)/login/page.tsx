'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { KeyRound, Mail } from 'lucide-react'
import { login } from '@/actions/auth'

export default function LoginPage() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
  }

  return (
    <div className="relative w-full max-w-md mx-auto z-10 px-4">
      {/* Premium Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-coffee-fruit/10 dark:bg-coffee-fruit/20 rounded-full blur-[80px] -z-10 animate-pulse duration-[8s]" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-warm-roast/10 dark:bg-warm-roast/20 rounded-full blur-[80px] -z-10 animate-pulse duration-[6s]" />

      {/* Floating Logo Badge & Title */}
      <div className="flex flex-col items-center justify-center mb-8 gap-2">
        <div className="bg-white/90 dark:bg-black/60 p-3 rounded-2xl shadow-xl hover:rotate-6 transition-transform duration-300 cursor-pointer border border-warm-roast/10 flex items-center justify-center">
          <Image 
            src="/favicon.svg" 
            alt="Dos Tazas Logo" 
            width={48} 
            height={48} 
            className="animate-bounce" 
            style={{ animationDuration: '3s' }}
          />
        </div>
        <h2 className="font-heading text-4xl text-expresso dark:text-white-pergamino tracking-tight mt-2">Dos Tazas</h2>
        <p className="text-[10px] text-expresso/60 dark:text-white-pergamino/60 uppercase tracking-[0.2em] font-bold">Roastery Management</p>
      </div>
      
      {/* Glassmorphic Login Card */}
      <Card className="shadow-2xl border-warm-roast/10 bg-white/70 dark:bg-card/70 backdrop-blur-md rounded-3xl overflow-hidden">
        <CardHeader className="space-y-1.5 text-center pb-4 pt-6">
          <CardTitle className="text-xl font-bold text-expresso dark:text-white-pergamino">
            Welcome back
          </CardTitle>
          <CardDescription className="text-expresso/60 dark:text-white-pergamino/60 text-sm">
            Enter your email and password to access your workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-300 p-3.5 rounded-2xl text-sm mb-5 border border-red-200/50 dark:border-red-900/50 font-medium">
              {error === 'Invalid login credentials' 
                ? 'Invalid email or password. Please try again.' 
                : error}
            </div>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-expresso dark:text-white-pergamino/80 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pl-1">
                <Mail className="h-3.5 w-3.5 text-warm-roast dark:text-coffee-fruit" />
                Email Address
              </Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="m@example.com" 
                required 
                className="border-warm-roast/20 dark:border-white/10 bg-white/60 focus:bg-white dark:bg-black/40 dark:focus:bg-black/60 focus-visible:ring-coffee-fruit rounded-2xl h-11 transition-all pl-4 text-expresso dark:text-white-pergamino"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-expresso dark:text-white-pergamino/80 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 pl-1">
                <KeyRound className="h-3.5 w-3.5 text-warm-roast dark:text-coffee-fruit" />
                Password
              </Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required 
                className="border-warm-roast/20 dark:border-white/10 bg-white/60 focus:bg-white dark:bg-black/40 dark:focus:bg-black/60 focus-visible:ring-coffee-fruit rounded-2xl h-11 transition-all pl-4 text-expresso dark:text-white-pergamino"
              />
            </div>
            
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-coffee-fruit to-warm-roast hover:from-warm-roast hover:to-expresso text-white font-bold transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-md hover:shadow-lg rounded-2xl h-11 cursor-pointer"
                disabled={isPending}
              >
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Decorative slogan footer */}
      <p className="text-center text-[11px] text-expresso/40 dark:text-white-pergamino/40 mt-6 font-medium italic">
        &quot;Roasted to perfection, managed with ease.&quot;
      </p>
    </div>
  )
}
