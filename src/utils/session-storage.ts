import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memoryStorage = new Map<string, string>();

let cachedAccessToken: string | null = null;
let cachedUsuario: unknown = null;

const writeFallback = (entries: Array<[string, string]>) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    entries.forEach(([key, value]) => window.localStorage.setItem(key, value));
    return;
  }

  entries.forEach(([key, value]) => memoryStorage.set(key, value));
};

const readFallback = (keys: string[]) => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    const result: Record<string, string | null> = {};
    keys.forEach((key) => {
      result[key] = window.localStorage.getItem(key);
    });
    return result;
  }

  const result: Record<string, string | null> = {};
  keys.forEach((key) => {
    result[key] = memoryStorage.get(key) ?? null;
  });
  return result;
};

export const saveSession = async (accessToken: string, usuario: unknown) => {
  cachedAccessToken = accessToken;
  cachedUsuario = usuario;

  const entries: Array<[string, string]> = [
    ['accessToken', accessToken],
    ['usuario', JSON.stringify(usuario)],
  ];

  try {
    await Promise.all(entries.map(([key, value]) => AsyncStorage.setItem(key, value)));
  } catch (error) {
    writeFallback(entries);
    console.warn('Session storage unavailable; using fallback storage.', error);
  }
};

export const getSession = async () => {
  if (cachedAccessToken) {
    return {
      accessToken: cachedAccessToken,
      usuario: cachedUsuario,
    };
  }

  const keys = ['accessToken', 'usuario'];

  try {
    const values = await Promise.all(keys.map((key) => AsyncStorage.getItem(key)));
    const accessToken = values[0];
    const usuarioRaw = values[1];

    if (accessToken) {
      cachedAccessToken = accessToken;
      cachedUsuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    }

    return {
      accessToken,
      usuario: usuarioRaw ? JSON.parse(usuarioRaw) : null,
    };
  } catch (error) {
    const fallback = readFallback(keys);
    const accessToken = fallback.accessToken ?? null;
    const usuarioRaw = fallback.usuario ?? null;

    if (accessToken) {
      cachedAccessToken = accessToken;
      cachedUsuario = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    }

    return {
      accessToken,
      usuario: usuarioRaw ? JSON.parse(usuarioRaw) : null,
    };
  }
};

export const clearSession = async () => {
  cachedAccessToken = null;
  cachedUsuario = null;

  const keys = ['accessToken', 'usuario'];
  try {
    await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
  } catch (error) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      keys.forEach((key) => window.localStorage.removeItem(key));
      return;
    }
    keys.forEach((key) => memoryStorage.delete(key));
  }
};

export const getCachedAccessToken = () => cachedAccessToken;

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};
