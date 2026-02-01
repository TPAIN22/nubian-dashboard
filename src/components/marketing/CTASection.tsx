"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconSparkles, IconRocket, IconArrowLeft, IconBrandGoogle, IconCheck } from "@tabler/icons-react";
import { motion, useMotionValue, useSpring, useTransform, useInView, type Variants } from "framer-motion";
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

// Magnetic button component
function MagneticButton({ children, className, ...props }: React.ComponentProps<typeof motion.div>) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Text reveal animation component
function TextReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mr-2"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export function CTASection() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const parallax1X = useTransform(mouseX, [-500, 500], [-30, 30]);
  const parallax1Y = useTransform(mouseY, [-500, 500], [-30, 30]);
  const parallax2X = useTransform(mouseX, [-500, 500], [20, -20]);
  const parallax2Y = useTransform(mouseY, [-500, 500], [20, -20]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  // Animated counters
  const customers = useCounter(5000, 2.5, isInView);
  const merchants = useCounter(150, 2, isInView);
  const satisfaction = useCounter(99, 2, isInView);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="py-28 relative overflow-hidden bg-gradient-to-b from-zinc-50 to-white"
    >
      {/* Grid Pattern Overlay with Animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"
      />

      {/* Animated Gradient Orbs with Mouse Parallax */}
      <motion.div
        style={{ x: parallax1X, y: parallax1Y }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] pointer-events-none"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-full h-full bg-gradient-to-br from-amber-200/40 to-orange-200/20 rounded-full blur-[80px]"
        />
      </motion.div>

      <motion.div
        style={{ x: parallax2X, y: parallax2Y }}
        className="absolute bottom-0 right-1/4 w-[400px] h-[400px] pointer-events-none"
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-full h-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 rounded-full blur-[80px]"
        />
      </motion.div>

      {/* Floating Sparkles with Complex Animation */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            y: [0, -100, -200],
            x: [0, (i % 2 === 0 ? 1 : -1) * 50, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "easeOut",
          }}
          className="absolute text-amber-400/60 pointer-events-none"
          style={{
            left: `${20 + i * 15}%`,
            bottom: "20%",
          }}
        >
          <IconSparkles className="w-6 h-6" />
        </motion.div>
      ))}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="container max-w-7xl mx-auto px-6 text-center relative z-10"
      >
        {/* Badge with Bounce */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: -20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.2
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200/50 mb-8 shadow-lg shadow-amber-100/50"
        >
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <IconRocket className="w-4 h-4 text-amber-600" />
          </motion.div>
          <span className="text-sm text-amber-800 font-semibold">
            انضم لأكثر من {customers.toLocaleString()}+ عميل سعيد
          </span>
        </motion.div>

        {/* Main Heading with Text Reveal */}
        <motion.h2
          variants={itemVariants}
          className="mx-auto max-w-4xl text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-zinc-900 mb-6 leading-tight"
        >
          <TextReveal text="جاهز لتبدأ رحلتك مع" delay={0.3} />
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.8
            }}
            className="block mt-2 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent bg-[length:200%_auto]"
            style={{
              animation: "gradient-shift 3s linear infinite",
            }}
          >
            نوبيان؟
          </motion.span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mx-auto max-w-2xl text-lg md:text-xl text-zinc-600 mb-12 leading-relaxed"
        >
          انضم إلى آلاف العملاء والتجار الذين يثقون في نوبيان كوجهتهم الأولى للتسوق والبيع الرقمي في السودان.
        </motion.p>

        {/* CTA Buttons with Magnetic Effect */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link href="/sign-in">
            <MagneticButton>
              <Button
                size="lg"
                className="group relative rounded-full h-16 px-10 text-lg bg-zinc-900 text-white hover:bg-zinc-800 min-w-[220px] font-bold shadow-2xl shadow-zinc-900/30 transition-all duration-300 overflow-hidden"
              >
                <span className="flex items-center gap-2 relative z-10">
                  إنشاء حساب مجاني
                  <motion.span
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <IconArrowLeft className="w-5 h-5" />
                  </motion.span>
                </span>

                {/* Animated Border Glow */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(251, 191, 36, 0)",
                      "0 0 40px rgba(251, 191, 36, 0.3)",
                      "0 0 20px rgba(251, 191, 36, 0)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  }}
                />
              </Button>
            </MagneticButton>
          </Link>

          <Link href="/shop">
            <MagneticButton>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-16 px-10 text-lg border-2 border-zinc-300 text-zinc-900 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 min-w-[220px] font-medium transition-all duration-300"
              >
                تصفح المتجر
              </Button>
            </MagneticButton>
          </Link>
        </motion.div>

        {/* Animated Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-16"
        >
          {[
            { value: customers, suffix: "+", label: "عميل سعيد", icon: "👥" },
            { value: merchants, suffix: "+", label: "تاجر موثوق", icon: "🏪" },
            { value: satisfaction, suffix: "%", label: "رضا العملاء", icon: "⭐" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 + i * 0.15, type: "spring", stiffness: 200 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative p-6 rounded-2xl bg-white border border-zinc-100 shadow-lg shadow-zinc-100/50 group"
            >
              <motion.span
                className="absolute -top-3 -right-3 text-2xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                {stat.icon}
              </motion.span>
              <p className="text-3xl md:text-4xl font-black text-zinc-900 mb-1">
                {stat.value.toLocaleString()}{stat.suffix}
              </p>
              <p className="text-sm text-zinc-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Indicators with Checkmarks */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-6 text-sm text-zinc-600 font-medium mb-12"
        >
          {[
            "بدون رسوم تسجيل",
            "توصيل سريع لجميع الولايات",
            "دفع آمن 100%",
          ].map((text, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1 + i * 0.15 }}
              className="flex items-center gap-2"
            >
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 1.2 + i * 0.15, type: "spring", stiffness: 300 }}
                className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
              >
                <IconCheck className="w-3 h-3 text-white" />
              </motion.div>
              <span>{text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* App Download Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="pt-12 border-t border-zinc-200"
        >
          <p className="text-zinc-500 text-sm font-medium mb-6">حمّل التطبيق الآن</p>
          <div className="flex flex-wrap justify-center gap-4">
            <MagneticButton>
              <a
                href="https://play.google.com/store/apps/details?id=dev.expo.nubian"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 px-6 py-4 bg-zinc-900 hover:bg-zinc-800 rounded-2xl transition-all duration-300 group shadow-xl shadow-zinc-900/20"
              >
                <motion.div
                  className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <IconBrandGoogle className="w-6 h-6 text-white" />
                </motion.div>
                <div className="text-right">
                  <p className="text-xs text-zinc-400 mb-0.5">حمّل من</p>
                  <p className="text-white font-bold text-lg">Google Play</p>
                </div>
              </a>
            </MagneticButton>
          </div>
        </motion.div>
      </motion.div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </section>
  );
}
