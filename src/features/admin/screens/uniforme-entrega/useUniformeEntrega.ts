import { useState } from 'react';

import { esHermano } from '@/lib/domain/alumnos';
import { precioUniforme } from '@/lib/domain/precios';
import {
  estadoUniforme,
  numeroOcupado,
  type EstadoUniforme,
  type TipoKit,
} from '@/lib/domain/uniformes';

import {
  anularEntrega,
  registrarEntregaUniforme,
  registrarPagoUniforme,
} from '../../data/store';
import type { Alumno } from '../../data/types';
import { useAlumnos } from '../../hooks/useAlumnos';

export interface EntregaValores {
  kit: TipoKit;
  numero: string;
  talla: string;
}

const KIT_LABEL: Record<TipoKit, string> = { AZUL: 'Azul', DORADO: 'Dorado' };

interface Args {
  alumnoId: number;
}

function estadoInicial(a: Alumno | undefined): EntregaValores {
  return {
    kit: a?.tipoKit ?? 'AZUL',
    numero: a?.numero != null ? String(a.numero) : '',
    talla: a?.talla ?? '',
  };
}

// Orquesta los dos registros independientes del uniforme (spec 08): pago y
// entrega mutan ejes distintos del store; el estado derivado sale del dominio.
export function useUniformeEntrega({ alumnoId }: Args) {
  const { alumnos } = useAlumnos();
  const alumno = alumnos.find((a) => a.id === alumnoId);
  const [valores, setValores] = useState<EntregaValores>(() =>
    estadoInicial(alumno),
  );

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

  const entregado = alumno?.uniforme === 'entregado';
  const pagado = alumno?.uniformePago === 'pagado';
  const estado: EstadoUniforme = estadoUniforme(
    alumno?.uniforme ?? 'pendiente',
    alumno?.uniformePago ?? 'pendiente',
  );
  const detalleEntrega =
    entregado && alumno
      ? `Kit ${KIT_LABEL[alumno.tipoKit ?? 'AZUL']} · Nº ${alumno.numero ?? '—'} · Talla ${alumno.talla}`
      : null;

  const guardarEntrega = (): void => {
    if (!valido) return;
    registrarEntregaUniforme(alumnoId, {
      tipoKit: valores.kit,
      numero,
      talla: valores.talla.trim(),
    });
  };

  return {
    alumno,
    estado,
    entregado,
    pagado,
    precio,
    detalleEntrega,
    valores,
    setCampo,
    valido,
    repetido,
    togglePago: () => registrarPagoUniforme(alumnoId, !pagado),
    guardarEntrega,
    anularEntrega: () => anularEntrega(alumnoId),
  };
}
