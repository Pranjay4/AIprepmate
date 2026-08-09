import type { Counterargument as CounterargumentType } from "@/lib/schema";

export function Counterargument({ counterargument }: { counterargument: CounterargumentType }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-muted font-semibold mb-1">Your position</p>
        <p className="text-sm italic">&ldquo;{counterargument.targetStatement}&rdquo;</p>
      </div>
      <div className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide text-danger font-semibold mb-1">Other participant</p>
        <p className="text-sm leading-relaxed">&ldquo;{counterargument.otherParticipantRebuttal}&rdquo;</p>
      </div>
      <div className="rounded-lg bg-success/5 border border-success/20 px-4 py-3">
        <p className="text-[10px] uppercase tracking-wide text-success font-semibold mb-1">Strong response</p>
        <p className="text-sm leading-relaxed">{counterargument.strongResponse}</p>
      </div>
    </div>
  );
}
