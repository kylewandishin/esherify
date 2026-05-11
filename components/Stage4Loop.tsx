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
  const [zoom, setZoom] = useState(1);

  const params = useMemo(() => drosteFromBoxes(outer, inner), [outer, inner]);

  const uniforms = useMemo<Uniforms | undefined>(() => {
    if (!params) return undefined;
    // Inner radius from the fixed point, in image pixels. Approximate with
    // half the inner box's smaller dimension — exact when the inner box is
    // centered on the fixed point (the symmetric Droste case).
    const innerRadius = Math.min(inner.w, inner.h) / 2;
    const uMin = Math.log(innerRadius);
    // Canvas covers a square region of this radius around the fixed point.
    // Default: outer-box half-width, scaled by the user's zoom.
    const outerRadius = Math.max(outer.w, outer.h) / 2;
    const viewRadius = outerRadius * zoom;
    return {
      u_center: [params.center.x, params.center.y],
      u_viewRadius: viewRadius,
      u_lnR: params.lnR,
      u_theta: twist,
      u_uMin: uMin,
    };
  }, [params, inner.w, inner.h, outer.w, outer.h, twist, zoom]);

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

        <div className="flex w-full items-center gap-3">
          <span className="font-mono text-xs text-muted-foreground">zoom</span>
          <Slider
            value={[zoom]}
            min={0.25}
            max={4}
            step={0.05}
            onValueChange={(value: number | readonly number[]) => {
              const v = Array.isArray(value) ? value[0] : value;
              setZoom(v as number);
            }}
            className="flex-1"
          />
          <span className="font-mono text-xs tabular-nums">
            {zoom.toFixed(2)}×
          </span>
        </div>

        <p className="max-w-2xl text-center text-xs text-muted-foreground">
          The canvas covers a square radius of{" "}
          <span className="font-mono">
            {Math.round((Math.max(outer.w, outer.h) / 2) * zoom)}
          </span>{" "}
          image px around the fixed point{" "}
          <span className="font-mono">
            ({Math.round(params.center.x)},{" "}
            {Math.round(params.center.y)})
          </span>
          . θ = {twist.toFixed(3)} rad, period ln&nbsp;r ={" "}
          {params.lnR.toFixed(3)}.
        </p>
      </section>
    </div>
  );
}
