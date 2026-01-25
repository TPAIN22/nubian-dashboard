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
  IconTooltip
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "لوحة التحكم",
      url: "/business/dashboard",
      icon: IconDashboard,
    },
    {
      title: "المنتجات",
      url: "/business/products",
      icon: IconListDetails,
    },
    {
      title: "التجار",
      url: "/business/merchant",
      icon: IconUsers,
    },
    {
      title: "طلبات التجار",
      url: "/business/merchants",
      icon: IconUsers,
    },
    {
      title: "التصنيفات",
      url: "/business/categories",
      icon: IconTooltip,
    },
    {
      title: "الطلبات",
      url: "/business/orders",
      icon: IconFolder,
    },
    {
      title: "مركز الاشعارات",
      url: "/business/notifications",
      icon: IconInnerShadowTop,
    },
    {
      title: "العروض",
      url: "/business/banners",
      icon: IconCamera,
    },
    {
      title: "كوبونات",
      url: "/business/coupons",
      icon: IconFileDescription,
    },
    {
      title: "المناطق",
      url: "/business/locations",
      icon: IconMapPin,
    },
  ],
  navClouds: [
    {
      title: "التقاط",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "الاقتراحات النشطة",
          url: "#",
        },
        {
          title: "المؤرشفة",
          url: "#",
        },
      ],
    },
    {
      title: "اقتراح",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "الاقتراحات النشطة",
          url: "#",
        },
        {
          title: "المؤرشفة",
          url: "#",
        },
      ],
    },
    {
      title: "الموجهات",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "الاقتراحات النشطة",
          url: "#",
        },
        {
          title: "المؤرشفة",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "الاعدادت",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "احصل على المساعدة",
      url: "#",
      icon: IconHelp,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
