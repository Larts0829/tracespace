import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Lock, Move, PenLine, Smartphone, SlidersHorizontal, Upload, X } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Upload your reference',
    body: 'Choose a photo or drawing from your device. High-contrast images are the easiest to trace.',
  },
  {
    icon: Smartphone,
    title: 'Place your phone above the paper',
    body: 'Prop the phone up so the rear camera looks down at your sheet, and keep it steady.',
  },
  {
    icon: Move,
    title: 'Position and resize',
    body: 'Drag with one finger, pinch to resize, and twist with two to rotate. On desktop, use the mouse wheel.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Adjust transparency',
    body: 'Lower the opacity until the reference is faint enough that your pencil lines stand out.',
  },
  {
    icon: Lock,
    title: 'Lock the image',
    body: 'Lock it in place so a stray touch cannot move it while you work.',
  },
  {
    icon: PenLine,
    title: 'Start tracing',
    body: 'Draw on the physical paper. The phone is only your guide; the drawing happens on the sheet.',
  },
];

interface Props {
  onClose: () => void;
}

export function Onboarding({ onClose }: Props) {
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const last = index === STEPS.length - 1;
  const Icon = step.icon;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex(i => Math.min(STEPS.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="How TraceSpace works"
    >
      <div className="glass fade-up w-full max-w-md rounded-3xl p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs tabular-nums text-white/45">
            {index + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/60 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>

        <div key={index} className="fade-up">
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
            <Icon size={26} className="text-accent" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{step.title}</h2>
          <p className="mt-2 min-h-[4.5rem] text-[15px] leading-relaxed text-white/60">{step.body}</p>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to step ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-accent' : 'w-1.5 bg-white/20'}`}
            />
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            className="btn-ghost h-11 w-11 px-0"
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Previous step"
          >
            <ArrowLeft size={16} />
          </button>
          {last ? (
            <button type="button" className="btn-primary flex-1" onClick={onClose}>
              Got it
            </button>
          ) : (
            <button type="button" className="btn-primary flex-1" onClick={() => setIndex(i => i + 1)}>
              Next <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
