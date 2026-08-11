import type { MerchantContext, OnboardingStep } from './types'

/* ============================================================================
   The merchant tour, as data
   ----------------------------------------------------------------------------
   One array drives the popovers, the progress counter, the resume point and
   the keyboard order. Adding a stop means adding an entry here — no component
   knows the name of any particular step.

   Two rules the list obeys:

     1. NOTHING IS INVENTED. Every step points at a surface the merchant console
        already has, using the console's own vocabulary ("التحليلات", not a new
        "Earnings" page). There is deliberately no notifications step: the
        merchant rail has no notification surface (`notificationsHref` is set
        for /admin only), and teaching a bell that is not there is worse than
        one fewer stop.

     2. NOTHING IS ASSUMED. Each step reads the merchant's real state before it
        speaks, so a store with 200 products is not told to add its first one.
   ========================================================================== */

/**
 * Bumped only when the sequence changes enough that a stored `currentStep`
 * would resume somebody in the wrong place. Cosmetic copy edits do not count.
 */
export const TOUR_VERSION = 1

export const MERCHANT_TOUR: OnboardingStep[] = [
  {
    id: 'welcome',
    variant: 'dialog',
    chromeOnly: true,
    title: 'أهلاً بيك في نوبيان 👋',
    description: (ctx) =>
      ctx.storeName
        ? `خلينا نجهز ${ctx.storeName} ونوريك أهم الحاجات في الداشبورد. الجولة ما حتاخد منك أكتر من دقيقتين.`
        : 'خلينا نجهز متجرك ونوريك أهم الحاجات في الداشبورد. الجولة ما حتاخد منك أكتر من دقيقتين.',
  },

  {
    id: 'store',
    target: 'merchant-store',
    route: '/merchant/settings',
    placement: 'inline-end',
    title: 'متجرك',
    description: (ctx) =>
      ctx.storeConfigured
        ? 'بيانات متجرك جاهزة. من هنا بتحدّث الاسم والوصف والصور أي وقت تحتاج.'
        : 'من هنا بتقدر تدير معلومات متجرك وتخلي الزبائن يعرفوا أكتر عنك.',
    action: { label: 'فتح إعدادات المتجر', href: '/merchant/settings' },
  },

  {
    id: 'products',
    target: 'merchant-products',
    route: '/merchant/products',
    placement: 'inline-end',
    title: 'منتجاتك 📦',
    description: () => 'هنا بتضيف منتجاتك وتعدل الأسعار والصور والمخزون.',
    action: { label: 'فتح المنتجات', href: '/merchant/products' },
  },

  {
    id: 'add-product',
    target: 'merchant-add-product',
    route: '/merchant/products',
    placement: 'block-end',
    title: 'أضف أول منتج',
    description: () => 'ابدأ بإضافة منتج واحد على الأقل عشان متجرك يكون جاهز للبيع.',
    action: { label: 'إضافة منتج', href: '/merchant/products/new' },
    // Real completion, read from the catalogue the backend returns — clicking
    // "next" past this step never marks it done.
    satisfiedWhen: (ctx) => ctx.productCount > 0,
    skipWhen: (ctx) => ctx.productCount > 0,
  },

  {
    id: 'orders',
    target: 'merchant-orders',
    route: '/merchant/orders',
    placement: 'inline-end',
    title: 'الطلبات 🛍️',
    description: (ctx) =>
      ctx.orderCount > 0
        ? 'طلباتك كلها هنا — من هنا بتأكد الطلب وتتابع حالته لحد ما يوصل الزبون.'
        : 'أي طلب جديد من الزبائن حتلقاه هنا، ومن هنا بتقدر تتابع حالة الطلب لحد ما يكتمل.',
    action: { label: 'فتح الطلبات', href: '/merchant/orders' },
  },

  {
    id: 'sales',
    target: 'merchant-analytics',
    route: '/merchant/analytics',
    placement: 'inline-end',
    title: 'مبيعاتك 💰',
    description: () => 'هنا بتتابع مبيعاتك وأداء متجرك.',
    action: { label: 'فتح التحليلات', href: '/merchant/analytics' },
  },

  {
    id: 'finish',
    variant: 'dialog',
    chromeOnly: true,
    title: 'تمام، متجرك جاهز 🎉',
    description: () => 'عرفت أهم أجزاء الداشبورد. أضف منتجاتك وابدأ استقبل طلباتك.',
  },
]

/**
 * Routes where the tour steps aside entirely.
 *
 * The product wizard is the whole point of the "add your first product" step —
 * hovering a popover over it while somebody fills it in would be the tour
 * getting in the way of the thing it just asked for. Progress is already
 * persisted, so the tour picks up where it left off on the way back.
 */
export const TOUR_PAUSED_ROUTES = ['/merchant/products/new', '/merchant/categories/new']

/** Copy that lives outside any one step. */
export const TOUR_COPY = {
  start: 'يلا نبدأ',
  later: 'لاحقاً',
  next: 'التالي',
  back: 'رجوع',
  skipStep: 'تخطي',
  skipTour: 'تخطي الجولة',
  finishPrimary: 'ابدأ البيع',
  finishSecondary: 'إغلاق',
  restart: 'جولة تعريفية',
  progress: (current: number, total: number) => `${current} من ${total}`,
  confirmTitle: 'متأكد عايز تتخطى الجولة؟',
  confirmBody: 'تقدر ترجع لها من المساعدة في أي وقت.',
  confirmSkip: 'تخطي',
  confirmBack: 'رجوع',
  /** Shown when a step's target is not on this screen (mobile rail, other route). */
  offRoute: 'افتح القسم عشان نوريك المكان بالظبط.',
  close: 'إغلاق الجولة',
} as const

export const EMPTY_CONTEXT: MerchantContext = {
  ready: false,
  productCount: 0,
  orderCount: 0,
  storeConfigured: false,
}
