"use client";

import { useRef, useState } from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "emerald" | "blue" | "red" | "none";
  padding?: "sm" | "md" | "lg";
}

const glowColors = {
  emerald: "hover:shadow-emerald-500/10",
  blue: "hover:shadow-blue-500/10",
  red: "hover:shadow-red-500/10",
  none: "",
};

const paddings = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function GlassCard({
  children,
  className = "",
  hover = true,
  glow = "emerald",
  padding = "md",
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || !hover) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden rounded-xl
        bg-white/[0.03] backdrop-blur-md
        border border-white/[0.06]
        ${hover ? `transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-xl ${glowColors[glow]}` : ""}
        ${paddings[padding]}
        ${className}
      `}
    >
      {/* Gradient border follow cursor */}
      {hover && isHovered && (
        <div
          className="absolute pointer-events-none -inset-px rounded-xl opacity-50 transition-opacity duration-500"
          style={{
            background: `radial-gradient(300px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 197, 94, 0.12), transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
