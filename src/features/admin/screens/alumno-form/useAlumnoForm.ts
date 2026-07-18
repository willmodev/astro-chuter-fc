import { actions } from 'astro:actions';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  esHermano,
  sugerirAcudientes,
  validarAlumno,
  type DatosAlumnoInput,
  type ErroresAlumno,
} from '@/lib/domain/alumnos';

import type { EstadoCargaValor } from '../../chrome/EstadoCarga';
import type { Alumno } from '../../data/types';
import { useAlumnos } from '../../hooks/useAlumnos';

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
  name: '', doc: '', fechaNacimiento: '', acu: '', phone: '', dir: '',
};

// Un migrado sin fecha llega con el campo vacío → obligatorio completarlo.
function desdeAlumno(a: Alumno): FormValores {
  return {
    name: a.name, doc: a.doc, fechaNacimiento: a.fechaNacimiento ?? '',
    acu: a.acu, phone: a.phone, dir: a.dir,
  };
}

function aDatos(v: FormValores): DatosAlumnoInput {
  return {
    name: v.name, doc: v.doc, fechaNacimiento: v.fechaNacimiento,
    acu: v.acu, phone: v.phone,
  };
}

function aInput(v: FormValores) {
  return {
    nombre: v.name.trim(), documento: v.doc.trim(),
    fechaNacimiento: v.fechaNacimiento, acudiente: v.acu.trim(),
    celular: v.phone.trim(), direccion: v.dir.trim(),
  };
}

export function useAlumnoForm({ modo, alumnoId, onGuardado }: Args) {
  const { alumnos, estado, recargar } = useAlumnos();
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
    () => validarAlumno(aDatos(valores), alumnos, alumnoId),
    [valores, alumnos, alumnoId],
  );
  const sugerencias = useMemo(
    () => sugerirAcudientes(alumnos, valores.acu).filter((s) => s !== valores.acu),
    [alumnos, valores.acu],
  );

  const guardar = useCallback(async (): Promise<void> => {
    if (Object.keys(errores).length > 0) {
      setIntento(true);
      return;
    }
    setEnviando(true);
    setErrorServidor(null);
    const input = aInput(valores);
    if (modo === 'nuevo') {
      const { data, error } = await actions.alumnos.crear(input);
      setEnviando(false);
      if (error || !data) {
        setErrorServidor(error?.message ?? 'No se pudo guardar.');
        return;
      }
      onGuardado(data.id);
      return;
    }
    if (alumnoId === undefined) {
      setEnviando(false);
      return;
    }
    const { error } = await actions.alumnos.editar({ id: alumnoId, ...input });
    setEnviando(false);
    if (error) {
      setErrorServidor(error.message);
      return;
    }
    onGuardado(alumnoId);
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
