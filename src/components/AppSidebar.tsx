'use client'

import { Coffee, Settings, BarChart3, Users, Home, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { logout } from "@/actions/auth"

// Menu items
const items = [
  {
    title: "Orders",
    url: "/",
    icon: Home,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Coffee,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-warm-roast/10 shadow-sm" variant="sidebar">
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="bg-coffee-fruit text-white p-2 rounded-lg shadow-inner">
          <Coffee className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-lg text-expresso leading-none">Dos Tazas</span>
          <span className="text-xs text-expresso/60 font-medium">Order Management</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-warm-roast/60 font-bold uppercase tracking-wider text-[10px]">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton render={<a href={item.url} className="flex items-center gap-3 py-5" />} className="hover:bg-warm-roast/10 hover:text-warm-roast transition-colors data-[active=true]:bg-warm-roast/15 data-[active=true]:text-expresso">
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-warm-roast/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton render={<button type="submit" className="w-full flex items-center gap-3 py-5" />} className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                <LogOut className="h-5 w-5" />
                <span className="font-medium text-sm">Log out</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
