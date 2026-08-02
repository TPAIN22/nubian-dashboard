import {
  ArrowLeftRight,
  ArrowUpDown,
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
  Plus,
  ReceiptText,
  Store,
  Tags,
  Truck,
  UserRoundCheck,
  Users,
} from 'lucide-react'

import { filterNav, type ConsoleNav, type NavGroup, type NavItem } from '@/components/console/shell'

/* ============================================================================
   Admin console navigation
   ----------------------------------------------------------------------------
   Data only. The rendering — sidebar, breadcrumb trail, ⌘K palette — lives in
   components/console/shell and is shared with the merchant console.
   ========================================================================== */

export type CountKey = 'pendingMerchants' | 'openTickets' | 'pendingOrders'

/** The one gate this console uses: platform-financial surfaces. */
export const ADMIN_ONLY = 'admin'

export const ADMIN_GROUPS: NavGroup[] = [
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
        requires: ADMIN_ONLY,
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
        requires: ADMIN_ONLY,
        keywords: ['currencies', 'عملات'],
      },
      {
        label: 'أسعار الصرف',
        href: '/admin/fx-rates',
        icon: ArrowLeftRight,
        requires: ADMIN_ONLY,
        keywords: ['fx', 'exchange rates', 'صرف'],
      },
    ],
  },
]

export const ADMIN_CONSOLE: ConsoleNav = {
  root: '/admin',
  rootLabel: 'الإدارة',
  badgeLabel: 'الإدارة',
  homeHref: '/admin',
  groups: ADMIN_GROUPS,
  primaryAction: { href: '/admin/products-advanced/new', label: 'منتج جديد' },
  notificationsHref: '/admin/notifications',
  commands: [
    { label: 'إنشاء منتج جديد', href: '/admin/products-advanced/new', icon: Plus, shortcut: 'N' },
    { label: 'استيراد منتجات', href: '/admin/products-advanced/import', icon: ArrowUpDown },
  ],
  segmentLabels: {
    new: 'جديد',
    edit: 'تعديل',
    import: 'استيراد',
    compose: 'إنشاء',
    history: 'السجل',
    queues: 'الطوابير',
    preferences: 'التفضيلات',
    v2: 'المعالج',
  },
}

/* -------------------------------------------------------------------------- */

export const ALL_NAV_ITEMS: NavItem[] = ADMIN_GROUPS.flatMap((g) => g.items)

/** Icon used when a breadcrumb/palette entry has no owning nav item. */
export const FALLBACK_ICON = Truck

/** `support` sees everything except the platform-financial surfaces. */
export function adminConsoleFor(role: string | undefined): ConsoleNav {
  return filterNav(ADMIN_CONSOLE, role === 'admin' ? [ADMIN_ONLY] : [])
}
