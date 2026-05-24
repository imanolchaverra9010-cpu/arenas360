import { getCachedAccessToken, getSession } from '@/utils/session-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://arenas360-x00o.onrender.com';

let unauthorizedHandler: (() => void) | null = null;
let tokenProvider: (() => string | null) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

/** Prefer in-memory token from AuthContext (available immediately after login). */
export function setTokenProvider(provider: (() => string | null) | null) {
  tokenProvider = provider;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export function getApiErrorMessage(error: unknown, fallback = 'Error de conexión con el servidor'): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function parseErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const detail = (data as { detail?: unknown; message?: unknown }).detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg?: unknown }).msg);
        }
        return JSON.stringify(item);
      })
      .join(' · ');
  }

  const message = (data as { message?: unknown }).message;
  if (typeof message === 'string') {
    return message;
  }

  return fallback;
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
  /** Do not trigger global logout on 401 (e.g. optional badge checks). */
  silent401?: boolean;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, silent401 = false, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!requestHeaders.has('Content-Type') && rest.body && !(rest.body instanceof FormData)) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = tokenProvider?.() ?? getCachedAccessToken() ?? (await getSession()).accessToken;
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...rest,
    headers: requestHeaders,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && auth && !silent401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(parseErrorMessage(data, 'Error en la solicitud'), response.status, data);
  }

  return data as T;
}

export async function apiGet<T>(
  path: string,
  auth = true,
  options: Pick<ApiFetchOptions, 'silent401'> = {}
): Promise<T> {
  return apiFetch<T>(path, { method: 'GET', auth, ...options });
}

export async function apiPost<T>(path: string, body: unknown, auth = false): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    auth,
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(path: string, body?: unknown, auth = true): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    auth,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string, auth = true): Promise<T> {
  return apiFetch<T>(path, { method: 'DELETE', auth });
}

export async function apiUpload<T>(path: string, formData: FormData, auth = true): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    auth,
    body: formData,
  });
}
