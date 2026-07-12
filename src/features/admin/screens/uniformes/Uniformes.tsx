import { useState } from 'react';

import type { TipoKit } from '@/lib/domain/uniformes';

import { AlertaDuplicados } from './AlertaDuplicados';
import { ContadoresKit } from './ContadoresKit';
import { FilaUniforme } from './FilaUniforme';
import { PorEntregar } from './PorEntregar';
import { ToggleKit } from './ToggleKit';
import { useUniformes } from './useUniformes';

// Pantalla Uniformes (HU-5.1, HU-5.2, HU-5.4): toggle de kit, contadores,
// alerta de números repetidos, listado del kit y sección "Por entregar".
// Solo orquesta; duplicados y derivaciones viven en dominio/hook.
interface Props {
  onEntrega: (alumnoId: number) => void;
}

const KIT_LABEL: Record<TipoKit, string> = { AZUL: 'Azul', DORADO: 'Dorado' };

export function Uniformes({ onEntrega }: Readonly<Props>) {
  const [kit, setKit] = useState<TipoKit>('AZUL');
  const data = useUniformes(kit);
  const duplicados = new Set(data.duplicados);

  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 24px' }}>
      <ToggleKit kit={kit} onChange={setKit} />
      <ContadoresKit
        entregados={data.totalEntregados}
        pendientes={data.totalPendientes}
      />
      <AlertaDuplicados numeros={data.duplicados} />

      <section style={{ display: 'grid', gap: 8 }}>
        <span className="eyebrow">Entregados · Kit {KIT_LABEL[kit]}</span>
        {data.entregados.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            Sin entregas en este kit.
          </p>
        ) : (
          data.entregados.map((a) => (
            <FilaUniforme
              key={a.id}
              alumno={a}
              duplicado={a.numero !== null && duplicados.has(a.numero)}
              onAbrir={onEntrega}
            />
          ))
        )}
      </section>

      <section style={{ display: 'grid', gap: 8 }}>
        <span className="eyebrow">Por entregar</span>
        <PorEntregar alumnos={data.porEntregar} onAsignar={onEntrega} />
      </section>
    </div>
  );
}
