import { Metadata } from 'next';
import OnboardingWizard from './components/OnboardingWizard';

export const metadata: Metadata = {
  title: 'تسجيل التاجر | انضم إلى منصتنا',
  description: 'سجّل كتاجر وابدأ البيع اليوم.',
};

export default function ApplyPage() {
  return (
    <div dir="rtl" className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight">
            انضم كتاجر جديد
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            انضم إلى السوق الرائد في السودان وابدأ في تنمية أعمالك.
          </p>
        </div>

        <div className="bg-card text-card-foreground py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border">
          <OnboardingWizard />
        </div>
      </div>
    </div>
  );
}
