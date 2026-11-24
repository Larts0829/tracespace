import type { ProjectMeta } from '../types';

/**
 * Thin IndexedDB wrapper. Metadata and image blobs live in separate stores so
 * the library list can load quickly without pulling every image into memory.
 */

const DB_NAME = 'tracespace';
const DB_VERSION = 1;
const META = 'projects';
const IMAGES = 'images';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('This browser does not support local storage.'));
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(IMAGES)) db.createObjectStore(IMAGES);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => {
        dbPromise = null;
        reject(req.error ?? new Error('Could not open local storage.'));
      };
    });
  }
  return dbPromise;
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Storage transaction was aborted.'));
  });
}

export async function listProjects(): Promise<ProjectMeta[]> {
  const db = await openDb();
  const all = await wrap(db.transaction(META).objectStore(META).getAll() as IDBRequest<ProjectMeta[]>);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProject(id: string): Promise<{ meta: ProjectMeta; image: Blob } | null> {
  const db = await openDb();
  const tx = db.transaction([META, IMAGES], 'readonly');
  const [meta, image] = await Promise.all([
    wrap(tx.objectStore(META).get(id) as IDBRequest<ProjectMeta | undefined>),
    wrap(tx.objectStore(IMAGES).get(id) as IDBRequest<Blob | undefined>),
  ]);
  if (!meta || !image) return null;
  return { meta, image };
}

export async function getImage(id: string): Promise<Blob | null> {
  const db = await openDb();
  const image = await wrap(db.transaction(IMAGES).objectStore(IMAGES).get(id) as IDBRequest<Blob | undefined>);
  return image ?? null;
}

export async function createProject(meta: ProjectMeta, image: Blob): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META, IMAGES], 'readwrite');
  tx.objectStore(META).put(meta);
  tx.objectStore(IMAGES).put(image, meta.id);
  await done(tx);
}

/** Merge a partial update into a project and bump its updatedAt timestamp. */
export async function patchProject(id: string, patch: Partial<ProjectMeta>): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(META, 'readwrite');
  const store = tx.objectStore(META);
  const req = store.get(id);
  req.onsuccess = () => {
    const current = req.result as ProjectMeta | undefined;
    if (current) store.put({ ...current, ...patch, updatedAt: Date.now() });
  };
  await done(tx);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([META, IMAGES], 'readwrite');
  tx.objectStore(META).delete(id);
  tx.objectStore(IMAGES).delete(id);
  await done(tx);
}
