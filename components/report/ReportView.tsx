import type { EvaluationReport } from "@/lib/schema";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { ImprovedAnswers } from "./ImprovedAnswers";
import { Counterargument } from "./Counterargument";
import { ImprovementPlan } from "./ImprovementPlan";

export function ReportView({ topic, report }: { topic: string; report: EvaluationReport }) {
  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs text-muted font-medium mb-1">GD Topic</p>
        <h1 className="text-lg font-semibold leading-snug">{topic}</h1>
      </div>

      <ReportSection title="Performance breakdown">
        <ScoreBreakdown overallScore={report.overallScore} scores={report.scores} />
      </ReportSection>

      <ReportSection
        title="Your strongest interventions — improved"
        subtitle="Same viewpoint, tightened up, next to the strongest possible answer for that moment."
      >
        <ImprovedAnswers rewrites={report.interventionRewrites} />
      </ReportSection>

      <ReportSection
        title="Counterargument training"
        subtitle="The sharpest pushback another candidate could give — and how to answer it."
      >
        <Counterargument counterargument={report.counterargument} />
      </ReportSection>

      <ReportSection title="Recruiter's feedback & improvement plan">
        <ImprovementPlan
          strengths={report.strengths}
          weaknesses={report.weaknesses}
          whatToAdd={report.whatToAdd}
          oneSentenceToRemember={report.oneSentenceToRemember}
        />
      </ReportSection>
    </div>
  );
}

function ReportSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-1">{title}</h2>
      {subtitle && <p className="text-xs text-muted mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}
