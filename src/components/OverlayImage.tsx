import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import type { OverlayTransform } from '../types';
import {
  MAX_SCALE,
  MIN_SCALE,
  angleDelta,
  angleOf,
  clamp,
  dist,
  midpoint,
  type Point,
} from '../lib/math';

interface Props {
  src: string;
  /** CSS width of the image at scale 1, e.g. "min(90vw, calc(88vh * 0.75))". */
  baseCss: string;
  transform: OverlayTransform;
  onChange: (patch: Partial<OverlayTransform>) => void;
}

interface GestureBase {
  t: OverlayTransform;
  ids: number[];
  pts: Point[];
}

/**
 * The reference image, drawn above the camera feed. Supports one-pointer drag,
 * two-pointer pinch/rotate/pan, and mouse-wheel zoom. Interaction is disabled
 * while the transform is locked.
 */
export function OverlayImage({ src, baseCss, transform, onChange }: Props) {
  const areaRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const base = useRef<GestureBase | null>(null);
  // Always-current values for event handlers that outlive a render.
  const latest = useRef({ transform, onChange });
  latest.current = { transform, onChange };

  const rebase = () => {
    const ids = [...pointers.current.keys()].slice(0, 2);
    base.current = {
      t: latest.current.transform,
      ids,
      pts: ids.map(id => ({ ...pointers.current.get(id)! })),
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (latest.current.transform.locked) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    rebase();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const b = base.current;
    if (!b || latest.current.transform.locked) return;

    const cur = b.ids
      .map(id => pointers.current.get(id))
      .filter((p): p is Point => p !== undefined);

    if (cur.length === 1 && b.pts.length >= 1) {
      latest.current.onChange({
        x: b.t.x + cur[0].x - b.pts[0].x,
        y: b.t.y + cur[0].y - b.pts[0].y,
      });
    } else if (cur.length === 2 && b.pts.length === 2) {
      const d0 = dist(b.pts[0], b.pts[1]);
      if (d0 < 1) return;
      const d1 = dist(cur[0], cur[1]);
      const m0 = midpoint(b.pts[0], b.pts[1]);
      const m1 = midpoint(cur[0], cur[1]);
      const dAngle = angleDelta(angleOf(b.pts[0], b.pts[1]), angleOf(cur[0], cur[1]));
      latest.current.onChange({
        scale: clamp(b.t.scale * (d1 / d0), MIN_SCALE, MAX_SCALE),
        rotation: b.t.rotation + (dAngle * 180) / Math.PI,
        x: b.t.x + (m1.x - m0.x),
        y: b.t.y + (m1.y - m0.y),
      });
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.delete(e.pointerId)) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (pointers.current.size > 0) rebase();
    else base.current = null;
  };

  // Mouse wheel zoom. Registered natively so we can call preventDefault.
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const current = latest.current.transform;
      if (current.locked) return;
      e.preventDefault();
      const scale = clamp(current.scale * Math.exp(-e.deltaY * 0.0015), MIN_SCALE, MAX_SCALE);
      latest.current.transform = { ...current, scale };
      latest.current.onChange({ scale });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const t = transform;

  return (
    <div
      ref={areaRef}
      className={`absolute inset-0 flex touch-none select-none items-center justify-center overflow-hidden ${
        t.locked ? '' : 'cursor-grab active:cursor-grabbing'
      }`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="will-change-transform"
        style={{
          width: baseCss,
          transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scale})`,
        }}
      >
        <img
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none block h-auto w-full"
          style={{
            opacity: t.opacity,
            filter: t.grayscale ? 'grayscale(1)' : undefined,
            transform: `scale(${t.flipH ? -1 : 1}, ${t.flipV ? -1 : 1})`,
          }}
        />
      </div>
    </div>
  );
}
