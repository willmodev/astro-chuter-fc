import { actions } from 'astro:actions';
import { useCallback, useEffect, useState } from 'react';

import type { DashboardStats } from '@/lib/services/dashboard';

import type { EstadoCargaValor } from '../chrome/EstadoCarga';

// Contrato del Dashboard, ahora servido por `dashboard.stats` (todo derivado en
// servidor). `data` es null mientras carga o si falló. Sin EntrenoDeHoy (vuelve
// con la persistencia de entrenos, spec 13); cumpleaños reales.
export interface DashboardData {
  data: DashboardStats | null;
  estado: EstadoCargaValor;
  recargar: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [estado, setEstado] = useState<EstadoCargaValor>('cargando');

  const recargar = useCallback(async () => {
    setEstado('cargando');
    const { data: res, error } = await actions.dashboard.stats();
    if (error || !res) {
      setEstado('error');
      return;
    }
    setData(res);
    setEstado('listo');
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  return { data, estado, recargar };
}
