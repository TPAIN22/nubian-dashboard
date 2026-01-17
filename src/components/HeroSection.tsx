import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Play, ChevronDown, Store, CreditCard, BarChart3, Truck } from "lucide-react";
import Image from "next/image";
import { Stat } from "./data";

interface HeroSectionProps {
  stats: Stat[];
}

type CTAButton = {
  label: string;
  variant: "default" | "outline";
  icon: React.ReactNode;
  ariaLabel: string;
  href: string;
};

const HERO_CONTENT: {
  badge: { text: string; ariaLabel: string };
  title: { main: string; brand: string; subtitle: string };
  description: string;
  ctaButtons: CTAButton[];
  image: { src: string; alt: string; width: number; height: number };
} = {
  badge: {
    text: "الــســوق الســـودانـــي",
    ariaLabel: "Sudanese Market Badge",
  },
  title: {
    main: "نُوبيان — سوق يوصّل منتجاتك للعالم",
    brand: "",
    subtitle: "",
  },
  description:
    "منصة رقمية تجمع التجار والمشترين. للتجار: ابدأ البيع ووصل لعملاء جدد. للمشترين: تسوق منتجات أصيلة بثقة.",
  ctaButtons: [
    {
      label: "ابدأ البيع كتاجر",
      variant: "default",
      icon: <ArrowRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />,
      ariaLabel: "ابدأ البيع كتاجر - Start Selling as Merchant",
      href: "/merchant/apply",
    },
    {
      label: "تسوّق الآن",
      variant: "outline",
      icon: <Play className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />,
      ariaLabel: "تسوّق الآن - Shop Now",
      href: "https://play.google.com/store/apps/details?id=dev.expo.nubian",
    },
  ],
  image: {
    src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2670&auto=format&fit=crop",
    alt: "نوبيان - Nubian Banner - التراث السوداني والثقافة الأفريقية - Modern marketplace and e-commerce platform",
    width: 1200,
    height: 800,
  },
};

export default function HeroSection({ stats }: HeroSectionProps) {
  const scrollToStats = () => {
    const statsSection = document.getElementById('stats-section');
    statsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full overflow-auto sm:pt-34" aria-label="Hero Section">
      {/* Hero Banner Image - Full Width */}
      <div className="relative w-full h-screen min-h-[600px] max-h-[900px]">
        {/* Background Image with Ken Burns effect */}
        <div className="absolute inset-0">
          <Image
            src={HERO_CONTENT.image.src}
            alt={HERO_CONTENT.image.alt}
            fill
            priority
            fetchPriority="high"
            className="object-cover animate-[ken-burns_20s_ease-in-out_infinite]"
            sizes="100vw"
            quality={95}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          />
        </div>

        {/* Professional Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/65 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        {/* Content Container */}
        <div className="relative z-10 h-full flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="max-w-4xl">
              {/* Badge with Modern Design */}
              <div className="mb-6 mt-24 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-primary/90 to-primary text-white border-0 hover:scale-105 transition-all duration-300 inline-flex items-center shadow-2xl px-5 py-2 text-sm font-bold backdrop-blur-xl rounded-full"
                  aria-label={HERO_CONTENT.badge.ariaLabel}
                >
                  <Sparkles className="w-4 h-4 mr-2 animate-pulse" aria-hidden="true" />
                  {HERO_CONTENT.badge.text}
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl -z-10" />
                </Badge>
              </div>

              {/* Title with Staggered Animation */}
              <header className="space-y-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                  <span className="block text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    {HERO_CONTENT.title.main}
                  </span>
                  {HERO_CONTENT.title.brand && (
                    <span className="block bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] mt-1 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                      {HERO_CONTENT.title.brand}
                    </span>
                  )}
                  {HERO_CONTENT.title.subtitle && (
                    <span className="block text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] mt-1 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                      {HERO_CONTENT.title.subtitle}
                    </span>
                  )}
                </h1>
              </header>

              {/* Description with Better Typography */}
              <p className="text-xl md:text-2xl lg:text-3xl text-white/95 max-w-2xl leading-relaxed font-medium drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                {HERO_CONTENT.description}
              </p>

              {/* Modern CTA Buttons with QR Code */}
              <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 lg:gap-8 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                {/* CTA Buttons */}
                <nav 
                  className="flex flex-col sm:flex-row gap-4"
                  aria-label="Call to Action Links"
                >
                  {HERO_CONTENT.ctaButtons.map((button, index) => {
                    const buttonClassName = button.variant === "default"
                      ? "relative bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white border-0 shadow-2xl hover:shadow-primary/50 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group font-bold px-8 py-7 text-lg rounded-xl overflow-hidden"
                      : "relative border-2 border-white/90 text-white hover:bg-white hover:text-black transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 group backdrop-blur-xl bg-white/10 shadow-xl font-bold px-8 py-7 text-lg rounded-xl overflow-hidden";

                    const buttonContent = (
                      <>
                        <span className="relative z-10 flex items-center">
                          {button.variant === "default" ? (
                            <>
                              {button.label}
                              {button.icon}
                            </>
                          ) : (
                            <>
                              {button.icon}
                              {button.label}
                            </>
                          )}
                        </span>
                        <div className={`absolute inset-0 ${button.variant === "default" ? "bg-gradient-to-r from-primary/0 via-white/20 to-primary/0" : "bg-white/0"} translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700`} />
                      </>
                    );

                    if (button.href.startsWith('#')) {
                      return (
                        <a
                          key={`cta-link-${index}`}
                          href={button.href}
                          onClick={(e) => {
                            e.preventDefault();
                            const element = document.querySelector(button.href);
                            element?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="block"
                        >
                          <Button
                            size="lg"
                            variant={button.variant}
                            className={buttonClassName}
                            aria-label={button.ariaLabel}
                          >
                            {buttonContent}
                          </Button>
                        </a>
                      );
                    }

                    if (button.href.startsWith('http')) {
                      return (
                        <a
                          key={`cta-link-${index}`}
                          href={button.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Button
                            size="lg"
                            variant={button.variant}
                            className={buttonClassName}
                            aria-label={button.ariaLabel}
                          >
                            {buttonContent}
                          </Button>
                        </a>
                      );
                    }

                    return (
                      <Link key={`cta-link-${index}`} href={button.href}>
                        <Button
                          size="lg"
                          variant={button.variant}
                          className={buttonClassName}
                          aria-label={button.ariaLabel}
                        >
                          {buttonContent}
                        </Button>
                      </Link>
                    );
                  })}
                </nav>

                {/* QR Code - Beside buttons on desktop, below on mobile */}
                <div className="flex flex-col items-center gap-3 lg:pt-2 lg:ml-8 lg:mr-auto">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                    <a
                      href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative inline-block bg-white p-4 rounded-2xl shadow-2xl hover:shadow-white/50 transition-all duration-300 hover:scale-105"
                      aria-label="QR Code - حمّل تطبيق نوبيان من Google Play"
                    >
                      <Image
                        src="/qr-code.svg"
                        alt="QR Code - حمّل تطبيق نوبيان"
                        width={140}
                        height={140}
                        className="w-[140px] h-[140px]"
                      />
                    </a>
                  </div>
                  <p className="text-white/90 text-xs font-medium text-center max-w-[140px]">
                    امسح الكود لتحميل التطبيق
                  </p>
                </div>
              </div>

              {/* Trust Row */}
              <div className="flex flex-wrap items-center gap-6 mt-6 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                <div className="flex items-center gap-2 text-white/90">
                  <Store className="w-5 h-5" />
                  <span className="text-sm font-medium">دعم للتجار</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-medium">مدفوعات</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <BarChart3 className="w-5 h-5" />
                  <span className="text-sm font-medium">لوحة تحكم</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <Truck className="w-5 h-5" />
                  <span className="text-sm font-medium">شحن</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Scroll Indicator */}
      
      </div>

      {/* Enhanced Stats Section */}
      <div id="stats-section" className="relative bg-gradient-to-b from-background to-background/50 backdrop-blur-sm border-t border-border/50">
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-16 md:py-24">
          <div
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12"
            role="region"
            aria-label="Platform Statistics"
          >
            {stats.map((stat, index) => (
              <div
                key={`stat-${index}`}
                className="group relative text-center transition-all duration-500 hover:scale-105"
                role="article"
                aria-label={`${stat.label}: ${stat.number}`}
                style={{
                  animation: `fade-in-up 0.6s ease-out forwards ${0.8 + index * 0.1}s`,
                  opacity: 0
                }}
              >
                {/* Card Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative p-6">
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center mb-4 text-primary/70 group-hover:text-primary group-hover:scale-110 transition-all duration-300"
                    aria-hidden="true"
                  >
                    <div className="relative">
                      {stat.icon}
                      <div className="absolute inset-0 blur-xl bg-primary/20 group-hover:bg-primary/40 transition-colors duration-300 scale-150" />
                    </div>
                  </div>
                  
                  {/* Number */}
                  <div 
                    className="text-4xl md:text-5xl lg:text-6xl font-black mb-2 bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300" 
                    aria-label={stat.number}
                  >
                    {stat.number}
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm md:text-base text-muted-foreground font-semibold leading-tight group-hover:text-foreground transition-colors duration-300">
                    {stat.label}
                  </div>
                  
                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-500 group-hover:w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative Bottom Element */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
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

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes scroll-down {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          40% {
            opacity: 1;
          }
          100% {
            transform: translateY(16px);
            opacity: 0;
          }
        }

        @keyframes ken-burns {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-scroll-down {
          animation: scroll-down 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
