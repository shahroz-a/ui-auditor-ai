"use client";

import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import type { AuditFinding, AuditReport, AuditSeverity } from "@/types/audit";
import type { UploadedImage } from "@/types/image";

export type PreviewMode = "original" | "annotated" | "split" | "grid" | "spacing" | "baseline";

interface AnnotatedPreviewProps {
  image?: UploadedImage;
  mode: PreviewMode;
  onSelectFinding: (findingId: string) => void;
  report?: AuditReport | null;
  selectedFindingId?: string;
}

const severityStyles: Record<AuditSeverity, { border: string; fill: string; pin: string; text: string }> = {
  critical: {
    border: "rgb(220 38 38)",
    fill: "rgb(220 38 38 / 0.12)",
    pin: "bg-rose-600",
    text: "text-rose-700 dark:text-rose-200"
  },
  major: {
    border: "rgb(234 88 12)",
    fill: "rgb(234 88 12 / 0.13)",
    pin: "bg-orange-600",
    text: "text-orange-700 dark:text-orange-200"
  },
  minor: {
    border: "rgb(202 138 4)",
    fill: "rgb(202 138 4 / 0.16)",
    pin: "bg-yellow-500",
    text: "text-yellow-700 dark:text-yellow-100"
  },
  info: {
    border: "rgb(37 99 235)",
    fill: "rgb(37 99 235 / 0.12)",
    pin: "bg-blue-600",
    text: "text-blue-700 dark:text-blue-200"
  }
};

function clampPercent(value: number): string {
  return `${Math.max(0, Math.min(100, value * 100))}%`;
}

function GuideLayer({ mode }: { mode: PreviewMode }) {
  if (mode === "grid") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgb(37 99 235 / 0.22) 1px, transparent 1px), linear-gradient(90deg, rgb(37 99 235 / 0.22) 1px, transparent 1px)",
          backgroundSize: "10% 10%"
        }}
      />
    );
  }

  if (mode === "spacing") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-75"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 15px, rgb(19 138 96 / 0.24) 15px 16px), repeating-linear-gradient(90deg, transparent 0 15px, rgb(19 138 96 / 0.24) 15px 16px)"
        }}
      />
    );
  }

  if (mode === "baseline") {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent 0 23px, rgb(168 85 247 / 0.3) 23px 24px)"
        }}
      />
    );
  }

  return null;
}

function FindingOverlay({
  finding,
  index,
  isSelected,
  onSelectFinding
}: {
  finding: AuditFinding;
  index: number;
  isSelected: boolean;
  onSelectFinding: (findingId: string) => void;
}) {
  const styles = severityStyles[finding.severity];

  return (
    <button
      aria-label={`Focus issue ${index + 1}: ${finding.title}`}
      className={cn(
        "absolute rounded-md border-2 text-left shadow-[0_0_0_9999px_rgb(15_23_42/0)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        isSelected && "z-20 shadow-[0_0_0_9999px_rgb(15_23_42/0.18)]"
      )}
      style={{
        left: clampPercent(finding.region.x),
        top: clampPercent(finding.region.y),
        width: clampPercent(finding.region.width),
        height: clampPercent(finding.region.height),
        borderColor: styles.border,
        background: styles.fill
      }}
      title={`${finding.severity}: ${finding.title}`}
      type="button"
      onClick={() => onSelectFinding(finding.id)}
    >
      <span
        className={cn(
          "absolute -left-3 -top-3 grid h-7 min-w-7 place-items-center rounded-full px-2 text-xs font-bold text-white shadow-lg",
          styles.pin
        )}
      >
        {index + 1}
      </span>
      <span className="sr-only">{finding.region.label}</span>
    </button>
  );
}

function ImagePlane({
  annotated,
  image,
  mode,
  onSelectFinding,
  report,
  selectedFindingId
}: {
  annotated: boolean;
  image: UploadedImage;
  mode: PreviewMode;
  onSelectFinding: (findingId: string) => void;
  report?: AuditReport | null;
  selectedFindingId?: string;
}) {
  const findings = report?.findings ?? [];

  return (
    <div className="grid gap-2">
      <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950">
        <Image
          alt={`Screenshot preview: ${image.name}`}
          className="block h-auto max-h-[64vh] w-full object-contain"
          height={image.height}
          src={image.previewUrl}
          unoptimized
          width={image.width}
        />
        <GuideLayer mode={mode} />
        {annotated
          ? findings.map((finding, index) => (
              <FindingOverlay
                finding={finding}
                index={index}
                isSelected={finding.id === selectedFindingId}
                key={finding.id}
                onSelectFinding={onSelectFinding}
              />
            ))
          : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {image.width}x{image.height}px
        </span>
        {report ? (
          <span className="flex items-center gap-2">
            <Badge tone={report.summary.totalFindings === 0 ? "success" : "warning"}>
              {report.summary.totalFindings} issue{report.summary.totalFindings === 1 ? "" : "s"}
            </Badge>
            <span>{report.viewport.label}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function AnnotatedPreview({
  image,
  mode,
  onSelectFinding,
  report,
  selectedFindingId
}: AnnotatedPreviewProps) {
  if (!image) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft dark:border-slate-800 dark:bg-slate-950">
        <EmptyState
          description="Upload or paste a screenshot to see issue locations, comparison modes, and exportable annotations."
          title="No screenshot loaded"
        />
      </div>
    );
  }

  if (mode === "split") {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <ImagePlane
          annotated={false}
          image={image}
          mode="original"
          onSelectFinding={onSelectFinding}
          report={report}
          selectedFindingId={selectedFindingId}
        />
        <ImagePlane
          annotated
          image={image}
          mode="annotated"
          onSelectFinding={onSelectFinding}
          report={report}
          selectedFindingId={selectedFindingId}
        />
      </div>
    );
  }

  return (
    <ImagePlane
      annotated={mode !== "original"}
      image={image}
      mode={mode}
      onSelectFinding={onSelectFinding}
      report={report}
      selectedFindingId={selectedFindingId}
    />
  );
}
