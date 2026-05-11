"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { drosteFromBoxes } from "@/lib/droste";
import { ShaderCanvas, type Uniforms } from "@/components/ShaderCanvas";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { STAGE3_TWIST_FRAG } from "@/shaders/stage3";

const TILED_PERIODS = 4;
const MAX_THETA = Math.PI / 2;

export function Stage3Twist() {
  const image = useStore((s) => s.image);
  const outer = useStore((s) => s.outer);
  const inner = useStore((s) => s.inner);
  const twist = useStore((s) => s.twist);
  const setTwist = useStore((s) => s.setTwist);

  const params = useMemo(() => drosteFromBoxes(outer, inner), [outer, inner]);

  const escherTheta = useMemo(
    () => (params ? Math.atan2(2 * Math.PI, params.lnR) : 0),
    [params],
  );

  const { stripUniforms, tiledUniforms } = useMemo(() => {
    if (!params) {
      return { stripUniforms: undefined, tiledUniforms: undefined };
    }
    const uMin = Math.log(Math.max(inner.w, inner.h) / 2);
    const base: Uniforms = {
      u_center: [params.center.x, params.center.y],
      u_lnR: params.lnR,
      u_theta: twist,
      u_uMin: uMin,
    };
    return {
      stripUniforms: { ...base, u_tileCount: 1, u_time: 0 },
      tiledUniforms: { ...base, u_tileCount: TILED_PERIODS },
    };
  }, [params, inner.w, inner.h, twist]);

  if (!image || !params || !stripUniforms || !tiledUniforms) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          Mark a valid outer and inner box on stage 1 first.
        </p>
      </div>
    );
  }

  const atEscher = Math.abs(twist - escherTheta) < 1e-3;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <section className="flex w-full max-w-2xl flex-col items-center gap-3">
        <div className="flex w-full items-center gap-4">
          <span className="font-mono text-xs text-muted-foreground">θ = 0</span>
          <Slider
            value={[twist]}
            min={0}
            max={MAX_THETA}
            step={0.005}
            onValueChange={(value: number | readonly number[]) => {
              const v = Array.isArray(value) ? value[0] : value;
              setTwist(v as number);
            }}
            className="flex-1"
          />
          <span className="font-mono text-xs text-muted-foreground">π/2</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs">
            θ = {twist.toFixed(3)} rad ({((twist * 180) / Math.PI).toFixed(1)}°)
          </span>
          <Button
            type="button"
            variant={atEscher ? "default" : "outline"}
            size="sm"
            onClick={() => setTwist(escherTheta)}
          >
            Snap to Escher (θ = atan(2π / ln&nbsp;r) ≈ {escherTheta.toFixed(3)})
          </Button>
          {twist !== 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setTwist(0)}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Sheared strip
        </h2>
        <ShaderCanvas
          fragmentSource={STAGE3_TWIST_FRAG}
          image={image}
          uniforms={stripUniforms}
          width={260}
          height={420}
          className="max-w-full rounded-md border border-border"
        />
      </section>

      <section className="flex w-full flex-col items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Tiled, scrolling
        </h2>
        <ShaderCanvas
          fragmentSource={STAGE3_TWIST_FRAG}
          image={image}
          uniforms={tiledUniforms}
          width={Math.round(260 * TILED_PERIODS)}
          height={240}
          animate
          loopSeconds={8}
          className="max-w-full rounded-md border border-border"
        />
        <p className="max-w-2xl text-center text-xs text-muted-foreground">
          Multiplying <span className="font-mono">w</span> by{" "}
          <span className="font-mono">β = α / ln&nbsp;r</span> tilts the strip.
          At <span className="font-mono">θ = atan(2π / ln&nbsp;r)</span> the
          tilt is just right — one tile aligns with the next, and the spiral
          closes.
        </p>
      </section>
    </div>
  );
}
