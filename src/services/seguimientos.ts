import { apiGetCached, apiPostCached } from '@/services/cached-api';

export type SeguimientoTipo = 'ATLETA' | 'EVENTO' | 'PRUEBA';

export async function getSeguimientoEstado(tipo: SeguimientoTipo, entidadId: number | string) {
  const result = await apiGetCached<{ following: boolean }>(
    `/api/seguimientos/estado?tipo=${tipo}&entidad_id=${entidadId}`
  );
  return result.data;
}

export async function getSeguimientosEstados(tipo: SeguimientoTipo, ids: Array<number | string>) {
  if (ids.length === 0) {
    return {} as Record<string, boolean>;
  }
  const result = await apiGetCached<{ estados: Record<string, boolean> }>(
    `/api/seguimientos/estados?tipo=${tipo}&ids=${ids.join(',')}`
  );
  return result.data.estados;
}

export type ToggleSeguimientoResult = {
  following: boolean;
  queued?: boolean;
};

export async function toggleSeguimiento(
  tipo: SeguimientoTipo,
  entidadId: number | string,
  currentFollowing?: boolean
): Promise<ToggleSeguimientoResult> {
  const result = await apiPostCached<{ following: boolean }>(
    '/api/seguimientos/toggle',
    {
      tipo,
      entidad_id: Number(entidadId),
    },
    true
  );

  if ('queued' in result) {
    return {
      following: currentFollowing === undefined ? true : !currentFollowing,
      queued: true,
    };
  }

  return { following: result.following };
}

export type SeguimientoEventoItem = {
  id: string;
  title: string;
  date: string;
  status: string;
  statusColor: string;
  image: string;
  tests: string;
  inscribed: string;
  location: string;
  followedAt: string;
};

export type SeguimientoAtletaItem = {
  id: string;
  name: string;
  specialty: string;
  category: string;
  categoryColor: string;
  image: string;
  medals: string;
  records: string;
  status: string;
  statusColor: string;
  bestTime: string;
  club: string;
  rating: string;
  followedAt: string;
};

export type SeguimientoPruebaItem = {
  id: string;
  eventoId: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  time: string;
  followedAt: string;
};

export type MisSeguidosResponse = {
  eventos: SeguimientoEventoItem[];
  atletas: SeguimientoAtletaItem[];
  pruebas: SeguimientoPruebaItem[];
  resumen: {
    total: number;
    eventos: number;
    atletas: number;
    pruebas: number;
  };
};

export async function fetchMisSeguidos() {
  const result = await apiGetCached<MisSeguidosResponse>('/api/seguimientos/mis-seguidos');
  return result.data;
}
