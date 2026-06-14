"use client";

import {
  AlignJustify,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Download,
  ExternalLink,
  FileJson,
  FileSpreadsheet,
  FileText,
  GitPullRequest,
  Grid3X3,
  Image as ImageIcon,
  Link,
  Monitor,
  Printer,
  Ruler,
  Sparkles
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState, type ClipboardEvent as ReactClipboardEvent } from "react";

import { browserUrlProvider, type UrlCaptureResult } from "@/capture/url-provider";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { analyzeImage } from "@/engine/audit-engine";
import { AnnotatedPreview, type PreviewMode } from "@/features/audit/annotated-preview";
import { IssueExplorer } from "@/features/audit/issue-explorer";
import { SummaryDashboard } from "@/features/audit/summary-dashboard";
import { UploadPanel } from "@/features/audit/upload-panel";
import { useImageUpload } from "@/hooks/use-image-upload";
import { cn } from "@/lib/cn";
import { analyzeScreenshotPixels } from "@/lib/visual-metrics";
import {
  exportAnnotatedPng,
  exportPrintableReport,
  exportReportAsCsv,
  exportReportAsJson,
  exportReportAsMarkdown
} from "@/reports/exporters";
import type { AuditViewport, VisualMetrics } from "@/types/audit";

const viewportPresets = [320, 375, 390, 414, 768, 1024, 1280, 1440] as const;
const historyKey = "ui-auditor-ai-history";
const viewportKey = "ui-auditor-ai-viewport";

const previewModes: Array<{
  icon: typeof ImageIcon;
  label: string;
  value: PreviewMode;
}> = [
  { icon: ImageIcon, label: "Original", value: "original" },
  { icon: Sparkles, label: "Annotated", value: "annotated" },
  { icon: Columns2, label: "Split", value: "split" },
  { icon: Grid3X3, label: "Grid", value: "grid" },
  { icon: Ruler, label: "Spacing", value: "spacing" },
  { icon: AlignJustify, label: "Baseline", value: "baseline" }
];

type VisualState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; metrics: VisualMetrics }
  | { status: "error"; message: string };

interface AuditHistoryItem {
  createdAt: string;
  findings: number;
  id: string;
  imageName: string;
  score: number;
  viewport: string;
}

function loadInitialViewport(): number {
  if (typeof window === "undefined") {
    return 1440;
  }

  const stored = Number(window.localStorage.getItem(viewportKey));
  return Number.isFinite(stored) && stored >= 280 ? stored : 1440;
}

function nearestViewport(width: number): number {
  return viewportPresets.reduce((nearest, current) => {
    return Math.abs(current - width) < Math.abs(nearest - width) ? current : nearest;
  }, 1440);
}

function viewportForWidth(width: number, imageWidth: number, imageHeight: number): AuditViewport {
  const source = viewportPresets.includes(width as (typeof viewportPresets)[number]) ? "estimated" : "custom";

  return {
    width,
    height: Math.max(1, Math.round(width * (imageHeight / imageWidth))),
    label: `${width}px`,
    source
  };
}

function loadHistory(): AuditHistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(historyKey) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, 5) : [];
  } catch {
    return [];
  }
}

function saveHistory(item: AuditHistoryItem) {
  if (typeof window === "undefined") {
    return [];
  }

  const next = [item, ...loadHistory().filter((entry) => entry.id !== item.id)].slice(0, 5);
  window.localStorage.setItem(historyKey, JSON.stringify(next));
  return next;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function AuditorShell() {
  const { pasteFromClipboard, reset, state, upload } = useImageUpload();
  const image = state.status === "ready" ? state.image : undefined;
  const [activeWidth, setActiveWidth] = useState(loadInitialViewport);
  const [auditCreatedAt, setAuditCreatedAt] = useState(() => new Date().toISOString());
  const [customWidth, setCustomWidth] = useState(String(activeWidth));
  const [exportError, setExportError] = useState<string | null>(null);
  const [hasManualViewport, setHasManualViewport] = useState(false);
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [mode, setMode] = useState<PreviewMode>("annotated");
  const [selectedFindingId, setSelectedFindingId] = useState<string | undefined>();
  const [url, setUrl] = useState("");
  const [urlResult, setUrlResult] = useState<UrlCaptureResult | null>(null);
  const [visualState, setVisualState] = useState<VisualState>({ status: "idle" });

  const metrics = visualState.status === "ready" ? visualState.metrics : undefined;
  const effectiveWidth = image && !hasManualViewport ? nearestViewport(image.width) : activeWidth;
  const activeViewport = useMemo(() => {
    if (!image) {
      return undefined;
    }

    return viewportForWidth(effectiveWidth, image.width, image.height);
  }, [effectiveWidth, image]);

  const report = useMemo(() => {
    if (!image || !activeViewport) {
      return null;
    }

    return analyzeImage(image, auditCreatedAt, {
      metrics,
      viewport: activeViewport
    });
  }, [activeViewport, auditCreatedAt, image, metrics]);

  const viewportReports = useMemo(() => {
    if (!image) {
      return [];
    }

    return viewportPresets.map((width) =>
      analyzeImage(image, auditCreatedAt, {
        metrics,
        viewport: viewportForWidth(width, image.width, image.height)
      })
    );
  }, [auditCreatedAt, image, metrics]);

  const effectiveSelectedFindingId =
    selectedFindingId && report?.findings.some((finding) => finding.id === selectedFindingId)
      ? selectedFindingId
      : report?.findings[0]?.id;
  const selectedFindingIndex = report?.findings.findIndex((finding) => finding.id === effectiveSelectedFindingId) ?? -1;

  useEffect(() => {
    const timer = window.setTimeout(() => setHistory(loadHistory()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(viewportKey, String(effectiveWidth));
  }, [effectiveWidth]);

  useEffect(() => {
    if (!image) {
      return;
    }

    let cancelled = false;
    const startedAt = new Date().toISOString();
    const timer = window.setTimeout(() => {
      setAuditCreatedAt(startedAt);
      setVisualState({ status: "loading" });

      analyzeScreenshotPixels(image.previewUrl)
        .then((visualMetrics) => {
          if (!cancelled) {
            setVisualState({ status: "ready", metrics: visualMetrics });
          }
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setVisualState({
              status: "error",
              message: error instanceof Error ? error.message : "Pixel sampling failed."
            });
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [image]);

  useEffect(() => {
    if (!report) {
      return;
    }

    const item = {
      createdAt: report.createdAt,
      findings: report.summary.totalFindings,
      id: report.id,
      imageName: report.image.name,
      score: report.scores.overall,
      viewport: report.viewport.label
    };
    const timer = window.setTimeout(() => {
      setHistory(saveHistory(item));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [report]);

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = Array.from(event.clipboardData?.files ?? []).find((item) => item.type.startsWith("image/"));
      if (file) {
        setVisualState({ status: "loading" });
        setSelectedFindingId(undefined);
        setUrlResult(null);
        setExportError(null);
        void upload(file);
      }
    }

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [upload]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!report || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === "]") {
        event.preventDefault();
        selectRelativeFinding(1);
      }

      if (event.key === "[") {
        event.preventDefault();
        selectRelativeFinding(-1);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function prepareForNewImage() {
    setVisualState({ status: "loading" });
    setSelectedFindingId(undefined);
    setUrlResult(null);
    setExportError(null);
  }

  function handleFile(file: File) {
    prepareForNewImage();
    void upload(file);
  }

  function handleReset() {
    reset();
    setHasManualViewport(false);
    setVisualState({ status: "idle" });
    setSelectedFindingId(undefined);
    setUrlResult(null);
    setExportError(null);
  }

  function selectRelativeFinding(direction: 1 | -1) {
    if (!report || report.findings.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, report.findings.findIndex((finding) => finding.id === effectiveSelectedFindingId));
    const nextIndex = (currentIndex + direction + report.findings.length) % report.findings.length;
    setSelectedFindingId(report.findings[nextIndex]?.id);
  }

  function selectViewport(width: number) {
    setHasManualViewport(true);
    setActiveWidth(width);
    setCustomWidth(String(width));
  }

  function applyCustomViewport() {
    const parsedWidth = Math.max(280, Math.min(2560, Math.round(Number(customWidth))));
    if (Number.isFinite(parsedWidth)) {
      selectViewport(parsedWidth);
    }
  }

  function onClipboardPaste(event: ReactClipboardEvent<HTMLDivElement>) {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith("image/"));
    if (file) {
      handleFile(file);
    }
  }

  async function runUrlCapture() {
    const result = await browserUrlProvider.capture(url.trim());
    setUrlResult(result);
  }

  async function runExport(kind: "json" | "markdown" | "csv" | "png" | "pdf") {
    if (!report) {
      return;
    }

    try {
      setExportError(null);

      if (kind === "json") {
        exportReportAsJson(report);
      }

      if (kind === "markdown") {
        exportReportAsMarkdown(report);
      }

      if (kind === "csv") {
        exportReportAsCsv(report);
      }

      if (kind === "pdf") {
        exportPrintableReport(report);
      }

      if (kind === "png" && image) {
        await exportAnnotatedPng(image, report, effectiveSelectedFindingId);
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden px-3 py-4 sm:px-6 sm:py-5 lg:px-8" onPaste={onClipboardPaste}>
      <div className="mx-auto grid w-full min-w-0 max-w-[1800px] gap-5 sm:gap-6">
        <header className="flex flex-col gap-4 rounded-lg border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur dark:border-slate-800 dark:bg-slate-950/88 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Image alt="" className="h-11 w-11 shrink-0" height={44} priority src="/logo.svg" width={44} />
            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold text-slate-950 dark:text-white">UI Auditor AI</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">Local screenshot audits with explainable issue overlays.</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge tone="success">Browser-only</Badge>
            <Badge tone="neutral">No API keys</Badge>
            <Button
              icon={<GitPullRequest aria-hidden="true" className="h-4 w-4" />}
              variant="secondary"
              onClick={() => window.open("https://github.com/shahroz-a/ui-auditor-ai", "_blank", "noopener,noreferrer")}
            >
              GitHub
            </Button>
          </div>
        </header>

        <section className="grid min-w-0 gap-5 sm:gap-6 xl:grid-cols-[minmax(300px,340px)_minmax(0,1fr)_minmax(320px,390px)] xl:items-start">
          <div className="grid min-w-0 gap-5 xl:sticky xl:top-5">
            <UploadPanel
              image={image}
              isLoading={state.status === "loading"}
              onFile={handleFile}
              onPaste={() => {
                prepareForNewImage();
                void pasteFromClipboard();
              }}
              onReset={handleReset}
            />

            {state.status === "loading" ? <LoadingState label={`Reading ${state.fileName}`} /> : null}

            {state.status === "error" ? (
              <ErrorState
                action={
                  <Button onClick={handleReset} variant="secondary">
                    Try another image
                  </Button>
                }
                description={state.error.message}
                title={state.error.title}
              />
            ) : null}

            <Card aria-labelledby="url-title">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Link aria-hidden="true" className="mt-0.5 h-5 w-5 text-mint-600" />
                  <div>
                    <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="url-title">
                      URL analysis
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Clear browser fallback for external pages.</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="grid gap-3">
                <Input
                  label="Page URL"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void runUrlCapture();
                    }
                  }}
                />
                <Button icon={<Monitor aria-hidden="true" className="h-4 w-4" />} variant="secondary" onClick={() => void runUrlCapture()}>
                  Check capture path
                </Button>
                {urlResult ? (
                  <Alert title={urlResult.title} tone={urlResult.status === "unavailable" ? "warning" : "info"}>
                    {urlResult.message} {urlResult.fallback}
                  </Alert>
                ) : null}
              </CardBody>
            </Card>

            <Card aria-labelledby="viewport-title">
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="viewport-title">
                  Responsive viewports
                </h2>
              </CardHeader>
              <CardBody className="grid gap-4">
                <div className="grid grid-cols-4 gap-2">
                  {viewportPresets.map((width) => (
                    <button
                      className={cn(
                        "h-10 rounded-md border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600",
                        effectiveWidth === width
                          ? "border-mint-600 bg-mint-50 text-mint-700 dark:bg-mint-950 dark:text-mint-200"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                      )}
                      key={width}
                      type="button"
                      onClick={() => selectViewport(width)}
                    >
                      {width}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Input
                    aria-label="Custom viewport width"
                    label="Custom width"
                    min={280}
                    max={2560}
                    type="number"
                    value={customWidth}
                    onChange={(event) => setCustomWidth(event.target.value)}
                  />
                  <Button className="self-end" variant="secondary" onClick={applyCustomViewport}>
                    Apply
                  </Button>
                </div>
              </CardBody>
            </Card>

            <Card aria-labelledby="history-title">
              <CardHeader>
                <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="history-title">
                  Recent audits
                </h2>
              </CardHeader>
              <CardBody>
                {history.length === 0 ? (
                  <EmptyState description="Completed local audits will appear here on this device." title="No history yet" />
                ) : (
                  <ul className="grid gap-3 text-sm">
                    {history.map((item) => (
                      <li className="rounded-md bg-slate-50 p-3 dark:bg-slate-900" key={item.id}>
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-slate-900 dark:text-white">{item.imageName}</span>
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                              {formatDate(item.createdAt)} · {item.viewport}
                            </span>
                          </span>
                          <Badge tone={item.findings === 0 ? "success" : "warning"}>{item.score}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <div className="grid min-w-0 gap-5">
            {report ? (
              <SummaryDashboard report={report} viewportReports={viewportReports} visualStatus={visualState.status} />
            ) : (
              <Card aria-labelledby="empty-title">
                <CardBody>
                  <EmptyState
                    description="Drop in a PNG, JPG, JPEG, WebP, or AVIF screenshot. Everything runs locally in this browser."
                    primaryAction={
                      <Button
                        icon={<Sparkles aria-hidden="true" className="h-4 w-4" />}
                        variant="secondary"
                        onClick={() => {
                          prepareForNewImage();
                          void pasteFromClipboard();
                        }}
                      >
                        Paste screenshot
                      </Button>
                    }
                    title="Ready for a screenshot"
                  />
                </CardBody>
              </Card>
            )}

            <Card aria-labelledby="workspace-title">
              <CardHeader>
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-slate-950 dark:text-white" id="workspace-title">
                        Screenshot review
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Original image, annotations, and overlays.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        disabled={!report || report.findings.length === 0}
                        icon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}
                        size="icon"
                        variant="ghost"
                        onClick={() => selectRelativeFinding(-1)}
                      >
                        Previous issue
                      </Button>
                      <Badge tone="neutral">
                        {selectedFindingIndex >= 0 && report ? `${selectedFindingIndex + 1}/${report.findings.length}` : "0/0"}
                      </Badge>
                      <Button
                        disabled={!report || report.findings.length === 0}
                        icon={<ChevronRight aria-hidden="true" className="h-4 w-4" />}
                        size="icon"
                        variant="ghost"
                        onClick={() => selectRelativeFinding(1)}
                      >
                        Next issue
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {previewModes.map((item) => {
                      const Icon = item.icon;

                      return (
                        <button
                          className={cn(
                            "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint-600",
                            mode === item.value
                              ? "border-mint-600 bg-mint-50 text-mint-700 dark:bg-mint-950 dark:text-mint-200"
                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                          )}
                          key={item.value}
                          type="button"
                          onClick={() => setMode(item.value)}
                        >
                          <Icon aria-hidden="true" className="h-4 w-4" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Button className="min-w-0" disabled={!report} icon={<FileJson aria-hidden="true" className="h-4 w-4" />} variant="secondary" onClick={() => void runExport("json")}>
                      JSON
                    </Button>
                    <Button className="min-w-0" disabled={!report} icon={<FileText aria-hidden="true" className="h-4 w-4" />} variant="secondary" onClick={() => void runExport("markdown")}>
                      Markdown
                    </Button>
                    <Button className="min-w-0" disabled={!report} icon={<FileSpreadsheet aria-hidden="true" className="h-4 w-4" />} variant="secondary" onClick={() => void runExport("csv")}>
                      CSV
                    </Button>
                    <Button className="min-w-0" disabled={!report || !image} icon={<Download aria-hidden="true" className="h-4 w-4" />} variant="secondary" onClick={() => void runExport("png")}>
                      PNG
                    </Button>
                    <Button className="min-w-0 sm:col-span-1" disabled={!report} icon={<Printer aria-hidden="true" className="h-4 w-4" />} variant="secondary" onClick={() => void runExport("pdf")}>
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="grid gap-4">
                {visualState.status === "loading" ? <LoadingState label="Running local visual sampling" /> : null}
                {visualState.status === "error" ? (
                  <Alert title="Pixel sampling unavailable" tone="warning">
                    {visualState.message} Metadata rules are still active.
                  </Alert>
                ) : null}
                {exportError ? (
                  <Alert title="Export failed" tone="danger">
                    {exportError}
                  </Alert>
                ) : null}
                <AnnotatedPreview
                  image={image}
                  mode={mode}
                  report={report}
                  selectedFindingId={effectiveSelectedFindingId}
                  onSelectFinding={setSelectedFindingId}
                />
              </CardBody>
            </Card>
          </div>

          <div className="min-w-0 xl:max-h-[calc(100vh-2.5rem)] xl:resize-x xl:overflow-auto">
            <IssueExplorer report={report} selectedFindingId={effectiveSelectedFindingId} onSelectFinding={setSelectedFindingId} />
          </div>
        </section>

        <footer className="flex flex-col gap-2 border-t border-slate-200 py-5 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Built by{" "}
            <a
              className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-white"
              href="https://www.shahrozahmad.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Shahroz
            </a>{" "}
            from{" "}
            <a
              className="font-semibold text-slate-900 underline-offset-4 hover:underline dark:text-white"
              href="https://www.aierlabs.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Aier Labs
            </a>
          </span>
          <a
            className="inline-flex items-center gap-1 font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-200"
            href="https://github.com/shahroz-a/ui-auditor-ai/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            Issues and PRs
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
        </footer>
      </div>
    </main>
  );
}
