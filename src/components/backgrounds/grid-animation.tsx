"use client";

import { useRef, useEffect } from "react";

interface GridAnimationProps {
  className?: string;
  dotColor?: string;
  glowColor?: string;
  dotSize?: number;
  gap?: number;
}

export function GridAnimation({
  className = "",
  dotColor = "rgba(255, 255, 255, 0.12)",
  glowColor = "rgba(34, 197, 94, 0.6)",
  dotSize = 1.5,
  gap = 32,
}: GridAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);
  const isActiveRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!canvas || !ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, rect.width, rect.height);
      const mouse = mouseRef.current;
      const glowRadius = 150;

      for (let x = gap; x < rect.width; x += gap) {
        for (let y = gap; y < rect.height; y += gap) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const proximity = Math.max(0, 1 - dist / glowRadius);

          ctx.beginPath();
          ctx.arc(x, y, dotSize + proximity * 2.5, 0, Math.PI * 2);

          if (proximity > 0) {
            ctx.fillStyle = glowColor;
            ctx.globalAlpha = 0.15 + proximity * 0.85;
          } else {
            ctx.fillStyle = dotColor;
            ctx.globalAlpha = 1;
          }

          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      // Only continue loop while mouse is active over the canvas
      if (isActiveRef.current) {
        animFrameRef.current = requestAnimationFrame(draw);
      }
    }

    // Draw once on mount (static grid, no continuous loop)
    draw();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      // Start animation loop only when mouse is over canvas
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        animFrameRef.current = requestAnimationFrame(draw);
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
      // Stop the loop, draw one final frame to clear glow
      isActiveRef.current = false;
      draw();
    };

    const handleResize = () => draw();

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      isActiveRef.current = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [dotColor, glowColor, dotSize, gap]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: "auto" }}
    />
  );
}
