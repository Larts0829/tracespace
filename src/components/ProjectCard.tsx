import { useEffect, useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import * as db from '../lib/db';
import { formatDate } from '../lib/image';
import { useObjectUrl } from '../hooks/useObjectUrl';
import type { ProjectMeta } from '../types';
import { IconButton } from './IconButton';

interface Props {
  meta: ProjectMeta;
  onOpen: (id: string) => void;
  onTrace: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ meta, onOpen, onTrace, onRename, onDelete }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const url = useObjectUrl(blob);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(meta.name);
  const [confirming, setConfirming] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    let alive = true;
    db.getImage(meta.id)
      .then(b => alive && setBlob(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [meta.id]);

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  const commit = () => {
    if (cancelled.current) {
      cancelled.current = false;
      setEditing(false);
      return;
    }
    const next = draft.trim().slice(0, 60);
    if (next && next !== meta.name) onRename(meta.id, next);
    else setDraft(meta.name);
    setEditing(false);
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] transition hover:border-white/15">
      <button
        type="button"
        onClick={() => onOpen(meta.id)}
        className="block w-full text-left"
        aria-label={`Open ${meta.name}`}
      >
        <div className="relative aspect-[4/3] bg-ink-900">
          {url ? (
            <img
              src={url}
              alt=""
              className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:opacity-100"
            />
          ) : (
            <div className="grid h-full place-items-center text-white/20">
              <ImageIcon size={22} />
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1 p-2.5 pl-3.5">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              autoFocus
              value={draft}
              maxLength={60}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  cancelled.current = true;
                  e.currentTarget.blur();
                }
              }}
              aria-label="Project name"
              className="w-full border-b border-accent/60 bg-transparent pb-0.5 text-sm outline-none"
            />
          ) : (
            <p className="truncate text-sm font-medium">{meta.name}</p>
          )}
          <p className="text-[11px] text-white/40">{formatDate(meta.updatedAt)}</p>
        </div>

        <IconButton label="Trace now" onClick={() => onTrace(meta.id)} className="h-8 w-8">
          <Camera size={15} />
        </IconButton>
        <IconButton
          label="Rename"
          onClick={() => {
            setDraft(meta.name);
            setEditing(true);
          }}
          className="h-8 w-8"
        >
          <Pencil size={14} />
        </IconButton>
        {confirming ? (
          <button
            type="button"
            onClick={() => onDelete(meta.id)}
            className="h-8 shrink-0 rounded-lg bg-red-500/15 px-2.5 text-xs font-medium text-red-300 transition hover:bg-red-500/25"
          >
            Delete
          </button>
        ) : (
          <IconButton label="Delete" onClick={() => setConfirming(true)} className="h-8 w-8">
            <Trash2 size={14} />
          </IconButton>
        )}
      </div>
    </article>
  );
}
