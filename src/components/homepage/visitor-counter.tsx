"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Visitor Counter — "You're visitor #12,345"
 *
 * Calls POST /api/stats/visitors once per session to increment,
 * then animates the digits rolling up.
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
      // Already counted this session — just GET
      fetch("/api/stats/visitors")
        .then((r) => r.json())
        .then((d) => {
          setCount(d.count || 0);
          setTimeout(() => setVisible(true), 100);
        })
        .catch(() => {});
    } else {
      // First visit this session — POST to increment
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

  const digits = count.toLocaleString().split("");

  return (
    <div
      className={`flex flex-col items-center gap-2 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      <p className="text-zinc-500 text-xs tracking-wide">
        You&apos;re visitor number
      </p>
      <div className="flex items-center gap-[3px]">
        {digits.map((char, i) => (
          <span
            key={i}
            className={
              char === ","
                ? "text-zinc-600 text-lg font-mono mx-0.5"
                : "inline-flex items-center justify-center w-7 h-9 rounded-md bg-zinc-900 border border-zinc-800 text-emerald-400 text-lg font-mono font-bold shadow-inner shadow-black/30"
            }
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
