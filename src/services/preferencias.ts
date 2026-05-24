import { apiGetCached, apiPatchCached } from '@/services/cached-api';

export type UsuarioPreferencias = {
  notificaciones_push: boolean;
};

export async function fetchPreferencias() {
  const result = await apiGetCached<UsuarioPreferencias>('/api/usuarios/preferencias');
  return result.data;
}

export async function updatePreferencias(notificaciones_push: boolean) {
  const result = await apiPatchCached<UsuarioPreferencias>('/api/usuarios/preferencias', {
    notificaciones_push,
  });

  if ('queued' in result) {
    return { notificaciones_push };
  }

  return result;
}
