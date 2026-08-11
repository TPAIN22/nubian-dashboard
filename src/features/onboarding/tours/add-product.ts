import type { OnboardingStep, Tour } from '../types'

/* ============================================================================
   Adding a product, from A to Z
   ----------------------------------------------------------------------------
   The console tour ends by asking the merchant to add their first product and
   then, correctly, gets out of the way. This is what happens next: the same
   engine, pointed at the product wizard.

   WHAT IT COVERS, AND WHY IT STOPS WHERE IT DOES.

   The wizard has six steps, but four of them (options, stock matrix, colour
   images, per-variant pricing) only exist for a product WITH variants, and the
   tour cannot see which internal step the wizard is on — that state lives in
   `useState` inside `ProductWizard`, not in the URL. Rather than guess, this
   tour teaches the screen every merchant sees: the step rail, the fields on
   step one, and how saving and publishing work. The four variant steps already
   carry the wizard's own per-step `STEP_HELP` panel, which is contextual in a
   way an external tour cannot be — so the tour points at that rail, explains
   what the six steps are, and hands over.

   The one field that comes and goes is price: it sits on step one for a simple
   product and moves to step five for a variant one. That step therefore carries
   copy that is true either way, and a `missingHint` for when the merchant has
   already switched to variants and the field is not there to highlight.
   ========================================================================== */

export const ADD_PRODUCT_TOUR_ID = 'add-product'

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    variant: 'dialog',
    chromeOnly: true,
    title: 'نضيف منتجك سوا 🧾',
    description: () =>
      'حأمشي معاك حقل حقل لحدي ما منتجك يكون جاهز للنشر. الجولة قصيرة، ولو حبيت تمشي لحالك اضغط «لاحقاً».',
  },

  {
    id: 'wizard-steps',
    target: 'wizard-steps',
    placement: 'inline-end',
    title: 'خطوات الإضافة',
    description: () =>
      'الشاشة مقسّمة ست خطوات، وقائمتها دي معاك طول الوقت وتقدر ترجع لأي خطوة منها. لو منتجك بسيط بتقفز من الخطوة الأولى للمراجعة على طول. وفي كل خطوة تحت القائمة في «نصيحة» بتشرح ليك الخطوة دي بالذات.',
    missingHint: 'قائمة الخطوات بتظهر أعلى الصفحة في الشاشات الصغيرة.',
  },

  {
    id: 'wizard-basics',
    target: 'wizard-basics',
    placement: 'block-end',
    title: 'الاسم والوصف',
    description: () =>
      'الاسم ده أول حاجة بيشوفها الزبون وبيبحث بيها، فخليهو واضح ومحدد — «قميص قطني رجالي» أحسن من «قميص». والوصف تحتيهو مكان الخامة والمقاسات وأي تفصيلة بتقلل أسئلة الزبائن قبل الشراء.',
  },

  {
    id: 'wizard-category',
    target: 'wizard-category',
    placement: 'block-end',
    title: 'التصنيف',
    description: () =>
      'التصنيف هو اللي بيحدد منتجك يظهر وين جوة التطبيق ومع أي منتجات. اختار الأقرب لمنتجك، ولو ما لقيت تصنيف مناسب تقدر تضيف واحد جديد من نفس المكان.',
  },

  {
    id: 'wizard-type',
    target: 'wizard-type',
    placement: 'block-end',
    title: 'نوع المنتج — القرار المهم',
    description: () =>
      'لو المنتج قطعة واحدة بسعر واحد وكمية واحدة، اختار «منتج بسيط» وحتكمل في خطوتين بس. ولو عندو مقاسات أو ألوان بأسعار أو كميات مختلفة، اختار «منتج متعدد» — وقتها حتفتح ليك خطوات الخيارات والكميات وصور الألوان والتسعير.',
  },

  {
    id: 'wizard-pricing',
    target: 'wizard-pricing',
    placement: 'block-start',
    title: 'السعر والكمية',
    description: () =>
      'السعر اللي بتدخلو هنا هو سعرك انت — سعر التاجر — بالعملة المختارة فوقيهو. نوبيان بتضيف هامشها فوق السعر ده، والزبون بيشوف السعر النهائي بعملتو هو. الكمية جنبو هي المخزون المتوفر، ولما يخلص المنتج ما بيبقى قابل للشراء.',
    missingHint:
      'لو اخترت «منتج متعدد»، الأسعار والكميات بتحددها لكل متغير في خطوة «التسعير والخصومات».',
  },

  {
    id: 'wizard-images',
    target: 'wizard-images',
    placement: 'block-end',
    title: 'الصور',
    description: () =>
      'أول صورة هي الرئيسية، ودي اللي بتظهر في قائمة المنتجات وفي نتائج البحث. تقدر ترفع لحدي ست صور، كل واحدة أقل من ٢ ميجا. صورة واضحة على خلفية بسيطة بتفرق كتير في المبيعات.',
  },

  {
    id: 'wizard-publish',
    target: 'wizard-publish',
    placement: 'block-start',
    title: 'الحفظ والنشر',
    description: () =>
      'شغلك بينحفظ مسودة تلقائياً على المتصفح ده، فلو قفلت الصفحة بالغلط ما حتخسر حاجة. امشي بـ«التالي» لحدي خطوة المراجعة، وهناك اضغط «نشر المنتج». لو في حقل ناقص حتلقى علامة خطأ على خطوتو في القائمة.',
  },

  {
    id: 'finish',
    variant: 'dialog',
    chromeOnly: true,
    title: 'جاهز 🎉',
    description: () =>
      'دي كل الحاجات المهمة. املأ الحقول وامشي بالتالي لحدي المراجعة، وبعدها انشر منتجك. لو احتجت الجولة دي تاني حتلقاها في زر «كيف أضيف منتج؟» فوق.',
  },
]

export const ADD_PRODUCT_TOUR: Tour = {
  id: ADD_PRODUCT_TOUR_ID,
  version: 1,
  steps: STEPS,
  // Creation only. On the edit screen the merchant already has a product and
  // does not need to be told what a category is.
  scope: (pathname) => pathname === '/merchant/products/new',
  autoStart: true,
  // None of these steps read the store's product count or order history, so
  // there is nothing to wait for — the tour opens as soon as the wizard does.
  needsMerchantContext: false,
  restartLabel: 'كيف أضيف منتج؟',
}
