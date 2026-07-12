import { useMemo, useState } from 'react';

import {
  esHermano,
  sugerirAcudientes,
  validarAlumno,
  type ErroresAlumno,
} from '@/lib/domain/alumnos';
import { subDeAnio } from '@/lib/domain/categoria';

import {
  actualizarAlumno,
  registrarAlumno,
  type DatosAlumno,
} from '../../data/store';
import type { Alumno } from '../../data/types';
import { useAlumnos } from '../../hooks/useAlumnos';

export interface FormValores {
  name: string;
  doc: string;
  anio: string;
  acu: string;
  phone: string;
  dir: string;
}

interface Args {
  modo: 'nuevo' | 'editar';
  alumnoId?: number;
  onGuardado: (id: number) => void;
}

const VACIO: FormValores = { name: '', doc: '', anio: '', acu: '', phone: '', dir: '' };

function desdeAlumno(a: Alumno): FormValores {
  return {
    name: a.name,
    doc: a.doc,
    anio: String(a.anio),
    acu: a.acu,
    phone: a.phone,
    dir: a.dir,
  };
}

function aDatos(v: FormValores): DatosAlumno {
  return {
    name: v.name,
    doc: v.doc,
    anio: Number(v.anio),
    acu: v.acu,
    phone: v.phone,
    dir: v.dir,
  };
}

export function useAlumnoForm({ modo, alumnoId, onGuardado }: Args) {
  const { alumnos } = useAlumnos();
  const actual =
    modo === 'editar' ? alumnos.find((a) => a.id === alumnoId) : undefined;
  const [valores, setValores] = useState<FormValores>(() =>
    actual ? desdeAlumno(actual) : VACIO,
  );
  const [intento, setIntento] = useState(false);

  const setCampo = (campo: keyof FormValores, valor: string): void =>
    setValores((prev) => ({ ...prev, [campo]: valor }));

  const errores: ErroresAlumno = useMemo(
    () => validarAlumno(aDatos(valores), alumnos, alumnoId),
    [valores, alumnos, alumnoId],
  );
  const sugerencias = useMemo(
    () => sugerirAcudientes(alumnos, valores.acu).filter((s) => s !== valores.acu),
    [alumnos, valores.acu],
  );

  const guardar = (): void => {
    if (Object.keys(errores).length > 0) {
      setIntento(true);
      return;
    }
    if (modo === 'nuevo') {
      onGuardado(registrarAlumno(aDatos(valores)));
      return;
    }
    if (alumnoId === undefined) return;
    actualizarAlumno(alumnoId, aDatos(valores));
    onGuardado(alumnoId);
  };

  return {
    valores,
    setCampo,
    errores: intento ? errores : {},
    categoria: subDeAnio(Number(valores.anio)),
    hermano: esHermano(alumnos, valores.acu, alumnoId),
    sugerencias,
    guardar,
    existe: modo === 'nuevo' || actual !== undefined,
  };
}
