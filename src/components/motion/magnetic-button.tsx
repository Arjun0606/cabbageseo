"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
}

export function MagneticButton({
  children,
  className = "",
  strength = 0.3,
  onClick,
  href,
  type = "button",
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    setPosition({
      x: (e.clientX - centerX) * strength,
      y: (e.clientY - centerY) * strength,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className="inline-block"
    >
      <div className={`relative group ${className}`}>
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-lg opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500" />
        {href ? (
          <a href={href} className="relative block">
            {children}
          </a>
        ) : (
          <button type={type} onClick={onClick} className="relative block">
            {children}
          </button>
        )}
      </div>
    </motion.div>
  );

  return content;
}
