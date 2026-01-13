"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Facebook, Instagram, Twitter } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="relative z-10 pt-28 pb-16 min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-4">
            اتصل بنا
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            نحن هنا لمساعدتك. تواصل معنا عبر أي من الطرق التالية
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Contact Information */}
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="p-8 md:p-10 space-y-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground border-b border-border pb-4">
                معلومات الاتصال
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 text-lg">البريد الإلكتروني</h3>
                    <a 
                      href="mailto:info@nubian-sd.info" 
                      className="text-muted-foreground hover:text-primary transition-colors break-all"
                    >
                      info@nubian-sd.info
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 text-lg">الهاتف</h3>
                    <a 
                      href="tel:+966-583-104-518" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      +966-583-104-518
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 text-lg">العنوان</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      شارع النيل، الخرطوم، السودان
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1 text-lg">ساعات العمل</h3>
                    <p className="text-muted-foreground">متاح على مدار الساعة</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="font-semibold text-foreground mb-4 text-lg">تابعنا</h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.facebook.com/profile.php?id=61577343351976"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300"
                    aria-label="Facebook"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href="https://www.instagram.com/sd_nubian?igsh=dXBrY3FraWppMnox"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a
                    href="https://x.com/nubian_sd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300"
                    aria-label="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Form */}
          <Card className="border-0 shadow-lg bg-card">
            <CardContent className="p-8 md:p-10">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground border-b border-border pb-4 mb-6">
                أرسل لنا رسالة
              </h2>

              <form className="space-y-6" onSubmit={(e) => e.preventDefault()} dir="rtl">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">
                    الاسم
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="أدخل اسمك"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-foreground font-medium">
                    الموضوع
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="موضوع الرسالة"
                    className="h-11"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-foreground font-medium">
                    الرسالة
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="اكتب رسالتك هنا"
                    className="min-h-[140px] resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  إرسال الرسالة
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="border-0 shadow-lg bg-card">
          <CardContent className="p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground border-b border-border pb-4 mb-6">
              أسئلة شائعة
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">
                  كيف يمكنني متابعة طلبي؟
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  يمكنك متابعة طلبك من خلال حسابك الشخصي على المنصة أو التواصل معنا مباشرة.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">
                  ما هي طرق الدفع المتاحة؟
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  نقبل الدفع النقدي عند الاستلام، البطاقات الائتمانية، والتحويل البنكي.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">
                  ما هي مدة الشحن؟
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  مدة الشحن تتراوح بين 2-7 أيام عمل حسب الموقع داخل السودان.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}





