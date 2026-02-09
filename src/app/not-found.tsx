import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-8xl font-black text-zinc-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-zinc-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-medium rounded-lg transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
