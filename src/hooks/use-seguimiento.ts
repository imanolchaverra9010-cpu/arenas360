import { useCallback, useEffect, useState } from 'react';

import {
  getSeguimientoEstado,
  toggleSeguimiento,
  type SeguimientoTipo,
} from '@/services/seguimientos';

export function useSeguimiento(tipo: SeguimientoTipo, entidadId?: string | number | null) {
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadState() {
      if (!entidadId) {
        setFollowing(false);
        setChecking(false);
        return;
      }

      setChecking(true);
      try {
        const data = await getSeguimientoEstado(tipo, entidadId);
        if (mounted) {
          setFollowing(data.following);
        }
      } catch {
        if (mounted) {
          setFollowing(false);
        }
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    void loadState();
    return () => {
      mounted = false;
    };
  }, [tipo, entidadId]);

  const toggle = useCallback(async () => {
    if (!entidadId || loading) {
      return;
    }

    setLoading(true);
    try {
      const data = await toggleSeguimiento(tipo, entidadId, following);
      setFollowing(data.following);
    } finally {
      setLoading(false);
    }
  }, [entidadId, loading, tipo]);

  return { following, loading, checking, toggle };
}
