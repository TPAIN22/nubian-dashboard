import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star } from "lucide-react";
import { Testimonial } from "./data"; // استيراد الـ type

// تعريف الـ props باستخدام TypeScript
interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4 bg-primary/10 text-primary border-0">
          مــاذا يــقــول عــمــلاؤنــا
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          آراء عــمــلائــنــا الــســعــداء
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          نحن نفخر بتقديم أفضل تجربة تسوق لعملائنا الكرام.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {testimonials.map((testimonial, i) => (
          <Card key={i} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4 text-right space-y-2">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary" />
                </div>
                <div className="flex-grow">
                  <p className="text-foreground leading-relaxed text-sm italic relative">
                    <Quote className="absolute -top-4 -right-4 w-8 h-8 text-primary/20 -z-10 transform -scale-x-100" />
                    {testimonial.quote}
                  </p>
                </div>
              </div>
              <div className="pt-4 border-t border-border mt-4 flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-sm text-foreground">
                    {testimonial.name}
                  </h4>
                  <div className="flex text-primary mt-1">
                    {[...Array(testimonial.rating)].map((_, starIndex) => (
                      <Star key={starIndex} className="w-3 h-3 fill-current" />
                    ))}
                    {[...Array(5 - testimonial.rating)].map((_, starIndex) => (
                      <Star key={starIndex} className="w-3 h-3 text-muted-foreground" />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </section>
  );
}