"use client";

import { useStore, type Stage } from "@/lib/store";

const STAGES: { id: Stage; title: string; subtitle: string }[] = [
  { id: 1, title: "Frame", subtitle: "Mark the boxes" },
  { id: 2, title: "Log", subtitle: "Unroll the spiral" },
  { id: 3, title: "Twist", subtitle: "Add the shear" },
  { id: 4, title: "Loop", subtitle: "Exponentiate" },
];

export function StageStepper() {
  const stage = useStore((s) => s.stage);
  const hasImage = useStore((s) => s.image !== null);
  const setStage = useStore((s) => s.setStage);

  return (
    <nav
      aria-label="Stages"
      className="flex w-full items-center justify-center gap-2 sm:gap-4"
    >
      {STAGES.map((s, idx) => {
        const isActive = s.id === stage;
        const isReachable = s.id === 1 || hasImage;
        return (
          <div key={s.id} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => setStage(s.id)}
              className={`flex items-center gap-3 rounded-full px-3 py-1.5 text-left transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : isReachable
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-medium ${
                  isActive
                    ? "border-background"
                    : "border-current"
                }`}
              >
                {s.id}
              </span>
              <span className="hidden sm:flex sm:flex-col sm:leading-tight">
                <span className="text-sm font-semibold">{s.title}</span>
                <span className="text-xs opacity-70">{s.subtitle}</span>
              </span>
            </button>
            {idx < STAGES.length - 1 ? (
              <span aria-hidden className="h-px w-4 bg-border sm:w-8" />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
