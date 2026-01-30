"use client";

import { IconAward, IconStar, IconSparkles } from "@tabler/icons-react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

const partners = [
    "MTN Sudan", "Zain", "Sudani", "البنك الأهلي", "بنك أم درمان", "بنك الخرطوم",
    "سوداتل", "موبايلي", "كوادر", "امباكت", "تقنية", "سودان بوست",
];

// Magnetic hover component
function MagneticHover({ children, className }: { children: React.ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const springX = useSpring(x, { stiffness: 400, damping: 25 });
    const springY = useSpring(y, { stiffness: 400, damping: 25 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        x.set((e.clientX - centerX) * 0.2);
        y.set((e.clientY - centerY) * 0.2);
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
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function PartnersSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <section
            ref={ref}
            className="py-20 border-t border-b border-zinc-100 bg-gradient-to-b from-white via-zinc-50/30 to-white overflow-hidden relative"
        >
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-24 -right-24 w-48 h-48 border border-zinc-200/30 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-24 -left-24 w-48 h-48 border border-zinc-200/30 rounded-full"
                />

                {/* Floating Sparkles */}
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 0.5, 0],
                            scale: [0, 1, 0],
                            y: [0, -80, -160],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: i * 0.8,
                            ease: "easeOut",
                        }}
                        className="absolute text-amber-400/40"
                        style={{
                            left: `${15 + i * 18}%`,
                            bottom: "5%",
                        }}
                    >
                        <IconSparkles className="w-4 h-4" />
                    </motion.div>
                ))}
            </div>

            <div className="container max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <motion.div
                        initial={{ width: 0 }}
                        animate={isInView ? { width: 60 } : {}}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto mb-6 rounded-full"
                    />
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.2 }}
                        className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3"
                    >
                        شراكات تعزز ثقتك
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3 }}
                        className="text-muted-foreground"
                    >
                        نتعاون مع أفضل الشركات السودانية لتقديم تجربة استثنائية
                    </motion.p>
                </motion.div>

                {/* Dual Marquee Rows */}
                <div className="relative">
                    {/* Gradient Masks */}
                    <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none" />

                    {/* First Row - Right to Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="mb-6"
                    >
                        <motion.div
                            className="flex items-center gap-6"
                            animate={{ x: ["0%", "-50%"] }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        >
                            {[...partners, ...partners].map((partner, idx) => (
                                <MagneticHover key={idx}>
                                    <motion.div
                                        whileHover={{
                                            scale: 1.1,
                                            y: -8,
                                            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)",
                                        }}
                                        className="flex-shrink-0 px-8 py-4 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:border-zinc-200 transition-colors duration-300 cursor-default group"
                                    >
                                        <motion.span
                                            className="text-zinc-700 font-semibold whitespace-nowrap group-hover:text-zinc-900 transition-colors"
                                        >
                                            {partner}
                                        </motion.span>
                                    </motion.div>
                                </MagneticHover>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Second Row - Left to Right */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <motion.div
                            className="flex items-center gap-6"
                            animate={{ x: ["-50%", "0%"] }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        >
                            {[...partners.slice().reverse(), ...partners.slice().reverse()].map((partner, idx) => (
                                <MagneticHover key={idx}>
                                    <motion.div
                                        whileHover={{
                                            scale: 1.1,
                                            y: -8,
                                            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.15)",
                                        }}
                                        className="flex-shrink-0 px-8 py-4 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:border-zinc-200 transition-colors duration-300 cursor-default group"
                                    >
                                        <motion.span
                                            className="text-zinc-700 font-semibold whitespace-nowrap group-hover:text-zinc-900 transition-colors"
                                        >
                                            {partner}
                                        </motion.span>
                                    </motion.div>
                                </MagneticHover>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Trust Badges with Advanced Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="mt-16 flex flex-wrap justify-center gap-4 md:gap-6"
                >
                    {[
                        { icon: IconAward, text: "موثوق 100%", color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50", delay: 0 },
                        { icon: IconStar, text: "تقييم 4.9/5", color: "from-emerald-500 to-green-500", bgColor: "bg-emerald-50", delay: 0.1 },
                        { icon: IconSparkles, text: "+10,000 طلب ناجح", color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-50", delay: 0.2 },
                    ].map((badge, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                            transition={{
                                delay: 0.9 + badge.delay,
                                type: "spring",
                                stiffness: 200,
                                damping: 15,
                            }}
                            whileHover={{
                                scale: 1.08,
                                y: -5,
                            }}
                            className={`relative flex items-center gap-3 px-5 py-3 rounded-full ${badge.bgColor} border border-zinc-100 cursor-default group overflow-hidden`}
                        >
                            {/* Animated Gradient Background on Hover */}
                            <motion.div
                                className={`absolute inset-0 bg-gradient-to-r ${badge.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                            />

                            {/* Ripple Effect */}
                            <motion.div
                                className={`absolute inset-0 bg-gradient-to-r ${badge.color} rounded-full`}
                                initial={{ scale: 0, opacity: 0.3 }}
                                animate={{ scale: [0, 2], opacity: [0.3, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                            />

                            <motion.div
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.1, 1],
                                }}
                                transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                            >
                                <badge.icon className={`w-5 h-5 bg-gradient-to-r ${badge.color} bg-clip-text`} style={{ color: badge.color.includes("amber") ? "#f59e0b" : badge.color.includes("emerald") ? "#10b981" : "#3b82f6" }} />
                            </motion.div>
                            <span className="text-sm font-semibold text-zinc-700 relative z-10">{badge.text}</span>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
