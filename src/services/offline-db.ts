import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'arenas360_offline.db';

type MemoryEntry = {
  payload: string;
  updatedAt: number;
};

const memoryCache = new Map<string, MemoryEntry>();

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (Platform.OS === 'web') {
    throw new Error('SQLite offline cache is not available on web');
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS api_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sync_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          method TEXT NOT NULL,
          path TEXT NOT NULL,
          body TEXT,
          requires_auth INTEGER NOT NULL DEFAULT 1,
          created_at INTEGER NOT NULL
        );
      `);
      return db;
    })();
  }

  return dbPromise;
}

function parseMemoryEntry<T>(entry: MemoryEntry): { data: T; updatedAt: number } | null {
  try {
    return {
      data: JSON.parse(entry.payload) as T,
      updatedAt: entry.updatedAt,
    };
  } catch {
    return null;
  }
}

export function buildCacheKey(method: string, path: string, auth: boolean): string {
  return `${method}:${auth ? 'auth' : 'public'}:${path}`;
}

export async function initOfflineDb(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  await getDb();
  await warmMemoryCache();
}

/** Load SQLite cache into memory so reads are instant on cold start. */
export async function warmMemoryCache(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const db = await getDb();
  const rows = await db.getAllAsync<{ cache_key: string; payload: string; updated_at: number }>(
    'SELECT cache_key, payload, updated_at FROM api_cache'
  );

  for (const row of rows) {
    memoryCache.set(row.cache_key, { payload: row.payload, updatedAt: row.updated_at });
  }
}

export async function saveCacheEntry<T>(key: string, data: T): Promise<void> {
  const updatedAt = Date.now();
  const payload = JSON.stringify(data);
  memoryCache.set(key, { payload, updatedAt });

  if (Platform.OS === 'web') {
    return;
  }

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO api_cache (cache_key, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       payload = excluded.payload,
       updated_at = excluded.updated_at`,
    [key, payload, updatedAt]
  );
}

export async function readCacheEntry<T>(key: string): Promise<{ data: T; updatedAt: number } | null> {
  const memoryHit = memoryCache.get(key);
  if (memoryHit) {
    const parsed = parseMemoryEntry<T>(memoryHit);
    if (parsed) {
      return parsed;
    }
    memoryCache.delete(key);
  }

  if (Platform.OS === 'web') {
    return null;
  }

  const db = await getDb();
  const row = await db.getFirstAsync<{ payload: string; updated_at: number }>(
    'SELECT payload, updated_at FROM api_cache WHERE cache_key = ?',
    [key]
  );

  if (!row) {
    return null;
  }

  memoryCache.set(key, { payload: row.payload, updatedAt: row.updated_at });
  return parseMemoryEntry<T>({ payload: row.payload, updatedAt: row.updated_at });
}

export async function listCachedKeys(): Promise<string[]> {
  if (Platform.OS === 'web') {
    return Array.from(memoryCache.keys());
  }

  const db = await getDb();
  const rows = await db.getAllAsync<{ cache_key: string }>(
    'SELECT cache_key FROM api_cache ORDER BY updated_at DESC'
  );
  return rows.map((row) => row.cache_key);
}

export type QueuedRequest = {
  id: number;
  method: string;
  path: string;
  body: string | null;
  requiresAuth: boolean;
  createdAt: number;
};

export async function enqueueSyncRequest(
  method: string,
  path: string,
  body: unknown,
  requiresAuth = true
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sync_queue (method, path, body, requires_auth, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [method, path, body ? JSON.stringify(body) : null, requiresAuth ? 1 : 0, Date.now()]
  );
}

export async function listQueuedRequests(): Promise<QueuedRequest[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    method: string;
    path: string;
    body: string | null;
    requires_auth: number;
    created_at: number;
  }>('SELECT * FROM sync_queue ORDER BY id ASC');

  return rows.map((row) => ({
    id: row.id,
    method: row.method,
    path: row.path,
    body: row.body,
    requiresAuth: row.requires_auth === 1,
    createdAt: row.created_at,
  }));
}

export async function removeQueuedRequest(id: number): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const db = await getDb();
  await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
}

export async function clearOfflineData(): Promise<void> {
  memoryCache.clear();

  if (Platform.OS === 'web') {
    return;
  }

  const db = await getDb();
  await db.execAsync('DELETE FROM api_cache; DELETE FROM sync_queue;');
}
