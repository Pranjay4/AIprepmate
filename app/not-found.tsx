import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted max-w-sm">The page you are looking for does not exist or has moved.</p>
      <Link href="/dashboard" className="mt-5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white dark:text-navy">Go to dashboard</Link>
    </div>
  );
}
