"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Check, Download, LogOut, ShieldCheck, Trash2 } from "lucide-react";
import type { RoleId, ThemePref, TimelineWeeks } from "@/lib/cp/types";
import { deleteAccount, hasSampleData, removeSampleData, resetDemo, submitReport, updatePlan, updateProfile, useCP, useData } from "@/lib/cp/store";
import { getRepository } from "@/lib/cp/data";
import { ROLE_MAP } from "@/lib/cp/content/roles";
import { fmtDate } from "@/lib/cp/util";
import { Badge, Button, Card, Field, Input, Modal, Notice, Page, PageHeader, Segmented, Select, Textarea } from "@/components/cp/ui";
import { BudgetNote, MinutesPicker, RolePicker, TimelinePicker } from "@/components/cp/PlanFields";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name (at least 2 characters).").max(60, "Keep your name under 60 characters."),
  institution: z.string().trim().max(80, "Keep this under 80 characters."),
});
const supportSchema = z.object({
  subject: z.string().trim().min(3, "Add a short subject.").max(100),
  message: z.string().trim().min(10, "Please write at least 10 characters.").max(2000),
});

function Saved({ show }: { show: boolean }) {
  return show ? <span role="status" className="inline-flex items-center gap-1 text-xs text-success"><Check size={13} /> Saved</span> : null;
}

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <Card id={id} className="p-5 sm:p-6 scroll-mt-20">
      <h2 className="text-base font-semibold">{title}</h2>
      {desc && <p className="text-sm text-muted mt-1 leading-relaxed">{desc}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export default function SettingsPage() {
  const d = useData();
  const router = useRouter();
  const logOut = useCP((s) => s.logOut);
  const p = d.profile;
  const thisYear = new Date().getFullYear();

  const [name, setName] = useState(p.name);
  const [institution, setInstitution] = useState(p.institution);
  const [degree, setDegree] = useState(p.degree);
  const [gradYear, setGradYear] = useState(p.gradYear ? String(p.gradYear) : "");
  const [pErrors, setPErrors] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState("");

  const [roles, setRoles] = useState<RoleId[]>(p.targetRoles);
  const [primary, setPrimary] = useState<RoleId | null>(p.primaryRole);
  const [weeks, setWeeks] = useState<TimelineWeeks>(p.timelineWeeks);
  const [minutes, setMinutes] = useState(p.minutesPerDay);
  const [planError, setPlanError] = useState("");
  const [confirmRole, setConfirmRole] = useState(false);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sErrors, setSErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSample, setConfirmSample] = useState(false);

  const saved = (key: string) => {
    setFlash(key);
    setTimeout(() => setFlash((f) => (f === key ? "" : f)), 2000);
  };

  function saveProfile() {
    const parsed = profileSchema.safeParse({ name, institution });
    if (!parsed.success) return setPErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
    setPErrors({});
    updateProfile({ name: parsed.data.name, institution: parsed.data.institution, degree, gradYear: gradYear ? Number(gradYear) : null });
    saved("profile");
  }

  const planChanged = primary !== p.primaryRole || weeks !== p.timelineWeeks || minutes !== p.minutesPerDay || roles.join() !== p.targetRoles.join();
  const roleChanged = primary !== p.primaryRole && !!d.roadmap;

  function applyPlan() {
    if (!primary) return;
    updatePlan({ targetRoles: roles, primaryRole: primary, timelineWeeks: weeks, minutesPerDay: minutes });
    setConfirmRole(false);
    saved("plan");
  }
  function savePlan() {
    setPlanError("");
    if (!roles.length || !primary) return setPlanError("Select at least one target role.");
    if (roleChanged) return setConfirmRole(true);
    applyPlan();
  }

  function sendSupport() {
    const parsed = supportSchema.safeParse({ subject, message });
    if (!parsed.success) return setSErrors(Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])));
    setSErrors({});
    submitReport("support", parsed.data.subject, parsed.data.message);
    setSubject("");
    setMessage("");
    saved("support");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campusprep-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Page narrow>
      <PageHeader eyebrow="Settings" title="Profile and settings" subtitle="Manage your profile, preparation plan, appearance, privacy and data." />

      <Section id="profile" title="Profile" desc="Only your name is required. Nothing here is shared with anyone.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="s-name" error={pErrors.name}><Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email" htmlFor="s-email" hint="Used to log in. It cannot be changed in demo mode."><Input id="s-email" value={p.email} disabled /></Field>
          <Field label="Institution" htmlFor="s-inst" error={pErrors.institution}><Input id="s-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Optional" /></Field>
          <Field label="Degree" htmlFor="s-deg">
            <Select id="s-deg" value={degree} onChange={(e) => setDegree(e.target.value)}>
              <option value="">Prefer not to say</option>
              {["MBA / PGDM", "B.Tech / B.E.", "BBA / BMS", "B.Com", "B.Sc / BCA", "BA", "M.Tech / MCA", "Other"].map((x) => <option key={x}>{x}</option>)}
            </Select>
          </Field>
          <Field label="Graduation year" htmlFor="s-year">
            <Select id="s-year" value={gradYear} onChange={(e) => setGradYear(e.target.value)}>
              <option value="">Prefer not to say</option>
              {[-1, 0, 1, 2, 3, 4].map((o) => <option key={o}>{thisYear + o}</option>)}
            </Select>
          </Field>
        </div>
        <div className="mt-5 flex items-center gap-3"><Button onClick={saveProfile}>Save profile</Button><Saved show={flash === "profile"} /></div>
      </Section>

      <Section id="plan" title="Preparation plan" desc="Change your target roles, timeline or daily availability. Your roadmap is rebuilt to match.">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Target roles</h3>
        <RolePicker roles={roles} primary={primary} onChange={(r, pr) => { setRoles(r); setPrimary(pr); }} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mt-6 mb-2">Timeline</h3>
        <TimelinePicker value={weeks} onChange={setWeeks} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mt-6 mb-2">Time per day</h3>
        <MinutesPicker value={minutes} onChange={setMinutes} />
        <div className="mt-4"><BudgetNote role={primary} weeks={weeks} minutes={minutes} /></div>
        {planError && <p role="alert" className="mt-3 text-sm text-danger">{planError}</p>}
        <div className="mt-5 flex items-center gap-3"><Button onClick={savePlan} disabled={!planChanged}>Update plan</Button><Saved show={flash === "plan"} /></div>
      </Section>

      <Section id="appearance" title="Appearance">
        <Segmented<ThemePref> label="Theme" value={p.theme} onChange={(theme) => updateProfile({ theme })} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "Match system" }]} />
      </Section>

      <Section id="privacy" title="Privacy" desc="How your information is handled in this build.">
        <ul className="space-y-2.5 text-sm leading-relaxed">
          {[
            "This build runs in demo mode: your profile, progress, answers and scores are stored only in this browser's local storage. Nothing is sent to a CampusPrep server.",
            "Your individual results are never shown to other users or to an institution. The institution dashboard in this demo uses synthetic data only.",
            "We collect only what the product needs: a name, an email and your preparation preferences. Institution, degree and graduation year are optional.",
            "Mock interview answers leave your browser only if an AI provider is configured on the server and you click “Generate AI feedback” on a scorecard.",
            "Usage events (for example “task completed”) are stored with your account to calculate your own product metrics. They are not transmitted.",
          ].map((t) => <li key={t} className="flex gap-2.5"><ShieldCheck size={15} className="text-accent mt-0.5 shrink-0" />{t}</li>)}
        </ul>
        <label className="mt-5 flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer">
          <input type="checkbox" checked={p.shareAggregates} onChange={(e) => updateProfile({ shareAggregates: e.target.checked })} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
          <span>
            <span className="text-sm font-medium">Include me in anonymised cohort statistics</span>
            <span className="block text-xs text-muted mt-1 leading-relaxed">Off by default. When a real institutional workflow is connected, this consent is what would allow your activity to be counted in aggregated, non-identifiable cohort metrics (groups of 10 or more). It has no effect in demo mode, where cohort data is synthetic.</span>
          </span>
        </label>
      </Section>

      <Section id="data" title="Your data" desc="Export, reset or delete what is stored for this account.">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
            <div><p className="text-sm font-medium">Export my data</p><p className="text-xs text-muted mt-0.5">Download everything stored for this account as a JSON file.</p></div>
            <Button variant="secondary" size="sm" onClick={exportData}><Download size={13} /> Export</Button>
          </div>
          {p.isDemo && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                <div className="min-w-0 flex-1 basis-64"><p className="text-sm font-medium">Remove sample history</p><p className="text-xs text-muted mt-0.5">Clears the seeded attempts, interview and activity marked “Sample” and resets the tasks they completed. Anything you did yourself is kept.</p></div>
                <Button variant="secondary" size="sm" disabled={!hasSampleData(d)} onClick={() => setConfirmSample(true)}>{hasSampleData(d) ? "Remove sample data" : "No sample data left"}</Button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
                <div className="min-w-0 flex-1 basis-64"><p className="text-sm font-medium">Reset the demo account</p><p className="text-xs text-muted mt-0.5">Restores the original sample learner and discards changes made in the demo.</p></div>
                <Button variant="secondary" size="sm" onClick={async () => { await resetDemo(); saved("reset"); }}>Reset demo</Button>
              </div>
              <Saved show={flash === "reset"} />
            </>
          )}
          {!p.isDemo && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/30 p-4">
              <div className="min-w-0 flex-1 basis-64"><p className="text-sm font-medium">Delete my account</p><p className="text-xs text-muted mt-0.5">Permanently removes your account and all progress from this browser.</p></div>
              <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Delete account</Button>
            </div>
          )}
        </div>
      </Section>

      <Section id="feedback" title="Support and feedback" desc="Tell us what is not working or what would make CampusPrep more useful. To flag a specific lesson or question, use “Report an issue” on that page.">
        <div className="space-y-4">
          <Field label="Subject" htmlFor="f-subject" error={sErrors.subject}><Input id="f-subject" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={100} /></Field>
          <Field label="Message" htmlFor="f-message" error={sErrors.message}><Textarea id="f-message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} /></Field>
          <div className="flex items-center gap-3"><Button onClick={sendSupport}>Send feedback</Button><Saved show={flash === "support"} /></div>
          <Notice tone="neutral">In demo mode, feedback and content reports are saved with your account on this device — there is no support inbox connected yet.</Notice>
        </div>
        {d.reports.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Your submissions ({d.reports.length})</h3>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {[...d.reports].reverse().map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <p className="text-sm font-medium flex flex-wrap items-center gap-2">{r.subject} <Badge tone={r.kind === "content" ? "warning" : "neutral"}>{r.kind === "content" ? "Content report" : "Feedback"}</Badge></p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{r.message}</p>
                  <p className="text-[11px] text-muted mt-1">{fmtDate(r.at, { day: "numeric", month: "short", year: "numeric" })}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section id="account" title="Account">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">Signed in as <span className="text-foreground font-medium">{p.email}</span> · storage: {getRepository().mode === "local-demo" ? "this browser (demo mode)" : "Supabase"}</p>
          <Button variant="secondary" size="sm" onClick={async () => { await logOut(); router.push("/"); }}><LogOut size={13} /> Log out</Button>
        </div>
      </Section>

      <Modal open={confirmRole} onClose={() => setConfirmRole(false)} title="Switch your primary role?" footer={<><Button variant="secondary" onClick={() => setConfirmRole(false)}>Cancel</Button><Button onClick={applyPlan}>Build new roadmap</Button></>}>
        <p className="text-sm leading-relaxed">Your roadmap will be rebuilt for <strong>{primary && ROLE_MAP[primary].name}</strong>, starting today. Task progress on your current {p.primaryRole && ROLE_MAP[p.primaryRole].name} roadmap will be replaced.</p>
        <p className="text-sm text-muted mt-2">Completed lessons, practice attempts and mock interviews are kept, and lessons you have already finished will not need repeating.</p>
      </Modal>
      <Modal open={confirmSample} onClose={() => setConfirmSample(false)} title="Remove sample history?" footer={<><Button variant="secondary" onClick={() => setConfirmSample(false)}>Cancel</Button><Button onClick={() => { removeSampleData(); setConfirmSample(false); }}>Remove sample data</Button></>}>
        <p className="text-sm leading-relaxed">Seeded attempts, the sample mock interview and sample activity will be deleted, and the roadmap tasks they completed will return to “Not started”. You can restore them later with “Reset the demo account”.</p>
      </Modal>
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete your account?" footer={<><Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="danger" onClick={async () => { await deleteAccount(); router.push("/"); }}>Delete permanently</Button></>}>
        <p className="text-sm leading-relaxed">This removes your account, roadmap, answers, scores and feedback from this browser. It cannot be undone. Consider exporting your data first.</p>
      </Modal>
    </Page>
  );
}
