"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2, History, ListChecks, Play, Timer, XCircle } from "lucide-react";
import type { QuestionType, RoleId } from "@/lib/cp/types";
import { discardPractice, pickQuestions, startPractice, toggleSaved, useData, type PracticeConfig } from "@/lib/cp/store";
import { QUESTIONS, QUESTION_MAP, TYPE_LABEL } from "@/lib/cp/content/questions";
import { DIFFICULTIES, ROLES, topicsForRole } from "@/lib/cp/content/roles";
import { strengthsAndWeaknesses, topicPerformance } from "@/lib/cp/insights";
import { fmtDate, fmtDuration } from "@/lib/cp/util";
import { Badge, Button, Card, CardHeader, DifficultyBadge, Empty, LinkButton, Notice, Page, PageHeader, SampleBadge, Segmented, Select, cn, scoreTone } from "@/components/cp/ui";

type Tab = "new" | "bank" | "saved" | "history";
const TYPES = Object.keys(TYPE_LABEL) as QuestionType[];

export default function PracticePage() {
  return (
    <Suspense>
      <Practice />
    </Suspense>
  );
}

function Practice() {
  const d = useData();
  const router = useRouter();
  const params = useSearchParams();
  const presetTopic = params.get("topic");
  const [tab, setTab] = useState<Tab>("new");
  const [role, setRole] = useState<string>(presetTopic ? "all" : d.profile.primaryRole ?? "all");
  const [topics, setTopics] = useState<string[]>(presetTopic ? [presetTopic] : []);
  const [difficulty, setDifficulty] = useState("All");
  const [types, setTypes] = useState<QuestionType[]>([]);
  const [count, setCount] = useState(8);
  const [timed, setTimed] = useState(false);
  const [error, setError] = useState("");

  const roleId = role === "all" ? null : (role as RoleId);
  const allTopics = useMemo(() => (roleId ? topicsForRole(roleId) : [...new Set(QUESTIONS.map((q) => q.topic))]).filter((t) => QUESTIONS.some((q) => q.topic === t && (!roleId || q.roles.includes(roleId)))), [roleId]);
  const weak = useMemo(() => strengthsAndWeaknesses(d).weak, [d]);
  const perf = useMemo(() => topicPerformance(d), [d]);

  const config: PracticeConfig = {
    title: topics.length === 1 ? `${topics[0]} practice` : topics.length ? `${topics.length}-topic practice` : "Mixed practice",
    role: roleId, topics: topics.length ? topics : ["*"], types, difficulty, count, timed, source: { type: "bank" },
  };
  const matching = useMemo(
    () => pickQuestions(d, { ...config, count: 999 }).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, topics, difficulty, types]
  );

  function begin(c: PracticeConfig) {
    setError("");
    if (startPractice(c)) router.push("/practice/session");
    else setError("No questions match these filters. Widen the topic, type or difficulty.");
  }

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const lastResult = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const a of d.attempts) for (const r of a.responses) if (r.answer !== null) m.set(r.questionId, r.correct);
    return m;
  }, [d.attempts]);

  const bank = QUESTIONS.filter(
    (q) => (!roleId || q.roles.includes(roleId)) && (!topics.length || topics.includes(q.topic)) && (difficulty === "All" || q.difficulty === difficulty) && (!types.length || types.includes(q.type))
  );
  const saved = d.saved.map((id) => QUESTION_MAP[id]).filter(Boolean);
  const history = [...d.attempts].reverse();

  const filters = (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="p-role" className="block text-xs font-medium mb-1.5">Role</label>
          <Select id="p-role" value={role} onChange={(e) => { setRole(e.target.value); setTopics([]); }}>
            <option value="all">All roles</option>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </Select>
        </div>
        <div>
          <label htmlFor="p-diff" className="block text-xs font-medium mb-1.5">Difficulty</label>
          <Select id="p-diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option>All</option>
            {DIFFICULTIES.map((x) => <option key={x}>{x}</option>)}
          </Select>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium mb-1.5">Topics <span className="font-normal text-muted">— none selected means all</span></p>
        <div className="flex flex-wrap gap-1.5">
          {allTopics.map((t) => {
            const on = topics.includes(t);
            const isWeak = weak.some((w) => w.topic === t);
            return (
              <button key={t} type="button" aria-pressed={on} onClick={() => setTopics(toggle(topics, t))}
                className={cn("rounded-full border px-3 py-1 text-xs font-medium", on ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-foreground")}>
                {t}{isWeak && <span className="ml-1.5 text-danger" title="Weak topic">●</span>}
              </button>
            );
          })}
        </div>
        {weak.length > 0 && <button type="button" onClick={() => setTopics(weak.map((w) => w.topic).filter((t) => allTopics.includes(t)))} className="mt-2 text-xs text-accent hover:underline">Select my weak topics ({weak.map((w) => w.topic).join(", ")})</button>}
      </div>
      <div>
        <p className="text-xs font-medium mb-1.5">Question types <span className="font-normal text-muted">— none selected means all</span></p>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button key={t} type="button" aria-pressed={types.includes(t)} onClick={() => setTypes(toggle(types, t))}
              className={cn("rounded-full border px-3 py-1 text-xs font-medium", types.includes(t) ? "border-accent bg-accent-soft text-accent" : "border-border text-muted hover:text-foreground")}>
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Page>
      <PageHeader eyebrow="Practice bank" title="Practice" subtitle="Seeded questions with answer keys and explanations. Multiple choice is auto-marked, SQL is executed in your browser, and written answers get a keyword-based key-point check alongside a model answer." />

      {d.activeSession && (
        <Notice tone="accent" icon={Play}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span><strong className="font-semibold">Unfinished session:</strong> {d.activeSession.title} — {Object.keys(d.activeSession.answers).length} of {d.activeSession.questionIds.length} answered.</span>
            <Link href="/practice/session" className="font-medium text-accent hover:underline">Resume</Link>
            <button type="button" onClick={discardPractice} className="text-muted hover:text-foreground hover:underline">Discard</button>
          </div>
        </Notice>
      )}
      {presetTopic && tab === "new" && <Notice tone="neutral">Topic preselected from a recommendation: <strong className="font-semibold">{presetTopic}</strong>.</Notice>}

      <Segmented label="Practice sections" value={tab} onChange={setTab} options={[
        { value: "new", label: "New session" }, { value: "bank", label: `Question bank (${QUESTIONS.length})` },
        { value: "saved", label: `Saved (${saved.length})` }, { value: "history", label: `History (${history.length})` },
      ]} />

      {tab === "new" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-5">
            {filters}
            <div className="mt-5 grid sm:grid-cols-2 gap-4 border-t border-border pt-5">
              <div>
                <p className="text-xs font-medium mb-1.5">Number of questions</p>
                <div className="flex gap-2">
                  {[5, 8, 12, 20].map((n) => (
                    <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)} className={cn("rounded-lg border px-3.5 py-2 text-sm font-medium", count === n ? "border-accent bg-accent-soft text-accent" : "border-border hover:bg-surface-muted")}>{n}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium"><Timer size={14} /> Timed quiz</span>
                  <span className="block text-xs text-muted mt-0.5">Sets a countdown based on question types and submits automatically at zero.</span>
                </span>
              </label>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button onClick={() => begin(config)} disabled={!matching}><Play size={14} /> Start session</Button>
              <span className="text-xs text-muted">{matching} matching question{matching === 1 ? "" : "s"} · {Math.min(count, matching)} will be drawn at random</span>
            </div>
          </Card>
          <Card>
            <CardHeader title="Your accuracy by topic" desc="Across all recorded answers." />
            {perf.length ? (
              <ul className="p-5 pt-3 space-y-2">
                {perf.map((t) => (
                  <li key={t.topic} className="flex items-center justify-between gap-3 text-sm">
                    <button type="button" onClick={() => { setRole("all"); setTopics([t.topic]); }} className="truncate text-left hover:text-accent hover:underline">{t.topic}</button>
                    <span className="flex items-center gap-2 shrink-0"><span className="text-xs text-muted">{t.answered} ans.</span><Badge tone={t.reliable ? scoreTone(t.pct) : "neutral"}>{t.pct}%</Badge></span>
                  </li>
                ))}
              </ul>
            ) : <Empty icon={ListChecks} title="No answers recorded" desc="Finish a session to see accuracy by topic." />}
          </Card>
        </div>
      )}

      {tab === "bank" && (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="p-5 h-fit">{filters}
            <div className="mt-5 border-t border-border pt-4">
              <Button size="sm" disabled={!bank.length} onClick={() => begin({ ...config, count: Math.min(20, bank.length) })}><Play size={13} /> Practise these ({Math.min(20, bank.length)})</Button>
              {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title={`${bank.length} question${bank.length === 1 ? "" : "s"}`} desc="Bookmark questions to revisit them later. Answers are shown only after you attempt them in a session." />
            {bank.length ? (
              <ul className="mt-3 divide-y divide-border">
                {bank.map((q) => <BankRow key={q.id} id={q.id} saved={d.saved.includes(q.id)} last={lastResult.get(q.id)} />)}
              </ul>
            ) : <Empty icon={ListChecks} title="No questions match" desc="Widen the role, topic, difficulty or type filters." />}
          </Card>
        </div>
      )}

      {tab === "saved" && (
        <Card>
          <CardHeader title="Saved for later" desc="Questions you bookmarked." action={saved.length ? <Button size="sm" onClick={() => begin({ title: "Saved questions", role: null, topics: ["*"], count: saved.length, source: { type: "saved" }, questionIds: d.saved })}><Play size={13} /> Practise saved</Button> : undefined} />
          {saved.length ? (
            <ul className="mt-3 divide-y divide-border">{saved.map((q) => <BankRow key={q.id} id={q.id} saved last={lastResult.get(q.id)} />)}</ul>
          ) : <Empty icon={Bookmark} title="Nothing saved yet" desc="Use the bookmark icon on any question — in the bank, during a session or on a results page." action={<Button variant="secondary" size="sm" onClick={() => setTab("bank")}>Browse the question bank</Button>} />}
        </Card>
      )}

      {tab === "history" && (
        <Card>
          <CardHeader title="Attempt history" desc={weak.length ? `Recurring weak topics: ${weak.map((w) => `${w.topic} (${w.pct}%)`).join(", ")}.` : "Every submitted session and lesson quiz."} />
          {history.length ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead><tr className="text-left text-xs text-muted border-b border-border"><th className="font-medium px-5 py-2">Session</th><th className="font-medium px-3 py-2">Date</th><th className="font-medium px-3 py-2">Questions</th><th className="font-medium px-3 py-2">Time</th><th className="font-medium px-5 py-2 text-right">Score</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {history.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-muted">
                      <td className="px-5 py-3"><Link href={`/practice/results/${a.id}`} className="font-medium hover:text-accent hover:underline">{a.title}</Link> {a.seeded && <SampleBadge />}</td>
                      <td className="px-3 py-3 text-muted whitespace-nowrap">{fmtDate(a.at)}</td>
                      <td className="px-3 py-3 text-muted">{a.responses.length}</td>
                      <td className="px-3 py-3 text-muted whitespace-nowrap">{fmtDuration(Math.max(1, a.durationSec / 60))}</td>
                      <td className="px-5 py-3 text-right"><Badge tone={scoreTone(a.scorePct)}>{a.scorePct}%</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty icon={History} title="No attempts yet" desc="Your scores and answers are stored here after each session." action={<Button size="sm" onClick={() => setTab("new")}>Start a session</Button>} />}
        </Card>
      )}

      <p className="text-xs text-muted">Looking for a specific lesson first? <LinkButton href="/learn" variant="ghost" size="sm">Open the learning library</LinkButton></p>
    </Page>
  );
}

function BankRow({ id, saved, last }: { id: string; saved: boolean; last?: boolean }) {
  const q = QUESTION_MAP[id];
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-relaxed line-clamp-2">{q.prompt}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge tone="accent">{q.topic}</Badge>
          <Badge>{TYPE_LABEL[q.type]}</Badge>
          <DifficultyBadge value={q.difficulty} />
          {last === true && <Badge tone="success"><CheckCircle2 size={11} aria-hidden />Last attempt correct</Badge>}
          {last === false && <Badge tone="danger"><XCircle size={11} aria-hidden />Last attempt incorrect</Badge>}
        </div>
      </div>
      <button type="button" onClick={() => toggleSaved(id)} aria-pressed={saved} aria-label={saved ? "Remove from saved" : "Save for later"} title={saved ? "Remove from saved" : "Save for later"} className={cn("p-1.5 rounded-md hover:bg-surface-muted", saved ? "text-accent" : "text-muted")}>
        {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
      </button>
    </li>
  );
}
