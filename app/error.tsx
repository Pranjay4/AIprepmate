"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong on this page</h1>
      <p className="mt-2 text-sm text-muted max-w-sm">Your saved progress is not affected. Try again, or go back to the dashboard.</p>
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={reset} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white dark:text-navy">Try again</button>
        <a href="/dashboard" className="rounded-lg border border-border px-4 py-2 text-sm font-medium">Dashboard</a>
      </div>
    </div>
  );
}
