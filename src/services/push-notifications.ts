import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { ApiError, apiDelete, apiGet, apiPost } from '@/services/api';

const PUSH_TOKEN_STORAGE_KEY = 'arenas360.expoPushToken';

let handlerConfigured = false;

export type PushRegistrationResult = {
  success: boolean;
  token?: string;
  error?: string;
};

export function ensureNotificationHandler() {
  if (handlerConfigured) {
    return;
  }

  handlerConfigured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

let cachedPushToken: string | null = null;

export function getCachedPushToken() {
  return cachedPushToken;
}

function getProjectId(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
}

function mapPushError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('FirebaseApp') || message.includes('google-services')) {
    return 'Faltan credenciales FCM para Android. Configura Firebase en EAS (eas credentials) y genera un nuevo APK.';
  }

  if (message.includes('projectId')) {
    return 'No se encontró el projectId de EAS. Verifica app.json → extra.eas.projectId.';
  }

  if (message.includes('Physical device') || message.includes('physical device')) {
    return 'Las notificaciones push solo funcionan en un dispositivo físico, no en emulador.';
  }

  if (error instanceof ApiError) {
    return error.message;
  }

  return message || 'No se pudo registrar el dispositivo para push.';
}

async function persistPushToken(token: string) {
  cachedPushToken = token;
  try {
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
  } catch {
    // Keep in-memory token even if storage fails.
  }
}

async function loadPersistedPushToken(): Promise<string | null> {
  if (cachedPushToken) {
    return cachedPushToken;
  }

  try {
    const stored = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (stored) {
      cachedPushToken = stored;
    }
    return stored;
  } catch {
    return null;
  }
}

async function clearPersistedPushToken() {
  cachedPushToken = null;
  try {
    await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
  } catch {
    // Ignore storage errors on logout.
  }
}

async function arePushNotificationsEnabled(): Promise<boolean> {
  const prefs = await apiGet<{ notificaciones_push: boolean }>('/api/usuarios/preferencias');
  return prefs.notificaciones_push;
}

async function syncPushTokenToBackend(token: string): Promise<void> {
  await apiPost(
    '/api/dispositivos/push-token',
    {
      push_token: token,
      platform: Platform.OS,
    },
    true
  );
}

async function obtainExpoPushToken(): Promise<string> {
  const projectId = getProjectId();

  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  return tokenResponse.data;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Arenas 360',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF9F1C',
  });
}

async function ensureNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === 'granted';
}

/** Sync an already-known token to the backend (retry after failed API call). */
export async function syncRegisteredPushToken(): Promise<PushRegistrationResult> {
  const token = await loadPersistedPushToken();
  if (!token) {
    return { success: false, error: 'No hay token push guardado en el dispositivo.' };
  }

  try {
    if (!(await arePushNotificationsEnabled())) {
      return { success: false, error: 'Las notificaciones push están desactivadas en tu cuenta.' };
    }

    await syncPushTokenToBackend(token);
    return { success: true, token };
  } catch (error) {
    return { success: false, error: mapPushError(error) };
  }
}

export async function registerPushNotificationsIfEnabled(): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return {
      success: false,
      error: 'Las notificaciones push solo funcionan en un teléfono físico, no en emulador.',
    };
  }

  try {
    if (!(await arePushNotificationsEnabled())) {
      return { success: false, error: 'Las notificaciones push están desactivadas en tu cuenta.' };
    }
  } catch (error) {
    return { success: false, error: mapPushError(error) };
  }

  try {
    const granted = await ensureNotificationPermissions();
    if (!granted) {
      return {
        success: false,
        error: 'Permiso de notificaciones denegado. Actívalo en Ajustes del teléfono.',
      };
    }

    await ensureAndroidChannel();

    const token = await obtainExpoPushToken();
    await persistPushToken(token);
    await syncPushTokenToBackend(token);

    return { success: true, token };
  } catch (error) {
    console.warn('[push] Error al registrar dispositivo:', error);

    const persisted = await loadPersistedPushToken();
    if (persisted) {
      try {
        await syncPushTokenToBackend(persisted);
        return { success: true, token: persisted };
      } catch (syncError) {
        return { success: false, error: mapPushError(syncError) };
      }
    }

    return { success: false, error: mapPushError(error) };
  }
}

export async function unregisterPushNotifications(): Promise<void> {
  const token = cachedPushToken ?? (await loadPersistedPushToken());
  await clearPersistedPushToken();

  if (!token) {
    return;
  }

  try {
    await apiDelete(`/api/dispositivos/push-token?push_token=${encodeURIComponent(token)}`);
  } catch {
    // Token may already be inactive; ignore on logout.
  }
}
