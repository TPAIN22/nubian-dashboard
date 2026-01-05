"use client";

import * as React from "react";
import {
  IconDashboard,
  IconPackage,
  IconShoppingCart,
  IconChartBar,
  IconSettings,
  IconShoppingBag,
  IconInnerShadowTop,
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
      title: "لوحة التحكم",
      url: "/merchant/dashboard",
      icon: IconDashboard,
    },
    {
      title: "المنتجات",
      url: "/merchant/products",
      icon: IconPackage,
    },
    {
      title: "الطلبات",
      url: "/merchant/orders",
      icon: IconShoppingCart,
    },
    {
      title: "التحليلات",
      url: "/merchant/analytics",
      icon: IconChartBar,
    },
    {
      title: "إعدادات المتجر",
      url: "/merchant/settings",
      icon: IconShoppingBag,
    },
  ],
  navSecondary: [
    {
      title: "الإعدادات",
      url: "/merchant/settings",
      icon: IconSettings,
    },
  ],
};

export function MerchantSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" side="right" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Nubian Sd</span>
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

