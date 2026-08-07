import { actions } from 'astro:actions';
import { useCallback, useState } from 'react';

import type { DiaEntreno } from '@/lib/domain/entrenos';

import { comprimeImagen } from '../../lib/comprime-imagen';

import { construyeForm, type SnapshotSesion } from './carga-sesion';

// Mitad "planeación" del borrador: imagen (comprimida, con preview local) y
// nota. Se guarda por su cuenta, aparte de la asistencia.
export interface PlaneacionSesion {
  img: string | null;
  nota: string;
  setNota: (v: string) => void;
  elegirImagen: (file: File) => void;
  errorImagen: string | null;
  guardarPlaneacion: () => Promise<boolean>;
  guardando: boolean;
  aplicar: (snap: SnapshotSesion) => void;
}

export function usePlaneacion(
  semanaInicio: string | null,
  day: DiaEntreno,
): PlaneacionSesion {
  const [img, setImg] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [archivo, setArchivo] = useState<Blob | null>(null);
  const [errorImagen, setErrorImagen] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const elegirImagen = useCallback(async (file: File) => {
    setErrorImagen(null);
    try {
      const blob = await comprimeImagen(file);
      setArchivo(blob);
      setImg((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } catch (e) {
      setErrorImagen(
        e instanceof Error ? e.message : 'No se pudo procesar la imagen.',
      );
    }
  }, []);

  const guardarPlaneacion = useCallback(async (): Promise<boolean> => {
    if (!semanaInicio) return false;
    setGuardando(true);
    const { error } = await actions.entrenos.guardarPlaneacion(
      construyeForm(semanaInicio, day, nota, archivo),
    );
    setGuardando(false);
    if (error) {
      setErrorImagen(error.message);
      return false;
    }
    return true;
  }, [semanaInicio, day, nota, archivo]);

  return {
    img,
    nota,
    setNota,
    elegirImagen: (file) => void elegirImagen(file),
    errorImagen,
    guardarPlaneacion,
    guardando,
    aplicar: (snap) => {
      setImg(snap.img);
      setNota(snap.nota);
    },
  };
}
