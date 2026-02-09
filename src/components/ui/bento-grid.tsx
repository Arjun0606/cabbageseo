"use client";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}

export function BentoGrid({
  children,
  className = "",
  cols = 3,
}: BentoGridProps) {
  const colClasses = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${colClasses[cols]} ${className}`}>
      {children}
    </div>
  );
}

interface BentoItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2;
  rowSpan?: 1 | 2;
}

export function BentoItem({
  children,
  className = "",
  colSpan = 1,
  rowSpan = 1,
}: BentoItemProps) {
  const spanClasses = [
    colSpan === 2 ? "md:col-span-2" : "",
    rowSpan === 2 ? "md:row-span-2" : "",
  ].join(" ");

  return (
    <div className={`${spanClasses} ${className}`}>
      {children}
    </div>
  );
}
