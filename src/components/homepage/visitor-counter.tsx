"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Visitor Counter — digital clock style with CabbageSEO branding
 *
 * Calls POST /api/stats/visitors once per session to increment,
 * then displays the count in a sleek embedded panel.
 */

const SESSION_KEY = "cabbage_visitor_counted";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const alreadyCounted = sessionStorage.getItem(SESSION_KEY);

    if (alreadyCounted) {
      fetch("/api/stats/visitors")
        .then((r) => r.json())
        .then((d) => {
          setCount(d.count || 0);
          setTimeout(() => setVisible(true), 100);
        })
        .catch(() => {});
    } else {
      fetch("/api/stats/visitors", { method: "POST" })
        .then((r) => r.json())
        .then((d) => {
          sessionStorage.setItem(SESSION_KEY, "1");
          setCount(d.count || 0);
          setTimeout(() => setVisible(true), 100);
        })
        .catch(() => {});
    }
  }, []);

  if (count === null) return null;

  // Pad to at least 6 digits for the clock aesthetic
  const padded = count.toString().padStart(6, "0");
  const digits = padded.split("");

  return (
    <div
      className={`inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/60 backdrop-blur-sm transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {/* Logo */}
      <img
        src="/apple-touch-icon.png"
        alt=""
        className="w-6 h-6 rounded-md shrink-0"
      />

      {/* Label */}
      <span className="text-zinc-500 text-xs whitespace-nowrap">
        Visitor #
      </span>

      {/* Digital clock digits */}
      <div className="flex items-center gap-px bg-black/40 rounded-lg px-1.5 py-1 border border-zinc-800/80">
        {digits.map((digit, i) => (
          <div key={i} className="relative">
            {/* Horizontal divider line across middle */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-800/60 z-10" />
            <span
              className="relative z-0 inline-flex items-center justify-center w-5 h-7 text-emerald-400 text-sm font-bold tabular-nums"
              style={{ fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace", textShadow: "0 0 8px rgba(52, 211, 153, 0.4)" }}
            >
              {digit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
