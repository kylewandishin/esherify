"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { drosteFromBoxes } from "@/lib/droste";
import { ShaderCanvas, type Uniforms } from "@/components/ShaderCanvas";
import { STAGE2_LOG_FRAG } from "@/shaders/stage2";

const TILED_PERIODS = 4;

export function Stage2Log() {
  const image = useStore((s) => s.image);
  const outer = useStore((s) => s.outer);
  const inner = useStore((s) => s.inner);

  const params = useMemo(() => drosteFromBoxes(outer, inner), [outer, inner]);

  const { stripUniforms, tiledUniforms } = useMemo(() => {
    if (!params) {
      return { stripUniforms: undefined, tiledUniforms: undefined };
    }
    const uMin = Math.log(Math.max(inner.w, inner.h) / 2);
    const base: Uniforms = {
      u_center: [params.center.x, params.center.y],
      u_lnR: params.lnR,
      u_uMin: uMin,
    };
    return {
      stripUniforms: { ...base, u_tileCount: 1, u_time: 0 },
      tiledUniforms: { ...base, u_tileCount: TILED_PERIODS },
    };
  }, [params, inner.w, inner.h]);

  if (!image || !params || !stripUniforms || !tiledUniforms) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          Mark a valid outer and inner box on stage 1 first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <section className="flex flex-col items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          One period
        </h2>
        <ShaderCanvas
          fragmentSource={STAGE2_LOG_FRAG}
          image={image}
          uniforms={stripUniforms}
          width={260}
          height={420}
          className="max-w-full rounded-md border border-border"
        />
        <p className="max-w-md text-center text-xs text-muted-foreground">
          Horizontal axis is <span className="font-mono">ln r</span>; vertical
          axis is the angle from <span className="font-mono">−π</span> to{" "}
          <span className="font-mono">+π</span>. The annulus has become a
          strip.
        </p>
      </section>

      <section className="flex w-full flex-col items-center gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Tiled, scrolling
        </h2>
        <ShaderCanvas
          fragmentSource={STAGE2_LOG_FRAG}
          image={image}
          uniforms={tiledUniforms}
          width={Math.round(260 * TILED_PERIODS)}
          height={240}
          animate
          loopSeconds={8}
          className="max-w-full rounded-md border border-border"
        />
        <p className="max-w-2xl text-center text-xs text-muted-foreground">
          The same strip repeated {TILED_PERIODS}× horizontally and scrolling
          by one period every 8&nbsp;seconds. The Droste self-similarity is now
          a plain horizontal translation of width{" "}
          <span className="font-mono">ln r ≈ {params.lnR.toFixed(3)}</span>.
        </p>
      </section>
    </div>
  );
}
