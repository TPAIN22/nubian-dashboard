import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Feature } from "./data"; // استيراد الـ type

// تعريف الـ props باستخدام TypeScript
interface FeaturesSectionProps {
  features: Feature[];
}

export default function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section className="py-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4 bg-accent/10 text-accent border-0">
          لـــمــاذا تــخــتــار نـوبـيــــــان
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          لـــمــاذا التـــســوق مــن
          <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">
            {" "}
            نـوبـيــــــان
          </span>
          ?
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          منصة التجارة الإلكترونية الرائدة في السودان تقدم منتجات عالية الجودة وأسعارًا تنافسية وخدمة استثنائية.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, i) => (
          <Card key={i} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8 text-center space-y-4">
              <div className="relative">
                <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  {feature.icon}
                </div>
                <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-2xl blur-xl" style={{ background: feature.accent }} />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
              <div className="pt-2">
                <Button variant="ghost" className="text-foreground hover:text-primary group-hover:translate-x-1 transition-transform p-0">
                  المزيد <ArrowLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </section>
  );
}