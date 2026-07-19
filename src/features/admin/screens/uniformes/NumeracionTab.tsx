import { useState } from 'react';

import type { TipoKit } from '@/lib/domain/uniformes';

import { AlertaDuplicados } from './AlertaDuplicados';
import { ContadoresKit } from './ContadoresKit';
import { duplicadosDeKit, entregadasDeKit, type KitFila } from './filas';
import { FilaUniforme } from './FilaUniforme';
import { ToggleKit } from './ToggleKit';

// Tab Numeración (spec 12): toggle de kit AZUL/ORO, contadores, alerta de
// números repetidos y listado del kit ordenado por número. Solo orquesta.
interface Props {
  filas: KitFila[];
  onEntrega: (alumnoId: number) => void;
}

const KIT_LABEL: Record<TipoKit, string> = { AZUL: 'Azul', ORO: 'Oro' };

export function NumeracionTab({ filas, onEntrega }: Readonly<Props>) {
  const [kit, setKit] = useState<TipoKit>('AZUL');
  const entregadas = entregadasDeKit(filas, kit);
  const duplicados = duplicadosDeKit(filas, kit);
  const setDup = new Set(duplicados);
  const totalKit = filas.filter((f) => f.kit.kit === kit).length;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <ToggleKit kit={kit} onChange={setKit} />
      <ContadoresKit
        entregados={entregadas.length}
        pendientes={totalKit - entregadas.length}
      />
      <AlertaDuplicados numeros={duplicados} />

      <section style={{ display: 'grid', gap: 8 }}>
        <span className="eyebrow">Entregados · Kit {KIT_LABEL[kit]}</span>
        {entregadas.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Sin entregas en este kit.
          </p>
        ) : (
          entregadas.map((f) => (
            <FilaUniforme
              key={f.alumnoId}
              fila={f}
              duplicado={f.kit.numero !== null && setDup.has(f.kit.numero)}
              onAbrir={onEntrega}
            />
          ))
        )}
      </section>
    </div>
  );
}
