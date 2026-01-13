"use client";

import React, { useEffect, useMemo, useState } from "react";

export default function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    // لا تتبع الماوس في الموبايل
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile]);

  // clamp بسيط عشان الترجمة ما تطلع برا بشكل مبالغ
  const tx1 = useMemo(() => Math.max(-40, Math.min(40, mousePosition.x * 0.02)), [mousePosition.x]);
  const ty1 = useMemo(() => Math.max(-40, Math.min(40, mousePosition.y * 0.02)), [mousePosition.y]);
  const tx2 = useMemo(() => Math.max(-30, Math.min(30, mousePosition.x * -0.01)), [mousePosition.x]);
  const ty2 = useMemo(() => Math.max(-30, Math.min(30, mousePosition.y * -0.01)), [mousePosition.y]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden pt-10">
      {/* دائرة 1 */}
      <div
        className="absolute rounded-full blur-3xl transition-transform duration-1000 ease-out
                   w-64 h-64 md:w-96 md:h-96
                   bg-gradient-to-r from-amber-200/20 to-orange-200/20"
        style={{
          top: "10%",
          left: isMobile ? "55%" : "70%",
          transform: isMobile ? "translate3d(0,0,0)" : `translate3d(${tx1}px, ${ty1}px, 0)`,
        }}
      />

      {/* دائرة 2 */}
      <div
        className="absolute rounded-full blur-3xl transition-transform duration-1000 ease-out
                   w-56 h-56 md:w-80 md:h-80
                   bg-gradient-to-r from-teal-200/20 to-cyan-200/20"
        style={{
          bottom: "20%",
          left: isMobile ? "10%" : "10%",
          transform: isMobile ? "translate3d(0,0,0)" : `translate3d(${tx2}px, ${ty2}px, 0)`,
        }}
      />
    </div>
  );
}
