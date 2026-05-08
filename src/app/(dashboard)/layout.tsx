import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { fetchSettings } from "@/actions/settings"
import type { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await fetchSettings()
    return {
      title: settings.business_name || "Dos Tazas Management",
    }
  } catch (error) {
    return {
      title: "Dos Tazas Management",
    }
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let settings = null
  try {
    settings = await fetchSettings()
  } catch (e) {
    // Ignore errors if not logged in
  }

  const businessName = settings?.business_name || "Dos Tazas"

  return (
    <SidebarProvider>
      <AppSidebar businessName={businessName} />
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <header className="md:hidden flex h-14 items-center gap-4 border-b border-warm-roast/10 bg-white-pergamino px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="text-expresso" />
          <span className="font-heading text-lg text-expresso">{businessName}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
