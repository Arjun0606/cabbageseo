"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
}

const sizes = {
  sm: { img: 20, text: "text-sm" },
  md: { img: 28, text: "text-lg" },
  lg: { img: 36, text: "text-2xl" },
  xl: { img: 48, text: "text-3xl" },
};

export function Logo({ size = "md", className, showText = true }: LogoProps) {
  const { img, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="CabbageSEO"
        width={img}
        height={img}
        className="rounded-lg"
      />
      {showText && (
        <span className={cn("font-bold tracking-tight", text)}>
          Cabbage<span className="text-emerald-500">SEO</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = "md", className }: Omit<LogoProps, "showText">) {
  const { img } = sizes[size];

  return (
    <Image
      src="/logo.png"
      alt="CabbageSEO"
      width={img}
      height={img}
      className={cn("rounded-lg", className)}
    />
  );
}

