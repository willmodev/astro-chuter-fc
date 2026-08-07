import { useMemo, useState } from 'react';

import {
  CATEGORIA_TODAS,
  filtraAlumnos,
  sinFechaNacimiento,
  soloActivos,
} from '@/lib/domain/alumnos';
import { estaEnMora } from '@/lib/domain/cartera';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useAlumnos } from '../../hooks/useAlumnos';
import { BuscadorAlumnos } from './BuscadorAlumnos';
import { ChipRetirados } from './ChipRetirados';
import { ChipsCategoria } from './ChipsCategoria';
import { FilaAlumno } from './FilaAlumno';
import { ResumenAlumnos } from './ResumenAlumnos';
import { SinResultados } from './SinResultados';

// Pantalla Alumnos (HU-2.1, HU-2.2): lista + búsqueda + chips de categoría.
// La pantalla solo orquesta: filtro y estado vienen de `lib/domain`.
// El chip "Mostrar retirados" solo cambia qué pide la Action; los contadores
// siguen midiendo únicamente a los activos (spec 14).
interface Props {
  onOpenFicha: (alumnoId: number) => void;
}

export function Alumnos({ onOpenFicha }: Readonly<Props>) {
  const [retirados, setRetirados] = useState(false);
  const { alumnos, estado, recargar } = useAlumnos(retirados);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>(CATEGORIA_TODAS);

  const visibles = useMemo(
    () => filtraAlumnos(alumnos, { query, cat }),
    [alumnos, query, cat],
  );
  const activos = useMemo(() => soloActivos(visibles), [visibles]);
  const enMora = useMemo(() => activos.filter(estaEnMora).length, [activos]);
  const sinFecha = useMemo(() => sinFechaNacimiento(activos).length, [activos]);

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }

  return (
    <div style={{ display: 'grid', gap: 12, padding: '14px 16px 0' }}>
      <BuscadorAlumnos value={query} onChange={setQuery} />
      <ChipsCategoria value={cat} onChange={setCat} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <ResumenAlumnos
          total={activos.length}
          enMora={enMora}
          sinFecha={sinFecha}
        />
        <ChipRetirados activo={retirados} onChange={setRetirados} />
      </div>

      {visibles.length === 0 ? (
        <SinResultados />
      ) : (
        <div
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {visibles.map((a, i) => (
            <div
              key={a.id}
              style={{
                borderTop: i ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <FilaAlumno alumno={a} onOpen={() => onOpenFicha(a.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
