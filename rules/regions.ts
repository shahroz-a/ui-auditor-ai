import type { AuditRegion, VisualMetrics } from "@/types/audit";

const edgeRegions = {
  bottom: { x: 0.04, y: 0.84, width: 0.92, height: 0.14 },
  left: { x: 0.02, y: 0.04, width: 0.14, height: 0.92 },
  right: { x: 0.84, y: 0.04, width: 0.14, height: 0.92 },
  top: { x: 0.04, y: 0.02, width: 0.92, height: 0.14 }
} satisfies Record<string, Omit<AuditRegion, "label">>;

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function rounded(value: number): number {
  return Number(value.toFixed(3));
}

export function metricPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function strongestEdge(metrics: VisualMetrics): { edge: keyof typeof edgeRegions; activity: number } {
  const edges = [
    { edge: "left" as const, activity: metrics.leftActivity },
    { edge: "right" as const, activity: metrics.rightActivity },
    { edge: "top" as const, activity: metrics.topActivity },
    { edge: "bottom" as const, activity: metrics.bottomActivity }
  ].sort((first, second) => second.activity - first.activity);

  return edges[0] ?? { edge: "right", activity: 0 };
}

export function edgeActivityRegion(metrics: VisualMetrics, label = "Most active viewport edge"): AuditRegion {
  const edge = strongestEdge(metrics);
  return {
    ...edgeRegions[edge.edge],
    label: `${label}: ${edge.edge}`
  };
}

export function hotspotRegion(metrics: VisualMetrics, fallback: AuditRegion, label = "Highest activity cluster"): AuditRegion {
  const hotspot = metrics.hotspots[0];

  if (!hotspot) {
    return fallback;
  }

  const paddingX = Math.max(0.06, hotspot.width * 0.85);
  const paddingY = Math.max(0.06, hotspot.height * 0.85);
  const minWidth = 0.12;
  const minHeight = 0.12;
  const x = clamp(hotspot.x - paddingX / 2, 0, 1 - minWidth);
  const y = clamp(hotspot.y - paddingY / 2, 0, 1 - minHeight);
  const width = clamp(hotspot.width + paddingX, minWidth, 1 - x);
  const height = clamp(hotspot.height + paddingY, minHeight, 1 - y);

  return {
    x: rounded(x),
    y: rounded(y),
    width: rounded(width),
    height: rounded(height),
    label: `${label} (${metricPercent(hotspot.activity)} activity)`
  };
}
