import NetInfo from '@react-native-community/netinfo';

import { ApiError, apiFetch } from '@/services/api';
import {
  buildCacheKey,
  enqueueSyncRequest,
  listCachedKeys,
  listQueuedRequests,
  readCacheEntry,
  removeQueuedRequest,
  saveCacheEntry,
  switchCacheUser,
  clearOfflineData,
} from '@/services/offline-db';

export type CachedResponse<T> = {
  data: T;
  fromCache: boolean;
  updatedAt?: number;
};

type RefreshListener = () => void | Promise<void>;

type ApiGetCachedOptions = {
  silent401?: boolean;
  forceNetwork?: boolean;
};

const refreshListeners = new Map<string, Set<RefreshListener>>();
const revalidationInFlight = new Set<string>();

let onlineState = true;
let netInfoCache = { online: true, checkedAt: 0 };
const NETINFO_TTL_MS = 2500;

export function getOnlineState(): boolean {
  return onlineState;
}

async function isOnlineQuick(): Promise<boolean> {
  const now = Date.now();
  if (now - netInfoCache.checkedAt < NETINFO_TTL_MS) {
    return netInfoCache.online;
  }

  const state = await NetInfo.fetch();
  const online = Boolean(state.isConnected && state.isInternetReachable !== false);
  netInfoCache = { online, checkedAt: now };
  onlineState = online;
  return online;
}

export function subscribeOnlineState(listener: (online: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => {
    const nextOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    netInfoCache = { online: nextOnline, checkedAt: Date.now() };
    if (nextOnline !== onlineState) {
      onlineState = nextOnline;
      listener(nextOnline);
    }
  }).remove;
}

export function registerRefreshListener(cacheKey: string, listener: RefreshListener): () => void {
  const bucket = refreshListeners.get(cacheKey) ?? new Set<RefreshListener>();
  bucket.add(listener);
  refreshListeners.set(cacheKey, bucket);

  return () => {
    bucket.delete(listener);
    if (bucket.size === 0) {
      refreshListeners.delete(cacheKey);
    }
  };
}

async function notifyRefreshListeners(cacheKey: string): Promise<void> {
  const bucket = refreshListeners.get(cacheKey);
  if (!bucket) {
    return;
  }

  await Promise.all(Array.from(bucket).map((listener) => listener()));
}

async function fetchNetworkAndCache<T>(
  cacheKey: string,
  path: string,
  auth: boolean,
  options: ApiGetCachedOptions
): Promise<CachedResponse<T>> {
  const data = await apiFetch<T>(path, { method: 'GET', auth, silent401: options.silent401 });
  await saveCacheEntry(cacheKey, data);
  return { data, fromCache: false, updatedAt: Date.now() };
}

async function revalidateCacheEntry<T>(
  cacheKey: string,
  path: string,
  auth: boolean,
  options: ApiGetCachedOptions
): Promise<void> {
  if (revalidationInFlight.has(cacheKey)) {
    return;
  }

  revalidationInFlight.add(cacheKey);
  try {
    const online = await isOnlineQuick();
    if (!online) {
      return;
    }

    const data = await apiFetch<T>(path, { method: 'GET', auth, silent401: options.silent401 });
    await saveCacheEntry(cacheKey, data);
    await notifyRefreshListeners(cacheKey);
  } catch {
    // Keep the cached copy when background refresh fails.
  } finally {
    revalidationInFlight.delete(cacheKey);
  }
}

export async function peekCacheForPath<T>(path: string, auth = true) {
  const cacheKey = buildCacheKey('GET', path, auth);
  return readCacheEntry<T>(cacheKey);
}

/** Cache-first: show saved data immediately, refresh in background when online. */
export async function apiGetCached<T>(
  path: string,
  auth = true,
  options: ApiGetCachedOptions = {}
): Promise<CachedResponse<T>> {
  const cacheKey = buildCacheKey('GET', path, auth);

  if (options.forceNetwork) {
    const online = await isOnlineQuick();
    if (!online) {
      const cached = await readCacheEntry<T>(cacheKey);
      if (cached) {
        return { data: cached.data, fromCache: true, updatedAt: cached.updatedAt };
      }
      throw new Error('Sin conexión y no hay datos guardados en el dispositivo.');
    }
    return fetchNetworkAndCache<T>(cacheKey, path, auth, options);
  }

  const cached = await readCacheEntry<T>(cacheKey);
  if (cached) {
    void revalidateCacheEntry<T>(cacheKey, path, auth, options);
    return { data: cached.data, fromCache: true, updatedAt: cached.updatedAt };
  }

  const online = await isOnlineQuick();
  if (!online) {
    throw new Error('Sin conexión y no hay datos guardados en el dispositivo.');
  }

  return fetchNetworkAndCache<T>(cacheKey, path, auth, options);
}

export async function apiPostCached<T>(
  path: string,
  body: unknown,
  auth = true,
  options: { queueOffline?: boolean } = {}
): Promise<T | { queued: true }> {
  const online = await isOnlineQuick();

  if (!online && options.queueOffline !== false) {
    await enqueueSyncRequest('POST', path, body, auth);
    return { queued: true };
  }

  return apiFetch<T>(path, {
    method: 'POST',
    auth,
    body: JSON.stringify(body),
  });
}

export async function apiPatchCached<T>(
  path: string,
  body: unknown,
  auth = true,
  options: { queueOffline?: boolean } = {}
): Promise<T | { queued: true }> {
  const online = await isOnlineQuick();

  if (!online && options.queueOffline !== false) {
    await enqueueSyncRequest('PATCH', path, body, auth);
    return { queued: true };
  }

  return apiFetch<T>(path, {
    method: 'PATCH',
    auth,
    body: JSON.stringify(body),
  });
}

export async function flushSyncQueue(): Promise<{ processed: number; failed: number }> {
  const online = await isOnlineQuick();
  if (!online) {
    return { processed: 0, failed: 0 };
  }

  const queue = await listQueuedRequests();
  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await apiFetch(item.path, {
        method: item.method,
        auth: item.requiresAuth,
        body: item.body ?? undefined,
      });
      await removeQueuedRequest(item.id);
      processed += 1;
    } catch {
      failed += 1;
    }
  }

  return { processed, failed };
}

export async function refreshAllCachedData(): Promise<void> {
  const online = await isOnlineQuick();
  if (!online) {
    return;
  }

  await flushSyncQueue();

  const keys = await listCachedKeys();
  const getKeys = keys.filter((key) => key.startsWith('GET:'));

  await Promise.allSettled(
    getKeys.map(async (key) => {
      const parts = key.split(':');
      if (parts.length < 3) {
        return;
      }

      const method = parts[0];
      const scope = parts[1];
      const path = parts.slice(2).join(':');
      const auth = scope !== 'public';

      if (method !== 'GET') {
        return;
      }

      try {
        const data = await apiFetch<unknown>(path, { method: 'GET', auth });
        await saveCacheEntry(key, data);
        await notifyRefreshListeners(key);
      } catch {
        // Keep stale cache if refresh fails.
      }
    })
  );
}

export async function clearUserCache() {
  await clearOfflineData();
}

export { switchCacheUser };

export function pathToCacheKey(path: string, auth = true): string {
  return buildCacheKey('GET', path, auth);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
