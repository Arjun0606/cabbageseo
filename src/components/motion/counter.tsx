"use client";

import { useRef, useEffect } from "react";
import { useInView, animate } from "framer-motion";

interface CounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function Counter({
  value,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className,
}: CounterProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!isInView || !numberRef.current) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.4, 0.25, 1],
      onUpdate(v) {
        if (numberRef.current) {
          numberRef.current.textContent = v.toFixed(decimals);
        }
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, decimals]);

  return (
    <span ref={containerRef} className={className}>
      {prefix}
      <span ref={numberRef}>0</span>
      {suffix}
    </span>
  );
}
