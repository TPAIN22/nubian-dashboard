"use client";

import { IconTruck, IconShieldCheck, IconHeadset, IconDeviceMobile, IconSparkles } from "@tabler/icons-react";
import { motion, useInView, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// Animated counter hook
function useCounter(end: number, duration: number = 2, inView: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, inView]);

  return count;
}

// Magnetic card component
function MagneticCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    x.set(deltaX * 0.1);
    y.set(deltaY * 0.1);
    rotateY.set(deltaX * 0.05);
    rotateX.set(-deltaY * 0.05);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{
        x: springX,
        y: springY,
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const features = [
  {
    title: "شحن سريع وآمن",
    description: "نغطي جميع الولايات مع شركاء لوجستيين موثوقين لضمان وصول طلبك في أسرع وقت.",
    icon: IconTruck,
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50",
    iconBg: "bg-blue-500",
  },
  {
    title: "دفع آمن 100%",
    description: "بوابات دفع مشفرة تدعم بنكك والتحويلات البنكية المباشرة، لراحة بالك.",
    icon: IconShieldCheck,
    gradient: "from-emerald-500 to-green-500",
    bgGradient: "from-emerald-50 to-green-50",
    iconBg: "bg-emerald-500",
  },
  {
    title: "دعم فني متميز",
    description: "فريقنا متواجد على مدار الساعة للإجابة على استفساراتك وحل أي مشكلة تواجهك.",
    icon: IconHeadset,
    gradient: "from-purple-500 to-violet-500",
    bgGradient: "from-purple-50 to-violet-50",
    iconBg: "bg-purple-500",
  },
  {
    title: "تجربة موبايل سلسة",
    description: "تطبيق ويب متطور يعمل بكفاءة على جميع الأجهزة والهواتف الذكية.",
    icon: IconDeviceMobile,
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
    iconBg: "bg-amber-500",
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 60, rotateX: -15 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

export function FeaturesGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Mouse position for background effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const bgX = useTransform(mouseX, [-500, 500], [-20, 20]);
  const bgY = useTransform(mouseY, [-500, 500], [-20, 20]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  // Animated counters
  const customers = useCounter(5000, 2.5, isInView);
  const merchants = useCounter(150, 2, isInView);
  const support = useCounter(24, 1.5, isInView);
  const satisfaction = useCounter(99, 2, isInView);

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      className="py-24 bg-zinc-50/50 relative overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Background Decorations with Parallax */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          style={{ x: bgX, y: bgY }}
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-48 -right-48 w-96 h-96 border border-zinc-200/30 rounded-full"
        />
        <motion.div
          style={{ x: useTransform(bgX, v => -v), y: useTransform(bgY, v => -v) }}
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-48 -left-48 w-96 h-96 border border-zinc-200/30 rounded-full"
        />

        {/* Floating Sparkles */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0, 1, 0],
              y: [0, -100, -200],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 1,
              ease: "easeOut",
            }}
            className="absolute text-amber-400/40"
            style={{
              left: `${25 + i * 18}%`,
              bottom: "10%",
            }}
          >
            <IconSparkles className="w-5 h-5" />
          </motion.div>
        ))}
      </div>

      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header with Animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center max-w-2xl mx-auto"
        >
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto mb-6 rounded-full"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold tracking-tight sm:text-4xl mb-4"
          >
            لماذا تختار نوبيان؟
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-lg"
          >
            نقدم معايير جديدة للتجارة الإلكترونية في السودان، تركز على الجودة والموثوقية.
          </motion.p>
        </motion.div>

        {/* Features Grid with 3D Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={cardVariants}
            >
              <MagneticCard className="h-full">
                <div className={`group relative rounded-2xl bg-gradient-to-br ${feature.bgGradient} p-8 border border-zinc-100 shadow-lg hover:shadow-2xl transition-shadow duration-500 h-full`}>
                  {/* Animated Gradient Border on Hover */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
                  />

                  {/* Shine Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl overflow-hidden"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                    />
                  </motion.div>

                  {/* Icon with Animation */}
                  <motion.div
                    whileHover={{
                      rotate: [0, -10, 10, 0],
                      scale: 1.1,
                    }}
                    transition={{ duration: 0.5 }}
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${feature.iconBg} text-white shadow-lg`}
                    style={{ transform: "translateZ(20px)" }}
                  >
                    <feature.icon className="h-7 w-7" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="mb-3 text-xl font-bold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative Corner */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute bottom-4 left-4 w-12 h-12 rounded-full bg-gradient-to-br ${feature.gradient} opacity-20 blur-xl`}
                  />
                </div>
              </MagneticCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom Stats with Counters */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-20 pt-12 border-t border-zinc-200/50"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: customers, suffix: "+", label: "عميل سعيد", emoji: "👥" },
              { value: merchants, suffix: "+", label: "تاجر موثوق", emoji: "🏪" },
              { value: support, suffix: "/7", label: "دعم متواصل", emoji: "🎧" },
              { value: satisfaction, suffix: "%", label: "رضا العملاء", emoji: "⭐" },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8 + idx * 0.15, type: "spring", stiffness: 200 }}
                whileHover={{ y: -5, scale: 1.05 }}
                className="relative p-6 rounded-2xl bg-white border border-zinc-100 shadow-lg group cursor-default"
              >
                <motion.span
                  className="absolute -top-3 -right-3 text-2xl"
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                >
                  {stat.emoji}
                </motion.span>
                <motion.p
                  className="text-3xl md:text-4xl font-black text-zinc-900"
                  key={stat.value}
                >
                  {stat.value.toLocaleString()}{stat.suffix}
                </motion.p>
                <p className="text-sm text-zinc-500 font-medium mt-1">{stat.label}</p>

                {/* Hover Glow */}
                <motion.div
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400/10 to-orange-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
