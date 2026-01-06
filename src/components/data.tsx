import React from "react";
import { ShoppingBag, Shield, Car, Globe, Star, Award } from "lucide-react";

// تعريف الـ types للبيانات
export interface Feature {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  accent: string;
}

export interface Stat {
  number: string;
  label: string;
  icon: React.ReactNode;
}

export interface Testimonial {
  quote: string;
  name: string;
  rating: number;
  avatar: string;
}

export const features: Feature[] = [
  {
    icon: <ShoppingBag className="w-8 h-8" />,
    title: "منتجات متنوعة",
    desc: "تصفح آلاف المنتجات الأصلية من الأزياء إلى ديكور المنزل والإلكترونيات.",
    color: "from-primary to-primary/80",
    accent: "#a37e2c",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "حماية للعملاء",
    desc: "طرق دفع آمنة مع حماية للمشتري وإرجاع جميع المشتريات.",
    color: "from-accent to-accent/80",
    accent: "#30a1a7",
  },
  {
    icon: <Car className="w-8 h-8" />,
    title: "شحن سريع",
    desc: "شحن سريع في جميع أنحاء السودان مع تتبع جميع الطلبات في الوقت الحقيقي.",
    color: "from-secondary to-secondary/80",
    accent: "#005b35",
  },
];

export const stats: Stat[] = [
  {
    number: "50K+",
    label: "منــتــج مـــتـــوفـــر",
    icon: <ShoppingBag className="w-5 h-5" />,
  },
  { number: "8+", label: "ولايـــات", icon: <Globe className="w-5 h-5" /> },
  {
    number: "4.8",
    label: "تقيـــمــات العـــمـــلاء",
    icon: <Star className="w-5 h-5" />,
  },
  {
    number: "24/7",
    label: "خـــــدمة العـــــمــلاء",
    icon: <Award className="w-5 h-5" />,
  },
];

export const testimonials: Testimonial[] = [
  {
    quote: "تجربة تسوق رائعة! المنتجات أصلية والتوصيل سريع جداً. أنصح بها بشدة لكل من يبحث عن جودة وثقة.",
    name: "وائل",
    rating: 5,
    avatar: "https://placehold.co/60x60/FF0038/000000?text=AA",
  },
  {
    quote: "i was a bit skeptical at first, but now i'm a regular customer. the quality of the products is outstanding. i'll be a lifelong customer.",
    name: "umar saleh",
    rating: 4,
    avatar: "https://placehold.co/60x60/0000AA/000000?text=UM",
  },
  {
    quote: "كنت مترددًا في البداية، لكن نوبيان فاجأتني بجودة المنتجات وسهولة عملية الشراء. سأكون عميلاً دائمًا.",
    name: "ناصر محمود",
    rating: 4,
    avatar: "https://placehold.co/60x60/90EE90/000000?text=NM",
  },
  {
    quote: "it's my first time using this platform and I'm really impressed with the quality of the products . I'll be a regular customer forever.",
    name: "mohamed khaled",
    rating: 5,
    avatar: "https://placehold.co/60x60/00F0F0/000000?text=MK",
  },
  {
    quote: "شوية تاخير في التوصيل بس نوبيان فاجاءتني بسهولة عملية الشراء. شكرا لكم.",
    name: "محمد الحسن",
    rating: 3,
    avatar: "https://placehold.co/60x60/EE00DD/000000?text=MA",
  },
  {
    quote: "بصراحة ما كنت متوقعة، لكن نوبيان فاجأتني بجودة المنتجات وسهولة عملية الشراء. شكراً لكم!",
    name: "ليلى حسن",
    rating: 5,
    avatar: "https://placehold.co/60x60/FFFFDD/000000?text=LH",
  },
  {
    quote: "ما كعب شغل نضيف للتسوق. نوبيان دائماً موجودة في الوقت المناسب. شكراً لكم.",
    name: " عبدالله",
    rating: 2,
    avatar: "https://placehold.co/60x60/EAD9FF/000000?text=KA",
  },
  {
    quote: "توصيل سريع وخدمة ممتازة. المنتجات وصلت كما في الوصف تمامًا. شكراً نوبيان!",
    name: "اسراء",
    rating: 5,
    avatar: "https://placehold.co/60x60/AAFFEE/000000?text=AK",
  },
];