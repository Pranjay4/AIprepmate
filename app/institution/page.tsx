"use client";

import { useMemo, useState } from "react";
import { Activity, FlaskConical, Lock, ShieldCheck, Users } from "lucide-react";
import type { RoleId } from "@/lib/cp/types";
import { useData } from "@/lib/cp/store";
import { cohortSummary, MIN_GROUP_SIZE } from "@/lib/cp/cohort";
import { productMetrics } from "@/lib/cp/insights";
import { ROLES } from "@/lib/cp/content/roles";
import { Badge, Card, CardHeader, Empty, Notice, Page, PageHeader, Segmented, Select, Stat } from "@/components/cp/ui";
import { AccuracyBars, ScoreLine } from "@/components/cp/charts";

const EVENT_LABEL: Record<string, string> = {
  signup_completed: "Signup completed", onboarding_completed: "Onboarding completed", role_selected: "Role selected",
  roadmap_generated: "Roadmap generated", roadmap_viewed: "Roadmap viewed", task_started: "Task started", task_completed: "Task completed",
  practice_started: "Practice started", practice_submitted: "Practice submitted", feedback_viewed: "Feedback viewed",
  recommended_task_completed: "Recommended task completed", session_returned: "User returned for another session",
  content_issue_reported: "Content issue reported", recommendation_followed: "Recommendation followed",
};

export default function InstitutionPage() {
  const d = useData();
  const [tab, setTab] = useState<"cohort" | "product">("cohort");
  const [role, setRole] = useState<RoleId | "all">("all");
  const c = useMemo(() => cohortSummary(role), [role]);
  const pm = useMemo(() => productMetrics(d), [d]);
  const pct = (v: number | null) => (v === null ? "—" : `${v}%`);

  return (
    <Page>
      <PageHeader eyebrow="Institution" title="Cohort and product insights" subtitle="An aggregated view for placement cells, plus the product metrics CampusPrep tracks. Individual student results are never shown here." />
      <Segmented label="Insights view" value={tab} onChange={setTab} options={[{ value: "cohort", label: "Cohort overview" }, { value: "product", label: "Product metrics" }]} />

      {tab === "cohort" && (
        <>
          <Notice tone="warning" icon={FlaskConical}>
            <strong className="font-semibold">Synthetic demo data.</strong> This cohort is generated from a fixed random seed to show what an institutional view could look like. It does not describe real students, and your own activity is not included.
          </Notice>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="w-full sm:w-64">
              <Select aria-label="Filter cohort by target role" value={role} onChange={(e) => setRole(e.target.value as RoleId | "all")}>
                <option value="all">All target roles</option>
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name} ({c.byRole.find((x) => x.role === r.id)?.n})</option>)}
              </Select>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> Groups smaller than {MIN_GROUP_SIZE} students are hidden</p>
          </div>

          {c.suppressed ? (
            <Card><Empty icon={Lock} title="Hidden to protect privacy" desc={`Only ${c.n} students in this cohort target this role. Metrics are shown only for groups of ${MIN_GROUP_SIZE} or more so that no individual can be identified.`} /></Card>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat label="Participating students" icon={Users} value={c.n} sub="Enrolled in the cohort" />
                <Stat label="Activation" icon={Activity} value={`${c.activationPct}%`} sub={`${c.activated} generated a roadmap and completed a first activity`} />
                <Stat label="Active last week" value={`${c.weeklyActivePct}%`} sub="Completed at least one activity" />
                <Stat label="Planned-task completion" value={`${c.plannedCompletion}%`} sub="Average among activated students" />
              </div>
              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader title="Weekly active students" desc="Share of the cohort active each week (%)." />
                  <div className="p-5 pt-3"><ScoreLine name="Active (%)" data={c.weekly.map((w) => ({ label: w.week, score: w.activePct }))} /></div>
                </Card>
                <Card>
                  <CardHeader title="Practice completion trend" desc="Share of started practice sessions that were submitted (%)." />
                  <div className="p-5 pt-3"><ScoreLine name="Completion (%)" data={c.weekly.map((w) => ({ label: w.week, score: w.completionPct }))} /></div>
                </Card>
              </div>
              <Card>
                <CardHeader title="Aggregate topic-level performance" desc={`Average practice accuracy by topic, lowest first.${c.hiddenTopics ? ` ${c.hiddenTopics} topic(s) with fewer than ${MIN_GROUP_SIZE} students are hidden.` : ""}`} />
                <div className="p-5 pt-4">
                  {c.topics.length ? <AccuracyBars rows={c.topics.map((t) => ({ label: t.topic, value: t.pct, note: `${t.n} students` }))} /> : <p className="text-sm text-muted">No topic has enough students to display.</p>}
                </div>
              </Card>
            </>
          )}

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={15} className="text-accent" /> Privacy protections in this view</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-muted leading-relaxed list-disc pl-5">
              <li>Only aggregated counts and averages are shown — there is no student list, search or drill-down.</li>
              <li>Any group or topic with fewer than {MIN_GROUP_SIZE} students is suppressed.</li>
              <li>In a live deployment, a student is counted only after opting in under Settings → Privacy. Your current choice: <Badge tone={d.profile.shareAggregates ? "success" : "neutral"}>{d.profile.shareAggregates ? "Opted in" : "Not sharing"}</Badge></li>
              <li>The database schema enforces this with row-level security: students can read only their own rows, and institutional roles can query only an aggregate view.</li>
            </ul>
          </Card>
        </>
      )}

      {tab === "product" && (
        <>
          <Notice tone="neutral">
            Calculated from the event log of <strong className="font-semibold">this account only</strong> ({pm.totalEvents} events{pm.seededEvents > 0 && <>, of which {pm.seededEvents} are seeded sample events</>}). Cross-user rates such as cohort retention need a shared backend and are not estimated here.
          </Notice>
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">North Star metric</p>
            <h2 className="mt-1 text-base font-semibold">Weekly learners completing planned preparation tasks and demonstrating progress on practice assessments</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Badge tone={pm.northStar.qualifies ? "success" : "neutral"}>{pm.northStar.qualifies ? "This learner counts this week" : "This learner does not count yet this week"}</Badge>
              <span className="text-muted">{pm.northStar.tasksThisWeek} planned task(s) completed in the last 7 days · practice trend: {pm.northStar.improved === null ? "not enough attempts to compare" : pm.northStar.improved ? "improving" : "not improving"}</span>
            </div>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Activated" value={pm.activated ? "Yes" : "Not yet"} sub="Onboarded, roadmap generated and first task or practice done" />
            <Stat label="Planned-task completion" value={pct(pm.plannedCompletion)} sub="Tasks due to date that are completed" />
            <Stat label="Practice completion" value={pct(pm.practiceCompletion)} sub="Started sessions that were submitted" />
            <Stat label="Weak-area action rate" value={pct(pm.weakAreaActionRate)} sub={pm.recFollowed ? `${pm.recFollowed} recommendation(s) followed` : "No recommendation followed yet"} />
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <h2 className="text-sm font-semibold">Retention signals</h2>
              <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
                <div><dt className="text-xs text-muted">Active days</dt><dd className="text-xl font-semibold mt-0.5">{pm.activeDays}</dd></div>
                <div><dt className="text-xs text-muted">Active weeks</dt><dd className="text-xl font-semibold mt-0.5">{pm.activeWeeks}</dd></div>
                <div><dt className="text-xs text-muted">Return sessions</dt><dd className="text-xl font-semibold mt-0.5">{pm.returned}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted leading-relaxed">A return session is logged when the app is opened 30 minutes or more after the previous visit. Week-over-week retention across learners cannot be computed from a single account.</p>
            </Card>
            <Card>
              <CardHeader title="Instrumented events" desc="Counts recorded for this account." />
              {pm.counts.length ? (
                <ul className="mt-3 divide-y divide-border">
                  {pm.counts.map(([name, n]) => <li key={name} className="flex items-center justify-between px-5 py-2.5 text-sm"><span>{EVENT_LABEL[name] ?? name}</span><span className="font-semibold tabular-nums">{n}</span></li>)}
                </ul>
              ) : <Empty icon={Activity} title="No events yet" desc="Events are recorded as you use the product." />}
            </Card>
          </div>
        </>
      )}
    </Page>
  );
}
