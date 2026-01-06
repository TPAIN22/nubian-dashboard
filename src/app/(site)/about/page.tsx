"use client";

import React from "react";

export default function AboutPage() {
  return (
    <main className="relative z-10 pt-28 pb-16">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 text-center">
          عن نوبيان | About Nubian
        </h1>

        <div className="bg-white p-8 rounded-lg shadow-lg space-y-6 text-right">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">من نحن | Who We Are</h2>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold text-amber-600">نوبيان (Nubian)</span> هو متجر إلكتروني رائد في السودان،
              يهدف إلى توفير تجربة تسوق استثنائية لعملائنا من خلال تقديم آلاف المنتجات الأصلية من أفضل العلامات التجارية
              والتجار المعتمدين. نحن ملتزمون بجلب أحدث المنتجات في مجالات الأزياء، الإلكترونيات، ديكور المنزل، ومجموعة
              واسعة من السلع الأخرى.
            </p>
            <p className="text-slate-700 leading-relaxed">
              <span className="font-semibold text-amber-600">Nubian</span> is a leading online store in Sudan, dedicated
              to providing an exceptional shopping experience for our customers by offering thousands of authentic
              products from the best merchant and trusted sellers. We are committed to bringing you the latest products
              in fashion, electronics, home decor, and a wide range of other goods.
            </p>
          </div>

          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">رؤيتنا | Our Vision</h2>
            <p className="text-slate-700 leading-relaxed">
              أن نكون المنصة الرائدة للتسوق الإلكتروني في السودان، ونوفر لعملائنا تجربة تسوق سهلة وآمنة ومريحة مع ضمان جودة
              المنتجات وأصالتها.
            </p>
            <p className="text-slate-700 leading-relaxed">
              To be the leading e-commerce platform in Sudan, providing our customers with an easy, secure, and
              convenient shopping experience while ensuring product quality and authenticity.
            </p>
          </div>

          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">مهمتنا | Our Mission</h2>
            <ul className="list-disc list-inside text-slate-700 space-y-2 pr-4">
              <li>تقديم منتجات أصلية وعالية الجودة من تجار معتمدين</li>
              <li>توفير تجربة تسوق سلسة وآمنة لعملائنا</li>
              <li>ضمان شحن سريع وآمن إلى جميع أنحاء السودان</li>
              <li>تقديم خدمة عملاء متميزة ودعم مستمر</li>
              <li>بناء مجتمع تسوق رقمي موثوق ومزدهر</li>
            </ul>
            <ul className="list-disc list-inside text-slate-700 space-y-2 pr-4 mt-4">
              <li>Providing authentic and high-quality products from trusted sellers</li>
              <li>Offering a smooth and secure shopping experience for our customers</li>
              <li>Ensuring fast and secure shipping across Sudan</li>
              <li>Delivering exceptional customer service and ongoing support</li>
              <li>Building a trusted and thriving digital shopping community</li>
            </ul>
          </div>

          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">قيمنا | Our Values</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-600 mb-2">الجودة | Quality</h3>
                <p className="text-slate-700 text-sm">نضمن جودة وأصالة جميع منتجاتنا</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-600 mb-2">الثقة | Trust</h3>
                <p className="text-slate-700 text-sm">نبني علاقات طويلة الأمد مع عملائنا</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-600 mb-2">الشفافية | Transparency</h3>
                <p className="text-slate-700 text-sm">شفافية كاملة في جميع معاملاتنا</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-amber-600 mb-2">الابتكار | Innovation</h3>
                <p className="text-slate-700 text-sm">نطور باستمرار منصة التسوق لدينا</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">لماذا نوبيان؟ | Why Nubian?</h2>
            <ul className="list-disc list-inside text-slate-700 space-y-2 pr-4">
              <li>آلاف المنتجات الأصلية من أفضل العلامات التجارية</li>
              <li>شحن سريع وآمن إلى جميع أنحاء السودان</li>
              <li>أسعار تنافسية وعروض خاصة مستمرة</li>
              <li>خدمة عملاء متاحة على مدار الساعة</li>
              <li>منصة آمنة ومحمية للدفع الإلكتروني</li>
              <li>سياسات استبدال وإرجاع واضحة</li>
            </ul>
            <ul className="list-disc list-inside text-slate-700 space-y-2 pr-4 mt-4">
              <li>Thousands of authentic products from the best merchant</li>
              <li>Fast and secure shipping across Sudan</li>
              <li>Competitive prices and ongoing special offers</li>
              <li>24/7 customer service availability</li>
              <li>Secure and protected e-payment platform</li>
              <li>Clear exchange and return policies</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}



