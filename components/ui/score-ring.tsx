import { cn } from "@/lib/cn";

export interface ScoreRingProps {
  className?: string;
  label: string;
  score: number;
}

export function ScoreRing({ className, label, score }: ScoreRingProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)));
  const tone =
    safeScore >= 90 ? "text-emerald-700" : safeScore >= 70 ? "text-amber-700" : "text-rose-700";

  return (
    <div className={cn("grid place-items-center gap-3", className)}>
      <div
        aria-label={`${label}: ${safeScore} out of 100`}
        className="grid h-36 w-36 place-items-center rounded-full"
        role="img"
        style={{
          background: `conic-gradient(#19a974 ${safeScore * 3.6}deg, rgb(226 232 240) 0deg)`
        }}
      >
        <div className="grid h-28 w-28 place-items-center rounded-full bg-white dark:bg-slate-950">
          <span className={cn("text-4xl font-bold tabular-nums", tone)}>{safeScore}</span>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</p>
    </div>
  );
}
