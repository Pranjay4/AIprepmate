export function ImprovementPlan({
  strengths,
  weaknesses,
  whatToAdd,
  oneSentenceToRemember,
}: {
  strengths: string[];
  weaknesses: string[];
  whatToAdd: string[];
  oneSentenceToRemember: string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <FeedbackList title="What you did well" items={strengths} tone="good" />
        <FeedbackList title="What hurt your score" items={weaknesses} tone="bad" />
      </div>
      <FeedbackList title="What you should have added" items={whatToAdd} tone="neutral" />
      <div className="rounded-xl bg-navy text-white px-5 py-4">
        <p className="text-[10px] uppercase tracking-wide text-white/50 font-semibold mb-1.5">
          One sentence to remember
        </p>
        <p className="text-sm font-medium leading-relaxed">&ldquo;{oneSentenceToRemember}&rdquo;</p>
      </div>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "bad" | "neutral";
}) {
  const dotClass = tone === "good" ? "bg-success" : tone === "bad" ? "bg-danger" : "bg-info";
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold mb-2.5">{title}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${dotClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
