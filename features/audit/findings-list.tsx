import { CheckCircle2, CircleAlert, CircleX, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AuditFinding, RuleCheck } from "@/types/audit";

function toneForFinding(finding: AuditFinding) {
  if (finding.severity === "critical") {
    return "danger" as const;
  }

  if (finding.severity === "major" || finding.severity === "minor") {
    return "warning" as const;
  }

  return "neutral" as const;
}

export function FindingsList({ findings }: { findings: AuditFinding[] }) {
  if (findings.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
        No issues were detected by the current ruleset.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {findings.map((finding) => (
        <article
          className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          key={finding.id}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              {finding.status === "fail" ? (
                <CircleX aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              ) : (
                <CircleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{finding.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{finding.description}</p>
              </div>
            </div>
            <Badge tone={toneForFinding(finding)}>{finding.severity}</Badge>
          </div>
          <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {finding.recommendation}
          </p>
        </article>
      ))}
    </div>
  );
}

export function ChecksList({ checks }: { checks: RuleCheck[] }) {
  return (
    <ul className="grid gap-2 text-sm">
      {checks.map((check) => {
        const Icon = check.status === "pass" ? CheckCircle2 : check.status === "fail" ? CircleX : Info;
        const tone = check.status === "pass" ? "text-emerald-600" : check.status === "fail" ? "text-rose-600" : "text-amber-600";

        return (
          <li className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 dark:bg-slate-900" key={check.ruleId}>
            <span className="flex min-w-0 items-center gap-2">
              <Icon aria-hidden="true" className={`h-4 w-4 shrink-0 ${tone}`} />
              <span className="truncate text-slate-700 dark:text-slate-200">{check.title}</span>
            </span>
            <Badge tone={check.status === "pass" ? "success" : check.status === "fail" ? "danger" : "warning"}>
              {check.status}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
