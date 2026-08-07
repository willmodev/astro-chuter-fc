import { actions } from 'astro:actions';
import { useCallback, useState } from 'react';

import {
  asistenciaDe,
  type DiaEntreno,
  type ResumenAsistencia,
} from '@/lib/domain/entrenos';

import type { SnapshotSesion } from './carga-sesion';
import type { AlumnoPlantel } from '../../data/types';

// Mitad "asistencia" del borrador: la lista de ausentes solo se persiste al
// pulsar Guardar; `listaExistente` distingue pasar lista de corregirla.
export interface AsistenciaSesion {
  estaAusente: (alumnoId: number) => boolean;
  marcar: (alumnoId: number, presente: boolean) => void;
  asistencia: ResumenAsistencia;
  listaExistente: boolean;
  guardarAsistencia: () => Promise<boolean>;
  guardando: boolean;
  aplicar: (snap: SnapshotSesion) => void;
}

export function useAsistenciaSesion(
  semanaInicio: string | null,
  day: DiaEntreno,
  roster: AlumnoPlantel[],
): AsistenciaSesion {
  const [ausentes, setAusentes] = useState<number[]>([]);
  const [listaExistente, setListaExistente] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const guardarAsistencia = useCallback(async (): Promise<boolean> => {
    if (!semanaInicio) return false;
    setGuardando(true);
    const { error } = await actions.entrenos.guardarAsistencia({
      semanaInicio,
      dia: day,
      ausentes,
    });
    setGuardando(false);
    return !error;
  }, [semanaInicio, day, ausentes]);

  return {
    estaAusente: (id) => ausentes.includes(id),
    marcar: (id, presente) => {
      setAusentes((prev) =>
        presente ? prev.filter((x) => x !== id) : [...new Set([...prev, id])],
      );
    },
    asistencia: asistenciaDe(ausentes, roster),
    listaExistente,
    guardarAsistencia,
    guardando,
    aplicar: (snap) => {
      setAusentes(snap.ausentes);
      setListaExistente(snap.listaExistente);
    },
  };
}
