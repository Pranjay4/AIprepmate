"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { QuestionResponse, RoleId, TimelineWeeks } from "@/lib/cp/types";
import { completeOnboarding, recordBaseline, useData } from "@/lib/cp/store";
import { QUESTIONS } from "@/lib/cp/content/questions";
import { ROLE_MAP } from "@/lib/cp/content/roles";
import { gradeMcq } from "@/lib/cp/grading";
import { Button, Card, Field, Input, Select, cn } from "@/components/cp/ui";
import { BudgetNote, MinutesPicker, RolePicker, TimelinePicker } from "@/components/cp/PlanFields";

const STEPS = ["Target roles", "Timeline", "Daily time", "Baseline check", "Your profile"];

export default function OnboardingPage() {
  const router = useRouter();
  const data = useData();
  const p = data.profile;
  const [step, setStep] = useState(0);
  const [roles, setRoles] = useState<RoleId[]>(p.targetRoles);
  const [primary, setPrimary] = useState<RoleId | null>(p.primaryRole);
  const [weeks, setWeeks] = useState<TimelineWeeks>(p.timelineWeeks);
  const [minutes, setMinutes] = useState(p.minutesPerDay);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [institution, setInstitution] = useState(p.institution);
  const [degree, setDegree] = useState(p.degree);
  const [gradYear, setGradYear] = useState(p.gradYear ? String(p.gradYear) : "");
  const [error, setError] = useState("");
  const baselineStart = useRef<number | null>(null);

  // One easy-to-medium question per topic for the primary role, up to five.
  const baseline = useMemo(() => {
    if (!primary) return [];
    const seen = new Set<string>();
    return QUESTIONS.filter((q) => {
      if (q.type !== "mcq" || q.difficulty === "Hard" || !q.roles.includes(primary) || !ROLE_MAP[primary].topics.includes(q.topic) || seen.has(q.topic)) return false;
      seen.add(q.topic);
      return true;
    }).slice(0, 5);
  }, [primary]);

  const thisYear = new Date().getFullYear();

  function next() {
    setError("");
    if (step === 0 && (!roles.length || !primary)) return setError("Select at least one target role.");
    if (step === 2) baselineStart.current = Date.now();
    setStep((s) => s + 1);
  }

  function finish() {
    if (!primary) return;
    const year = gradYear ? Number(gradYear) : null;
    completeOnboarding(
      { targetRoles: roles, primaryRole: primary, timelineWeeks: weeks, minutesPerDay: minutes },
      { institution: institution.trim(), degree, gradYear: year }
    );
    const responses: QuestionResponse[] = baseline.filter((q) => answers[q.id] !== undefined).map((q) => gradeMcq(q, answers[q.id]));
    recordBaseline(responses, Math.round((Date.now() - (baselineStart.current ?? Date.now())) / 1000));
    router.push("/roadmap?new=1");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <ol className="flex items-center gap-2 mb-6" aria-label="Onboarding progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <div className={cn("h-1.5 rounded-full", i <= step ? "bg-accent" : "bg-surface-muted")} />
            <p className={cn("mt-1.5 text-[11px] hidden sm:block", i === step ? "text-foreground font-medium" : "text-muted")}>{s}</p>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted sm:hidden mb-2">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <Card className="p-5 sm:p-7">
        {step === 0 && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Which roles are you preparing for, {p.name.split(" ")[0]}?</h1>
            <p className="text-sm text-muted mt-1.5 mb-5">Select every role you are targeting. Your roadmap is built for the primary one; you can change it later in Settings.</p>
            <RolePicker roles={roles} primary={primary} onChange={(r, pr) => { setRoles(r); setPrimary(pr); setAnswers({}); }} />
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">How long until placements?</h1>
            <p className="text-sm text-muted mt-1.5 mb-5">Your plan is spread evenly across this period, starting today.</p>
            <TimelinePicker value={weeks} onChange={setWeeks} />
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">How much time can you give each day?</h1>
            <p className="text-sm text-muted mt-1.5 mb-5">Be realistic — a plan you can keep beats an ambitious one you abandon. The plan assumes six study days a week.</p>
            <MinutesPicker value={minutes} onChange={setMinutes} />
            <div className="mt-5"><BudgetNote role={primary} weeks={weeks} minutes={minutes} /></div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">Optional: a quick baseline check</h1>
            <p className="text-sm text-muted mt-1.5 mb-5">
              {baseline.length} short questions for {primary ? ROLE_MAP[primary].name : "your role"}. Answer any you like — results seed your topic performance so recommendations start out relevant. Skipping is fine; unanswered questions are not counted against you.
            </p>
            <div className="space-y-5">
              {baseline.map((q, i) => (
                <fieldset key={q.id}>
                  <legend className="text-sm font-medium whitespace-pre-line">{i + 1}. {q.prompt} <span className="text-xs font-normal text-muted">({q.topic})</span></legend>
                  <div className="mt-2 grid sm:grid-cols-2 gap-2">
                    {q.options!.map((o, j) => (
                      <label key={j} className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer", answers[q.id] === j ? "border-accent bg-accent-soft/50" : "border-border hover:bg-surface-muted")}>
                        <input type="radio" name={q.id} className="mt-1 accent-[var(--accent)]" checked={answers[q.id] === j} onChange={() => setAnswers((a) => ({ ...a, [q.id]: j }))} />
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <p className="text-xs text-muted mt-4">{Object.keys(answers).length} of {baseline.length} answered.</p>
          </>
        )}
        {step === 4 && (
          <>
            <h1 className="text-xl font-semibold tracking-tight">A little about you</h1>
            <p className="text-sm text-muted mt-1.5 mb-5">All optional. Used only to personalise your workspace — it is never shared.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Institution" htmlFor="inst"><Input id="inst" value={institution} maxLength={80} onChange={(e) => setInstitution(e.target.value)} placeholder="Your college or institute" /></Field>
              </div>
              <Field label="Degree" htmlFor="deg">
                <Select id="deg" value={degree} onChange={(e) => setDegree(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  {["MBA / PGDM", "B.Tech / B.E.", "BBA / BMS", "B.Com", "B.Sc / BCA", "BA", "M.Tech / MCA", "Other"].map((d) => <option key={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Graduation year" htmlFor="year">
                <Select id="year" value={gradYear} onChange={(e) => setGradYear(e.target.value)}>
                  <option value="">Prefer not to say</option>
                  {[0, 1, 2, 3, 4].map((o) => <option key={o}>{thisYear + o}</option>)}
                </Select>
              </Field>
            </div>
            <div className="mt-6 rounded-lg bg-surface-muted p-4 text-sm">
              <p className="font-medium">Your plan</p>
              <ul className="mt-2 space-y-1 text-muted">
                <li className="flex gap-2"><Check size={15} className="text-success mt-0.5 shrink-0" /> Roadmap for <span className="text-foreground font-medium">{primary && ROLE_MAP[primary].name}</span>{roles.length > 1 && ` (+${roles.length - 1} other target role${roles.length > 2 ? "s" : ""})`}</li>
                <li className="flex gap-2"><Check size={15} className="text-success mt-0.5 shrink-0" /> {weeks} weeks, about {minutes} minutes a day</li>
                <li className="flex gap-2"><Check size={15} className="text-success mt-0.5 shrink-0" /> Baseline: {Object.keys(answers).length ? `${Object.keys(answers).length} question(s) answered` : "skipped"}</li>
              </ul>
            </div>
          </>
        )}

        {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-7 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 0}><ArrowLeft size={15} /> Back</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>{step === 3 && !Object.keys(answers).length ? "Skip for now" : "Continue"} <ArrowRight size={15} /></Button>
          ) : (
            <Button onClick={finish}>Generate my roadmap <ArrowRight size={15} /></Button>
          )}
        </div>
      </Card>
    </div>
  );
}
