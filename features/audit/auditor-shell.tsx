"use client";

import { Download, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Progress } from "@/components/ui/progress";
import { ScoreRing } from "@/components/ui/score-ring";
import { analyzeImage } from "@/engine/audit-engine";
import { ChecksList, FindingsList } from "@/features/audit/findings-list";
import { UploadPanel } from "@/features/audit/upload-panel";
import { useImageUpload } from "@/hooks/use-image-upload";

const sampleImage = {
  name: "sample-dashboard.png",
  size: 1_024_000,
  type: "image/png",
  width: 1440,
  height: 1024,
  lastModified: 0
};

export function AuditorShell() {
  const { reset, state, upload } = useImageUpload();
  const image = state.status === "ready" ? state.image : undefined;
  const report = useMemo(() => (image ? analyzeImage(image) : null), [image]);
  const sampleReport = useMemo(() => analyzeImage(sampleImage, "2026-01-01T00:00:00.000Z"), []);

  function downloadReport() {
    if (!report) {
      return;
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-white/70 bg-white/70 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Image alt="" className="h-11 w-11 shrink-0" height={44} priority src="/logo.svg" width={44} />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-950 dark:text-white">UI Auditor AI</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Screenshot quality checks for product teams.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">Local first</Badge>
            <Badge tone="neutral">WCAG-minded</Badge>
            <Button
              icon={<ExternalLink aria-hidden="true" className="h-4 w-4" />}
              variant="secondary"
              onClick={() => window.open("https://github.com/shahroz-a/ui-auditor-ai", "_blank", "noopener,noreferrer")}
            >
              GitHub
            </Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <UploadPanel
            image={image}
            isLoading={state.status === "loading"}
            onFile={(file) => void upload(file)}
            onReset={reset}
          />

          <Card aria-labelledby="results-title">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="results-title">
                    Audit report
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Rule engine output, scoring, and next actions.
                  </p>
                </div>
                <Button
                  disabled={!report}
                  icon={<Download aria-hidden="true" className="h-4 w-4" />}
                  variant="secondary"
                  onClick={downloadReport}
                >
                  Export JSON
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {state.status === "idle" ? (
                <EmptyState
                  description="Upload a product screenshot to start an audit."
                  primaryAction={
                    <Button icon={<Sparkles aria-hidden="true" className="h-4 w-4" />} variant="secondary">
                      Sample score {sampleReport.scores.overall}
                    </Button>
                  }
                  secondaryAction={
                    <a
                      className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600 dark:text-slate-200 dark:hover:bg-slate-800"
                      href="/hero-screenshot.svg"
                    >
                      View sample
                    </a>
                  }
                  title="Nothing to analyze"
                />
              ) : null}

              {state.status === "loading" ? <LoadingState label={`Reading ${state.fileName}`} /> : null}

              {state.status === "error" ? (
                <ErrorState
                  action={
                    <Button onClick={reset} variant="secondary">
                      Try another image
                    </Button>
                  }
                  description={state.error.message}
                  title={state.error.title}
                />
              ) : null}

              {report ? (
                <div className="grid gap-6">
                  <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                    <ScoreRing label="Overall score" score={report.scores.overall} />
                    <div className="grid gap-3">
                      <Alert
                        title={report.summary.totalFindings === 0 ? "Analysis complete" : "Review suggested"}
                        tone={report.summary.totalFindings === 0 ? "success" : "warning"}
                      >
                        {report.summary.totalFindings === 0
                          ? "The current ruleset did not find issues in this screenshot."
                          : `${report.summary.totalFindings} finding${report.summary.totalFindings === 1 ? "" : "s"} detected across ${report.checks.length} checks.`}
                      </Alert>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Progress label="Accessibility" value={report.scores.accessibility} />
                        <Progress label="Spacing" value={report.scores.spacing} />
                        <Progress label="Typography" value={report.scores.typography} />
                        <Progress label="Layout" value={report.scores.layout} />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
                    <section aria-labelledby="findings-title" className="grid gap-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck aria-hidden="true" className="h-5 w-5 text-mint-600" />
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300" id="findings-title">
                          Findings
                        </h3>
                      </div>
                      <FindingsList findings={report.findings} />
                    </section>
                    <section aria-labelledby="checks-title" className="grid content-start gap-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300" id="checks-title">
                        Checks
                      </h3>
                      <ChecksList checks={report.checks} />
                    </section>
                  </div>
                </div>
              ) : null}
            </CardBody>
          </Card>
        </section>
      </div>
    </main>
  );
}
