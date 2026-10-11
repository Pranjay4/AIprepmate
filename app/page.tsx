"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Map, ListChecks, MessagesSquare, LineChart, Target, BookOpen } from "lucide-react";
import { useCP } from "@/lib/cp/store";
import { Logo } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/cp/ui";
import { ROLES } from "@/lib/cp/content/roles";

const STEPS = [
  { icon: Target, title: "Choose your target role", desc: "Pick a role, a timeline of 2 to 12 weeks, and how much time you have each day." },
  { icon: Map, title: "Follow a weekly roadmap", desc: "Get an ordered plan of lessons, practice sets and mock interviews sized to your time." },
  { icon: LineChart, title: "See what to fix next", desc: "Scores, weak topics and a recommended next action update as you work." },
];
const FEATURES = [
  { icon: BookOpen, title: "Curated lessons", desc: "Original modules with worked examples, an exercise and a knowledge check." },
  { icon: ListChecks, title: "Practice bank", desc: "Multiple choice, written and case questions — and SQL that actually runs in your browser." },
  { icon: MessagesSquare, title: "Mock interviews", desc: "Written interviews scored against a transparent five-part rubric with specific advice." },
];

export default function Landing() {
  const router = useRouter();
  const enterDemo = useCP((s) => s.enterDemo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function demo() {
    setBusy(true);
    setError("");
    try {
      await enterDemo();
      router.push("/dashboard");
    } catch {
      setError("Could not start the demo. Check that browser storage is enabled.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
          <Logo />
          <div className="flex items-center gap-2">
            <LinkButton href="/login" variant="ghost" size="sm">Log in</LinkButton>
            <LinkButton href="/signup" variant="secondary" size="sm">Sign up</LinkButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-5 pt-14 pb-12 sm:pt-20">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">Campus placement preparation</p>
          <h1 className="mt-3 text-3xl sm:text-[42px] font-semibold tracking-tight leading-[1.15] max-w-3xl">
            Prepare with direction. Practise with purpose. Progress with confidence.
          </h1>
          <p className="mt-4 text-base text-muted max-w-2xl leading-relaxed">
            CampusPrep turns a target role into a structured weekly plan, gives you practice with real feedback, and shows exactly what to work on next — in place of scattered videos, notes and question banks.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={demo} disabled={busy}>
              {busy ? "Opening demo…" : "Explore the demo account"} <ArrowRight size={15} aria-hidden />
            </Button>
            <LinkButton href="/signup" variant="secondary" size="lg">Create your own plan</LinkButton>
          </div>
          {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
          <p className="mt-3 text-xs text-muted">No sign-up needed for the demo. It opens a sample Business Analyst learner in week two of a four-week plan.</p>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="max-w-5xl mx-auto px-5 py-10 grid sm:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center"><s.icon size={16} aria-hidden /></span>
                  <span className="text-xs font-semibold text-muted">Step {i + 1}</span>
                </div>
                <h2 className="mt-3 text-sm font-semibold">{s.title}</h2>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 py-12">
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-surface p-5">
                <f.icon size={18} className="text-accent" aria-hidden />
                <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <h2 className="text-sm font-semibold">Roadmaps for six job families</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <span key={r.id} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs">
                  {r.name}
                  {r.depth === "full" && <span className="ml-1.5 text-accent font-medium">· full library</span>}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-5 py-5 text-xs text-muted leading-relaxed">
          This build runs in demo mode: accounts and progress are stored only in this browser. Scores and the readiness indicator are practice feedback and do not predict or guarantee placement outcomes. <Link href="/login" className="underline">Log in</Link>
        </div>
      </footer>
    </div>
  );
}
