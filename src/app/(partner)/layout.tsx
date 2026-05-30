import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { PartnerSidebar } from "@/components/PartnerSidebar"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Partner Portal",
}

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <PartnerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <header className="md:hidden flex h-14 items-center gap-4 border-b border-warm-roast/10 bg-white-pergamino px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="text-expresso" />
          <span className="font-heading text-lg text-expresso">Partner Portal</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
