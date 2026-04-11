"use client";

import { IconAward, IconStar, IconSparkles } from "@tabler/icons-react";

const partners = [
    "MTN Sudan", "Zain", "Sudani", "البنك الأهلي", "بنك أم درمان", "بنك الخرطوم",
    "سوداتل", "موبايلي", "كوادر", "امباكت", "تقنية", "سودان بوست",
];

export function PartnersSection() {
    return (
        <section className="py-20 border-t border-b border-zinc-100 bg-gradient-to-b from-white via-zinc-50/30 to-white overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-24 -right-24 w-48 h-48 border border-zinc-200/30 rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 border border-zinc-200/30 rounded-full" />

                {/* Static Sparkles */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-amber-400/40 opacity-50"
                        style={{
                            left: `${15 + i * 18}%`,
                            bottom: "5%",
                        }}
                    >
                        <IconSparkles className="w-4 h-4" />
                    </div>
                ))}
            </div>

            <div className="container max-w-7xl mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto mb-6 rounded-full" />
                    <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-3">
                        شراكات تعزز ثقتك
                    </h2>
                    <p className="text-muted-foreground">
                        نتعاون مع أفضل الشركات السودانية لتقديم تجربة استثنائية
                    </p>
                </div>

                {/* Static Partner Grid */}
                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-12">
                    {partners.map((partner, idx) => (
                        <div
                            key={idx}
                            className="flex-shrink-0 px-6 py-3 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:border-zinc-200 cursor-default group"
                        >
                            <span className="text-zinc-700 font-semibold whitespace-nowrap group-hover:text-zinc-900">
                                {partner}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Trust Badges */}
                <div className="mt-16 flex flex-wrap justify-center gap-4 md:gap-6">
                    {[
                        { icon: IconAward, text: "موثوق 100%", color: "from-amber-500 to-orange-500", bgColor: "bg-amber-50" },
                        { icon: IconStar, text: "تقييم 4.9/5", color: "from-emerald-500 to-green-500", bgColor: "bg-emerald-50" },
                        { icon: IconSparkles, text: "+10,000 طلب ناجح", color: "from-blue-500 to-cyan-500", bgColor: "bg-blue-50" },
                    ].map((badge, idx) => (
                        <div
                            key={idx}
                            className={`relative flex items-center gap-3 px-5 py-3 rounded-full ${badge.bgColor} border border-zinc-100 cursor-default group overflow-hidden`}
                        >
                            {/* Static Background */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${badge.color} opacity-10`} />

                            <div>
                                <badge.icon
                                    className={`w-5 h-5 bg-gradient-to-r ${badge.color} bg-clip-text`}
                                    style={{ color: badge.color.includes("amber") ? "#f59e0b" : badge.color.includes("emerald") ? "#10b981" : "#3b82f6" }}
                                />
                            </div>
                            <span className="text-sm font-semibold text-zinc-700 relative z-10">{badge.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
