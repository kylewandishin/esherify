"use client";

import { useStore } from "@/lib/store";
import { Logo } from "@/components/Logo";
import { StageStepper } from "@/components/StageStepper";
import { Stage1Frame } from "@/components/Stage1Frame";
import { Stage2Log } from "@/components/Stage2Log";

export default function Home() {
  const stage = useStore((s) => s.stage);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Logo className="size-6 text-foreground" title="Esherify" />
          <span className="text-sm font-semibold tracking-tight">
            Esherify
          </span>
        </div>
      </header>

      <div className="px-4 py-6">
        <StageStepper />
      </div>

      <main className="flex flex-1 flex-col items-center px-4 pb-12">
        {stage === 1 ? (
          <Stage1Frame />
        ) : stage === 2 ? (
          <Stage2Log />
        ) : (
          <StagePlaceholder stage={stage} />
        )}
      </main>
    </div>
  );
}

function StagePlaceholder({ stage }: { stage: 3 | 4 }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">Stage {stage}</h2>
      <p className="text-sm text-muted-foreground">
        Coming up next — the log / twist / loop pipeline.
      </p>
    </div>
  );
}
