import { useCallback, useEffect, useRef, useState } from 'react';

import { apiGetCached, pathToCacheKey, peekCacheForPath, registerRefreshListener } from '@/services/cached-api';
import { getApiErrorMessage } from '@/services/api';

type UseCachedQueryOptions = {
  auth?: boolean;
  enabled?: boolean;
  debounceMs?: number;
  silent401?: boolean;
};

export function useCachedQuery<T>(path: string | null, options: UseCachedQueryOptions = {}) {
  const { auth = true, enabled = true, debounceMs = 0, silent401 = false } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [fromCache, setFromCache] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDataRef = useRef(false);

  const applyResult = useCallback((result: { data: T; fromCache: boolean; updatedAt?: number }) => {
    setData(result.data);
    setFromCache(result.fromCache);
    setUpdatedAt(result.updatedAt ?? Date.now());
    hasDataRef.current = true;
  }, []);

  const fetchData = useCallback(async () => {
    if (!path || !enabled) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    setError('');

    const cached = await peekCacheForPath<T>(path, auth);
    if (cached) {
      applyResult({ data: cached.data, fromCache: true, updatedAt: cached.updatedAt });
      setLoading(false);
      setRefreshing(true);
    } else if (!hasDataRef.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const result = await apiGetCached<T>(path, auth, { silent401 });
      applyResult(result);
    } catch (err) {
      if (!hasDataRef.current) {
        setError(getApiErrorMessage(err, 'No se pudieron cargar los datos'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [applyResult, auth, enabled, path, silent401]);

  const refetch = useCallback(async () => {
    if (!path || !enabled) {
      return;
    }

    setRefreshing(true);
    setError('');

    try {
      const result = await apiGetCached<T>(path, auth, { silent401, forceNetwork: true });
      applyResult(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudieron cargar los datos'));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [applyResult, auth, enabled, path, silent401]);

  useEffect(() => {
    if (!enabled || !path) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void fetchData();
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [debounceMs, enabled, fetchData, path]);

  useEffect(() => {
    if (!path || !enabled) {
      return;
    }

    const cacheKey = pathToCacheKey(path, auth);
    return registerRefreshListener(cacheKey, fetchData);
  }, [auth, enabled, fetchData, path]);

  return {
    data,
    loading,
    refreshing,
    error,
    fromCache,
    updatedAt,
    refetch,
  };
}
