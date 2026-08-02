import {
  ChartNoAxesColumn,
  Gift,
  LayoutGrid,
  LifeBuoy,
  Package,
  Plus,
  ReceiptText,
  Store,
  Tags,
} from 'lucide-react'

import type { ConsoleNav, NavGroup } from '@/components/console/shell'

/* ============================================================================
   Merchant console navigation
   ----------------------------------------------------------------------------
   Same shape as the admin nav, same renderer — a merchant and an admin are
   looking at one product. The groups follow the merchant's actual day:
   sell (orders, products), promote (coupons, analytics), run the shop
   (support, settings).
   ========================================================================== */

export type MerchantCountKey = 'pendingOrders'

export const MERCHANT_GROUPS: NavGroup[] = [
  {
    id: 'root',
    items: [
      {
        label: 'نظرة عامة',
        href: '/merchant/dashboard',
        icon: LayoutGrid,
        keywords: ['overview', 'dashboard', 'home', 'الرئيسية', 'لوحة'],
      },
    ],
  },
  {
    id: 'commerce',
    label: 'التجارة',
    items: [
      {
        label: 'الطلبات',
        href: '/merchant/orders',
        icon: ReceiptText,
        badge: 'pendingOrders',
        keywords: ['orders', 'sales', 'مبيعات', 'شحنات'],
      },
      {
        label: 'المنتجات',
        href: '/merchant/products',
        icon: Package,
        keywords: ['products', 'inventory', 'مخزون', 'sku', 'منتجاتي'],
        children: [{ label: 'منتج جديد', href: '/merchant/products/new' }],
      },
      {
        label: 'التصنيفات',
        href: '/merchant/categories/new',
        icon: Tags,
        keywords: ['categories', 'أقسام', 'فئة'],
      },
    ],
  },
  {
    id: 'growth',
    label: 'النمو',
    items: [
      {
        label: 'التحليلات',
        href: '/merchant/analytics',
        icon: ChartNoAxesColumn,
        keywords: ['analytics', 'reports', 'تقارير', 'إحصائيات'],
      },
      {
        label: 'الكوبونات',
        href: '/merchant/coupons',
        icon: Gift,
        keywords: ['coupons', 'discounts', 'promo', 'خصومات'],
      },
    ],
  },
  {
    id: 'store',
    label: 'المتجر',
    items: [
      {
        label: 'الدعم',
        href: '/merchant/support',
        icon: LifeBuoy,
        keywords: ['support', 'tickets', 'تذاكر', 'شكاوى', 'مساعدة'],
      },
      {
        label: 'إعدادات المتجر',
        href: '/merchant/settings',
        icon: Store,
        keywords: ['settings', 'profile', 'إعدادات', 'الملف'],
      },
    ],
  },
]

export const MERCHANT_CONSOLE: ConsoleNav = {
  root: '/merchant',
  rootLabel: 'متجري',
  badgeLabel: 'المتجر',
  homeHref: '/merchant/dashboard',
  groups: MERCHANT_GROUPS,
  primaryAction: { href: '/merchant/products/new', label: 'منتج جديد' },
  commands: [
    { label: 'إضافة منتج جديد', href: '/merchant/products/new', icon: Plus, shortcut: 'N' },
    { label: 'فتح تذكرة دعم', href: '/merchant/support?new=1', icon: LifeBuoy },
  ],
  segmentLabels: {
    new: 'جديد',
    edit: 'تعديل',
    dashboard: 'نظرة عامة',
    products: 'المنتجات',
    orders: 'الطلبات',
    categories: 'التصنيفات',
    settings: 'إعدادات المتجر',
    support: 'الدعم',
  },
}
