import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Feature } from "./data";

interface FeaturesSectionProps {
  features: Feature[];
}

const SECTION_CONTENT = {
  badge: {
    text: "لـــمــاذا تــخــتــار نـوبـيــــــان",
    ariaLabel: "Why Choose Nubian"
  },
  heading: {
    prefix: "لـــمــاذا التـــســوق مــن",
    highlight: "نـوبـيــــــان",
    suffix: "؟"
  },
  description: "منصة التجارة الإلكترونية الرائدة في السودان تقدم منتجات عالية الجودة وأسعارًا تنافسية وخدمة استثنائية.",
  cta: {
    text: "المزيد",
    ariaLabel: "اعرف المزيد"
  }
};

export default function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section 
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Features Section"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10" />

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
            {SECTION_CONTENT.heading.prefix}
            <p className="block md:inline bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3 drop-shadow-sm">
              {SECTION_CONTENT.heading.highlight}
            </p>
            {SECTION_CONTENT.heading.suffix}
          </h2>

          {/* Description */}
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-2 leading-relaxed font-medium">
            {SECTION_CONTENT.description}
          </p>
        </div>

        {/* Features Grid */}
        <div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          role="list"
          aria-label="Platform Features"
        >
          {features.map((feature, index) => (
            <Card 
              key={`feature-${index}`}
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

              <CardContent className="relative p-8 md:p-10 text-center space-y-6">
                {/* Icon Container */}
                <div className="relative inline-block">
                  <div 
                    className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                  >
                    <div className="scale-125">
                      {feature.icon}
                    </div>
                  </div>
                  
                  {/* Glow effect */}
                  <div 
                    className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500 rounded-2xl blur-2xl scale-150`}
                  />
                  
                  {/* Floating particles effect */}
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-accent rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }} />
                </div>

                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium min-h-[4rem]">
                  {feature.desc}
                </p>

                {/* CTA Button */}
                <div className="pt-4">
                  <Button 
                    variant="ghost" 
                    className="text-foreground hover:text-primary hover:bg-primary/5 group/btn transition-all duration-300 font-bold text-base px-6 py-2 rounded-lg"
                    aria-label={`${SECTION_CONTENT.cta.ariaLabel} - ${feature.title}`}
                  >
                    {SECTION_CONTENT.cta.text}
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover/btn:translate-x-1 transition-transform duration-300" />
                  </Button>
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
            <span>اكتشف المزيد من المميزات</span>
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
