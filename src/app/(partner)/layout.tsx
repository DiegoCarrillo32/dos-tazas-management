import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { MobileTabBar } from "@/components/MobileTabBar"
import { MobileTopBar } from "@/components/MobileTopBar"
import { fetchSettings } from "@/actions/settings"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Partner Portal",
}

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profile?.role !== 'partner') {
      redirect('/')
    }
  }

  let settings = null
  try {
    settings = await fetchSettings()
  } catch {
    // Ignore errors if not logged in
  }

  const businessName = settings?.business_name || "Partner Portal"

  return (
    <SidebarProvider>
      <AppSidebar businessName={businessName} userRole="partner" />
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <MobileTopBar businessName={businessName} />
        {/* The bottom padding clears the fixed tab bar (60px + the home
            indicator) so the last row of a long list is never under it. */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
        <MobileTabBar userRole="partner" />
      </div>
    </SidebarProvider>
  )
}
