import { describe, it, expect } from "bun:test";
import {
  add,
  sub,
  mul,
  div,
  scale,
  conj,
  abs,
  arg,
  log,
  exp,
  fromPolar,
  c,
  I,
  ONE,
  ZERO,
} from "./complex";
import type { C } from "./complex";

const expectClose = (z: C, re: number, im: number, digits = 12) => {
  expect(z.re).toBeCloseTo(re, digits);
  expect(z.im).toBeCloseTo(im, digits);
};

describe("add / sub", () => {
  it("adds componentwise", () => {
    expectClose(add(c(1, 2), c(3, -4)), 4, -2);
  });

  it("subtracts componentwise", () => {
    expectClose(sub(c(5, 1), c(2, 3)), 3, -2);
  });

  it("zero is the additive identity", () => {
    expectClose(add(c(7, -3), ZERO), 7, -3);
  });
});

describe("mul / div", () => {
  it("i * i = -1", () => {
    expectClose(mul(I, I), -1, 0);
  });

  it("multiplies (1+2i)(3+4i) = -5+10i", () => {
    expectClose(mul(c(1, 2), c(3, 4)), -5, 10);
  });

  it("one is the multiplicative identity", () => {
    expectClose(mul(c(2, -7), ONE), 2, -7);
  });

  it("z / z = 1 for nonzero z", () => {
    const z = c(3, -4);
    expectClose(div(z, z), 1, 0);
  });

  it("divides (1+2i) / (1-i) = (-1+3i)/2", () => {
    expectClose(div(c(1, 2), c(1, -1)), -0.5, 1.5);
  });
});

describe("scale / conj / abs / arg", () => {
  it("scale multiplies both parts by k", () => {
    expectClose(scale(c(2, -3), 4), 8, -12);
  });

  it("conj flips imaginary part", () => {
    expectClose(conj(c(2, -3)), 2, 3);
  });

  it("|3+4i| = 5", () => {
    expect(abs(c(3, 4))).toBeCloseTo(5, 12);
  });

  it("arg(1+i) = pi/4", () => {
    expect(arg(c(1, 1))).toBeCloseTo(Math.PI / 4, 12);
  });

  it("arg(-1) = pi", () => {
    expect(arg(c(-1, 0))).toBeCloseTo(Math.PI, 12);
  });
});

describe("log", () => {
  it("log(1) = 0", () => {
    expectClose(log(ONE), 0, 0);
  });

  it("log(e) = 1", () => {
    expectClose(log(c(Math.E, 0)), 1, 0);
  });

  it("log(i) = i*pi/2", () => {
    expectClose(log(I), 0, Math.PI / 2);
  });

  it("log(-1) = i*pi", () => {
    expectClose(log(c(-1, 0)), 0, Math.PI);
  });
});

describe("exp", () => {
  it("exp(0) = 1", () => {
    expectClose(exp(ZERO), 1, 0);
  });

  it("exp(1) = e", () => {
    expectClose(exp(c(1, 0)), Math.E, 0);
  });

  it("exp(i*pi) = -1 (Euler)", () => {
    expectClose(exp(c(0, Math.PI)), -1, 0);
  });

  it("exp(i*pi/2) = i", () => {
    expectClose(exp(c(0, Math.PI / 2)), 0, 1);
  });
});

describe("log / exp roundtrip", () => {
  it("exp(log(z)) = z for z in the principal branch", () => {
    const samples: C[] = [
      c(1, 1),
      c(3, -4),
      c(-2, 1),
      c(0.5, 0.001),
      c(7, 0),
    ];
    for (const z of samples) {
      expectClose(exp(log(z)), z.re, z.im);
    }
  });

  it("log(exp(w)) = w when w.im in (-pi, pi]", () => {
    const samples: C[] = [
      c(0, 0),
      c(1, 0.5),
      c(-0.3, Math.PI - 0.01),
      c(2, -Math.PI + 0.01),
    ];
    for (const w of samples) {
      expectClose(log(exp(w)), w.re, w.im);
    }
  });
});

describe("fromPolar", () => {
  it("fromPolar(1, 0) = 1", () => {
    expectClose(fromPolar(1, 0), 1, 0);
  });

  it("fromPolar(1, pi/2) = i", () => {
    expectClose(fromPolar(1, Math.PI / 2), 0, 1);
  });

  it("|fromPolar(r, theta)| = r", () => {
    for (const r of [0.5, 1, 2, 10]) {
      for (const theta of [-1, 0, 0.7, Math.PI - 0.1]) {
        expect(abs(fromPolar(r, theta))).toBeCloseTo(r, 12);
      }
    }
  });
});

describe("Droste/Escher pipeline math", () => {
  it("alpha = ln(r) + i*theta encodes the Droste self-similarity", () => {
    const r = 256;
    const theta = Math.atan2(2 * Math.PI, Math.log(r));
    const alpha = c(Math.log(r), theta);
    expect(alpha.re).toBeCloseTo(Math.log(256), 12);
    expect(alpha.im).toBeCloseTo(theta, 12);
  });

  it("beta = alpha / ln(r) maps the strip onto the Escher direction", () => {
    const r = 256;
    const lnR = Math.log(r);
    const theta = Math.atan2(2 * Math.PI, lnR);
    const alpha = c(lnR, theta);
    const beta = div(alpha, c(lnR, 0));
    expect(beta.re).toBeCloseTo(1, 12);
    expect(beta.im).toBeCloseTo(theta / lnR, 12);
  });

  it("exp(log(z)) round-trips through a typical sample point", () => {
    const z = c(120, -45);
    expectClose(exp(log(z)), z.re, z.im, 10);
  });
});
