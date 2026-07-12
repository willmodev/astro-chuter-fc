import { useState } from 'react';

import { esHermano } from '@/lib/domain/alumnos';
import { precioUniforme } from '@/lib/domain/precios';
import { numeroOcupado, type TipoKit } from '@/lib/domain/uniformes';

import { guardarUniforme } from '../../data/store';
import type { Alumno } from '../../data/types';
import { useAlumnos } from '../../hooks/useAlumnos';

export interface EntregaValores {
  kit: TipoKit;
  numero: string;
  talla: string;
  pago: 'pagado' | 'pendiente';
}

interface Args {
  alumnoId: number;
  onGuardado: () => void;
}

function estadoInicial(a: Alumno | undefined): EntregaValores {
  return {
    kit: a?.tipoKit ?? 'AZUL',
    numero: a?.numero != null ? String(a.numero) : '',
    talla: a?.talla ?? '',
    pago: a?.uniformePago ?? 'pendiente',
  };
}

export function useUniformeEntrega({ alumnoId, onGuardado }: Args) {
  const { alumnos } = useAlumnos();
  const alumno = alumnos.find((a) => a.id === alumnoId);
  const [valores, setValores] = useState<EntregaValores>(() => estadoInicial(alumno));

  const setCampo = <K extends keyof EntregaValores>(
    campo: K,
    valor: EntregaValores[K],
  ): void => setValores((prev) => ({ ...prev, [campo]: valor }));

  const numero = Number(valores.numero);
  const numeroValido = Number.isInteger(numero) && numero > 0;
  const valido = numeroValido && valores.talla.trim() !== '';
  const repetido =
    numeroValido && numeroOcupado(alumnos, valores.kit, numero, alumnoId);
  const precio = precioUniforme(
    alumno ? esHermano(alumnos, alumno.acu, alumno.id) : false,
  );

  const guardar = (): void => {
    if (!valido) return;
    guardarUniforme(alumnoId, {
      tipoKit: valores.kit,
      numero,
      talla: valores.talla.trim(),
      pago: valores.pago,
    });
    onGuardado();
  };

  return {
    alumno,
    valores,
    setCampo,
    valido,
    repetido,
    precio,
    esCorreccion: alumno?.uniforme === 'entregado',
    guardar,
  };
}
