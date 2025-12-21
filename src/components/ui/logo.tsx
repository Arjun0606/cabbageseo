"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: { height: 24, text: "text-sm" },
  md: { height: 32, text: "text-lg" },
  lg: { height: 40, text: "text-xl" },
  xl: { height: 48, text: "text-2xl" },
};

export function Logo({ size = "md", className, showText = true }: LogoProps) {
  const { height, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <img
        src="/cabbageseo_logo.png"
        alt="CabbageSEO"
        style={{ height: `${height}px`, width: 'auto' }}
      />
      {showText && (
        <span className={cn("font-bold tracking-tight", text)}>
          CabbageSEO
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = "md", className }: Omit<LogoProps, "showText">) {
  const { height } = sizes[size];

  return (
    <img
      src="/cabbageseo_logo.png"
      alt="CabbageSEO"
      style={{ height: `${height}px`, width: 'auto' }}
      className={cn("", className)}
    />
  );
}

