"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Box } from "@/lib/droste";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

type Corner = "tl" | "tr" | "bl" | "br";

interface DragState {
  pointerId: number;
  mode: "body" | Corner;
  startBox: Box;
  startImg: { x: number; y: number };
}

interface BoxOverlayProps {
  box: Box;
  imgW: number;
  imgH: number;
  colorClass: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (next: Box) => void;
  label: string;
  minSize?: number;
  /** Active CSS scale applied to the wrapper — used to keep stroke/handles a constant pixel size. */
  inverseScale?: number;
}

const MIN_SIZE_DEFAULT = 8;
const MIN_SCALE = 1;
const MAX_SCALE = 10;

const clampBox = (box: Box, imgW: number, imgH: number, minSize: number): Box => {
  const w = Math.max(minSize, Math.min(box.w, imgW));
  const h = Math.max(minSize, Math.min(box.h, imgH));
  const x = Math.max(0, Math.min(box.x, imgW - w));
  const y = Math.max(0, Math.min(box.y, imgH - h));
  return { x, y, w, h };
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Uses the transformed wrapper's getBoundingClientRect, which already accounts
// for the active scale + pan, so we get image pixels regardless of zoom.
function clientToImage(
  clientX: number,
  clientY: number,
  containerRef: React.RefObject<HTMLDivElement | null>,
  imgW: number,
  imgH: number,
): { x: number; y: number } | null {
  const el = containerRef.current;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return {
    x: ((clientX - rect.left) / rect.width) * imgW,
    y: ((clientY - rect.top) / rect.height) * imgH,
  };
}

function BoxOverlay({
  box,
  imgW,
  imgH,
  colorClass,
  containerRef,
  onChange,
  label,
  minSize = MIN_SIZE_DEFAULT,
  inverseScale = 1,
}: BoxOverlayProps) {
  const dragRef = useRef<DragState | null>(null);

  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, mode: DragState["mode"]) => {
      const img = clientToImage(e.clientX, e.clientY, containerRef, imgW, imgH);
      if (!img) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        mode,
        startBox: { ...box },
        startImg: img,
      };
      e.stopPropagation();
    },
    [box, imgW, imgH, containerRef],
  );

  const onMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const img = clientToImage(e.clientX, e.clientY, containerRef, imgW, imgH);
      if (!img) return;

      const dx = img.x - drag.startImg.x;
      const dy = img.y - drag.startImg.y;
      const s = drag.startBox;
      let next: Box;

      if (drag.mode === "body") {
        next = { x: s.x + dx, y: s.y + dy, w: s.w, h: s.h };
      } else {
        let x = s.x;
        let y = s.y;
        let right = s.x + s.w;
        let bottom = s.y + s.h;
        if (drag.mode === "tl" || drag.mode === "bl") x = s.x + dx;
        if (drag.mode === "tr" || drag.mode === "br") right = s.x + s.w + dx;
        if (drag.mode === "tl" || drag.mode === "tr") y = s.y + dy;
        if (drag.mode === "bl" || drag.mode === "br") bottom = s.y + s.h + dy;
        const xMin = Math.min(x, right - minSize);
        const xMax = Math.max(right, x + minSize);
        const yMin = Math.min(y, bottom - minSize);
        const yMax = Math.max(bottom, y + minSize);
        next = { x: xMin, y: yMin, w: xMax - xMin, h: yMax - yMin };
      }

      onChange(clampBox(next, imgW, imgH, minSize));
    },
    [imgW, imgH, containerRef, onChange, minSize],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
  }, []);

  const style: React.CSSProperties = {
    left: `${(box.x / imgW) * 100}%`,
    top: `${(box.y / imgH) * 100}%`,
    width: `${(box.w / imgW) * 100}%`,
    height: `${(box.h / imgH) * 100}%`,
  };

  // Keep the border + corner handles a constant pixel size regardless of
  // the wrapper's CSS scale, so precise selection stays usable at high zoom.
  const borderPx = 2 / inverseScale;
  const cornerPx = 12 / inverseScale;
  const cornerInset = -cornerPx / 2;

  return (
    <div className="absolute" style={style} aria-label={label}>
      <div
        className={`absolute inset-0 ${colorClass} cursor-move touch-none`}
        style={{
          borderWidth: `${borderPx}px`,
          borderStyle: "solid",
          boxShadow: `0 0 0 ${0.5 / inverseScale}px rgba(0,0,0,.5) inset`,
        }}
        onPointerDown={(e) => startDrag(e, "body")}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const cursor =
          corner === "tl" || corner === "br"
            ? "cursor-nwse-resize"
            : "cursor-nesw-resize";
        const pos: React.CSSProperties = {
          width: `${cornerPx}px`,
          height: `${cornerPx}px`,
          borderWidth: `${borderPx}px`,
          borderStyle: "solid",
        };
        if (corner === "tl" || corner === "bl") pos.left = `${cornerInset}px`;
        if (corner === "tr" || corner === "br") pos.right = `${cornerInset}px`;
        if (corner === "tl" || corner === "tr") pos.top = `${cornerInset}px`;
        if (corner === "bl" || corner === "br") pos.bottom = `${cornerInset}px`;
        return (
          <div
            key={corner}
            className={`absolute rounded-sm bg-white ${colorClass} ${cursor} touch-none`}
            style={pos}
            onPointerDown={(e) => startDrag(e, corner)}
            onPointerMove={onMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
        );
      })}
    </div>
  );
}

interface BoxEditorProps {
  imageUrl: string;
  imgW: number;
  imgH: number;
  outer: Box;
  inner: Box;
  onOuterChange: (b: Box) => void;
  onInnerChange: (b: Box) => void;
  fixedPoint?: { x: number; y: number } | null;
  className?: string;
}

interface PanState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPanX: number;
  startPanY: number;
}

export function BoxEditor({
  imageUrl,
  imgW,
  imgH,
  outer,
  inner,
  onOuterChange,
  onInnerChange,
  fixedPoint,
  className,
}: BoxEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const [naturalReady, setNaturalReady] = useState(imgW > 0 && imgH > 0);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Clamp pan so the image can't be dragged completely out of view.
  const clampPan = useCallback(
    (s: number, p: { x: number; y: number }) => {
      const c = containerRef.current;
      if (!c) return p;
      const cw = c.clientWidth;
      const ch = c.clientHeight;
      if (cw === 0 || ch === 0) return p;
      // When s = 1, pan is forced to 0. When zoomed in, allow translation up
      // to (s - 1) * size in each direction so the opposite edge can reach.
      const maxX = Math.max(0, (s - 1) * cw);
      const maxY = Math.max(0, (s - 1) * ch);
      return { x: clamp(p.x, -maxX, 0), y: clamp(p.y, -maxY, 0) };
    },
    [],
  );

  // Pinch-to-zoom via wheel + ctrlKey (browsers translate trackpad pinches
  // into wheel events with ctrlKey set). Anchored to the cursor.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * 0.01);
      setScale((prev) => {
        const next = clamp(prev * factor, MIN_SCALE, MAX_SCALE);
        // Solve for new pan so the cursor's underlying point stays put.
        setPan((prevPan) => {
          const ratio = next / prev;
          return clampPan(next, {
            x: px - ratio * (px - prevPan.x),
            y: py - ratio * (py - prevPan.y),
          });
        });
        return next;
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [clampPan]);

  const startPan = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panStateRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y,
    };
  };

  const movePan = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = panStateRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    const dx = e.clientX - s.startClientX;
    const dy = e.clientY - s.startClientY;
    setPan(
      clampPan(scale, {
        x: s.startPanX + dx,
        y: s.startPanY + dy,
      }),
    );
  };

  const endPan = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = panStateRef.current;
    if (!s || s.pointerId !== e.pointerId) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    panStateRef.current = null;
  };

  const onScaleChange = (next: number) => {
    setScale(next);
    setPan((p) => clampPan(next, p));
  };

  const reset = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ""}`}>
      <div
        ref={containerRef}
        className="relative w-full max-w-full overflow-hidden select-none rounded-md border border-border bg-muted/40"
        style={{ aspectRatio: imgW && imgH ? `${imgW}/${imgH}` : undefined }}
      >
        <div
          ref={wrapperRef}
          className={`absolute inset-0 origin-top-left ${
            scale > 1 ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
          onPointerDown={startPan}
          onPointerMove={movePan}
          onPointerUp={endPan}
          onPointerCancel={endPan}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            draggable={false}
            className="block h-auto w-full select-none"
            onLoad={() => setNaturalReady(true)}
          />
          {naturalReady && imgW > 0 && imgH > 0 ? (
            <>
              <BoxOverlay
                box={outer}
                imgW={imgW}
                imgH={imgH}
                colorClass="border-cyan-400"
                containerRef={wrapperRef}
                onChange={onOuterChange}
                label="outer box"
                inverseScale={scale}
              />
              <BoxOverlay
                box={inner}
                imgW={imgW}
                imgH={imgH}
                colorClass="border-fuchsia-400"
                containerRef={wrapperRef}
                onChange={onInnerChange}
                label="inner box"
                inverseScale={scale}
              />
              {fixedPoint &&
              Number.isFinite(fixedPoint.x) &&
              Number.isFinite(fixedPoint.y) ? (
                <div
                  aria-label="spiral fixed point"
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-yellow-400 shadow"
                  style={{
                    left: `${(fixedPoint.x / imgW) * 100}%`,
                    top: `${(fixedPoint.y / imgH) * 100}%`,
                    width: `${12 / scale}px`,
                    height: `${12 / scale}px`,
                    borderWidth: `${2 / scale}px`,
                  }}
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex w-full max-w-full items-center gap-3 px-1">
        <span className="text-xs text-muted-foreground">Zoom</span>
        <Slider
          value={[scale]}
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.1}
          onValueChange={(value: number | readonly number[]) => {
            const v = Array.isArray(value) ? value[0] : value;
            onScaleChange(v as number);
          }}
          className="flex-1"
        />
        <span className="font-mono text-xs tabular-nums">
          {scale.toFixed(1)}×
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={reset}
          disabled={scale === 1 && pan.x === 0 && pan.y === 0}
        >
          Reset
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        Tip: ⌘/Ctrl + scroll to zoom on the cursor. Drag the image to pan
        when zoomed in.
      </p>
    </div>
  );
}
