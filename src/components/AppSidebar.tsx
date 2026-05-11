"use client";

import {
  Coffee,
  Settings,
  BarChart3,
  Users,
  Home,
  LogOut,
  History,
  Package,
  LucideProps,
} from "lucide-react";

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
  useSidebar,
} from "@/components/ui/sidebar";
import { logout } from "@/actions/auth";

import { useTranslation } from "@/i18n/LanguageProvider";
import type { DictionaryKey } from "@/i18n/dictionaries";

import Link from "next/link";
import { ForwardRefExoticComponent, RefAttributes } from "react";

// Menu items
const items: {
  titleKey: DictionaryKey;
  url: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}[] = [
  {
    titleKey: "nav_dashboard",
    url: "/",
    icon: Home,
  },
  {
    titleKey: "nav_analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    titleKey: "nav_history",
    url: "/history",
    icon: History,
  },
  {
    titleKey: "nav_customers",
    url: "/customers",
    icon: Users,
  },
  {
    titleKey: "nav_inventory",
    url: "/inventory",
    icon: Package,
  },
  {
    titleKey: "nav_settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar({
  businessName = "Dos Tazas",
}: {
  businessName?: string;
}) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar
      className="border-r border-warm-roast/10 shadow-sm"
      variant="sidebar"
    >
      <SidebarHeader className="p-4 flex flex-row items-center gap-3">
        <div className="bg-coffee-fruit text-white p-2 rounded-lg shadow-inner">
          <Coffee className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-lg text-expresso leading-none">
            {businessName}
          </span>
          <span className="text-xs text-expresso/60 font-medium">
            {t("sidebar_order_management")}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-warm-roast/60 font-bold uppercase tracking-wider text-[10px]">
            {t("sidebar_dashboard")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    render={
                      <Link
                        href={item.url}
                        onClick={() => { if (isMobile) setOpenMobile(false); }}
                        className="flex items-center gap-3 py-5"
                      />
                    }
                    className="hover:bg-warm-roast/10 hover:text-warm-roast transition-colors data-[active=true]:bg-warm-roast/15 data-[active=true]:text-expresso"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium text-sm">
                      {t(item.titleKey)}
                    </span>
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
              <SidebarMenuButton
                render={
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 py-5"
                  />
                }
                className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium text-sm">
                  {t("sidebar_logout")}
                </span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
