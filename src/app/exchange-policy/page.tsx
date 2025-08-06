"use client";

import React from 'react';
import Header from '@/components/Header'; // استيراد مكون Header
import Footer from '@/components/Footer'; // استيراد مكون Footer

export default function ExchangePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden" dir="rtl">
      <Header /> {/* دمج مكون Header */}

      <main className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 text-center">
          سياسة الاستبدال
        </h1>

        <div className="bg-white p-8 rounded-lg shadow-lg space-y-6 text-right">
          <p className="text-slate-700 leading-relaxed">
            نحن في تطبيق <span className="font-semibold text-amber-600">نوبيان</span> نلتزم بتقديم أفضل المنتجات لعملائنا. نظرًا لطبيعة بعض منتجاتنا ولضمان سلامتكم وجودة الخدمة، فإننا نقدم سياسة استبدال للمنتجات المؤهلة، ولا نقدم سياسة استرجاع نقدي.
          </p>

          {/* Section 1: شروط الاستبدال */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              1. شروط الاستبدال
            </h2>
            <ul className="list-disc list-inside text-slate-700 space-y-1 pr-4">
              <li>يجب أن يتم طلب الاستبدال خلال <span className="font-semibold">7 أيام</span> من تاريخ استلام الطلب.</li>
              <li>يجب أن يكون المنتج في حالته الأصلية، غير مستخدم، وغير تالف، ومع جميع الملصقات والعبوات الأصلية.</li>
              <li>يجب إرفاق فاتورة الشراء الأصلية أو إثبات الشراء.</li>
              <li>بعض المنتجات (مثل: الملابس الداخلية، مستحضرات التجميل، المنتجات الغذائية، المنتجات المخصصة) قد لا تكون مؤهلة للاستبدال لأسباب صحية أو تتعلق بالسلامة. يرجى مراجعة وصف المنتج قبل الشراء.</li>
            </ul>
          </div>

          {/* Section 2: حالات الاستبدال المقبولة */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              2. حالات الاستبدال المقبولة
            </h2>
            <ul className="list-disc list-inside text-slate-700 space-y-1 pr-4">
              <li>إذا كان المنتج الذي استلمته معيباً أو تالفاً.</li>
              <li>إذا كان المنتج المستلم غير مطابق للوصف أو الصورة المعروضة في التطبيق.</li>
              <li>إذا كان هناك خطأ في المقاس أو اللون المرسل (بشرط توفره).</li>
            </ul>
          </div>

          {/* Section 3: عملية الاستبدال */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              3. عملية الاستبدال
            </h2>
            <ol className="list-decimal list-inside text-slate-700 space-y-2 pr-4">
              <li>
                <span className="font-semibold">التواصل معنا:</span> يرجى إرسال بريد إلكتروني إلى <a href="mailto:support@marketapp.com" className="text-amber-600 hover:underline">support@marketapp.com</a> أو الاتصال بخدمة العملاء خلال الفترة المحددة، مع توضيح سبب الاستبدال وتقديم رقم الطلب وتفاصيل المنتج.
              </li>
              <li>
                <span className="font-semibold">مراجعة الطلب:</span> سيقوم فريقنا بمراجعة طلبك والتأكد من استيفائه للشروط.
              </li>
              <li>
                <span className="font-semibold">تنسيق الشحن:</span> بعد الموافقة، سيتم تزويدك بتعليمات حول كيفية إعادة المنتج.
              </li>
              <li>
                <span className="font-semibold">فحص المنتج:</span> عند استلام المنتج، سيتم فحصه للتأكد من مطابقته للشروط.
              </li>
              <li>
                <span className="font-semibold">إرسال المنتج البديل:</span> بعد الفحص، سيتم إرسال المنتج البديل إليك. إذا لم يكن المنتج البديل متوفراً، سيتم تزويدك برصيد شراء بقيمة المنتج لاستخدامه في مشتريات مستقبلية.
              </li>
            </ol>
          </div>

          {/* Section 4: تكاليف الشحن للاستبدال */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              4. تكاليف الشحن للاستبدال
            </h2>
            <ul className="list-disc list-inside text-slate-700 space-y-1 pr-4">
              <li>في حالة استبدال المنتج بسبب عيب مصنعي أو خطأ من جانب نوبيان (مثل إرسال منتج خاطئ)، سنتحمل نحن تكاليف الشحن للاستبدال.</li>
              <li>في الحالات الأخرى (مثل تغيير المقاس أو اللون بناءً على طلب العميل)، قد يتحمل العميل تكاليف الشحن للاستبدال. سيتم إبلاغك بذلك مسبقاً.</li>
            </ul>
          </div>

          {/* Section 5: التواصل */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">
              5. التواصل
            </h2>
            <p className="text-slate-700 leading-relaxed">
              لأي استفسارات بخصوص سياسة الاستبدال، يرجى التواصل معنا عبر:
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
