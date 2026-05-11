"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { drosteFromBoxes } from "@/lib/droste";
import { ShaderCanvas, type Uniforms } from "@/components/ShaderCanvas";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { STAGE4_ESCHER_FRAG } from "@/shaders/stage4";

const CANVAS_SIZE = 600;

export function Stage4Loop() {
  const image = useStore((s) => s.image);
  const outer = useStore((s) => s.outer);
  const inner = useStore((s) => s.inner);
  const twist = useStore((s) => s.twist);

  const [isPlaying, setIsPlaying] = useState(true);
  const [duration, setDuration] = useState(4);

  const params = useMemo(() => drosteFromBoxes(outer, inner), [outer, inner]);

  const uniforms = useMemo<Uniforms | undefined>(() => {
    if (!params) return undefined;
    const uMin = Math.log(Math.max(inner.w, inner.h) / 2);
    return {
      u_center: [params.center.x, params.center.y],
      u_lnR: params.lnR,
      u_theta: twist,
      u_uMin: uMin,
    };
  }, [params, inner.w, inner.h, twist]);

  if (!image || !params || !uniforms) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          Mark a valid outer and inner box on stage 1 first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <ShaderCanvas
        fragmentSource={STAGE4_ESCHER_FRAG}
        image={image}
        uniforms={uniforms}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        animate={isPlaying}
        loopSeconds={duration}
        className="max-w-full rounded-md border border-border"
      />

      <section className="flex w-full max-w-xl flex-col items-center gap-4">
        <div className="flex w-full items-center gap-4">
          <Button
            type="button"
            variant={isPlaying ? "outline" : "default"}
            size="sm"
            onClick={() => setIsPlaying((p) => !p)}
            className="min-w-20"
          >
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <div className="flex flex-1 items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              loop
            </span>
            <Slider
              value={[duration]}
              min={1}
              max={12}
              step={0.5}
              onValueChange={(value: number | readonly number[]) => {
                const v = Array.isArray(value) ? value[0] : value;
                setDuration(v as number);
              }}
              className="flex-1"
            />
            <span className="font-mono text-xs tabular-nums">
              {duration.toFixed(1)}s
            </span>
          </div>
        </div>
        <p className="max-w-2xl text-center text-xs text-muted-foreground">
          <span className="font-mono">exp</span> undoes{" "}
          <span className="font-mono">log</span>, but the twist remains — the
          spiral closes on itself, so zooming in cycles forever. θ ={" "}
          {twist.toFixed(3)} rad, period {params.lnR.toFixed(3)} in log radius.
        </p>
      </section>
    </div>
  );
}
