export interface Point {
  x: number;
  y: number;
}

export const MIN_SCALE = 0.05;
export const MAX_SCALE = 20;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y);

export const angleOf = (a: Point, b: Point) => Math.atan2(b.y - a.y, b.x - a.x);

export const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** Smallest signed difference between two angles in radians. */
export function angleDelta(from: number, to: number): number {
  let d = to - from;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

/** Wrap degrees into [-180, 180). */
export const wrapDeg = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180;
