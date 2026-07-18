import { useMemo, useState } from 'react';

import { CATEGORIA_TODAS, filtraAlumnos } from '@/lib/domain/alumnos';
import { estaEnMora } from '@/lib/domain/cartera';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useAlumnos } from '../../hooks/useAlumnos';
import { BuscadorAlumnos } from './BuscadorAlumnos';
import { ChipsCategoria } from './ChipsCategoria';
import { FilaAlumno } from './FilaAlumno';
import { ResumenAlumnos } from './ResumenAlumnos';
import { SinResultados } from './SinResultados';

// Pantalla Alumnos (HU-2.1, HU-2.2): lista + búsqueda + chips de categoría.
// La pantalla solo orquesta: filtro y estado vienen de `lib/domain`.
interface Props {
  onOpenFicha: (alumnoId: number) => void;
}

export function Alumnos({ onOpenFicha }: Readonly<Props>) {
  const { alumnos, estado, recargar } = useAlumnos();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>(CATEGORIA_TODAS);

  const visibles = useMemo(
    () => filtraAlumnos(alumnos, { query, cat }),
    [alumnos, query, cat],
  );
  const enMora = useMemo(() => visibles.filter(estaEnMora).length, [visibles]);

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }

  return (
    <div style={{ display: 'grid', gap: 12, padding: '14px 16px 0' }}>
      <BuscadorAlumnos value={query} onChange={setQuery} />
      <ChipsCategoria value={cat} onChange={setCat} />
      <ResumenAlumnos total={visibles.length} enMora={enMora} />

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
              style={{ borderTop: i ? '1px solid var(--border-subtle)' : 'none' }}
            >
              <FilaAlumno alumno={a} onOpen={() => onOpenFicha(a.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
