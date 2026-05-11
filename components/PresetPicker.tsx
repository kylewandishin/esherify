"use client";

import { useStore } from "@/lib/store";

interface Preset {
  path: string;
  label: string;
}

const PRESETS: Preset[] = [
  { path: "/presets/m_0_1.jpg", label: "M_0_1" },
  { path: "/presets/scan200.jpg", label: "Scan 200" },
];

export function PresetPicker() {
  const loadImage = useStore((s) => s.loadImage);

  const pick = (preset: Preset) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadImage(img, preset.path, { kind: "preset", ...preset });
    };
    img.src = preset.path;
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">Or pick a preset:</span>
      {PRESETS.map((preset) => (
        <button
          key={preset.path}
          type="button"
          onClick={() => pick(preset)}
          className="group flex flex-col items-center gap-1 rounded-md border border-border bg-background p-1.5 transition-colors hover:border-foreground/30 hover:bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preset.path}
            alt={preset.label}
            className="h-16 w-16 rounded-sm object-cover"
          />
          <span className="text-xs text-muted-foreground group-hover:text-foreground">
            {preset.label}
          </span>
        </button>
      ))}
    </div>
  );
}
