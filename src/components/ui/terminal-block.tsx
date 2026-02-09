"use client";

import { useRef, useEffect, useState } from "react";
import { useInView } from "framer-motion";

interface TerminalLine {
  text: string;
  type?: "command" | "output" | "comment" | "success" | "error" | "highlight";
  delay?: number;
}

interface TerminalBlockProps {
  lines: TerminalLine[];
  title?: string;
  className?: string;
  typingSpeed?: number;
}

const lineColors: Record<string, string> = {
  command: "text-emerald-400",
  output: "text-zinc-400",
  comment: "text-zinc-600",
  success: "text-emerald-400",
  error: "text-red-400",
  highlight: "text-amber-400",
};

const linePrefixes: Record<string, string> = {
  command: "$ ",
  output: "  ",
  comment: "# ",
  success: "✓ ",
  error: "✗ ",
  highlight: "→ ",
};

export function TerminalBlock({
  lines,
  title = "terminal",
  className = "",
  typingSpeed = 30,
}: TerminalBlockProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [currentText, setCurrentText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    let lineIndex = 0;
    let charIndex = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const typeLine = () => {
      if (lineIndex >= lines.length) return;

      const line = lines[lineIndex];
      const fullText = (linePrefixes[line.type || "output"] || "") + line.text;

      if (line.type === "command") {
        setIsTyping(true);
        if (charIndex < fullText.length) {
          setCurrentText(fullText.slice(0, charIndex + 1));
          charIndex++;
          timeout = setTimeout(typeLine, typingSpeed);
        } else {
          setIsTyping(false);
          setVisibleLines(lineIndex + 1);
          setCurrentText("");
          lineIndex++;
          charIndex = 0;
          timeout = setTimeout(typeLine, line.delay || 300);
        }
      } else {
        setVisibleLines(lineIndex + 1);
        lineIndex++;
        charIndex = 0;
        timeout = setTimeout(typeLine, line.delay || 100);
      }
    };

    timeout = setTimeout(typeLine, 500);
    return () => clearTimeout(timeout);
  }, [isInView, lines, typingSpeed]);

  return (
    <div ref={ref} className={`rounded-xl overflow-hidden bg-zinc-950 border border-white/[0.06] ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs text-zinc-500 ml-2 font-mono">{title}</span>
      </div>

      {/* Content */}
      <div className="p-4 font-mono text-sm leading-relaxed min-h-[120px]">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={lineColors[line.type || "output"]}>
            {linePrefixes[line.type || "output"]}{line.text}
          </div>
        ))}
        {isTyping && (
          <div className={lineColors[lines[visibleLines]?.type || "command"]}>
            {currentText}
            <span className="animate-pulse">▊</span>
          </div>
        )}
        {!isTyping && visibleLines < lines.length && (
          <span className="text-zinc-600 animate-pulse">▊</span>
        )}
      </div>
    </div>
  );
}
