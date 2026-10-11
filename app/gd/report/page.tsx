"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGDStore } from "@/lib/store/gdStore";
import { ReportView } from "@/components/report/ReportView";

export default function ReportPage() {
  const router = useRouter();
  const { status, report, topic, errorMessage, reset } = useGDStore();

  useEffect(() => {
    if (status === "idle" || (!report && status !== "evaluating" && status !== "error")) {
      router.replace("/gd");
    }
  }, [status, report, router]);

  if (status === "evaluating" || (!report && status !== "error")) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-1px)]">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
          <p className="text-sm text-muted">Scoring your performance…</p>
        </div>
      </div>
    );
  }

  if (status === "error" || !report) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-1px)] px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-medium text-danger mb-2">Couldn&apos;t generate your report</p>
          <p className="text-sm text-muted">{errorMessage}</p>
          <Link href="/gd" className="mt-4 inline-block rounded-lg border border-border px-4 py-2 text-sm font-medium">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <ReportView topic={topic} report={report} />
      <div className="flex gap-3 mt-10 pb-10">
        <Link
          href="/gd/setup"
          onClick={() => reset()}
          className="rounded-lg bg-navy text-white text-sm font-medium px-5 py-2.5"
        >
          Practice another GD
        </Link>
        <Link href="/gd/performance" className="rounded-lg border border-border text-sm font-medium px-5 py-2.5">
          View performance trends
        </Link>
      </div>
    </div>
  );
}
