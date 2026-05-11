"use client";

import { useCallback, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import { drosteFromBoxes } from "@/lib/droste";
import { BoxEditor } from "@/components/BoxEditor";
import { PresetPicker } from "@/components/PresetPicker";

export function Stage1Frame() {
  const image = useStore((s) => s.image);
  const imageUrl = useStore((s) => s.imageUrl);
  const outer = useStore((s) => s.outer);
  const inner = useStore((s) => s.inner);
  const setOuter = useStore((s) => s.setOuter);
  const setInner = useStore((s) => s.setInner);
  const loadImage = useStore((s) => s.loadImage);
  const reset = useStore((s) => s.reset);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFile = useCallback(
    (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        loadImage(img, url, { kind: "upload", name: file.name });
      };
      img.src = url;
    },
    [loadImage],
  );

  const params = useMemo(
    () => drosteFromBoxes(outer, inner),
    [outer, inner],
  );

  if (!image || !imageUrl) {
    return (
      <div className="flex w-full flex-col items-center gap-6">
        <DropZone
          onFile={onFile}
          onPick={() => fileInputRef.current?.click()}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <PresetPicker />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="w-full max-w-3xl">
        <BoxEditor
          imageUrl={imageUrl}
          imgW={image.naturalWidth}
          imgH={image.naturalHeight}
          outer={outer}
          inner={inner}
          onOuterChange={setOuter}
          onInnerChange={setInner}
        />
      </div>
      <DrosteBadge params={params} />
      <button
        type="button"
        onClick={reset}
        className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Use a different image
      </button>
    </div>
  );
}

function DropZone({
  onFile,
  onPick,
}: {
  onFile: (f: File) => void;
  onPick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className="flex h-56 w-full max-w-xl cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 text-center transition-colors hover:border-foreground/40 hover:bg-muted/60"
    >
      <span className="text-sm font-medium">Drop a Droste image</span>
      <span className="text-xs text-muted-foreground">
        or click to choose a file
      </span>
    </div>
  );
}

function DrosteBadge({
  params,
}: {
  params: ReturnType<typeof drosteFromBoxes>;
}) {
  if (!params) {
    return (
      <p className="text-xs text-muted-foreground">
        Inner box must be smaller than outer.
      </p>
    );
  }
  const { r, center } = params;
  return (
    <dl className="grid grid-cols-3 gap-x-6 gap-y-1 rounded-md border border-border bg-muted/30 px-4 py-2 text-xs">
      <div className="flex flex-col">
        <dt className="text-muted-foreground">scale r</dt>
        <dd className="font-mono">{r.toFixed(3)}</dd>
      </div>
      <div className="flex flex-col">
        <dt className="text-muted-foreground">ln r</dt>
        <dd className="font-mono">{Math.log(r).toFixed(3)}</dd>
      </div>
      <div className="flex flex-col">
        <dt className="text-muted-foreground">center (px)</dt>
        <dd className="font-mono">
          {center.x.toFixed(0)}, {center.y.toFixed(0)}
        </dd>
      </div>
    </dl>
  );
}
