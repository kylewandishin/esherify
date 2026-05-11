import { describe, it, expect } from "bun:test";
import { boxCenter, drosteFromBoxes, defaultBoxes } from "./droste";

describe("boxCenter", () => {
  it("returns the geometric center of a box", () => {
    expect(boxCenter({ x: 0, y: 0, w: 10, h: 20 })).toEqual({ x: 5, y: 10 });
    expect(boxCenter({ x: -4, y: 8, w: 2, h: 2 })).toEqual({ x: -3, y: 9 });
  });
});

describe("drosteFromBoxes", () => {
  it("returns null for degenerate scale (inner >= outer)", () => {
    const outer = { x: 0, y: 0, w: 10, h: 10 };
    const sameSize = { x: 5, y: 5, w: 10, h: 10 };
    const bigger = { x: 0, y: 0, w: 20, h: 20 };
    expect(drosteFromBoxes(outer, sameSize)).toBeNull();
    expect(drosteFromBoxes(outer, bigger)).toBeNull();
  });

  it("computes scale ratio from box widths", () => {
    const outer = { x: 0, y: 0, w: 256, h: 256 };
    const inner = { x: 100, y: 100, w: 16, h: 16 };
    const p = drosteFromBoxes(outer, inner)!;
    expect(p.r).toBeCloseTo(16, 12);
    expect(p.lnR).toBeCloseTo(Math.log(16), 12);
  });

  it("places the fixed point so scaling inner by r about it yields outer", () => {
    const outer = { x: 0, y: 0, w: 256, h: 256 };
    const inner = { x: 70, y: 110, w: 16, h: 16 };
    const p = drosteFromBoxes(outer, inner)!;
    const P = boxCenter(outer);
    const Q = boxCenter(inner);
    expect(P.x - p.center.x).toBeCloseTo(p.r * (Q.x - p.center.x), 10);
    expect(P.y - p.center.y).toBeCloseTo(p.r * (Q.y - p.center.y), 10);
  });

  it("places the fixed point at the shared center when boxes are concentric", () => {
    const outer = { x: 0, y: 0, w: 100, h: 100 };
    const inner = { x: 40, y: 40, w: 20, h: 20 };
    const p = drosteFromBoxes(outer, inner)!;
    expect(p.center.x).toBeCloseTo(50, 12);
    expect(p.center.y).toBeCloseTo(50, 12);
  });

  it("places the fixed point off-center when inner is offset", () => {
    // P = (50, 50), Q = (60, 50), r = 5 → c = (5*60 - 50) / 4 = 62.5
    const outer = { x: 0, y: 0, w: 100, h: 100 };
    const inner = { x: 50, y: 40, w: 20, h: 20 };
    const p = drosteFromBoxes(outer, inner)!;
    expect(p.r).toBeCloseTo(5, 12);
    expect(p.center.x).toBeCloseTo(62.5, 12);
    expect(p.center.y).toBeCloseTo(50, 12);
  });
});

describe("defaultBoxes", () => {
  it("produces an outer covering 90% and an inner covering 20% centered", () => {
    const { outer, inner } = defaultBoxes(1000, 800);
    expect(outer.w).toBeCloseTo(900, 6);
    expect(outer.h).toBeCloseTo(720, 6);
    expect(boxCenter(outer).x).toBeCloseTo(500, 6);
    expect(boxCenter(outer).y).toBeCloseTo(400, 6);
    expect(inner.w).toBeCloseTo(200, 6);
    expect(inner.h).toBeCloseTo(160, 6);
    expect(boxCenter(inner).x).toBeCloseTo(500, 6);
    expect(boxCenter(inner).y).toBeCloseTo(400, 6);
  });
});
