import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Quote, Star, Sparkles } from "lucide-react";
import { Testimonial } from "./data";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

const SECTION_CONTENT = {
  badge: {
    text: "مــاذا يــقــول عــمــلاؤنــا",
    ariaLabel: "What Our Customers Say"
  },
  heading: {
    main: "آراء عــمــلائــنــا",
    highlight: "الــســعــداء"
  },
  description: "نحن نفخر بتقديم أفضل تجربة تسوق لعملائنا الكرام."
};

export default function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section 
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Testimonials Section"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20 space-y-6 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-block">
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0 hover:scale-105 transition-all duration-300 px-6 py-2 text-sm font-bold shadow-lg backdrop-blur-sm"
              aria-label={SECTION_CONTENT.badge.ariaLabel}
            >
              <Sparkles className="w-4 h-4 ml-2 animate-pulse" aria-hidden="true" />
              {SECTION_CONTENT.badge.text}
            </Badge>
          </div>

          {/* Heading */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight">
            {SECTION_CONTENT.heading.main}
            <span className="block md:inline bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3 drop-shadow-sm">
              {SECTION_CONTENT.heading.highlight}
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            {SECTION_CONTENT.description}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          role="list"
          aria-label="Customer Testimonials"
        >
          {testimonials.map((testimonial, index) => (
            <Card 
              key={`testimonial-${index}`}
              className="group relative border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-background via-background to-background/50 backdrop-blur-sm overflow-hidden"
              role="listitem"
              style={{
                animation: `fade-in-up 0.6s ease-out forwards ${0.1 + index * 0.1}s`,
                opacity: 0
              }}
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              <CardContent className="relative p-6 md:p-8 text-right space-y-4">
                {/* Quote Icon */}
                <div className="absolute top-4 left-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                  <Quote className="w-16 h-16 text-primary transform -scale-x-100" />
                </div>

                {/* Avatar and Quote */}
                <div className="flex items-start gap-4 relative z-10">
                  <div className="flex-shrink-0 relative">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-primary/50 group-hover:border-primary transition-all duration-300 group-hover:scale-110 shadow-lg" 
                    />
                    {/* Glow effect on avatar */}
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 scale-150" />
                  </div>
                  <div className="flex-grow">
                    <p className="text-foreground leading-relaxed text-sm md:text-base italic font-medium relative">
                      {testimonial.quote}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="pt-4 border-t border-border/50 mt-4 relative">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-full transition-all duration-500" />
                </div>

                {/* Name and Rating */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors duration-300">
                    {testimonial.name}
                  </h4>
                  <div className="flex gap-1 text-primary">
                    {[...Array(testimonial.rating)].map((_, starIndex) => (
                      <Star 
                        key={`filled-${starIndex}`} 
                        className="w-4 h-4 fill-current group-hover:scale-110 transition-transform duration-300" 
                        style={{ transitionDelay: `${starIndex * 0.05}s` }}
                      />
                    ))}
                    {[...Array(5 - testimonial.rating)].map((_, starIndex) => (
                      <Star 
                        key={`empty-${starIndex}`} 
                        className="w-4 h-4 text-muted-foreground/50" 
                      />
                    ))}
                  </div>
                </div>

                {/* Bottom decorative element */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-3/4 transition-all duration-500 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 md:mt-20 text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <div className="inline-flex items-center gap-3 text-sm md:text-base text-muted-foreground font-medium">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-border" />
            <span>اكتشف المزيد من آراء عملائنا</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-border" />
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}
