import { Metadata } from 'next'
import OnboardingWizard from './components/OnboardingWizard'

export const metadata: Metadata = {
  title: 'تسجيل التاجر | انضم إلى منصتنا',
  description: 'سجّل كتاجر وابدأ البيع اليوم.',
}

/**
 * The wizard owns its own stepper and footer, so this route contributes the
 * page title and the surface it sits on — nothing else. The centred column and
 * page padding come from the onboarding layout.
 */
export default function ApplyPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-[20px] font-semibold leading-7 tracking-[-0.011em] text-foreground">
          انضم كتاجر إلى نُوبيان
        </h1>
        <p className="mt-1 text-[13px] leading-5 text-text-muted">
          خمس خطوات قصيرة. نراجع الطلب خلال يوم إلى يومي عمل ونخطرك بالنتيجة.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card p-5 sm:p-7">
        <OnboardingWizard />
      </div>
    </>
  )
}
