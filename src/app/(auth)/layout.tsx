import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-cabbage-500 via-cabbage-600 to-cabbage-700 lg:block">
        <div className="flex h-full flex-col justify-between p-12">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <span className="text-xl">🥬</span>
            </div>
            <span className="text-2xl font-bold text-white">CabbageSEO</span>
          </Link>

          <div className="space-y-6">
            <blockquote className="text-2xl font-medium leading-relaxed text-white/90">
              &ldquo;We went from 2k to 24k monthly visitors in 4 months.
              CabbageSEO paid for itself 100x over.&rdquo;
            </blockquote>
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 font-semibold text-white">
                SC
              </div>
              <div>
                <p className="font-medium text-white">Sarah Chen</p>
                <p className="text-sm text-white/70">Founder, EcoThreads</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div>
              <p className="text-3xl font-bold text-white">1,000+</p>
              <p className="text-sm text-white/70">Active users</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50M+</p>
              <p className="text-sm text-white/70">Articles generated</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99.9%</p>
              <p className="text-sm text-white/70">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-1/2 dark:bg-slate-950">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

