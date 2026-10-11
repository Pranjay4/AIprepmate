"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { useData } from "@/lib/cp/store";
import { MODULES } from "@/lib/cp/content/modules";
import { questionsForModule } from "@/lib/cp/content/questions";
import { ROLES, ROLE_MAP } from "@/lib/cp/content/roles";
import { fmtDuration } from "@/lib/cp/util";
import { Badge, Button, Card, DifficultyBadge, Empty, Page, PageHeader, Progress, SampleBadge, Select, StatusBadge, scoreTone } from "@/components/cp/ui";

export default function LearnPage() {
  const d = useData();
  const [role, setRole] = useState<string>(d.profile.primaryRole ?? "all");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");

  const forRole = MODULES.filter((m) => role === "all" || m.roles.includes(role as never));
  const topics = [...new Set(forRole.map((m) => m.topic))];
  const shown = forRole.filter((m) => {
    const s = d.modules[m.id]?.status ?? "not_started";
    return (topic === "all" || m.topic === topic) && (status === "all" || s === status);
  });
  const done = forRole.filter((m) => d.modules[m.id]?.status === "completed").length;

  return (
    <Page>
      <PageHeader
        eyebrow="Learning library"
        title="Learn"
        subtitle="Original lessons organised by role and topic. Each one has objectives, worked examples, a practical exercise and a short knowledge check."
      />

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm"><span className="font-semibold">{done} of {forRole.length}</span> <span className="text-muted">lessons completed{role !== "all" && ` for ${ROLE_MAP[role as keyof typeof ROLE_MAP].name}`}</span></p>
          {role !== "all" && ROLE_MAP[role as keyof typeof ROLE_MAP].depth === "starter" && <Badge>Starter content — a smaller library for this role</Badge>}
        </div>
        <div className="mt-3"><Progress value={forRole.length ? (done / forRole.length) * 100 : 0} label="Lessons completed" /></div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:max-w-2xl">
        <Select aria-label="Filter by role" value={role} onChange={(e) => { setRole(e.target.value); setTopic("all"); }}>
          <option value="all">All roles</option>
          {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
        <Select aria-label="Filter by topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="all">All topics</option>
          {topics.map((t) => <option key={t}>{t}</option>)}
        </Select>
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="not_started">Not started</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      {shown.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shown.map((m) => {
            const p = d.modules[m.id];
            return (
              <Link key={m.id} href={`/learn/${m.id}`} className="group rounded-xl border border-border bg-surface p-5 flex flex-col hover:border-accent/60 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="accent">{m.topic}</Badge>
                  {p?.status === "completed" ? <CheckCircle2 size={17} className="text-success" aria-label="Completed" /> : p ? <StatusBadge value="in_progress" /> : null}
                </div>
                <h2 className="mt-3 text-sm font-semibold leading-snug group-hover:text-accent">{m.title}</h2>
                <p className="mt-1.5 text-xs text-muted leading-relaxed flex-1">{m.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <DifficultyBadge value={m.difficulty} />
                  <Badge><Clock size={11} aria-hidden />{fmtDuration(m.durationMin)}</Badge>
                  <Badge>{questionsForModule(m.id).length}-question quiz</Badge>
                  {p?.quizScore !== undefined && <Badge tone={scoreTone(p.quizScore)}>Quiz {p.quizScore}%</Badge>}
                  {p?.seeded && <SampleBadge />}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card><Empty icon={BookOpen} title="No lessons match these filters" desc="Try a different role, topic or status." action={<Button variant="secondary" size="sm" onClick={() => { setRole("all"); setTopic("all"); setStatus("all"); }}>Clear filters</Button>} /></Card>
      )}
    </Page>
  );
}
