"use client";

import React, { useState, useEffect } from "react";

export default function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10">
      <div
        className="absolute w-96 h-96 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-full blur-3xl transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          top: "10%",
          left: "70%",
        }}
      />
      <div
        className="absolute w-80 h-80 bg-gradient-to-r from-teal-200/20 to-cyan-200/20 rounded-full blur-3xl transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`,
          bottom: "20%",
          left: "10%",
        }}
      />
    </div>
  );
}