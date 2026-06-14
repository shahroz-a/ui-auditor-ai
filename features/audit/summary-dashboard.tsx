import { CircleAlert, ShieldCheck, Sparkles } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import type { AuditCategory, AuditReport } from "@/types/audit";

interface SummaryDashboardProps {
  report: AuditReport;
  viewportReports: AuditReport[];
  visualStatus: "idle" | "loading" | "ready" | "error";
}

const categoryLabels: Record<AuditCategory, string> = {
  accessibility: "Accessibility",
  components: "Components",
  layout: "Layout",
  performance: "Performance",
  quality: "Quality",
  responsive: "Responsive",
  spacing: "Spacing",
  typography: "Typography"
};

const categories: AuditCategory[] = [
  "accessibility",
  "responsive",
  "layout",
  "spacing",
  "typography",
  "components",
  "quality",
  "performance"
];

export function SummaryDashboard({ report, viewportReports, visualStatus }: SummaryDashboardProps) {
  const criticalFindings = report.findings.filter((finding) => finding.severity === "critical").slice(0, 3);
  const accessibilityCount = report.findings.filter((finding) => finding.category === "accessibility").length;
  const layoutCount = report.findings.filter((finding) => finding.category === "layout" || finding.category === "spacing").length;
  const bestViewport = viewportReports.slice().sort((first, second) => second.scores.overall - first.scores.overall)[0];
  const weakestViewport = viewportReports.slice().sort((first, second) => first.scores.overall - second.scores.overall)[0];

  return (
    <section aria-labelledby="summary-title" className="grid min-w-0 gap-5 rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950 sm:p-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="summary-title">
            Audit report
          </h2>
          <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
            {report.image.name} · {report.viewport.label}
          </p>
        </div>
        <Badge tone={visualStatus === "ready" ? "success" : visualStatus === "error" ? "warning" : "neutral"}>
          {visualStatus === "ready" ? "pixel sampled" : visualStatus === "loading" ? "sampling" : visualStatus === "error" ? "metadata mode" : "local"}
        </Badge>
      </div>

      <div className="grid gap-5 xl:grid-cols-[auto_minmax(0,1fr)] xl:items-center">
        <ScoreRing label="Overall score" score={report.scores.overall} />
        <div className="grid min-w-0 gap-4">
          <Alert
            title={report.summary.totalFindings === 0 ? "Analysis complete" : "Review suggested"}
            tone={report.summary.totalFindings === 0 ? "success" : report.summary.critical > 0 ? "danger" : "warning"}
          >
            {report.summary.totalFindings === 0
              ? "The current ruleset did not find issues in this screenshot."
              : `${report.summary.totalFindings} finding${report.summary.totalFindings === 1 ? "" : "s"} detected across ${report.checks.length} local checks.`}
          </Alert>
          <div className="grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <Progress key={category} label={categoryLabels[category]} value={report.scores[category]} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-w-0 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Severity</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <span className="text-rose-700 dark:text-rose-200">Critical {report.summary.critical}</span>
            <span className="text-orange-700 dark:text-orange-200">Major {report.summary.major}</span>
            <span className="text-yellow-700 dark:text-yellow-200">Minor {report.summary.minor}</span>
            <span className="text-blue-700 dark:text-blue-200">Info {report.summary.info}</span>
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            Accessibility
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{report.scores.accessibility}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{accessibilityCount} active signal{accessibilityCount === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <CircleAlert aria-hidden="true" className="h-4 w-4" />
            Layout stability
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{Math.min(report.scores.layout, report.scores.spacing)}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{layoutCount} layout signal{layoutCount === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            Recommendations
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950 dark:text-white">{report.findings.length}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Actionable local fixes</p>
        </div>
      </div>

      {criticalFindings.length > 0 ? (
        <div className="grid gap-2 rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950">
          <h3 className="text-sm font-semibold text-rose-950 dark:text-rose-100">Top critical issues</h3>
          {criticalFindings.map((finding) => (
            <p className="text-sm leading-6 text-rose-900 dark:text-rose-100" key={finding.id}>
              {finding.title}: {finding.recommendation}
            </p>
          ))}
        </div>
      ) : null}

      {bestViewport && weakestViewport ? (
        <div className="grid min-w-0 gap-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Responsive score summary</h3>
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Best {bestViewport.viewport.label} · Weakest {weakestViewport.viewport.label}
            </span>
          </div>
          <div className="grid min-w-0 gap-2 sm:grid-cols-4">
            {viewportReports.map((viewportReport) => (
              <div className="rounded-md bg-slate-50 p-3 dark:bg-slate-900" key={viewportReport.viewport.width}>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{viewportReport.viewport.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{viewportReport.scores.overall}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
