import type { Participant } from "@/lib/schema";
import { PERSONAS } from "@/lib/personas";

export function ParticipantList({
  roster,
  currentSpeakerId,
  isThinking,
}: {
  roster: Participant[];
  currentSpeakerId: string | null;
  isThinking: boolean;
}) {
  return (
    <div className="w-56 shrink-0 border-r border-border bg-surface overflow-y-auto hidden lg:block">
      <p className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        Participants ({roster.length})
      </p>
      <ul className="px-2 pb-4 space-y-0.5">
        {roster.map((p) => {
          const persona = p.personaId ? PERSONAS[p.personaId] : null;
          const isSpeaking = p.id === currentSpeakerId;
          return (
            <li
              key={p.id}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                isSpeaking ? "bg-accent-soft" : ""
              }`}
            >
              <div
                className={`relative h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  p.isUser ? "bg-navy text-white" : "bg-surface-muted"
                }`}
              >
                {p.isUser ? "🎤" : persona?.avatar || "👤"}
                {isSpeaking && (
                  <span className="speaking-dot absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-surface" />
                )}
                {isSpeaking && isThinking && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-info border-2 border-surface" />
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-medium truncate ${p.isUser ? "text-foreground" : ""}`}>
                  {p.name} {p.isUser && <span className="text-muted font-normal">(you)</span>}
                </p>
                <p className="text-[10.5px] text-muted truncate">{p.isUser ? "Candidate" : persona?.archetype}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
