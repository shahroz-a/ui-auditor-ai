"use client";

import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";
import type { AuditFinding, AuditRegion, AuditReport, AuditSeverity } from "@/types/audit";
import type { UploadedImage } from "@/types/image";

export type PreviewMode = "original" | "annotated" | "split" | "grid" | "spacing" | "baseline";

interface AnnotatedPreviewProps {
  image?: UploadedImage;
  mode: PreviewMode;
  onSelectFinding: (findingId: string) => void;
  report?: AuditReport | null;
  selectedFindingId?: string;
}

type ZoomMode = "fit" | "focus";

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

function clampUnit(value: number, min = 0.06, max = 0.94): number {
  return Math.max(min, Math.min(max, value));
}

function clampBetween(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function categoryLabel(finding: AuditFinding): string {
  return finding.category.charAt(0).toUpperCase() + finding.category.slice(1);
}

function regionAnchor(region: AuditRegion): { x: number; y: number } {
  return {
    x: clampUnit(region.x + region.width / 2),
    y: clampUnit(region.y + region.height / 2, 0.08, 0.92)
  };
}

function zoomScaleForRegion(region?: AuditRegion): number {
  if (!region) {
    return 1;
  }

  if (region.width >= 0.92 && region.height >= 0.92) {
    return 1;
  }

  const shortestSide = Math.max(0.08, Math.min(region.width, region.height));
  return Number(clampBetween(0.48 / shortestSide, 1.2, 2.8).toFixed(2));
}

function focusTransform(finding: AuditFinding | undefined, zoomMode: ZoomMode) {
  const scale = zoomMode === "focus" ? zoomScaleForRegion(finding?.region) : 1;

  if (!finding || scale <= 1) {
    return {
      anchorX: 0.5,
      anchorY: 0.5,
      displayX: 0.5,
      displayY: 0.5,
      scale: 1,
      transform: "translate3d(0%, 0%, 0) scale(1)",
      tx: 0,
      ty: 0
    };
  }

  const anchor = regionAnchor(finding.region);
  const tx = clampBetween(0.5 - anchor.x * scale, 1 - scale, 0);
  const ty = clampBetween(0.5 - anchor.y * scale, 1 - scale, 0);

  return {
    anchorX: anchor.x,
    anchorY: anchor.y,
    displayX: clampUnit(anchor.x * scale + tx),
    displayY: clampUnit(anchor.y * scale + ty, 0.08, 0.92),
    scale,
    transform: `translate3d(${tx * 100}%, ${ty * 100}%, 0) scale(${scale})`,
    tx,
    ty
  };
}

function calloutPosition(displayX: number, displayY: number): {
  bottom?: string;
  left?: string;
  right?: string;
  top?: string;
  transform?: string;
} {
  const calloutOnRight = displayX < 0.56;
  const vertical =
    displayY < 0.32
      ? { top: "0.75rem" }
      : displayY > 0.68
        ? { bottom: "0.75rem" }
        : { top: "50%", transform: "translateY(-50%)" };

  return {
    ...vertical,
    left: calloutOnRight ? clampPercent(displayX + 0.04) : undefined,
    right: calloutOnRight ? undefined : clampPercent(1 - displayX + 0.04)
  };
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
  const anchor = regionAnchor(finding.region);

  return (
    <>
      <button
        aria-label={`Focus issue ${index + 1}: ${finding.title}`}
        className={cn(
          "absolute rounded-md border-2 text-left shadow-[0_0_0_9999px_rgb(15_23_42/0)] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
          isSelected && "z-20 shadow-[0_0_0_9999px_rgb(15_23_42/0.2)]"
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
        <span className="sr-only">{finding.region.label}</span>
      </button>
      <button
        aria-label={`Focus issue ${index + 1}: ${finding.title}`}
        className={cn(
          "absolute z-30 flex max-w-[11rem] -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border border-white/80 px-2.5 py-1 text-xs font-bold text-white shadow-lg transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
          styles.pin,
          isSelected && "scale-105 ring-2 ring-white"
        )}
        style={{
          left: clampPercent(anchor.x),
          top: clampPercent(anchor.y)
        }}
        type="button"
        onClick={() => onSelectFinding(finding.id)}
      >
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-white/20 px-1">{index + 1}</span>
        <span className="hidden truncate sm:block">{categoryLabel(finding)}</span>
      </button>
    </>
  );
}

function FindingCallout({
  displayX,
  displayY,
  finding,
  issueLabel,
  onNextFinding,
  onPreviousFinding
}: {
  displayX: number;
  displayY: number;
  finding: AuditFinding;
  issueLabel: string;
  onNextFinding: () => void;
  onPreviousFinding: () => void;
}) {
  const styles = severityStyles[finding.severity];
  const evidence = finding.evidence?.slice(0, 2) ?? [];

  return (
    <div
      className="absolute z-40 grid max-h-[calc(100%-1.5rem)] w-72 max-w-[calc(100%-1rem)] gap-2 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white/95 p-3 text-left shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-950/95"
      data-testid="selected-finding-callout"
      style={calloutPosition(displayX, displayY)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <Button
          className="h-8 w-8 bg-transparent"
          icon={<ChevronLeft aria-hidden="true" className="h-4 w-4" />}
          size="icon"
          variant="ghost"
          onClick={onPreviousFinding}
        >
          Previous bug
        </Button>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{issueLabel}</span>
        <Button
          className="h-8 w-8 bg-transparent"
          icon={<ChevronRight aria-hidden="true" className="h-4 w-4" />}
          size="icon"
          variant="ghost"
          onClick={onNextFinding}
        >
          Next bug
        </Button>
      </div>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{finding.title}</p>
          <p className={cn("mt-0.5 text-xs font-semibold", styles.text)}>{finding.region.label}</p>
        </div>
        <Badge tone={finding.severity === "critical" ? "danger" : finding.severity === "info" ? "neutral" : "warning"}>
          {finding.severity}
        </Badge>
      </div>
      {evidence.length > 0 ? (
        <ul className="grid gap-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
          {evidence.map((item) => (
            <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-2" key={item}>
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 rounded-full bg-mint-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs leading-5 text-slate-600 dark:text-slate-300">{finding.description}</p>
      )}
      <p className="rounded-md bg-slate-50 p-2 text-xs leading-5 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
        {finding.fixPrompt ?? finding.recommendation}
      </p>
    </div>
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
  const selectedFinding = findings.find((finding) => finding.id === selectedFindingId);
  const selectedFindingIndex = findings.findIndex((finding) => finding.id === selectedFindingId);
  const [fitFindingId, setFitFindingId] = useState<string | null>(null);
  const selectedZoomScale = zoomScaleForRegion(selectedFinding?.region);
  const canZoomToFinding = annotated && Boolean(selectedFinding) && selectedZoomScale > 1;
  const zoomMode: ZoomMode = canZoomToFinding && fitFindingId !== selectedFinding?.id ? "focus" : "fit";
  const activeZoomMode = canZoomToFinding ? zoomMode : "fit";
  const transform = focusTransform(selectedFinding, activeZoomMode);
  const isZoomed = canZoomToFinding && activeZoomMode === "focus";

  function selectRelativeFinding(direction: 1 | -1) {
    if (findings.length === 0) {
      return;
    }

    const currentIndex = Math.max(0, selectedFindingIndex);
    const nextIndex = (currentIndex + direction + findings.length) % findings.length;
    const nextFinding = findings[nextIndex];

    if (nextFinding) {
      setFitFindingId(null);
      onSelectFinding(nextFinding.id);
    }
  }

  return (
    <div className="grid min-w-0 gap-2">
      <div
        className="relative mx-auto w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
        data-testid="screenshot-preview-frame"
        data-zoomed={isZoomed ? "true" : "false"}
      >
        <div
          className="relative min-w-0 transition-transform duration-300 ease-out"
          data-testid="screenshot-preview-plane"
          style={{
            transform: transform.transform,
            transformOrigin: "0 0"
          }}
        >
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
        {selectedFinding && annotated ? (
          <FindingCallout
            displayX={transform.displayX}
            displayY={transform.displayY}
            finding={selectedFinding}
            issueLabel={`${selectedFindingIndex + 1}/${findings.length}`}
            onNextFinding={() => selectRelativeFinding(1)}
            onPreviousFinding={() => selectRelativeFinding(-1)}
          />
        ) : null}
        {canZoomToFinding ? (
          <div className="absolute right-3 top-3 z-50">
            <Button
              className="h-9 border-white/80 bg-white/90 px-3 text-xs shadow-lg backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-950/90 dark:hover:bg-slate-900"
              icon={isZoomed ? <ZoomOut aria-hidden="true" className="h-4 w-4" /> : <ZoomIn aria-hidden="true" className="h-4 w-4" />}
              variant="secondary"
              onClick={() => {
                setFitFindingId(isZoomed ? (selectedFinding?.id ?? null) : null);
              }}
            >
              {isZoomed ? "Zoom out" : "Focus issue"}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>
          {image.width}x{image.height}px
        </span>
        {report ? (
          <span className="flex min-w-0 items-center gap-2">
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
      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-800 dark:bg-slate-950 sm:p-5">
        <EmptyState
          description="Upload or paste a screenshot to see issue locations, comparison modes, and exportable annotations."
          title="No screenshot loaded"
        />
      </div>
    );
  }

  if (mode === "split") {
    return (
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
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
