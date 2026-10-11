"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGDStore } from "@/lib/store/gdStore";
import { getRealismSettings, getSavedUserName, saveUserName } from "@/lib/storage/appSettings";
import {
  DIFFICULTIES,
  DURATIONS,
  PARTICIPANT_COUNTS,
  TOPIC_CATEGORIES,
  type Difficulty,
  type DurationMinutes,
  type ParticipantCount,
  type TopicCategory,
} from "@/lib/schema";

const CATEGORY_LABELS: Record<TopicCategory, string> = {
  "current-affairs": "Current Affairs",
  technology: "Technology",
  business: "Business",
  economics: "Economics",
  marketing: "Marketing",
  abstract: "Abstract",
  "social-issues": "Social Issues",
  custom: "Custom Topic",
};

const DIFFICULTY_LABELS: Record<Difficulty, { label: string; desc: string }> = {
  beginner: { label: "Beginner", desc: "Clear topic, obvious arguments" },
  intermediate: { label: "Intermediate", desc: "Requires multiple perspectives" },
  placement: { label: "Placement Level", desc: "Business + social + economic thinking" },
  elite: { label: "Elite / Consulting", desc: "Ambiguous — best answer reframes it" },
};

function SetupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const isQuick = params.get("quick") === "1";
  const startSession = useGDStore((s) => s.startSession);
  const status = useGDStore((s) => s.status);

  const categoryParam = params.get("category") as TopicCategory | null;
  const [category, setCategory] = useState<TopicCategory>(
    categoryParam && TOPIC_CATEGORIES.includes(categoryParam) ? categoryParam : "business"
  );
  const [customTopicPrompt, setCustomTopicPrompt] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("placement");
  const [participantCount, setParticipantCount] = useState<ParticipantCount>(8);
  const [duration, setDuration] = useState<DurationMinutes>(isQuick ? 5 : 15);
  const [coachingMode, setCoachingMode] = useState(false);
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUserName(getSavedUserName() || "You");
  }, []);

  async function handleStart() {
    setSubmitting(true);
    setError(null);
    saveUserName(userName || "You");
    try {
      await startSession(
        {
          category,
          customTopicPrompt: category === "custom" ? customTopicPrompt : undefined,
          difficulty,
          participantCount,
          durationMinutes: duration,
          coachingMode,
          realism: getRealismSettings(),
        },
        userName || "You"
      );
      router.push("/gd/live");
    } catch {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status === "error") setSubmitting(false);
  }, [status]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
      <div>
        <p className="text-sm text-muted font-medium">{isQuick ? "Quick Practice" : "Start GD"}</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Set up your discussion</h1>
      </div>

      <Section title="Topic category">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TOPIC_CATEGORIES.map((c) => (
            <PillButton key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]}
            </PillButton>
          ))}
        </div>
        {category === "custom" && (
          <textarea
            className="mt-3 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm resize-none"
            rows={2}
            placeholder="Describe the topic area you want to discuss..."
            value={customTopicPrompt}
            onChange={(e) => setCustomTopicPrompt(e.target.value)}
          />
        )}
      </Section>

      <Section title="Difficulty">
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`text-left rounded-lg border px-3.5 py-2.5 transition-colors ${
                difficulty === d ? "border-accent bg-accent-soft" : "border-border bg-surface hover:border-accent/40"
              }`}
            >
              <p className="text-sm font-medium">{DIFFICULTY_LABELS[d].label}</p>
              <p className="text-xs text-muted mt-0.5">{DIFFICULTY_LABELS[d].desc}</p>
            </button>
          ))}
        </div>
      </Section>

      <div className="grid sm:grid-cols-2 gap-8">
        <Section title="Number of participants">
          <div className="flex gap-2">
            {PARTICIPANT_COUNTS.map((n) => (
              <PillButton key={n} active={participantCount === n} onClick={() => setParticipantCount(n)}>
                {n}
              </PillButton>
            ))}
          </div>
        </Section>

        <Section title="Duration">
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <PillButton key={d} active={duration === d} onClick={() => setDuration(d)}>
                {d} min
              </PillButton>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Your name">
        <input
          className="w-full sm:w-72 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="How the group will address you"
        />
      </Section>

      <Section title="Coaching mode">
        <button
          onClick={() => setCoachingMode((v) => !v)}
          className={`flex items-center justify-between w-full sm:w-96 rounded-lg border px-3.5 py-3 transition-colors ${
            coachingMode ? "border-accent bg-accent-soft" : "border-border bg-surface"
          }`}
        >
          <div className="text-left">
            <p className="text-sm font-medium">{coachingMode ? "Live Coaching Mode: On" : "Realistic GD (no live feedback)"}</p>
            <p className="text-xs text-muted mt-0.5">
              {coachingMode ? "Small tags appear after your turns — full score only at the end." : "No feedback until the GD ends, like a real panel."}
            </p>
          </div>
          <div className={`h-5 w-9 rounded-full flex items-center px-0.5 shrink-0 transition-colors ${coachingMode ? "bg-accent justify-end" : "bg-border justify-start"}`}>
            <div className="h-4 w-4 rounded-full bg-white shadow" />
          </div>
        </button>
      </Section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        onClick={handleStart}
        disabled={submitting || (category === "custom" && !customTopicPrompt.trim())}
        className="w-full sm:w-auto rounded-lg bg-navy text-white font-medium text-sm px-6 py-3 disabled:opacity-50"
      >
        {submitting ? "Preparing the room…" : "Begin Group Discussion"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-2.5">{title}</h3>
      {children}
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors ${
        active ? "border-accent bg-accent-soft text-foreground" : "border-border bg-surface text-muted hover:border-accent/40"
      }`}
    >
      {children}
    </button>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupForm />
    </Suspense>
  );
}
