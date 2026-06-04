"use client";

import {
  Settings,
  BarChart3,
  Users,
  Home,
  LogOut,
  History,
  Package,
  Clock,
  Flame,
  Briefcase,
  Wrench,
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
  SidebarSeparator,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { logout } from "@/actions/auth";

import { useTranslation } from "@/i18n/LanguageProvider";
import type { DictionaryKey } from "@/i18n/dictionaries";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ForwardRefExoticComponent, RefAttributes, useTransition } from "react";

type NavItem = {
  titleKey: DictionaryKey;
  url: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
};

type NavSection = {
  labelKey: DictionaryKey;
  items: NavItem[];
};

// Sidebar sections – related modules grouped together
const sections: NavSection[] = [
  {
    labelKey: "sidebar_section_overview",
    items: [
      { titleKey: "nav_dashboard" as DictionaryKey, url: "/", icon: Home },
      { titleKey: "nav_tracker" as DictionaryKey, url: "/tracker", icon: Clock },
      { titleKey: "nav_analytics" as DictionaryKey, url: "/analytics", icon: BarChart3 },
      { titleKey: "nav_history" as DictionaryKey, url: "/history", icon: History },
    ],
  },
  {
    labelKey: "sidebar_section_operations" as DictionaryKey,
    items: [
      { titleKey: "nav_inventory" as DictionaryKey, url: "/inventory", icon: Package },
      { titleKey: "nav_roasts" as DictionaryKey, url: "/roasts", icon: Flame },
      { titleKey: "nav_equipment" as DictionaryKey, url: "/equipment", icon: Wrench },
    ],
  },
  {
    labelKey: "sidebar_section_sales" as DictionaryKey,
    items: [
      { titleKey: "nav_customers" as DictionaryKey, url: "/customers", icon: Users },
      { titleKey: "nav_b2b" as DictionaryKey, url: "/b2b", icon: Briefcase },
      { titleKey: "nav_team" as DictionaryKey, url: "/team", icon: Users },
    ],
  },
  {
    labelKey: "sidebar_section_system" as DictionaryKey,
    items: [
      { titleKey: "nav_settings" as DictionaryKey, url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar({
  businessName = "Dos Tazas",
  userRole = "roaster",
}: {
  businessName?: string;
  userRole?: string;
}) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // Filter sections based on role
  const filteredSections = sections.map(section => {
    let allowedItems = section.items;
    
    if (userRole === "worker") {
      // Workers can only see Orders, Tracker, History, Settings
      allowedItems = section.items.filter(item => 
        ['nav_dashboard', 'nav_tracker', 'nav_history', 'nav_settings'].includes(item.titleKey)
      );
    } else {
      // Roasters don't see Tracker yet (or they do if they want to track themselves, but let's hide it)
      allowedItems = section.items.filter(item => item.titleKey !== 'nav_tracker');
      
      // Add team module for roasters if we need it
    }
    
    return { ...section, items: allowedItems };
  }).filter(section => section.items.length > 0);

  return (
    <Sidebar
      className="border-r border-warm-roast/10 shadow-sm"
      variant="sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="p-3 border-b border-warm-roast/10 flex flex-row items-center justify-between min-h-[60px]">
        <div className="flex items-center gap-3 group-data-[state=collapsed]:hidden overflow-hidden">
          <div className="bg-white/95 p-1 rounded-lg shadow-inner border border-warm-roast/10 shrink-0 flex items-center justify-center">
            <Image src="/favicon.svg" alt="Dos Tazas Logo" width={32} height={32} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-heading text-lg text-expresso leading-none truncate">
              {businessName}
            </span>
            <span className="text-xs text-expresso/60 font-medium truncate">
              {t("sidebar_order_management")}
            </span>
          </div>
        </div>
        <SidebarTrigger className="hidden md:inline-flex text-expresso hover:bg-warm-roast/10 group-data-[state=collapsed]:mx-auto" />
      </SidebarHeader>
      <SidebarContent>
        {filteredSections.map((section, idx) => (
          <SidebarGroup key={section.labelKey}>
            {idx > 0 && <SidebarSeparator className="mb-1" />}
            <SidebarGroupLabel className="text-warm-roast/60 font-bold uppercase tracking-wider text-[10px]">
              {t(section.labelKey)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      render={
                        <Link
                          href={item.url}
                          onClick={() => { if (isMobile) setOpenMobile(false); }}
                          className="flex items-center gap-3 py-5"
                        />
                      }
                      className="hover:bg-warm-roast/10 hover:text-warm-roast transition-colors data-[active=true]:bg-warm-roast/15 data-[active=true]:text-expresso"
                      tooltip={t(item.titleKey)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium text-sm group-data-[state=collapsed]:hidden">
                        {t(item.titleKey)}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-warm-roast/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => startTransition(() => { logout() })}
              className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors w-full flex items-center gap-3 py-5"
              tooltip={t("sidebar_logout")}
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm group-data-[state=collapsed]:hidden">
                {t("sidebar_logout")}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

