"use client";

import * as React from "react";
import {
  IconDashboard,
  IconPackage,
  IconShoppingCart,
  IconChartBar,
  IconSettings,
  IconStore,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

const merchantNavData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/merchant/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Products",
      url: "/merchant/products",
      icon: IconPackage,
    },
    {
      title: "Orders",
      url: "/merchant/orders",
      icon: IconShoppingCart,
    },
    {
      title: "Analytics",
      url: "/merchant/analytics",
      icon: IconChartBar,
    },
    {
      title: "Store Settings",
      url: "/merchant/settings",
      icon: IconStore,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/merchant/settings",
      icon: IconSettings,
    },
  ],
};

export function MerchantSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/merchant/dashboard">
                <IconStore className="!size-5" />
                <span className="text-base font-semibold">Merchant Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={merchantNavData.navMain} />
        <NavSecondary items={merchantNavData.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}

