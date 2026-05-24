import { apiPatch, apiUpload } from '@/services/api';
import type { Usuario } from '@/types/usuario';

export type PerfilUpdatePayload = {
  primer_nombre: string;
  segundo_nombre?: string | null;
  primer_apellido: string;
  segundo_apellido?: string | null;
  telefono?: string | null;
};

export async function updatePerfil(payload: PerfilUpdatePayload) {
  return apiPatch<Usuario>('/api/auth/me', payload);
}

export async function uploadFotoPerfil(uri: string, fileName?: string, mimeType?: string) {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName || `avatar-${Date.now()}.jpg`,
    type: mimeType || 'image/jpeg',
  } as unknown as Blob);

  return apiUpload<Usuario>('/api/auth/me/foto', formData);
}
