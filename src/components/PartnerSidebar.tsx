'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import { LogOut, LayoutDashboard, ShoppingCart, RefreshCw } from "lucide-react"
import Image from "next/image"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar"
import { logout } from "@/actions/auth"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Order History",
    url: "/orders",
    icon: ShoppingCart,
  },
  {
    title: "Recurring Orders",
    url: "/recurring",
    icon: RefreshCw,
  }
]

export function PartnerSidebar({ className }: { className?: string }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  return (
    <Sidebar className={className}>
      <SidebarContent className="bg-white-pergamino">
        <div className="p-4 flex items-center justify-center border-b border-warm-roast/10 pb-6 mb-2 pt-6">
          <Link href="/dashboard" className="flex flex-col items-center gap-2 group">
            <div className="bg-white p-2 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
              <Image 
                src="/favicon.svg" 
                alt="Partner Portal Logo" 
                width={32} 
                height={32} 
                className="group-hover:scale-105 transition-transform" 
              />
            </div>
            <span className="font-heading text-lg font-bold text-expresso">
              Partner Portal
            </span>
          </Link>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-expresso/50 font-bold uppercase tracking-wider text-[10px] mb-2 px-4">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(`${item.url}/`)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive}
                      className={`rounded-xl transition-all ${
                        isActive 
                          ? 'bg-coffee-fruit/10 text-coffee-fruit hover:bg-coffee-fruit/15 font-semibold shadow-sm' 
                          : 'text-expresso hover:bg-warm-roast/10 hover:text-expresso'
                      }`}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Link href={item.url} className="flex items-center gap-3 px-3 py-2 w-full h-full">
                        <item.icon className={`h-4 w-4 ${isActive ? 'text-coffee-fruit' : 'text-warm-roast'}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-white-pergamino border-t border-warm-roast/10 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => startTransition(() => { logout() })}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full flex items-center gap-3 py-5"
              tooltip="Logout"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm group-data-[state=collapsed]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function Button({ children, className, variant, ...props }: React.ComponentProps<"button"> & { variant?: string }) {
  return (
    <button className={`px-4 py-2 ${className}`} {...props}>
      {children}
    </button>
  )
}
