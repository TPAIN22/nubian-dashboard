import type { MerchantContext } from './types'

/* ============================================================================
   Shared tour copy
   ----------------------------------------------------------------------------
   The words that belong to the tour chrome rather than to any one step. Sudanese
   colloquial where the tour is talking to the merchant, and Modern Standard for
   the things that are labels rather than speech — the same register the rest of
   the console already uses.
   ========================================================================== */

export const TOUR_COPY = {
  start: 'يلا نبدأ',
  later: 'لاحقاً',
  next: 'التالي',
  back: 'رجوع',
  skipStep: 'تخطي',
  skipTour: 'تخطي الجولة',
  finishPrimary: 'ابدأ البيع',
  finishSecondary: 'إغلاق',
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

/**
 * Stand-in context for tours that do not read the merchant's real state.
 *
 * `ready: true` is the point: it lets such a tour open immediately rather than
 * waiting on queries whose answers none of its steps consult.
 */
export const CONTEXT_NOT_NEEDED: MerchantContext = {
  ready: true,
  productCount: 0,
  orderCount: 0,
  storeConfigured: false,
}
