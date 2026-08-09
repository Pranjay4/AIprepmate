function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Timer({ elapsedSeconds, totalSeconds }: { elapsedSeconds: number; totalSeconds: number }) {
  const remaining = Math.max(totalSeconds - elapsedSeconds, 0);
  const progress = Math.min((elapsedSeconds / totalSeconds) * 100, 100);
  const isCritical = remaining <= 60;

  return (
    <div className="flex items-center gap-3">
      <div className="text-right">
        <p className={`text-sm font-semibold tabular-nums ${isCritical ? "text-danger" : ""}`}>{formatTime(remaining)}</p>
        <p className="text-[11px] text-muted">remaining</p>
      </div>
      <div className="w-24 h-1.5 rounded-full bg-surface-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${isCritical ? "bg-danger" : "bg-accent"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-left">
        <p className="text-sm font-semibold tabular-nums">{formatTime(elapsedSeconds)}</p>
        <p className="text-[11px] text-muted">elapsed</p>
      </div>
    </div>
  );
}
