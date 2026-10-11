"use client";

import { useEffect, useState } from "react";
import { getProfile, saveProfile } from "@/lib/storage/sessionHistory";
import type { UserProfile } from "@/lib/schema";

const EXPERIENCE_LEVELS: UserProfile["experienceLevel"][] = ["fresher", "0-2 years", "2-5 years", "5+ years"];

const EMPTY: UserProfile = {
  name: "",
  college: "",
  specialization: "",
  targetRoles: "",
  experienceLevel: "fresher",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(getProfile() || EMPTY);
  }, []);

  function handleSave() {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <p className="text-sm text-muted font-medium">Profile</p>
      <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-1">Your profile</h1>
      <p className="text-sm text-muted mb-8">
        Used to lightly personalize coaching notes (e.g. marketing-specific angles for a marketing student) — it never
        changes your core GD score.
      </p>

      <div className="space-y-4">
        <Field label="Name">
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />
        </Field>
        <Field label="MBA college">
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={profile.college}
            onChange={(e) => setProfile({ ...profile, college: e.target.value })}
          />
        </Field>
        <Field label="Specialization">
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            placeholder="e.g. Marketing, Finance, Operations, Consulting"
            value={profile.specialization}
            onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
          />
        </Field>
        <Field label="Target roles">
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            placeholder="e.g. Brand Management, Strategy Consulting"
            value={profile.targetRoles}
            onChange={(e) => setProfile({ ...profile, targetRoles: e.target.value })}
          />
        </Field>
        <Field label="Experience level">
          <div className="flex gap-2 flex-wrap">
            {EXPERIENCE_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setProfile({ ...profile, experienceLevel: level })}
                className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  profile.experienceLevel === level
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-surface text-muted hover:border-accent/40"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </Field>
      </div>

      <button onClick={handleSave} className="mt-8 rounded-lg bg-navy text-white text-sm font-medium px-5 py-2.5">
        Save profile
      </button>
      {saved && <span className="ml-3 text-xs text-success">Saved.</span>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
