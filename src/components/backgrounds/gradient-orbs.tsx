"use client";

interface GradientOrbsProps {
  className?: string;
  variant?: "emerald" | "blue" | "purple" | "mixed";
}

const variants = {
  emerald: [
    "from-emerald-500/20 to-emerald-700/5",
    "from-emerald-400/15 to-green-600/5",
    "from-teal-500/10 to-emerald-500/5",
  ],
  blue: [
    "from-blue-500/20 to-blue-700/5",
    "from-indigo-400/15 to-blue-600/5",
    "from-cyan-500/10 to-blue-500/5",
  ],
  purple: [
    "from-purple-500/20 to-purple-700/5",
    "from-violet-400/15 to-purple-600/5",
    "from-fuchsia-500/10 to-purple-500/5",
  ],
  mixed: [
    "from-emerald-500/20 to-emerald-700/5",
    "from-blue-400/15 to-indigo-600/5",
    "from-purple-500/10 to-violet-500/5",
  ],
};

export function GradientOrbs({
  className = "",
  variant = "emerald",
}: GradientOrbsProps) {
  const colors = variants[variant];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div
        className={`absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br ${colors[0]} blur-[120px] animate-orb-1`}
      />
      <div
        className={`absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br ${colors[1]} blur-[100px] animate-orb-2`}
      />
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br ${colors[2]} blur-[80px] animate-orb-3`}
      />
    </div>
  );
}
