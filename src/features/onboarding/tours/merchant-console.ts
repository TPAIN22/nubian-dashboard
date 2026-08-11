import type { OnboardingStep, Tour } from '../types'

/* ============================================================================
   The merchant console tour, as data
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

export const MERCHANT_TOUR_ID = 'merchant-console'

/** Routes the console tour hands over to the add-a-product tour. */
export const WIZARD_ROUTES = ['/merchant/products/new', '/merchant/categories/new']

const STEPS: OnboardingStep[] = [
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
    description: () =>
      'ابدأ بإضافة منتج واحد على الأقل عشان متجرك يكون جاهز للبيع. في شاشة الإضافة في جولة تانية بتمشي معاك حقل حقل.',
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
    // The finish card's primary button. A tour that ends somewhere useful says
    // so here rather than the renderer hard-coding a route.
    action: { label: 'ابدأ البيع', href: '/merchant/products' },
  },
]

export const MERCHANT_CONSOLE_TOUR: Tour = {
  id: MERCHANT_TOUR_ID,
  version: 1,
  steps: STEPS,
  // The whole console EXCEPT the wizards. The product wizard is the one screen
  // this tour spent a step asking the merchant to open — floating a popover
  // over it would be the tour getting in the way of the thing it just
  // recommended. The add-a-product tour takes over there instead.
  scope: (pathname) =>
    pathname.startsWith('/merchant') &&
    !WIZARD_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`)),
  autoStart: true,
  needsMerchantContext: true,
  restartHref: '/merchant/dashboard',
  restartLabel: 'جولة تعريفية',
}
