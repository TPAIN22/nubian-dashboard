"use client";

import React from "react";




export default function PrivacyPolicyPage() {
  return (
    <main className="relative z-10 pt-28 pb-16">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-black mb-8">سياسة الخصوصية</h1>

        <div className=" p-8 rounded-lg shadow-lg space-y-6 text-right">
          <p className="text-black leading-relaxed">
            نحن في تطبيق <span className="font-semibold text-amber-600">نوبيان</span> نحترم خصوصيتك وملتزمون بحماية بياناتك
            الشخصية. تهدف هذه السياسة إلى توضيح كيفية جمع، استخدام، تخزين، ومشاركة معلوماتك عند استخدامك لتطبيق ماركت.
          </p>

          {/* Section 1: Information We Collect */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-black border-b pb-2">1. المعلومات التي نجمعها</h2>

            <h3 className="text-xl font-semibold text-black">1.1 معلومات شخصية</h3>
            <p className="text-black leading-relaxed">قد نقوم بجمع المعلومات التالية عند التسجيل أو أثناء استخدامك للتطبيق:</p>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>الاسم الكامل</li>
              <li>البريد الإلكتروني</li>
              <li>رقم الهاتف</li>
              <li>العنوان الكامل (للتوصيل)</li>
              <li>معلومات الدفع (بطاقات الائتمان، الدفع عند الاستلام، إلخ.)</li>
              <li>صورة الملف الشخصي (اختياري)</li>
            </ul>

            <h3 className="text-xl font-semibold text-black pt-4">1.2 معلومات الاستخدام</h3>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>المنتجات التي بحثت عنها أو اشتريتها</li>
              <li>الوقت والتاريخ والمدة التي تستخدم فيها التطبيق</li>
              <li>تفاعلك مع العروض أو التنبيهات</li>
              <li>التعليقات أو التقييمات التي تتركها</li>
            </ul>

            <h3 className="text-xl font-semibold text-black pt-4">1.3 معلومات الجهاز</h3>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>نوع الجهاز ونظام التشغيل</li>
              <li>عنوان IP</li>
              <li>معرف الجهاز (Device ID)</li>
              <li>الموقع الجغرافي (بموافقتك فقط)</li>
            </ul>
          </div>

          {/* Section 2: How We Use Your Information */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">2. كيف نستخدم معلوماتك</h2>
            <p className="text-black leading-relaxed">نستخدم بياناتك للأغراض التالية:</p>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>إنشاء حساب المستخدم وتخصيص تجربته</li>
              <li>معالجة الطلبات والدفع والتوصيل</li>
              <li>إرسال الإشعارات (مثل تأكيد الطلب، حالة الشحن، العروض الخاصة)</li>
              <li>تحسين جودة الخدمة وتخصيص المحتوى</li>
              <li>الأمان والحماية من الاستخدام غير المصرح به</li>
              <li>الامتثال للقوانين والأنظمة</li>
            </ul>
          </div>

          {/* Section 3: Information Sharing */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">3. مشاركة المعلومات</h2>
            <p className="text-black leading-relaxed">
              لن نقوم ببيع أو تأجير معلوماتك الشخصية لأي طرف ثالث. قد نشارك بياناتك فقط مع:
            </p>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>شركاء التوصيل (مثل شركات الشحن)</li>
              <li>مزودي الدفع الإلكتروني</li>
              <li>مزودي خدمات التحليلات (مثل Google Analytics)</li>
              <li>الجهات الرسمية (في حال الطلب القانوني)</li>
            </ul>
          </div>

          {/* Section 4: Data Protection */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">4. حماية البيانات</h2>
            <p className="text-black leading-relaxed">
              نطبق إجراءات أمنية تقنية وتنظيمية لحماية بياناتك من الوصول غير المصرح به أو التعديل أو الكشف أو التدمير. من
              هذه الإجراءات:
            </p>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>تشفير البيانات أثناء النقل والتخزين</li>
              <li>التحقق الثنائي (2FA) عند تسجيل الدخول (اختياري)</li>
              <li>مراقبة الأنشطة المشبوهة</li>
            </ul>
          </div>

          {/* Section 5: User Rights */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">5. حقوق المستخدم</h2>
            <p className="text-black leading-relaxed">بصفتك مستخدمًا، لك الحق في:</p>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>الوصول إلى بياناتك الشخصية</li>
              <li>طلب تصحيح أو حذف بياناتك</li>
              <li>الاعتراض على استخدام بياناتك لأغراض تسويقية</li>
              <li>إلغاء الاشتراك في الإشعارات</li>
            </ul>
            <p className="text-black leading-relaxed">
              لطلب أي من هذه الحقوق، يمكنك التواصل معنا عبر البريد:{" "}
              <a href="mailto:mamyafreka@gmail.com" className="text-amber-600 hover:underline">
                mamyafreka@gmail.com
              </a>
            </p>
          </div>

          {/* Section 6: Cookies */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">6. ملفات تعريف الارتباط (Cookies)</h2>
            <p className="text-black leading-relaxed">
              قد نستخدم ملفات تعريف الارتباط وتقنيات مشابهة لتحسين تجربتك داخل التطبيق، مثل:
            </p>
            <ul className="list-disc list-inside text-black space-y-1 pr-4">
              <li>تذكر إعداداتك</li>
              <li>تتبع العروض التي شاهدتها</li>
              <li>تحليل سلوك المستخدم لتحسين المنتج</li>
            </ul>
            <p className="text-black leading-relaxed">يمكنك تعديل إعدادات الكوكيز من خلال إعدادات الجهاز.</p>
          </div>

          {/* Section 7: Children's Privacy */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">7. خصوصية الأطفال</h2>
            <p className="text-black leading-relaxed">
              تطبيق نوبيان غير موجه للأطفال دون سن 13 عامًا. لا نقوم بجمع معلومات شخصية منهم عن قصد. إذا اكتشفنا أننا جمعنا
              معلومات عن طفل دون علم، فسنقوم بحذفها فورًا.
            </p>
          </div>

          {/* Section 8: Updates to Privacy Policy */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">8. التحديثات على سياسة الخصوصية</h2>
            <p className="text-black leading-relaxed">
              قد نقوم بتحديث هذه السياسة من وقت لآخر. سنبلغك بأي تغييرات عبر التطبيق أو البريد الإلكتروني. استمرارك في
              استخدام التطبيق بعد التحديث يعني موافقتك على السياسة الجديدة.
            </p>
          </div>

          {/* Section 9: Contact Us */}
          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-black border-b pb-2">9. تواصل معنا</h2>
            <p className="text-black leading-relaxed">إذا كان لديك أي أسئلة أو استفسارات، يُرجى التواصل معنا عبر:</p>
            <p className="text-black leading-relaxed">
              📧 البريد الإلكتروني:{" "}
              <a href="mailto:mamyafreka@gmail.com" className="text-amber-600 hover:underline">
                mamyafreka@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}




