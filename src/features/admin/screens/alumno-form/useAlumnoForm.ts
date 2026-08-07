import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  esHermano,
  sugerirAcudientes,
  validarAlumno,
  type DatosAlumnoInput,
  type ErroresAlumno,
} from '@/lib/domain/alumnos';

import { useAlumnos } from '../../hooks/useAlumnos';

import { aInput, guardaAlumno } from './guardado-alumno';

import type { Alumno } from '../../data/types';

export interface FormValores {
  name: string;
  doc: string;
  fechaNacimiento: string; // 'YYYY-MM-DD'
  acu: string;
  phone: string;
  dir: string;
}

interface Args {
  modo: 'nuevo' | 'editar';
  alumnoId?: number;
  onGuardado: (id: number) => void;
}

const VACIO: FormValores = {
  name: '',
  doc: '',
  fechaNacimiento: '',
  acu: '',
  phone: '',
  dir: '',
};

// Un migrado sin fecha llega con el campo vacío → obligatorio completarlo.
function desdeAlumno(a: Alumno): FormValores {
  return {
    name: a.name,
    doc: a.doc,
    fechaNacimiento: a.fechaNacimiento ?? '',
    acu: a.acu,
    phone: a.phone,
    dir: a.dir,
  };
}

function aDatos(v: FormValores): DatosAlumnoInput {
  return {
    name: v.name,
    doc: v.doc,
    fechaNacimiento: v.fechaNacimiento,
    acu: v.acu,
    phone: v.phone,
  };
}

export function useAlumnoForm({ modo, alumnoId, onGuardado }: Args) {
  // Con retirados: el documento único y los acudientes se validan contra el
  // padrón completo, no solo contra los activos (spec 14).
  const { alumnos, estado, recargar } = useAlumnos(true);
  const actual =
    modo === 'editar' ? alumnos.find((a) => a.id === alumnoId) : undefined;
  const [valores, setValores] = useState<FormValores>(VACIO);
  const [intento, setIntento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const prefilled = useRef(false);

  useEffect(() => {
    if (modo === 'editar' && actual && !prefilled.current) {
      prefilled.current = true;
      setValores(desdeAlumno(actual));
    }
  }, [modo, actual]);

  const setCampo = (campo: keyof FormValores, valor: string): void => {
    setValores((prev) => ({ ...prev, [campo]: valor }));
    setErrorServidor(null);
  };

  const errores: ErroresAlumno = useMemo(
    () => validarAlumno(aDatos(valores), alumnos, new Date(), alumnoId),
    [valores, alumnos, alumnoId],
  );
  const sugerencias = useMemo(
    () =>
      sugerirAcudientes(alumnos, valores.acu).filter((s) => s !== valores.acu),
    [alumnos, valores.acu],
  );

  const guardar = useCallback(async (): Promise<void> => {
    if (Object.keys(errores).length > 0) {
      setIntento(true);
      return;
    }
    setEnviando(true);
    setErrorServidor(null);
    const res = await guardaAlumno(modo, alumnoId, aInput(valores));
    setEnviando(false);
    if (res === null) return;
    if ('error' in res) {
      setErrorServidor(res.error);
      return;
    }
    onGuardado(res.id);
  }, [errores, valores, modo, alumnoId, onGuardado]);

  return {
    valores,
    setCampo,
    errores: intento ? errores : {},
    hermano: esHermano(alumnos, valores.acu, alumnoId),
    sugerencias,
    guardar,
    existe: modo === 'nuevo' || actual !== undefined,
    estado,
    recargar,
    enviando,
    errorServidor,
  };
}
