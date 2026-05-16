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
  IconTooltip,
  IconMessageCircle,
  IconClock,
  IconAffiliate,
  IconCash,
  IconLink,
  IconChartBar,
  IconSettings,
  IconUsers,
  IconArrowsExchange,
  IconBell,
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
  {
    title: "إدارة المسوقين",
    url: "/admin/marketers",
    icon: IconAffiliate,
  },
  {
    title: "العمولات والمدفوعات",
    url: "/admin/commissions",
    icon: IconCash,
  },
  {
    title: "الإشعارات",
    url: "/admin/notifications",
    icon: IconBell,
  },
];

const adminOnlyNav = [
  {
    title: "أسعار الصرف",
    url: "/admin/fx-rates",
    icon: IconArrowsExchange,
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
    url: "/merchant/support",
    icon: IconHelp,
  },
  {
    title: "الإعدادات",
    url: "/merchant/settings",
    icon: IconSettings,
  },
];

const affiliateNav = [
  {
    title: "لوحة تحكم المسوق",
    url: "/affiliate",
    icon: IconChartBar,
  },
  {
    title: "العمولات المالية",
    url: "/affiliate/commissions",
    icon: IconCash,
  },
  {
    title: "رابط الإحالة",
    url: "/affiliate/referral",
    icon: IconLink,
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
];

const joinAffiliateNav = [
  ...applyingNav,
  {
    title: "انضم لبرنامج الإحالة",
    url: "/affiliate/register",
    icon: IconAffiliate,
  },
];

const helpUrlForRole = (role: string, status: string) =>
  role === "admin" || role === "support"
    ? "/admin/support"
    : role === "merchant" && status === "approved"
    ? "/merchant/support"
    : "/";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string;
  const status = user?.publicMetadata?.merchantStatus as string;

  const items = role === "admin"
    ? [...adminNav, ...adminOnlyNav]
    : role === "support"
    ? adminNav
    : (role === "marketer" ? affiliateNav : (role === "merchant" && status === "approved" ? merchantNav : joinAffiliateNav));

  const secondaryNav = [
    {
      title: "المساعدة",
      url: helpUrlForRole(role, status),
      icon: IconHelp,
    },
  ];

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
