'use client'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingBag, 
  Shield, 
  Globe, 
  Star, 
  ArrowRight, 
  Play,
  Heart,
  Users,
  Award,
  Sparkles
} from 'lucide-react';

export default function ModernNoubian() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Authentic Craftsmanship",
      desc: "Handpicked treasures from master artisans across Africa, each with a story to tell.",
      color: "#f0b745"
    },
    {
      icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Secure & Trusted",
      desc: "Bank-level security with blockchain verification for authentic product provenance.",
      color: "#30a1a7"
    },
    {
      icon: <Globe className="w-6 h-6 sm:w-8 sm:h-8" />,
      title: "Global Impact",
      desc: "Every purchase directly supports local communities and sustainable livelihoods.",
      color: "#f0b745"
    }
  ];

  const stats = [
    { number: "10K+", label: "Artisans Supported", icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { number: "50+", label: "Countries Reached", icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { number: "4.9", label: "Customer Rating", icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" /> },
    { number: "100%", label: "Authentic Products", icon: <Award className="w-4 h-4 sm:w-5 sm:h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background Elements - Hidden on mobile */}
      <div className="fixed inset-0 pointer-events-none hidden md:block">
        <div 
          className="absolute w-96 h-96 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            top: '10%',
            left: '70%',
            background: 'linear-gradient(to right, #f0b74520, #f0b74510)'
          }}
        />
        <div 
          className="absolute w-80 h-80 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
            bottom: '20%',
            left: '10%',
            background: 'linear-gradient(to right, #30a1a720, #30a1a710)'
          }}
        />
      </div>

      <main className="relative z-10 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col justify-center py-12 sm:py-16 md:py-20">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
              <div className="space-y-2">
                <Badge 
                  variant="secondary" 
                  className="hover:scale-105 transition-transform text-xs sm:text-sm"
                  style={{ 
                    background: 'linear-gradient(to right, #f0b74520, #f0b74510)',
                    color: '#f0b745',
                    border: '1px solid #f0b74530'
                  }}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Authentic African Marketplace
                </Badge>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold leading-tight text-foreground">
                  Discover
                  <br />
                  <span style={{ color: '#f0b745' }}>
                    Noubian
                  </span>
                  <br />
                  Treasures
                </h1>
              </div>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                Where ancient craftsmanship meets modern commerce. Connect directly with African artisans and bring home pieces of living culture.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  size="lg"
                  className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group w-full sm:w-auto"
                  style={{ 
                    background: 'linear-gradient(to right, #f0b745, #f0b745dd)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Explore Collection
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="hover:scale-105 transition-all duration-300 group w-full sm:w-auto"
                  style={{ 
                    borderColor: '#30a1a7',
                    color: '#30a1a7'
                  }}
                >
                  <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Watch Story
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-6 sm:pt-8">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center group cursor-pointer">
                    <div 
                      className="flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                      style={{ color: '#30a1a7' }}
                    >
                      {stat.icon}
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{stat.number}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative order-1 lg:order-2 mb-8 lg:mb-0">
              <div className="relative z-10 bg-card/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border max-w-sm mx-auto lg:max-w-none">
                <div 
                  className="aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(to bottom right, #f0b74520, #f0b74510)' }}
                >
                  <div className="text-4xl sm:text-5xl md:text-6xl">🏺</div>
                </div>
                <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">Authentic Pottery</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Handcrafted by master potter Amara from Senegal</p>
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">(127 reviews)</span>
                  </div>
                </div>
              </div>
              
              {/* Floating Elements - Hidden on mobile */}
              <div className="absolute -top-3 -right-3 bg-card rounded-full p-3 shadow-lg border hover:scale-110 transition-transform cursor-pointer hidden md:block">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div 
                className="absolute -bottom-2 -left-2 text-white rounded-full p-2 shadow-lg hover:scale-110 transition-transform cursor-pointer hidden md:block"
                style={{ background: 'linear-gradient(to right, #30a1a7, #30a1a7dd)' }}
              >
                <Badge className="bg-white/20 text-white border-0 text-xs">New</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 md:py-24">
          <div className="text-center mb-12 sm:mb-16">
            <Badge 
              variant="secondary" 
              className="mb-4 text-xs sm:text-sm"
              style={{ 
                background: 'linear-gradient(to right, #30a1a720, #30a1a710)',
                color: '#30a1a7',
                border: '1px solid #30a1a730'
              }}
            >
              Why Choose Noubian
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6">
              Experience the
              <span style={{ color: '#30a1a7' }}> Difference</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              More than a marketplace – a bridge between cultures, supporting artisans and preserving traditions.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="group border shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8 text-center space-y-4">
                  <div className="relative">
                    <div 
                      className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-xl sm:rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg"
                      style={{ background: `linear-gradient(to right, ${feature.color}, ${feature.color}dd)` }}
                    >
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.desc}</p>
                  <div className="pt-2">
                    <Button 
                      variant="ghost" 
                      className="group-hover:translate-x-1 transition-transform p-0 text-sm"
                      style={{ color: feature.color }}
                    >
                      Learn More <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-24">
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-2xl sm:rounded-3xl"
              style={{ background: 'linear-gradient(to right, #f0b74520, #f0b74510)' }}
            />
            <div className="absolute inset-0 bg-primary/10 rounded-2xl sm:rounded-3xl" />
            <div className="relative z-10 text-center py-12 sm:py-16 px-4 sm:px-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-foreground">
                Ready to Make an
                <span style={{ color: '#f0b745' }}> Impact</span>?
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4">
                Join our community of conscious consumers supporting African artisans. Every purchase tells a story, preserves tradition, and creates opportunity.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  size="lg"
                  className="shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                  style={{ 
                    background: 'linear-gradient(to right, #f0b745, #f0b745dd)',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Start Shopping
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  style={{ 
                    borderColor: '#30a1a7',
                    color: '#30a1a7'
                  }}
                >
                  Become a Partner
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}