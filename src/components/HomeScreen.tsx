import type { DragEvent } from 'react';
import { Image as ImageIcon, Info, Upload } from 'lucide-react';
import type { ProjectMeta } from '../types';
import { IconButton } from './IconButton';
import { Logo } from './Logo';
import { ProjectCard } from './ProjectCard';

interface Props {
  projects: ProjectMeta[];
  loaded: boolean;
  busy: boolean;
  onStartTracing: () => void;
  onPick: () => void;
  onDropFile: (file: File) => void;
  onShowHelp: () => void;
  onOpen: (id: string) => void;
  onTrace: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function HomeScreen({
  projects,
  loaded,
  busy,
  onStartTracing,
  onPick,
  onDropFile,
  onShowHelp,
  onOpen,
  onTrace,
  onRename,
  onDelete,
}: Props) {
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onDropFile(file);
  };

  return (
    <div
      className="min-h-dvh bg-ink-950"
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="flex items-center justify-between py-2">
          <Logo />
          <IconButton label="How it works" onClick={onShowHelp}>
            <Info size={18} />
          </IconButton>
        </header>

        <section className="fade-up mt-10 max-w-xl sm:mt-16">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Camera-assisted tracing</p>
          <h1 className="mt-3 text-[34px] font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Turn your phone into a tracing projector.
          </h1>
          <p className="mt-4 leading-relaxed text-white/55">
            Overlay any reference on your paper through the camera, then trace it by hand.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={onStartTracing} disabled={busy}>
              Start tracing
            </button>
            <button type="button" className="btn-ghost" onClick={onPick} disabled={busy}>
              <Upload size={16} /> Upload image
            </button>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-white/70">Recent</h2>
            {projects.length > 0 && (
              <span className="text-xs tabular-nums text-white/35">{projects.length}</span>
            )}
          </div>

          {!loaded ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[0, 1].map(i => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/[0.04]" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <button
              type="button"
              onClick={onPick}
              className="flex w-full flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center transition hover:border-white/25 hover:bg-white/[0.02]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white/[0.04] text-white/40">
                <ImageIcon size={20} />
              </span>
              <span className="text-sm font-medium text-white/80">No projects yet</span>
              <span className="max-w-xs text-xs leading-relaxed text-white/40">
                Upload a reference image, or drop one here, to begin. Your projects are saved on this device.
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  meta={p}
                  onOpen={onOpen}
                  onTrace={onTrace}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </section>

        <footer className="mt-16 text-center text-[11px] text-white/25">
          Everything stays on this device. No account required.
        </footer>
      </div>

      {busy && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/70 backdrop-blur-sm">
          <p className="text-sm text-white/70">Preparing image…</p>
        </div>
      )}
    </div>
  );
}
