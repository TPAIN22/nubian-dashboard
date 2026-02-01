"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconArrowLeft, IconDeviceMobile, IconSparkles } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { motion, useScroll, useTransform, useMotionValue, useSpring, type Variants } from "framer-motion";
import { useRef } from "react";

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

// Text reveal with word animation (better for Arabic)
function WordReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: delay + i * 0.12,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block mx-1"
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
      staggerChildren: 0.12,
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
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

export function HeroSection() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);

  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const parallax1X = useTransform(mouseX, [-500, 500], [-20, 20]);
  const parallax1Y = useTransform(mouseY, [-500, 500], [-20, 20]);
  const parallax2X = useTransform(mouseX, [-500, 500], [15, -15]);
  const parallax2Y = useTransform(mouseY, [-500, 500], [15, -15]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden pt-16 md:pt-24 pb-32"
    >
      {/* Animated Background Texture */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 -z-10 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
      />

      {/* Decorative Gradient Orbs with Mouse Parallax */}
      <motion.div
        style={{ x: parallax1X, y: parallax1Y }}
        className="absolute top-0 right-1/4 pointer-events-none"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="w-[500px] h-[500px] bg-gradient-to-br from-amber-100/50 to-orange-100/30 rounded-full blur-[100px]"
        />
      </motion.div>
      <motion.div
        style={{ x: parallax2X, y: parallax2Y }}
        className="absolute bottom-0 left-1/4 pointer-events-none"
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="w-[400px] h-[400px] bg-gradient-to-br from-blue-100/40 to-cyan-100/20 rounded-full blur-[80px]"
        />
      </motion.div>

      {/* Floating Sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            y: [0, -150, -300],
            x: [0, (i % 2 === 0 ? 1 : -1) * 30, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeOut",
          }}
          className="absolute text-amber-400/50 pointer-events-none"
          style={{
            left: `${15 + i * 12}%`,
            bottom: "10%",
          }}
        >
          <IconSparkles className="w-5 h-5" />
        </motion.div>
      ))}

      <motion.div
        style={{ y, scale }}
        className="container max-w-7xl mx-auto px-6 relative z-10 text-center"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge with Bounce */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 text-sm border-zinc-200 bg-white/50 backdrop-blur-sm text-zinc-600 shadow-lg">
              <motion.span
                animate={{ rotate: [0, 360], scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="inline-block mr-1"
              >
                ✨
              </motion.span>
              مرحباً بكم في نوبيان
            </Badge>
          </motion.div>

          {/* Main Headline with Word Animation */}
          <motion.h1
            variants={itemVariants}
            className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-zinc-950 sm:text-6xl md:text-7xl lg:text-8xl mb-8 leading-[1.1]"
          >
            <WordReveal text="تجربة تسوق" delay={0.3} />
            <motion.span
              initial={{ opacity: 0, scale: 0.5, filter: "blur(20px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-[length:200%_auto] mx-2"
              style={{ animation: "gradient-shift 3s linear infinite" }}
            >
              استثنائية
            </motion.span>
            <br />
            <WordReveal text="في السودان" delay={1.2} />
          </motion.h1>

          {/* Subtitle with Blur Reveal */}
          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed mb-10"
          >
            منصة نوبيان تجمع بين أحدث صيحات الموضة، التقنية، والديكور المنزلي في مكان واحد.
            تسوق بثقة، وادفع بأمان، واستلم مشترياتك في أي مكان.
          </motion.p>

          {/* CTA Buttons with Magnetic Effect */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/shop">
              <MagneticButton>
                <Button size="lg" className="relative rounded-full h-14 px-8 text-lg bg-zinc-900 hover:bg-zinc-800 text-white min-w-[180px] overflow-hidden shadow-xl shadow-zinc-900/20">
                  ابدأ التسوق الآن
                  <motion.span
                    animate={{ x: [0, -5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <IconArrowLeft className="mr-2 h-5 w-5" />
                  </motion.span>
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                  />
                </Button>
              </MagneticButton>
            </Link>
            <Link href="/merchant/apply">
              <MagneticButton>
                <Button variant="outline" size="lg" className="rounded-full h-14 px-8 text-lg border-zinc-200 hover:bg-zinc-50 text-zinc-900 min-w-[180px]">
                  سجل كتاجر
                </Button>
              </MagneticButton>
            </Link>
          </motion.div>
        </motion.div>

        {/* Product UI Mockup with 3D Tilt Effect */}
        <motion.div
          initial={{ opacity: 0, y: 80, rotateX: 15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 relative mx-auto max-w-5xl"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            whileHover={{ rotateX: -3, rotateY: 3, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl shadow-zinc-200/50 ring-1 ring-zinc-950/5 lg:rounded-3xl lg:p-4"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="aspect-[16/9] overflow-hidden rounded-xl lg:rounded-2xl bg-zinc-50 border border-zinc-100 relative group flex flex-col">

              {/* Mock Browser Header */}
              <div className="h-8 border-b border-zinc-100 flex items-center px-4 gap-2 bg-white/50">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay }}
                    className={`w-2.5 h-2.5 rounded-full ${['bg-red-400/80', 'bg-yellow-400/80', 'bg-green-400/80'][i]}`}
                  />
                ))}
                <motion.div
                  className="ml-4 h-5 w-64 bg-zinc-100 rounded-md"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              {/* Mock Dashboard Content */}
              <div className="flex-1 p-6 relative">
                <div className="flex gap-6 h-full">
                  {/* Sidebar */}
                  <div className="w-48 hidden md:flex flex-col gap-3 py-2">
                    <div className="h-8 w-32 bg-zinc-200 rounded-md mb-4"></div>
                    {[1, 0.75, 0.85].map((width, i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                        className="h-4 bg-zinc-100 rounded-md"
                        style={{ width: `${width * 100}%` }}
                      />
                    ))}
                  </div>

                  {/* Main Area */}
                  <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center mb-8">
                      <div className="h-8 w-40 bg-zinc-900/10 rounded-lg"></div>
                      <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="h-8 w-24 bg-zinc-900 rounded-full"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { emoji: "💰", bg: "bg-blue-50", delay: 0 },
                        { emoji: "📦", bg: "bg-purple-50", delay: 0.1 },
                        { emoji: "👥", bg: "bg-green-50", delay: 0.2 },
                      ].map((card, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 1.5 + card.delay, type: "spring", stiffness: 200 }}
                          whileHover={{ y: -5, scale: 1.05 }}
                          className={`h-24 ${card.bg} border border-zinc-100 rounded-xl shadow-sm p-4 space-y-2`}
                        >
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                            className="text-2xl"
                          >
                            {card.emoji}
                          </motion.div>
                          <div className="w-16 h-4 bg-zinc-200/50 rounded"></div>
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: 1, scaleY: 1 }}
                      transition={{ delay: 2, duration: 0.5 }}
                      style={{ transformOrigin: "top" }}
                      className="h-48 bg-white border border-zinc-100 rounded-xl shadow-sm mt-4"
                    />
                  </div>
                </div>

                {/* Overlay CTA */}
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                  <Link href="/merchant/apply">
                    <MagneticButton>
                      <Button size="lg" className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full p-2 md:p-4 shadow-2xl shadow-zinc-900/20 text-xs md:text-base font-semibold h-auto">
                        انضم للتجار وابدأ البيع
                        <motion.span
                          animate={{ x: [0, -3, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <IconArrowLeft className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                        </motion.span>
                      </Button>
                    </MagneticButton>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating badge decoration (Left) */}
          <motion.div
            animate={{
              y: [0, -15, 0],
              rotate: [0, 2, -2, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-8 top-1/3 hidden lg:block z-20"
          >
            <motion.div
              initial={{ opacity: 0, x: -50, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.08, rotate: 3 }}
              className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5 flex items-center gap-4 max-w-[200px]"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center text-2xl"
              >
                ⚡
              </motion.div>
              <div>
                <p className="font-bold text-zinc-900">مبيعات فورية</p>
                <p className="text-xs text-zinc-500">اربط منتجاتك وابدأ البيع</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Floating badge decoration (Right) */}
          <motion.div
            animate={{
              y: [0, -12, 0],
              rotate: [0, -2, 2, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -right-8 top-1/2 hidden lg:block z-20"
          >
            <Link href="https://play.google.com/store/apps/details?id=dev.expo.nubian" target="_blank">
              <motion.div
                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 1.7, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.08, rotate: -3 }}
                className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-xl ring-1 ring-zinc-950/5 flex items-center gap-4 cursor-pointer bg-white/80 backdrop-blur-md"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600"
                >
                  <IconDeviceMobile className="w-6 h-6" />
                </motion.div>
                <div className="text-right">
                  <p className="font-bold text-zinc-900">حمل التطبيق الآن</p>
                  <p className="text-xs text-zinc-500">تجربة تسوق أسرع 🚀</p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
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
