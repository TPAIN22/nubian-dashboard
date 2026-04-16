"use client";

import * as React from "react";
import {
  IconCamera,
  IconDashboard,
  IconFileAi,
  IconFileDescription,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconMapPin,
  IconSettings,
  IconUsers,
  IconTooltip,
  IconMessageCircle,
  IconClock
} from "@tabler/icons-react";
import { useUser } from "@clerk/nextjs";

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

const adminNav = [
  {
    title: "نظرة عامة",
    url: "/admin",
    icon: IconDashboard,
  },
  {
    title: "طلبات الانضمام",
    url: "/admin/applications",
    icon: IconUsers,
  },
  {
    title: "الدعم والنزاعات",
    url: "/admin/support",
    icon: IconMessageCircle,
  },
  {
    title: "المنتجات والمخزون",
    url: "/admin/products-advanced",
    icon: IconListDetails,
  },
  {
    title: "إدارة التصنيفات",
    url: "/admin/categories",
    icon: IconTooltip,
  },
  {
    title: "الطلبات والمبيعات",
    url: "/admin/orders",
    icon: IconFolder,
  },
  {
    title: "العروض التسويقية",
    url: "/admin/banners",
    icon: IconCamera,
  },
  {
    title: "الكوبونات والخصومات",
    url: "/admin/coupons",
    icon: IconFileDescription,
  },
  {
    title: "المناطق والشحن",
    url: "/admin/locations",
    icon: IconMapPin,
  },
];

const merchantNav = [
  {
    title: "لوحة تحكم المتجر",
    url: "/merchant/dashboard",
    icon: IconDashboard,
  },
  {
    title: "منتجاتي",
    url: "/merchant/products",
    icon: IconListDetails,
  },
  {
    title: "الطلبات",
    url: "/merchant/orders",
    icon: IconFolder,
  },
  {
    title: "الدعم الفني",
    url: "/admin/support",
    icon: IconHelp,
  },
  {
    title: "الإعدادات",
    url: "/merchant/settings",
    icon: IconSettings,
  },
];

const applyingNav = [
  {
    title: "حالة الطلب",
    url: "/merchant/pending",
    icon: IconClock,
  },
  {
    title: "تقديم طلب جديد",
    url: "/merchant/apply",
    icon: IconUsers,
  },
  {
    title: "مركز المساعدة",
    url: "/admin/support",
    icon: IconHelp,
  },
];

const secondaryNav = [
  {
    title: "المساعدة",
    url: "/admin/support",
    icon: IconHelp,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string;
  const status = user?.publicMetadata?.merchantStatus as string;

  const items = role === "admin" || role === "support" 
    ? adminNav 
    : (role === "merchant" && status === "approved" ? merchantNav : applyingNav);

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
                <IconInnerShadowTop className="!size-5 text-primary" />
                <span className="text-base font-bold">Nubian Platform</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
