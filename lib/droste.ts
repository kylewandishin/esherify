export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

export const boxCenter = (b: Box): Point => ({
  x: b.x + b.w / 2,
  y: b.y + b.h / 2,
});

export interface DrosteParams {
  r: number;
  lnR: number;
  center: Point;
}

// Solve (P - c) = r * (Q - c) for the fixed point c, given the outer-box
// center P and inner-box center Q. For axis-aligned boxes of the same aspect
// ratio, this collapses to a componentwise weighted average.
export const drosteFromBoxes = (
  outer: Box,
  inner: Box,
): DrosteParams | null => {
  const r = outer.w / inner.w;
  if (!Number.isFinite(r) || r <= 1) return null;

  const P = boxCenter(outer);
  const Q = boxCenter(inner);
  const denom = r - 1;

  return {
    r,
    lnR: Math.log(r),
    center: {
      x: (r * Q.x - P.x) / denom,
      y: (r * Q.y - P.y) / denom,
    },
  };
};

export const defaultBoxes = (
  imgW: number,
  imgH: number,
): { outer: Box; inner: Box } => ({
  outer: {
    x: imgW * 0.05,
    y: imgH * 0.05,
    w: imgW * 0.9,
    h: imgH * 0.9,
  },
  inner: {
    x: imgW * 0.4,
    y: imgH * 0.4,
    w: imgW * 0.2,
    h: imgH * 0.2,
  },
});
