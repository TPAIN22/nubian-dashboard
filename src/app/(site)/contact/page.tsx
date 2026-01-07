"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
  return (
    <main className="relative z-10 pt-28 pb-16">
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 text-center">اتصل بنا | Contact Us</h1>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white p-8 rounded-lg shadow-lg space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2">معلومات الاتصال | Contact Information</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-amber-600 mb-2">البريد الإلكتروني | Email</h3>
                <p className="text-slate-700">
                  <a href="mailto:info@nubian-sd.info" className="hover:text-amber-600 transition-colors">
                    info@nubian-sd.info
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-amber-600 mb-2">الهاتف | Phone</h3>
                <p className="text-slate-700">
                  <a href="tel:+966-583-104-518" className="hover:text-amber-600 transition-colors">
                    +966-583-104-518
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-amber-600 mb-2">العنوان | Address</h3>
                <p className="text-slate-700">
                  شارع النيل، الخرطوم، السودان
                  <br />
                  Nile Street, Khartoum, Sudan
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-amber-600 mb-2">ساعات العمل | Working Hours</h3>
                <p className="text-slate-700">متاح على مدار الساعة | Available 24/7</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-semibold text-amber-600 mb-3">تابعنا | Follow Us</h3>
              <div className="flex gap-4">
                <a
                  href="https://www.facebook.com/profile.php?id=61577343351976"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-amber-600 transition-colors"
                  aria-label="Facebook"
                >
                  Facebook
                </a>
                <a
                  href="https://www.instagram.com/sd_nubian?igsh=dXBrY3FraWppMnox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-amber-600 transition-colors"
                  aria-label="Instagram"
                >
                  Instagram
                </a>
                <a
                  href="https://x.com/nubian_sd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-600 hover:text-amber-600 transition-colors"
                  aria-label="Twitter"
                >
                  Twitter
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-slate-800 border-b pb-2 mb-6">أرسل لنا رسالة | Send Us a Message</h2>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <Label htmlFor="name" className="text-right block mb-2">
                  الاسم | Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="أدخل اسمك | Enter your name"
                  className="text-right"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-right block mb-2">
                  البريد الإلكتروني | Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  className="text-right"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject" className="text-right block mb-2">
                  الموضوع | Subject
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="موضوع الرسالة | Message subject"
                  className="text-right"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-right block mb-2">
                  الرسالة | Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="اكتب رسالتك هنا | Write your message here"
                  className="text-right min-h-[120px]"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                إرسال | Send
              </Button>
            </form>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-slate-800 border-b pb-2 mb-4">أسئلة شائعة | Frequently Asked Questions</h2>
          <div className="space-y-4 text-right">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">كيف يمكنني متابعة طلبي؟ | How can I track my order?</h3>
              <p className="text-slate-700">يمكنك متابعة طلبك من خلال حسابك الشخصي على المنصة أو التواصل معنا مباشرة.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">ما هي طرق الدفع المتاحة؟ | What payment methods are available?</h3>
              <p className="text-slate-700">نقبل الدفع النقدي عند الاستلام، البطاقات الائتمانية، والتحويل البنكي.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">ما هي مدة الشحن؟ | What is the shipping duration?</h3>
              <p className="text-slate-700">مدة الشحن تتراوح بين 2-7 أيام عمل حسب الموقع داخل السودان.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}




