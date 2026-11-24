import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Contrast,
  Eye,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SwitchCamera,
  Unlock,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { useObjectUrl } from '../hooks/useObjectUrl';
import { useProjectTransform } from '../hooks/useProjectTransform';
import { MAX_SCALE, MIN_SCALE, clamp, wrapDeg } from '../lib/math';
import { DEFAULT_TRANSFORM, type OverlayTransform, type ProjectMeta } from '../types';
import { IconButton } from './IconButton';
import { OverlayImage } from './OverlayImage';
import { Slider } from './Slider';
import { ToolTile } from './ToolTile';

interface Props {
  meta: ProjectMeta;
  image: Blob;
  onExit: () => void;
}

/**
 * The main tracing screen: live rear camera with the reference overlaid on top.
 * Keyboard shortcuts are listed in the README.
 */
export function TracingWorkspace({ meta, image, onExit }: Props) {
  const url = useObjectUrl(image);
  const { t, update, replace } = useProjectTransform(meta);
  const [cameraOn, setCameraOn] = useState(true);
  const [deviceId, setDeviceId] = useState<string>();
  const cam = useCamera(cameraOn, deviceId);
  const [panelOpen, setPanelOpen] = useState(true);
  const [focus, setFocus] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const canFullscreen = typeof document !== 'undefined' && document.fullscreenEnabled;
  const ratio = meta.width / meta.height;
  const baseCss = `min(92vw, calc(88vh * ${ratio.toFixed(4)}))`;

  const say = useCallback((msg: string) => setHint(msg), []);

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(null), 1400);
    return () => window.clearTimeout(id);
  }, [hint]);

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void document.documentElement.requestFullscreen().catch(() => say('Fullscreen was blocked'));
    }
  };

  const switchCamera = () => {
    const list = cam.devices;
    if (list.length < 2) return;
    const i = list.findIndex(d => d.deviceId === cam.activeId);
    setDeviceId(list[(i + 1) % list.length].deviceId);
  };

  // Position, scale and rotation are frozen while locked. Opacity, mirroring and
  // grayscale stay adjustable because they do not move the drawing reference.
  const edit = (fn: (p: OverlayTransform) => Partial<OverlayTransform>) => {
    if (t.locked) {
      say('Unlock to move or resize');
      return;
    }
    update(fn);
  };
  const zoom = (factor: number) =>
    edit(p => ({ scale: clamp(p.scale * factor, MIN_SCALE, MAX_SCALE) }));
  const rotateBy = (deg: number) => edit(p => ({ rotation: wrapDeg(p.rotation + deg) }));
  const toggleLock = () => {
    say(t.locked ? 'Unlocked' : 'Locked');
    update({ locked: !t.locked });
  };
  const reset = () => {
    if (t.locked) {
      say('Unlock to reset position');
      return;
    }
    replace({ ...DEFAULT_TRANSFORM });
    say('Reset');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const step = e.shiftKey ? 12 : 2;
      switch (e.key) {
        case 'Escape':
          if (document.fullscreenElement) return;
          if (focus) setFocus(false);
          else onExit();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          edit(p => ({ x: p.x - step }));
          break;
        case 'ArrowRight':
          e.preventDefault();
          edit(p => ({ x: p.x + step }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          edit(p => ({ y: p.y - step }));
          break;
        case 'ArrowDown':
          e.preventDefault();
          edit(p => ({ y: p.y + step }));
          break;
        case '+':
        case '=':
          zoom(1.1);
          break;
        case '-':
        case '_':
          zoom(1 / 1.1);
          break;
        case '[':
          rotateBy(-5);
          break;
        case ']':
          rotateBy(5);
          break;
        case 'm':
        case 'M':
          update(p => ({ flipH: !p.flipH }));
          break;
        case 'v':
        case 'V':
          update(p => ({ flipV: !p.flipV }));
          break;
        case 'g':
        case 'G':
          update(p => ({ grayscale: !p.grayscale }));
          break;
        case 'l':
        case 'L':
          toggleLock();
          break;
        case 'r':
        case 'R':
          reset();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'h':
        case 'H':
          setFocus(v => !v);
          break;
        case 'c':
        case 'C':
          setCameraOn(v => !v);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // Handlers close over `t`, so re-bind whenever the transform or screen state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, focus, onExit]);

  const cameraVisible = cameraOn && cam.status === 'live';

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-black text-white">
      <video
        ref={cam.videoRef}
        muted
        playsInline
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
          cameraVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {url && (
        <div className="absolute inset-0 z-10">
          <OverlayImage src={url} baseCss={baseCss} transform={t} onChange={update} />
        </div>
      )}

      {!cameraOn && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-ink-950/40 text-center">
          <p className="text-sm text-white/60">Camera paused. The reference stays visible.</p>
          <button type="button" className="btn-ghost" onClick={() => setCameraOn(true)}>
            <Play size={15} /> Resume camera
          </button>
        </div>
      )}

      {cameraOn && cam.status === 'starting' && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-sm text-white/60">
          Starting camera…
        </div>
      )}

      {cameraOn && cam.status === 'error' && (
        <div className="absolute inset-x-4 top-1/2 z-30 mx-auto max-w-sm -translate-y-1/2">
          <div className="glass fade-up rounded-3xl p-5 text-center">
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-amber-500/10 text-amber-300">
              <AlertTriangle size={20} />
            </div>
            <p className="text-sm leading-relaxed text-white/75">{cam.error}</p>
            <div className="mt-5 flex gap-2">
              <button type="button" className="btn-ghost flex-1 py-2.5" onClick={() => setCameraOn(false)}>
                Continue without camera
              </button>
              <button type="button" className="btn-primary flex-1 py-2.5" onClick={cam.retry}>
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {t.locked && (
        <div className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+4.5rem)] z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] text-white/75 backdrop-blur">
          <Lock size={11} /> Locked
        </div>
      )}

      {hint && (
        <div className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+7.5rem)] z-40 -translate-x-1/2 rounded-full bg-black/65 px-4 py-1.5 text-xs text-white/85 backdrop-blur">
          {hint}
        </div>
      )}

      {!focus && (
        <header className="fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <div className="glass flex min-w-0 items-center gap-1 rounded-2xl p-1.5">
            <IconButton label="Exit tracing" onClick={onExit}>
              <ArrowLeft size={18} />
            </IconButton>
            <span className="max-w-[34vw] truncate px-2 text-sm text-white/80">{meta.name}</span>
          </div>

          <div className="glass flex shrink-0 items-center gap-1 rounded-2xl p-1.5">
            {cam.devices.length > 1 && (
              <IconButton label="Switch camera" onClick={switchCamera}>
                <SwitchCamera size={18} />
              </IconButton>
            )}
            <IconButton label={cameraOn ? 'Pause camera' : 'Resume camera'} onClick={() => setCameraOn(v => !v)}>
              {cameraOn ? <Pause size={18} /> : <Play size={18} />}
            </IconButton>
            <IconButton label="Focus mode (hide controls)" onClick={() => setFocus(true)}>
              <Eye size={18} />
            </IconButton>
            {canFullscreen && (
              <IconButton label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
                {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </IconButton>
            )}
          </div>
        </header>
      )}

      {!focus && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="glass mx-auto max-w-xl rounded-3xl">
            <button
              type="button"
              onClick={() => setPanelOpen(v => !v)}
              aria-expanded={panelOpen}
              className="flex w-full items-center justify-between px-5 py-3.5 text-[11px] uppercase tracking-[0.14em] text-white/55"
            >
              <span>Adjust · {Math.round(t.opacity * 100)}%</span>
              {panelOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>

            {panelOpen && (
              <div className="space-y-4 px-5 pb-5">
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
                  disabled={t.locked}
                  onChange={v => edit(() => ({ scale: v / 100 }))}
                />
                <Slider
                  label="Rotation"
                  value={Math.round(t.rotation)}
                  min={-180}
                  max={180}
                  suffix="°"
                  disabled={t.locked}
                  onChange={v => edit(() => ({ rotation: v }))}
                />

                <div className="grid grid-cols-4 gap-2">
                  <ToolTile label="Zoom out" icon={<ZoomOut size={18} />} disabled={t.locked} onClick={() => zoom(1 / 1.15)} />
                  <ToolTile label="Zoom in" icon={<ZoomIn size={18} />} disabled={t.locked} onClick={() => zoom(1.15)} />
                  <ToolTile label="Rotate 90°" icon={<RotateCw size={18} />} disabled={t.locked} onClick={() => rotateBy(90)} />
                  <ToolTile
                    label={t.locked ? 'Unlock' : 'Lock'}
                    icon={t.locked ? <Unlock size={18} /> : <Lock size={18} />}
                    active={t.locked}
                    onClick={toggleLock}
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
                  <ToolTile label="Reset" icon={<RotateCcw size={18} />} disabled={t.locked} onClick={reset} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {focus && (
        <button
          type="button"
          onClick={() => setFocus(false)}
          className="glass fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-xs text-white/80"
        >
          <Eye size={14} /> Show controls
        </button>
      )}
    </div>
  );
}
