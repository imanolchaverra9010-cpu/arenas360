import { apiGet, apiPatch, apiPost } from '@/services/api';

export type NotificacionItem = {
  id: string;
  title: string;
  description: string;
  type: 'event' | 'result' | 'system';
  date: string;
  time: string;
  read: boolean;
  icon: string;
  color: string;
  payload?: {
    eventId?: string;
    athleteId?: string;
    resultId?: string;
    eventoPruebaId?: string;
  } | null;
};

export async function fetchNotificaciones(tipo?: string) {
  const query = tipo ? `?tipo=${tipo}` : '';
  return apiGet<{ items: NotificacionItem[]; resumen: { no_leidas: number } }>(
    `/api/notificaciones${query}`
  );
}

export async function fetchNotificacionesResumen() {
  return apiGet<{ no_leidas: number }>('/api/notificaciones/resumen', true, { silent401: true });
}

export async function marcarNotificacionLeida(id: string) {
  return apiPatch<{ ok: boolean }>(`/api/notificaciones/${id}/leer`);
}

export async function marcarTodasLeidas() {
  return apiPatch<{ actualizadas: number }>('/api/notificaciones/leer-todas');
}

export async function enviarPushPrueba() {
  return apiPost<{ push_enviados: number; mensaje: string }>('/api/notificaciones/push-prueba', {}, true);
}
