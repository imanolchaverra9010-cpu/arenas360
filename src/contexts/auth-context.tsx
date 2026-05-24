import { usePathname, useRootNavigationState, useRouter } from 'expo-router';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { ApiError, apiGet, setTokenProvider, setUnauthorizedHandler } from '@/services/api';
import { switchCacheUser, clearUserCache } from '@/services/cached-api';
import { registerPushNotificationsIfEnabled, unregisterPushNotifications } from '@/services/push-notifications';
import type { Usuario } from '@/types/usuario';
import { clearSession, getSession, saveSession } from '@/utils/session-storage';

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  usuario: Usuario | null;
  accessToken: string | null;
  login: (accessToken: string, usuario: Usuario) => Promise<void>;
  logout: () => Promise<void>;
  refreshUsuario: () => Promise<Usuario | null>;
  setSessionUsuario: (usuario: Usuario) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const PUBLIC_ROUTES = new Set(['/', '/register']);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const rootNavigationState = useRootNavigationState();
  const navigationReady = Boolean(rootNavigationState?.key);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const login = useCallback(async (token: string, user: Usuario) => {
    await switchCacheUser(user.id);
    await saveSession(token, user);
    setAccessToken(token);
    setUsuario(user);
    void registerPushNotificationsIfEnabled();
  }, []);

  const logout = useCallback(async () => {
    await unregisterPushNotifications();
    await clearUserCache();
    await switchCacheUser(null);
    await clearSession();
    setAccessToken(null);
    setUsuario(null);
    router.replace('/');
  }, [router]);

  const refreshUsuario = useCallback(async () => {
    const session = await getSession();
    if (!session.accessToken) {
      await logout();
      return null;
    }

    try {
      const data = await apiGet<Usuario>('/api/auth/me');
      await saveSession(session.accessToken, data);
      setAccessToken(session.accessToken);
      setUsuario(data);
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await logout();
        return null;
      }
      return null;
    }
  }, [logout]);

  const setSessionUsuario = useCallback(async (user: Usuario) => {
    const session = await getSession();
    if (!session.accessToken) {
      return;
    }
    await saveSession(session.accessToken, user);
    setAccessToken(session.accessToken);
    setUsuario(user);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const session = await getSession();
        if (!mounted || !session.accessToken || !session.usuario) {
          return;
        }

        setAccessToken(session.accessToken);
        setUsuario(session.usuario as Usuario);
        await switchCacheUser((session.usuario as Usuario).id);

        try {
          const fresh = await apiGet<Usuario>('/api/auth/me');
          if (!mounted) {
            return;
          }
          await saveSession(session.accessToken, fresh);
          setUsuario(fresh);
        } catch (error) {
          if (!mounted) {
            return;
          }
          if (error instanceof ApiError && error.status === 401) {
            await clearSession();
            setAccessToken(null);
            setUsuario(null);
          }
        }
      } catch (error) {
        console.warn('Error al restaurar sesión:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setTokenProvider(() => accessToken);
    return () => setTokenProvider(null);
  }, [accessToken]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
  }, [logout]);

  const isAuthenticated = !!accessToken && !!usuario;

  useEffect(() => {
    if (isLoading || !navigationReady) {
      return;
    }

    const isPublicRoute = PUBLIC_ROUTES.has(pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/');
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.replace('/events');
    }
  }, [isAuthenticated, isLoading, navigationReady, pathname, router]);

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated,
      usuario,
      accessToken,
      login,
      logout,
      refreshUsuario,
      setSessionUsuario,
    }),
    [isLoading, isAuthenticated, usuario, accessToken, login, logout, refreshUsuario, setSessionUsuario]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF9F1C" />
        </View>
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001529',
    zIndex: 9998,
  },
});
