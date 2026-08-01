import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  Banknote,
  BellRing,
  Coins,
  Gift,
  Image as ImageIcon,
  LayoutGrid,
  LifeBuoy,
  MapPin,
  Megaphone,
  Package,
  ReceiptText,
  Store,
  Tags,
  Truck,
  UserRoundCheck,
  Users,
} from 'lucide-react'

/* ============================================================================
   Navigation model
   ----------------------------------------------------------------------------
   One declarative source drives the sidebar, the breadcrumb trail and the
   command palette. Adding a route in one place lights it up in all three.
   ========================================================================== */

export type CountKey = 'pendingMerchants' | 'openTickets' | 'pendingOrders'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** Live badge sourced from `useAdminCounts`. */
  badge?: CountKey
  /** Extra path prefixes that should keep this item highlighted. */
  match?: string[]
  /** Hidden from `support` role — platform-financial surfaces. */
  adminOnly?: boolean
  /** Extra command-palette search terms (English aliases, synonyms). */
  keywords?: string[]
  /** Sub-routes surfaced in the palette and breadcrumbs, not in the sidebar. */
  children?: { label: string; href: string }[]
}

export type NavGroup = {
  id: string
  /** Omitted for the top-level group so "Overview" needs no heading. */
  label?: string
  items: NavItem[]
}

export const ADMIN_NAV: NavGroup[] = [
  {
    id: 'root',
    items: [
      {
        label: 'نظرة عامة',
        href: '/admin',
        icon: LayoutGrid,
        keywords: ['overview', 'dashboard', 'home', 'الرئيسية'],
      },
    ],
  },
  {
    id: 'commerce',
    label: 'التجارة',
    items: [
      {
        label: 'الطلبات',
        href: '/admin/orders',
        icon: ReceiptText,
        badge: 'pendingOrders',
        keywords: ['orders', 'sales', 'مبيعات', 'شحنات'],
      },
      {
        label: 'المنتجات',
        href: '/admin/products-advanced',
        icon: Package,
        match: ['/admin/products'],
        keywords: ['products', 'inventory', 'مخزون', 'sku'],
        children: [
          { label: 'منتج جديد', href: '/admin/products-advanced/new' },
          { label: 'استيراد منتجات', href: '/admin/products-advanced/import' },
        ],
      },
      {
        label: 'التصنيفات',
        href: '/admin/categories',
        icon: Tags,
        keywords: ['categories', 'taxonomy', 'أقسام'],
        children: [{ label: 'تصنيف جديد', href: '/admin/categories/new' }],
      },
      {
        label: 'المتاجر',
        href: '/admin/stores',
        icon: Store,
        match: ['/admin/merchants-legacy', '/admin/merchant-legacy'],
        keywords: ['stores', 'merchants', 'vendors', 'تجار'],
      },
      {
        label: 'طلبات الانضمام',
        href: '/admin/applications',
        icon: UserRoundCheck,
        badge: 'pendingMerchants',
        keywords: ['applications', 'onboarding', 'approvals', 'موافقات'],
      },
    ],
  },
  {
    id: 'marketing',
    label: 'التسويق',
    items: [
      {
        label: 'الكوبونات',
        href: '/admin/coupons',
        icon: Gift,
        keywords: ['coupons', 'discounts', 'promo', 'خصومات'],
      },
      {
        label: 'البانرات',
        href: '/admin/banners',
        icon: ImageIcon,
        keywords: ['banners', 'campaigns', 'إعلانات', 'عروض'],
      },
      {
        label: 'المسوقون',
        href: '/admin/marketers',
        icon: Megaphone,
        keywords: ['affiliates', 'marketers', 'referrals', 'إحالات'],
      },
      {
        label: 'العمولات',
        href: '/admin/commissions',
        icon: Banknote,
        adminOnly: true,
        keywords: ['commissions', 'payouts', 'مدفوعات'],
      },
    ],
  },
  {
    id: 'customers',
    label: 'العملاء',
    items: [
      {
        label: 'العناوين',
        href: '/admin/addresses',
        icon: Users,
        keywords: ['addresses', 'customers', 'عملاء'],
      },
      {
        label: 'الدعم والنزاعات',
        href: '/admin/support',
        icon: LifeBuoy,
        badge: 'openTickets',
        keywords: ['support', 'tickets', 'disputes', 'تذاكر', 'شكاوى'],
      },
    ],
  },
  {
    id: 'system',
    label: 'النظام',
    items: [
      {
        label: 'الإشعارات',
        href: '/admin/notifications',
        icon: BellRing,
        keywords: ['notifications', 'push', 'email', 'رسائل'],
        children: [
          { label: 'إنشاء إشعار', href: '/admin/notifications/compose' },
          { label: 'سجل الإرسال', href: '/admin/notifications/history' },
          { label: 'الطوابير', href: '/admin/notifications/queues' },
          { label: 'التفضيلات', href: '/admin/notifications/preferences' },
        ],
      },
      {
        label: 'المناطق والشحن',
        href: '/admin/locations',
        icon: MapPin,
        keywords: ['locations', 'zones', 'shipping', 'مناطق'],
      },
      {
        label: 'العملات',
        href: '/admin/currencies',
        icon: Coins,
        adminOnly: true,
        keywords: ['currencies', 'عملات'],
      },
      {
        label: 'أسعار الصرف',
        href: '/admin/fx-rates',
        icon: ArrowLeftRight,
        adminOnly: true,
        keywords: ['fx', 'exchange rates', 'صرف'],
      },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/* Derived lookups                                                            */
/* -------------------------------------------------------------------------- */

export const ALL_NAV_ITEMS: NavItem[] = ADMIN_NAV.flatMap((g) => g.items)

/** Icon used when a breadcrumb/palette entry has no owning nav item. */
export const FALLBACK_ICON = Truck

/**
 * Labels for path segments that are not nav items — wizard steps, sub-tabs and
 * verbs. Dynamic ids (`[id]`) are handled by the breadcrumb context instead.
 */
export const SEGMENT_LABELS: Record<string, string> = {
  new: 'جديد',
  edit: 'تعديل',
  import: 'استيراد',
  compose: 'إنشاء',
  history: 'السجل',
  queues: 'الطوابير',
  preferences: 'التفضيلات',
  v2: 'المعالج',
}

/** Groups a path to its owning nav item, longest prefix wins. */
export function findNavItem(pathname: string): NavItem | undefined {
  let best: NavItem | undefined
  let bestLen = -1
  for (const item of ALL_NAV_ITEMS) {
    for (const p of [item.href, ...(item.match ?? [])]) {
      if ((pathname === p || pathname.startsWith(`${p}/`)) && p.length > bestLen) {
        best = item
        bestLen = p.length
      }
    }
  }
  return best
}

/** True when a nav item should render as active for the current path. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  // "/admin" must not swallow every child route.
  if (item.href === '/admin') return pathname === '/admin'
  return [item.href, ...(item.match ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  )
}

export function visibleNav(role: string | undefined): NavGroup[] {
  const isAdmin = role === 'admin'
  return ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.adminOnly || isAdmin),
  })).filter((g) => g.items.length > 0)
}
