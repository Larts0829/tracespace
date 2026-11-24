import { useCallback, useEffect, useRef, useState } from 'react';
import * as db from '../lib/db';
import type { OverlayTransform, ProjectMeta } from '../types';

export type TransformPatch =
  | Partial<OverlayTransform>
  | ((prev: OverlayTransform) => Partial<OverlayTransform>);

const SAVE_DELAY_MS = 350;

/**
 * Holds a project's overlay transform in React state and autosaves it to
 * IndexedDB (debounced). Pending changes are flushed on unmount so leaving a
 * screen never loses the last adjustment.
 */
export function useProjectTransform(meta: ProjectMeta) {
  const [t, setT] = useState<OverlayTransform>(meta.transform);
  const id = meta.id;
  const dirty = useRef(false);
  const pending = useRef<OverlayTransform | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const flush = useCallback(async () => {
    if (timer.current !== undefined) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    }
    const value = pending.current;
    if (!value) return;
    pending.current = null;
    try {
      await db.patchProject(id, { transform: value });
    } catch {
      // Storage can be unavailable (private mode). The session still works; the
      // change simply isn't persisted.
    }
  }, [id]);

  const update = useCallback((patch: TransformPatch) => {
    dirty.current = true;
    setT(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  const replace = useCallback((next: OverlayTransform) => {
    dirty.current = true;
    setT(next);
  }, []);

  useEffect(() => {
    if (!dirty.current) return;
    pending.current = t;
    if (timer.current !== undefined) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void flush(), SAVE_DELAY_MS);
  }, [t, flush]);

  useEffect(() => () => void flush(), [flush]);

  return { t, update, replace, flush };
}
