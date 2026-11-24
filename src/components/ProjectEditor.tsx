import { useState } from 'react';
import { ArrowLeft, Contrast, FlipHorizontal, FlipVertical, RotateCcw, RotateCw, Target } from 'lucide-react';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useProjectTransform } from '../hooks/useProjectTransform';
import { DEFAULT_TRANSFORM, type ProjectMeta } from '../types';
import { OverlayImage } from './OverlayImage';
import { Slider } from './Slider';
import { ToolTile } from './ToolTile';
import { wrapDeg } from '../lib/math';

interface Props {
  meta: ProjectMeta;
  image: Blob;
  onBack: () => void;
  onStart: (id: string) => Promise<void> | void;
}

/** Preview and prepare the reference before entering the camera workspace. */
export function ProjectEditor({ meta, image, onBack, onStart }: Props) {
  const url = useObjectUrl(image);
  const { t, update, replace, flush } = useProjectTransform(meta);
  const [starting, setStarting] = useState(false);
  const ratio = meta.width / meta.height;
  const baseCss = `min(70vw, calc(44vh * ${ratio.toFixed(4)}))`;

  const start = async () => {
    setStarting(true);
    try {
      await flush();
      await onStart(meta.id);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="fade-up flex min-h-dvh flex-col bg-ink-950">
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onBack} className="btn-ghost-sm">
          <ArrowLeft size={16} /> Projects
        </button>
        <span className="max-w-[50vw] truncate text-sm text-white/60">{meta.name}</span>
        <span className="w-20" aria-hidden />
      </header>

      <div className="relative mx-4 h-[50dvh] overflow-hidden rounded-3xl border border-white/[0.07] bg-ink-900 dotted-grid">
        {url && <OverlayImage src={url} baseCss={baseCss} transform={t} onChange={update} />}
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/50 px-3 py-1 text-[11px] text-white/60 backdrop-blur">
          Drag · pinch · twist
        </div>
      </div>

      <div className="mx-4 mt-5 space-y-5 rounded-3xl border border-white/[0.07] bg-white/[0.02] p-4">
        <Slider
          label="Opacity"
          value={Math.round(t.opacity * 100)}
          min={10}
          max={100}
          suffix="%"
          onChange={v => update({ opacity: v / 100 })}
        />
        <Slider
          label="Zoom"
          value={Math.round(t.scale * 100)}
          min={10}
          max={400}
          suffix="%"
          onChange={v => update({ scale: v / 100 })}
        />
        <Slider
          label="Rotation"
          value={Math.round(t.rotation)}
          min={-180}
          max={180}
          suffix="°"
          onChange={v => update({ rotation: v })}
        />

        <div className="grid grid-cols-5 gap-2">
          <ToolTile
            label="Rotate"
            icon={<RotateCw size={18} />}
            onClick={() => update(p => ({ rotation: wrapDeg(p.rotation + 90) }))}
          />
          <ToolTile
            label="Mirror"
            icon={<FlipHorizontal size={18} />}
            active={t.flipH}
            onClick={() => update(p => ({ flipH: !p.flipH }))}
          />
          <ToolTile
            label="Flip"
            icon={<FlipVertical size={18} />}
            active={t.flipV}
            onClick={() => update(p => ({ flipV: !p.flipV }))}
          />
          <ToolTile
            label="Gray"
            icon={<Contrast size={18} />}
            active={t.grayscale}
            onClick={() => update(p => ({ grayscale: !p.grayscale }))}
          />
          <ToolTile
            label="Fit"
            icon={<Target size={18} />}
            onClick={() => update({ x: 0, y: 0, scale: 1, rotation: 0 })}
          />
        </div>
        <button
          type="button"
          onClick={() => replace({ ...DEFAULT_TRANSFORM })}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-white/50 transition hover:text-white/80"
        >
          <RotateCcw size={13} /> Reset all adjustments
        </button>
      </div>

      <div className="mt-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6">
        <p className="mb-3 text-center text-xs text-white/40">
          Next, place your phone above the paper and align the image.
        </p>
        <button type="button" className="btn-primary w-full py-3.5" onClick={start} disabled={starting}>
          Start tracing
        </button>
      </div>
    </div>
  );
}
