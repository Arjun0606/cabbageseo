"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimateInProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  once?: boolean;
  className?: string;
  as?: "div" | "section" | "span" | "li" | "article";
}

const directionOffset = {
  up: { y: 40, x: 0 },
  down: { y: -40, x: 0 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
};

// Pre-built motion components — never create inside render (causes remount every re-render)
const motionElements = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  li: motion.li,
  article: motion.article,
};

export function AnimateIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  className,
  as = "div",
}: AnimateInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-80px" });
  const offset = directionOffset[direction];

  const MotionComponent = motionElements[as];

  return (
    <MotionComponent
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
