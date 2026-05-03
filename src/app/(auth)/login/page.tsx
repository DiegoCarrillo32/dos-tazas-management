'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Coffee } from 'lucide-react'
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
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-center mb-8">
        <div className="bg-[#b92323] text-white p-3 rounded-xl shadow-lg">
          <Coffee className="h-10 w-10" />
        </div>
      </div>
      
      <Card className="shadow-xl border-[#7a1318]/20 bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-heading text-[#410505]">
            Welcome back
          </CardTitle>
          <CardDescription className="text-[#410505]/60">
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
              {error === 'Invalid login credentials' 
                ? 'Invalid email or password. Please try again.' 
                : error}
            </div>
          )}
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#410505]">Email</Label>
              <Input 
                id="email" 
                name="email"
                type="email" 
                placeholder="m@example.com" 
                required 
                className="border-[#7a1318]/30 focus-visible:ring-[#b92323]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#410505]">Password</Label>
              <Input 
                id="password" 
                name="password"
                type="password" 
                required 
                className="border-[#7a1318]/30 focus-visible:ring-[#b92323]"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#b92323] hover:bg-[#7a1318] text-white"
              disabled={isPending}
            >
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
