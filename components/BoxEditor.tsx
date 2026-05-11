"use client";

import { useCallback, useRef, useState } from "react";
import type { Box } from "@/lib/droste";

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
}

const MIN_SIZE_DEFAULT = 8;

const clampBox = (box: Box, imgW: number, imgH: number, minSize: number): Box => {
  const w = Math.max(minSize, Math.min(box.w, imgW));
  const h = Math.max(minSize, Math.min(box.h, imgH));
  const x = Math.max(0, Math.min(box.x, imgW - w));
  const y = Math.max(0, Math.min(box.y, imgH - h));
  return { x, y, w, h };
};

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
}: BoxOverlayProps) {
  const dragRef = useRef<DragState | null>(null);

  const startDrag = useCallback(
    (
      e: React.PointerEvent<HTMLDivElement>,
      mode: DragState["mode"],
    ) => {
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
        // Keep corners ordered (handle drag across the opposite edge).
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

  return (
    <div className="absolute" style={style} aria-label={label}>
      <div
        className={`absolute inset-0 border-2 ${colorClass} cursor-move touch-none`}
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,.4) inset" }}
        onPointerDown={(e) => startDrag(e, "body")}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const positionClass =
          corner === "tl"
            ? "-left-1.5 -top-1.5 cursor-nwse-resize"
            : corner === "tr"
              ? "-right-1.5 -top-1.5 cursor-nesw-resize"
              : corner === "bl"
                ? "-left-1.5 -bottom-1.5 cursor-nesw-resize"
                : "-right-1.5 -bottom-1.5 cursor-nwse-resize";
        return (
          <div
            key={corner}
            className={`absolute h-3 w-3 rounded-sm bg-white border ${colorClass.replace("border-", "border-")} touch-none ${positionClass}`}
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
  /** Optional fixed-point marker in image pixel coordinates. */
  fixedPoint?: { x: number; y: number } | null;
  className?: string;
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
  const [naturalReady, setNaturalReady] = useState(imgW > 0 && imgH > 0);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block max-w-full overflow-hidden select-none ${className ?? ""}`}
      style={{ aspectRatio: imgW && imgH ? `${imgW}/${imgH}` : undefined }}
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
            containerRef={containerRef}
            onChange={onOuterChange}
            label="outer box"
          />
          <BoxOverlay
            box={inner}
            imgW={imgW}
            imgH={imgH}
            colorClass="border-fuchsia-400"
            containerRef={containerRef}
            onChange={onInnerChange}
            label="inner box"
          />
          {fixedPoint &&
          Number.isFinite(fixedPoint.x) &&
          Number.isFinite(fixedPoint.y) ? (
            <div
              aria-label="spiral fixed point"
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-yellow-400 shadow"
              style={{
                left: `${(fixedPoint.x / imgW) * 100}%`,
                top: `${(fixedPoint.y / imgH) * 100}%`,
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
