import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Download, Users } from "lucide-react";

const SECTION_CONTENT = {
  badge: {
    text: "ابدأ رحلتك معنا",
    ariaLabel: "Start Your Journey"
  },
  heading: {
    prefix: "ابــدا التســوق ",
    highlight: "الــيـــوم ",
    suffix: "!"
  },
  description: "انضم إلى ملايين العملاء الراضين في جميع أنحاء السودان. حمّل تطبيقنا للحصول على عروض حصرية، ودفع أسرع، وتوصيات شخصية.",
  ctaButtons: [
    {
      label: "حمـــل التـــطبــيــق",
      variant: "default" as const,
      icon: <Download className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />,
      ariaLabel: "Download App"
    },
    {
      label: "انضم الى اسـرة نـوبـيـان",
      variant: "outline" as const,
      icon: <Users className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />,
      ariaLabel: "Join Nubian Family"
    }
  ]
};

export default function CtaSection() {
  return (
    <section 
      className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Call to Action Section"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }} />

      {/* Gradient Orbs */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-7xl mx-auto">
        <div className="relative">
          {/* Main CTA Card */}
          <div className="relative rounded-3xl overflow-hidden backdrop-blur-xl bg-gradient-to-br from-background/95 via-background/90 to-background/80 border border-border/50 shadow-2xl">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-50" />
            
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            {/* Content */}
            <div className="relative z-10 text-center py-16 md:py-20 px-6 md:px-12 space-y-8 animate-fade-in-up">
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
              <Link href="/merchant/apply" className="inline-block hover:scale-105 transition-transform duration-300">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-tight cursor-pointer">
                  {SECTION_CONTENT.heading.prefix}
                  <span className="block md:inline bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent mt-2 md:mt-0 md:mx-3 drop-shadow-sm">
                    {SECTION_CONTENT.heading.highlight}
                  </span>
                  {SECTION_CONTENT.heading.suffix}
                </h2>
              </Link>

              {/* Description */}
              <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
                {SECTION_CONTENT.description}
              </p>

              {/* CTA Buttons */}
              <nav 
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                aria-label="Action Buttons"
              >
                {SECTION_CONTENT.ctaButtons.map((button, index) => {
                  const ButtonComponent = button.variant === "outline" ? (
                    <Link href="/merchant/apply" key={`cta-${index}`}>
                      <Button
                        size="lg"
                        variant={button.variant}
                        className="relative border-2 border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group backdrop-blur-sm bg-background/50 shadow-xl font-bold px-8 py-7 text-lg rounded-xl overflow-hidden"
                        aria-label={button.ariaLabel}
                      >
                        <span className="relative z-10 flex items-center">
                          {button.icon}
                          {button.label}
                        </span>
                        <div className="absolute inset-0 bg-foreground/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      key={`cta-${index}`}
                      size="lg"
                      variant={button.variant}
                      className="relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-0 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group font-bold px-8 py-7 text-lg rounded-xl overflow-hidden"
                      aria-label={button.ariaLabel}
                    >
                      <span className="relative z-10 flex items-center">
                        {button.label}
                        {button.icon}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                    </Button>
                  );
                  
                  return ButtonComponent;
                })}
              </nav>
            </div>
            {/* Decorative bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
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
