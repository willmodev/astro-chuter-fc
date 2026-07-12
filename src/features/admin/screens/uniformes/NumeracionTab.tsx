import { useState } from 'react';

import type { TipoKit } from '@/lib/domain/uniformes';

import { AlertaDuplicados } from './AlertaDuplicados';
import { ContadoresKit } from './ContadoresKit';
import { FilaUniforme } from './FilaUniforme';
import { ToggleKit } from './ToggleKit';
import { useUniformes } from './useUniformes';

// Tab Numeración (spec 08): toggle de kit, contadores, alerta de números
// repetidos y listado del kit ordenado por número. Ya sin sección "Por entregar"
// (la cubre el tab Estado). Solo orquesta; duplicados viven en dominio/hook.
interface Props {
  onEntrega: (alumnoId: number) => void;
}

const KIT_LABEL: Record<TipoKit, string> = { AZUL: 'Azul', DORADO: 'Dorado' };

export function NumeracionTab({ onEntrega }: Readonly<Props>) {
  const [kit, setKit] = useState<TipoKit>('AZUL');
  const data = useUniformes(kit);
  const duplicados = new Set(data.duplicados);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
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
    </div>
  );
}
