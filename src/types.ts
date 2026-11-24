export interface OverlayTransform {
  /** Offset from the centre of the screen, in CSS pixels. */
  x: number;
  y: number;
  /** 1 = fitted size. */
  scale: number;
  /** Degrees. */
  rotation: number;
  /** 0.1 – 1. */
  opacity: number;
  flipH: boolean;
  flipV: boolean;
  grayscale: boolean;
  locked: boolean;
}

export const DEFAULT_TRANSFORM: OverlayTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  opacity: 0.6,
  flipH: false,
  flipV: false,
  grayscale: false,
  locked: false,
};

export interface ProjectMeta {
  id: string;
  name: string;
  width: number;
  height: number;
  transform: OverlayTransform;
  createdAt: number;
  updatedAt: number;
}
