export type C = { re: number; im: number };

export const c = (re: number, im: number = 0): C => ({ re, im });

export const ZERO: C = { re: 0, im: 0 };
export const ONE: C = { re: 1, im: 0 };
export const I: C = { re: 0, im: 1 };

export const add = (a: C, b: C): C => ({ re: a.re + b.re, im: a.im + b.im });

export const sub = (a: C, b: C): C => ({ re: a.re - b.re, im: a.im - b.im });

export const mul = (a: C, b: C): C => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

export const div = (a: C, b: C): C => {
  const d = b.re * b.re + b.im * b.im;
  return {
    re: (a.re * b.re + a.im * b.im) / d,
    im: (a.im * b.re - a.re * b.im) / d,
  };
};

export const scale = (z: C, k: number): C => ({ re: z.re * k, im: z.im * k });

export const conj = (z: C): C => ({ re: z.re, im: -z.im });

export const abs = (z: C): number => Math.hypot(z.re, z.im);

export const arg = (z: C): number => Math.atan2(z.im, z.re);

export const log = (z: C): C => ({ re: Math.log(abs(z)), im: arg(z) });

export const exp = (w: C): C => {
  const r = Math.exp(w.re);
  return { re: r * Math.cos(w.im), im: r * Math.sin(w.im) };
};

export const fromPolar = (r: number, theta: number): C => ({
  re: r * Math.cos(theta),
  im: r * Math.sin(theta),
});
