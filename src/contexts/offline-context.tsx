import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import NetInfo from '@react-native-community/netinfo';

import { initOfflineDb, listQueuedRequests } from '@/services/offline-db';
import {
  flushSyncQueue,
  refreshAllCachedData,
  subscribeOnlineState,
} from '@/services/cached-api';

type OfflineContextValue = {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  syncNow: () => Promise<void>;
};

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const syncingRef = useRef(false);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    setIsSyncing(true);
    try {
      await flushSyncQueue();
      await refreshAllCachedData();
      const queue = await listQueuedRequests();
      setPendingCount(queue.length);
      setLastSyncedAt(Date.now());
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, []);

  const syncNowRef = useRef(syncNow);
  syncNowRef.current = syncNow;

  useEffect(() => {
    void initOfflineDb();
    void NetInfo.fetch().then((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    const unsubscribe = subscribeOnlineState((online) => {
      setIsOnline(online);
      if (online) {
        void syncNowRef.current();
      }
    });

    void listQueuedRequests().then((queue) => setPendingCount(queue.length));

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      isOnline,
      isSyncing,
      pendingCount,
      lastSyncedAt,
      syncNow,
    }),
    [isOnline, isSyncing, pendingCount, lastSyncedAt, syncNow]
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within OfflineProvider');
  }
  return context;
}
