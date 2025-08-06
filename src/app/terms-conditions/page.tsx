"use client";

import React from 'react';
import Header from '@/components/Header'; // استيراد مكون Header
import Footer from '@/components/Footer'; // استيراد مكون Footer

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden" dir="rtl">
      <Header /> {/* دمج مكون Header */}

      <main className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 ">
          الشروط والأحكام
        </h1>

        <div className="bg-white p-8 rounded-lg shadow-lg space-y-6 text-right">
          <p className="text-slate-700 leading-relaxed">
            مرحبًا بك في تطبيق <span className="font-semibold text-amber-600">نوبيان</span>. يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام التطبيق. باستخدامك للتطبيق، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام التطبيق.
          </p>

          {/* Section 1: مقدمة */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              1. مقدمة
            </h2>
            <p className="text-slate-700 leading-relaxed">
              تحدد هذه الشروط والأحكام القواعد واللوائح الخاصة باستخدام تطبيق نوبيان، المتوفر على الأجهزة المحمولة.
            </p>
          </div>

          {/* Section 2: استخدام التطبيق */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              2. استخدام التطبيق
            </h2>
            <p className="text-slate-700 leading-relaxed">
              يجب أن يكون عمرك 18 عامًا على الأقل لاستخدام هذا التطبيق. أنت توافق على استخدام التطبيق لأغراض قانونية فقط ووفقًا لجميع القوانين واللوائح المعمول بها.
            </p>
            <h3 className="text-xl font-semibold text-slate-700 pt-4">
              2.1 حسابات المستخدمين
            </h3>
            <p className="text-slate-700 leading-relaxed">
              عند إنشاء حساب معنا، يجب عليك تزويدنا بمعلومات دقيقة وكاملة وحديثة في جميع الأوقات. أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك وعن جميع الأنشطة التي تحدث تحت حسابك.
            </p>
          </div>

          {/* Section 3: المنتجات والخدمات */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              3. المنتجات والخدمات
            </h2>
            <p className="text-slate-700 leading-relaxed">
              نوبيان توفر منصة للمستخدمين لشراء المنتجات من البائعين. نحن لا نضمن جودة أو سلامة أو قانونية المنتجات المدرجة، ولا صحة أو دقة قوائم البائعين.
            </p>
            <h3 className="text-xl font-semibold text-slate-700 pt-4">
              3.1 الأسعار والدفع
            </h3>
            <p className="text-slate-700 leading-relaxed">
              جميع الأسعار المعروضة قابلة للتغيير. نحن نقبل طرق الدفع المحددة في التطبيق. أنت توافق على تقديم معلومات دفع صحيحة وكاملة.
            </p>
          </div>

          {/* Section 4: حقوق الملكية الفكرية */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              4. حقوق الملكية الفكرية
            </h2>
            <p className="text-slate-700 leading-relaxed">
              جميع المحتويات الموجودة في التطبيق، بما في ذلك النصوص والرسومات والشعارات والأيقونات والصور، هي ملك لنوبيان أو لمزودي المحتوى التابعين لها، وهي محمية بموجب قوانين حقوق النشر.
            </p>
          </div>

          {/* Section 5: تحديد المسؤولية */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              5. تحديد المسؤولية
            </h2>
            <p className="text-slate-700 leading-relaxed">
              لن تكون نوبيان مسؤولة عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية تنشأ عن استخدامك أو عدم قدرتك على استخدام التطبيق أو المنتجات المشتراة من خلاله.
            </p>
          </div>

          {/* Section 6: التعديلات على الشروط */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              6. التعديلات على الشروط
            </h2>
            <p className="text-slate-700 leading-relaxed">
              نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر أي تغييرات على هذه الصفحة. استمرارك في استخدام التطبيق بعد نشر التعديلات يعني موافقتك على الشروط المعدلة.
            </p>
          </div>

          {/* Section 7: القانون الحاكم */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              7. القانون الحاكم
            </h2>
            <p className="text-slate-700 leading-relaxed">
              تخضع هذه الشروط والأحكام وتفسر وفقًا لقوانين السودان، بغض النظر عن تعارض مبادئ القانون.
            </p>
          </div>

          {/* Section 8: التواصل معنا */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              8. التواصل معنا
            </h2>
            <p className="text-slate-700 leading-relaxed">
              إذا كان لديك أي أسئلة بخصوص هذه الشروط والأحكام، يرجى التواصل معنا عبر:
            </p>
            <p className="text-slate-700 leading-relaxed">
              📧 البريد الإلكتروني: <a href="mailto:support@marketapp.com" className="text-amber-600 hover:underline">support@marketapp.com</a>
            </p>
          </div>
        </div>
      </main>

      <Footer /> {/* دمج مكون Footer */}
    </div>
  );
}
