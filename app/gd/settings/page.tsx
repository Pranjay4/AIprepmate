"use client";

import { useEffect, useState } from "react";
import { getRealismSettings, saveRealismSettings } from "@/lib/storage/appSettings";
import {
  DEFAULT_REALISM,
  INTELLIGENCE_LEVELS,
  REALISM_LEVELS,
  type IntelligenceLevel,
  type RealismLevel,
  type RealismSettings,
} from "@/lib/schema";

const REALISM_FIELDS: { key: keyof Omit<RealismSettings, "aiIntelligence">; label: string; desc: string }[] = [
  { key: "aiAggression", label: "AI aggression", desc: "How often AI participants disagree strongly or push back" },
  { key: "interruptionFrequency", label: "Interruption frequency", desc: "How often AI participants jump in on each other" },
  { key: "chaos", label: "GD chaos", desc: "How unpredictable turn order and topic drift feel" },
  { key: "timePressure", label: "Time pressure", desc: "How fast the discussion moves and how quickly your turn window closes" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<RealismSettings>(DEFAULT_REALISM);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSettings(getRealismSettings());
  }, []);

  function update<K extends keyof RealismSettings>(key: K, value: RealismSettings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveRealismSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <p className="text-sm text-muted font-medium">Settings</p>
      <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-1">Realism settings</h1>
      <p className="text-sm text-muted mb-8">
        These apply as the default for every new GD you start — you can still see them before each session on the setup page.
      </p>

      <div className="space-y-6">
        {REALISM_FIELDS.map((field) => (
          <div key={field.key}>
            <p className="text-sm font-medium">{field.label}</p>
            <p className="text-xs text-muted mb-2">{field.desc}</p>
            <div className="flex gap-2">
              {REALISM_LEVELS.map((level) => (
                <LevelButton
                  key={level}
                  active={settings[field.key] === level}
                  onClick={() => update(field.key, level as RealismLevel)}
                >
                  {level}
                </LevelButton>
              ))}
            </div>
          </div>
        ))}

        <div>
          <p className="text-sm font-medium">AI intelligence</p>
          <p className="text-xs text-muted mb-2">How strong the AI candidates are on average</p>
          <div className="flex gap-2">
            {INTELLIGENCE_LEVELS.map((level) => (
              <LevelButton
                key={level}
                active={settings.aiIntelligence === level}
                onClick={() => update("aiIntelligence", level as IntelligenceLevel)}
              >
                {level}
              </LevelButton>
            ))}
          </div>
        </div>
      </div>

      {saved && <p className="text-xs text-success mt-6">Saved.</p>}
    </div>
  );
}

function LevelButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`capitalize rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "border-accent bg-accent-soft" : "border-border bg-surface text-muted hover:border-accent/40"
      }`}
    >
      {children}
    </button>
  );
}
