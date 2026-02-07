"use client";

interface DashboardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function DashboardHeader({
  title,
  description,
  action,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500">{description}</p>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {action}
      </div>
    </header>
  );
}

