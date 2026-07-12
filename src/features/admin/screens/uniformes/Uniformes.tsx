import { useState } from 'react';

import { EstadoTab } from './EstadoTab';
import { NumeracionTab } from './NumeracionTab';
import { TabsUniformes, type TabUniformes } from './TabsUniformes';

// Pantalla Uniformes (spec 08): dos tabs — Estado (matriz 2×2 + lista por
// prioridad) y Numeración (listado por kit). Solo orquesta.
interface Props {
  onEntrega: (alumnoId: number) => void;
}

export function Uniformes({ onEntrega }: Readonly<Props>) {
  const [tab, setTab] = useState<TabUniformes>('estado');

  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 24px' }}>
      <TabsUniformes tab={tab} onTab={setTab} />
      {tab === 'estado' ? (
        <EstadoTab onAbrir={onEntrega} />
      ) : (
        <NumeracionTab onEntrega={onEntrega} />
      )}
    </div>
  );
}
