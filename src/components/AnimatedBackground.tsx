"use client";

import React from "react";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden pt-10">
      {/* دائرة 1 */}
      <div
        className="absolute rounded-full blur-3xl w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-amber-200/20 to-orange-200/20"
        style={{
          top: "10%",
          left: "70%",
        }}
      />

      {/* دائرة 2 */}
      <div
        className="absolute rounded-full blur-3xl w-56 h-56 md:w-80 md:h-80 bg-gradient-to-r from-teal-200/20 to-cyan-200/20"
        style={{
          bottom: "20%",
          left: "10%",
        }}
      />
    </div>
  );
}
