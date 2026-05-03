import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        <header className="md:hidden flex h-14 items-center gap-4 border-b border-warm-roast/10 bg-white-pergamino px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="text-expresso" />
          <span className="font-heading text-lg text-expresso">Dos Tazas</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
