import { actions } from 'astro:actions';

import type { DiaEntreno } from '@/lib/domain/entrenos';

// Carga la sesión del día desde la Action y devuelve el snapshot inicial del
// borrador, o `null` si la lectura falló (el hook lo traduce a estado 'error').
export interface SnapshotSesion {
  img: string | null;
  nota: string;
  ausentes: number[];
  listaExistente: boolean;
}

// Día sin sesión guardada: el borrador arranca en blanco.
const SIN_SESION: SnapshotSesion = {
  img: null,
  nota: '',
  ausentes: [],
  listaExistente: false,
};

export async function cargaSesionDia(
  semanaInicio: string,
  day: DiaEntreno,
): Promise<SnapshotSesion | null> {
  const { data, error } = await actions.entrenos.listar({ semanaInicio });
  if (error) return null;
  if (data.rol !== 'entrenador') return null;
  const s = data.sesiones.find((x) => x.dia === day);
  if (!s) return SIN_SESION;
  return {
    img: s.parteCentralUrl,
    nota: s.parteCentralNota,
    ausentes: s.ausentes ?? [],
    listaExistente: s.ausentes !== null,
  };
}

// FormData de la planeación: la imagen (ya comprimida) viaja como File con la
// extensión real; sin imagen nueva, el servidor conserva la URL previa.
export function construyeForm(
  semanaInicio: string,
  day: DiaEntreno,
  nota: string,
  archivo: Blob | null,
): FormData {
  const fd = new FormData();
  fd.set('semanaInicio', semanaInicio);
  fd.set('dia', day);
  fd.set('nota', nota);
  if (archivo) {
    const ext = archivo.type === 'image/jpeg' ? 'jpg' : 'webp';
    fd.set(
      'imagen',
      new File([archivo], `parte.${ext}`, { type: archivo.type }),
    );
  }
  return fd;
}
