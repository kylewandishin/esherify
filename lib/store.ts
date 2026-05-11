import { create } from "zustand";
import { defaultBoxes, type Box } from "./droste";

export type Stage = 1 | 2 | 3 | 4;

export interface PresetSource {
  kind: "preset";
  path: string;
  label: string;
}

export interface UploadSource {
  kind: "upload";
  name: string;
}

export type ImageSource = PresetSource | UploadSource;

interface State {
  image: HTMLImageElement | null;
  imageUrl: string | null;
  source: ImageSource | null;
  outer: Box;
  inner: Box;
  stage: Stage;
  twist: number;

  loadImage: (image: HTMLImageElement, url: string, source: ImageSource) => void;
  setOuter: (b: Box) => void;
  setInner: (b: Box) => void;
  setStage: (s: Stage) => void;
  setTwist: (t: number) => void;
  reset: () => void;
}

const EMPTY_BOX: Box = { x: 0, y: 0, w: 0, h: 0 };

export const useStore = create<State>((set) => ({
  image: null,
  imageUrl: null,
  source: null,
  outer: EMPTY_BOX,
  inner: EMPTY_BOX,
  stage: 1,
  twist: 0,

  loadImage: (image, imageUrl, source) => {
    const { outer, inner } = defaultBoxes(
      image.naturalWidth,
      image.naturalHeight,
    );
    set({ image, imageUrl, source, outer, inner, stage: 1, twist: 0 });
  },
  setOuter: (outer) => set({ outer }),
  setInner: (inner) => set({ inner }),
  setStage: (stage) => set({ stage }),
  setTwist: (twist) => set({ twist }),
  reset: () =>
    set({
      image: null,
      imageUrl: null,
      source: null,
      outer: EMPTY_BOX,
      inner: EMPTY_BOX,
      stage: 1,
      twist: 0,
    }),
}));
