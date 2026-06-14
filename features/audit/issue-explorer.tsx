"use client";

import { Check, Copy, EyeOff, Search, Target } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import type { AuditCategory, AuditFinding, AuditReport, AuditSeverity } from "@/types/audit";

interface IssueExplorerProps {
  onSelectFinding: (findingId: string) => void;
  report?: AuditReport | null;
  selectedFindingId?: string;
}

type FindingState = "active" | "resolved" | "ignored";
type SortMode = "impact" | "confidence";

const severities: Array<"all" | AuditSeverity> = ["all", "critical", "major", "minor", "info"];
const categories: Array<"all" | AuditCategory> = [
  "all",
  "accessibility",
  "responsive",
  "layout",
  "spacing",
  "typography",
  "components",
  "quality",
  "performance"
];

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

const severityTone: Record<AuditSeverity, "danger" | "neutral" | "warning"> = {
  critical: "danger",
  major: "warning",
  minor: "warning",
  info: "neutral"
};

function findingText(finding: AuditFinding): string {
  return `${finding.title} ${finding.description} ${finding.recommendation} ${finding.category} ${finding.severity}`.toLowerCase();
}

function groupFindings(findings: AuditFinding[]): Partial<Record<AuditCategory, AuditFinding[]>> {
  return findings.reduce<Partial<Record<AuditCategory, AuditFinding[]>>>((groups, finding) => {
    return {
      ...groups,
      [finding.category]: [...(groups[finding.category] ?? []), finding]
    };
  }, {});
}

function summaryForClipboard(report: AuditReport): string {
  const topFindings = report.findings
    .slice()
    .sort((first, second) => second.scoreImpact - first.scoreImpact)
    .slice(0, 5)
    .map((finding, index) => `${index + 1}. [${finding.severity}] ${finding.title}: ${finding.recommendation}`)
    .join("\n");

  return `UI Auditor AI report
Score: ${report.scores.overall}/100
Viewport: ${report.viewport.label}
Findings: ${report.summary.totalFindings}

${topFindings || "No findings."}`;
}

export function IssueExplorer({ onSelectFinding, report, selectedFindingId }: IssueExplorerProps) {
  const [category, setCategory] = useState<"all" | AuditCategory>("all");
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"all" | AuditSeverity>("all");
  const [sortMode, setSortMode] = useState<SortMode>("impact");
  const [findingStates, setFindingStates] = useState<Record<string, FindingState>>({});

  const findings = report?.findings ?? [];
  const activeFindings = findings.filter((finding) => findingStates[finding.id] !== "ignored");
  const topFixes = activeFindings
    .filter((finding) => findingStates[finding.id] !== "resolved")
    .slice()
    .sort((first, second) => second.scoreImpact - first.scoreImpact)
    .slice(0, 3);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredFindings = activeFindings
    .filter((finding) => severity === "all" || finding.severity === severity)
    .filter((finding) => category === "all" || finding.category === category)
    .filter((finding) => !normalizedQuery || findingText(finding).includes(normalizedQuery))
    .sort((first, second) => {
      if (sortMode === "confidence") {
        return second.confidence - first.confidence;
      }

      return second.scoreImpact - first.scoreImpact;
    });

  const groupedFindings = groupFindings(filteredFindings);

  function updateFindingState(findingId: string, state: FindingState) {
    setFindingStates((current) => ({
      ...current,
      [findingId]: current[findingId] === state ? "active" : state
    }));
  }

  async function copySummary() {
    if (!report || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(summaryForClipboard(report));
  }

  if (!report) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <EmptyState
          description="The issue list will appear after a screenshot is decoded locally."
          title="No audit yet"
        />
      </div>
    );
  }

  return (
    <aside aria-labelledby="issues-title" className="grid gap-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="issues-title">
            Issue explorer
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{filteredFindings.length} visible findings</p>
        </div>
        <Button icon={<Copy aria-hidden="true" className="h-4 w-4" />} variant="secondary" onClick={() => void copySummary()}>
          Copy
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <Input
          label="Search"
          placeholder="Find issue, fix, region..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
        />
        <div className="grid gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Severity</span>
          <div className="flex flex-wrap gap-2">
            {severities.map((value) => (
              <button
                className={cn(
                  "inline-flex h-9 items-center rounded-md border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600",
                  severity === value
                    ? "border-mint-600 bg-mint-50 text-mint-700 dark:bg-mint-950 dark:text-mint-200"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                )}
                key={value}
                type="button"
                onClick={() => setSeverity(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Category</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((value) => (
              <button
                className={cn(
                  "inline-flex h-9 items-center rounded-md border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600",
                  category === value
                    ? "border-mint-600 bg-mint-50 text-mint-700 dark:bg-mint-950 dark:text-mint-200"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
                )}
                key={value}
                type="button"
                onClick={() => setCategory(value)}
              >
                {value === "all" ? "all" : categoryLabels[value]}
              </button>
            ))}
          </div>
        </div>
        <Button
          icon={<Search aria-hidden="true" className="h-4 w-4" />}
          variant="ghost"
          onClick={() => setSortMode((current) => (current === "impact" ? "confidence" : "impact"))}
        >
          Sort by {sortMode === "impact" ? "impact" : "confidence"}
        </Button>
      </div>

      {topFixes.length > 0 ? (
        <section className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Top fixes</h3>
          {topFixes.map((finding, index) => (
            <button
              className="flex items-start gap-3 rounded-md p-2 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600 dark:hover:bg-slate-900"
              key={finding.id}
              type="button"
              onClick={() => onSelectFinding(finding.id)}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white dark:bg-white dark:text-slate-950">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{finding.title}</span>
                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-300">{finding.recommendation}</span>
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {filteredFindings.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
          <EmptyState
            description="Adjust search, severity, category, or ignored states to bring findings back."
            primaryAction={
              <Button
                variant="secondary"
                onClick={() => {
                  setCategory("all");
                  setSeverity("all");
                  setQuery("");
                }}
              >
                Clear filters
              </Button>
            }
            title={findings.length === 0 ? "No issues found" : "No matching issues"}
          />
        </div>
      ) : (
        <div className="grid gap-3">
          {categories
            .filter((value): value is AuditCategory => value !== "all")
            .filter((value) => (groupedFindings[value]?.length ?? 0) > 0)
            .map((value) => (
              <details
                className="rounded-lg border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950"
                key={value}
                open
              >
                <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600 dark:text-white">
                  {categoryLabels[value]} ({groupedFindings[value]?.length ?? 0})
                </summary>
                <div className="grid gap-3 border-t border-slate-200 p-3 dark:border-slate-800">
                  {(groupedFindings[value] ?? []).map((finding) => {
                    const state = findingStates[finding.id] ?? "active";

                    return (
                      <article
                        className={cn(
                          "rounded-md border p-3 transition",
                          selectedFindingId === finding.id
                            ? "border-mint-600 bg-mint-50 dark:bg-mint-950"
                            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
                          state === "resolved" && "opacity-65"
                        )}
                        key={finding.id}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600"
                            type="button"
                            onClick={() => onSelectFinding(finding.id)}
                          >
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-slate-950 dark:text-white">{finding.title}</span>
                              <Badge tone={severityTone[finding.severity]}>{finding.severity}</Badge>
                              {state === "resolved" ? <Badge tone="success">resolved</Badge> : null}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-slate-600 dark:text-slate-300">
                              {finding.description}
                            </span>
                          </button>
                          <Button
                            aria-pressed={selectedFindingId === finding.id}
                            icon={<Target aria-hidden="true" className="h-4 w-4" />}
                            size="icon"
                            variant="ghost"
                            onClick={() => onSelectFinding(finding.id)}
                          >
                            Focus issue
                          </Button>
                        </div>
                        <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                          {finding.recommendation}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Impact {finding.scoreImpact} · Confidence {Math.round(finding.confidence * 100)}%
                          </span>
                          <span className="flex gap-2">
                            <Button
                              icon={<Check aria-hidden="true" className="h-4 w-4" />}
                              size="sm"
                              variant="ghost"
                              onClick={() => updateFindingState(finding.id, "resolved")}
                            >
                              Resolve
                            </Button>
                            <Button
                              icon={<EyeOff aria-hidden="true" className="h-4 w-4" />}
                              size="sm"
                              variant="ghost"
                              onClick={() => updateFindingState(finding.id, "ignored")}
                            >
                              Ignore
                            </Button>
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </details>
            ))}
        </div>
      )}
    </aside>
  );
}
