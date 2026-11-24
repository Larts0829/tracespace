import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { Onboarding } from './components/Onboarding';
import { ProjectEditor } from './components/ProjectEditor';
import { TracingWorkspace } from './components/TracingWorkspace';
import * as db from './lib/db';
import { loadImageInfo, newId } from './lib/image';
import { DEFAULT_TRANSFORM, type ProjectMeta } from './types';

type View = { name: 'home' } | { name: 'editor' | 'trace'; id: string };

const ONBOARDED_KEY = 'tracespace:onboarded';

interface Loaded {
  meta: ProjectMeta;
  image: Blob;
}

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(ONBOARDED_KEY));
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      setProjects(await db.listProjects());
    } catch {
      setError('Could not read your saved projects. Your browser may be blocking local storage.');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!error) return;
    const id = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(id);
  }, [error]);

  const openProject = useCallback(
    async (id: string, next: 'editor' | 'trace') => {
      try {
        const rec = await db.getProject(id);
        if (!rec) {
          setError('That project no longer exists.');
          await refresh();
          return;
        }
        setCurrent(rec);
        setView({ name: next, id });
      } catch {
        setError('Could not open this project.');
      }
    },
    [refresh],
  );

  const importFile = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const { width, height } = await loadImageInfo(file);
      const now = Date.now();
      const meta: ProjectMeta = {
        id: newId(),
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 60) || 'Untitled',
        width,
        height,
        transform: { ...DEFAULT_TRANSFORM },
        createdAt: now,
        updatedAt: now,
      };
      await db.createProject(meta, file);
      await refresh();
      await openProject(meta.id, 'editor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try another image.');
    } finally {
      setBusy(false);
    }
  };

  const onFileChosen = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (file) void importFile(file);
  };

  const startTracing = () => {
    const last = projects[0];
    if (last) void openProject(last.id, 'trace');
    else fileInput.current?.click();
  };

  const closeHelp = () => {
    localStorage.setItem(ONBOARDED_KEY, '1');
    setShowHelp(false);
  };

  const goHome = () => {
    setView({ name: 'home' });
    void refresh();
  };

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChosen}
        aria-hidden
        tabIndex={-1}
      />

      {view.name === 'home' && (
        <HomeScreen
          projects={projects}
          loaded={loaded}
          busy={busy}
          onStartTracing={startTracing}
          onPick={() => fileInput.current?.click()}
          onDropFile={file => void importFile(file)}
          onShowHelp={() => setShowHelp(true)}
          onOpen={id => void openProject(id, 'editor')}
          onTrace={id => void openProject(id, 'trace')}
          onRename={async (id, name) => {
            await db.patchProject(id, { name });
            await refresh();
          }}
          onDelete={async id => {
            await db.deleteProject(id);
            if (current?.meta.id === id) setCurrent(null);
            await refresh();
          }}
        />
      )}

      {view.name === 'editor' && current && (
        <ProjectEditor
          key={`edit-${current.meta.id}`}
          meta={current.meta}
          image={current.image}
          onBack={goHome}
          onStart={async id => {
            // The editor flushes its pending save first, so reloading gets the latest transform.
            await openProject(id, 'trace');
          }}
        />
      )}

      {view.name === 'trace' && current && (
        <TracingWorkspace
          key={`trace-${current.meta.id}`}
          meta={current.meta}
          image={current.image}
          onExit={goHome}
        />
      )}

      {showHelp && <Onboarding onClose={closeHelp} />}

      {error && (
        <div
          role="alert"
          className="fade-up glass fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-start gap-3 rounded-2xl px-4 py-3 text-sm text-white/85"
        >
          <span className="flex-1 leading-relaxed">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-white/50 hover:text-white"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
