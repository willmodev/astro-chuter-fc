import { useState } from 'react';

import { EstadoCarga } from '../../chrome/EstadoCarga';
import { useUniformes } from '../../hooks/useUniformes';
import { aFilas } from './filas';
import { EstadoTab } from './EstadoTab';
import { NumeracionTab } from './NumeracionTab';
import { TabsUniformes, type TabUniformes } from './TabsUniformes';

// Pantalla Uniformes (spec 12): dos tabs sobre el universo de 2N kits — Estado
// (matriz 2×2 + lista por prioridad) y Numeración (por kit AZUL/ORO). Solo
// orquesta; los datos vienen de `uniformes.listar` y la derivación de `filas`.
interface Props {
  onEntrega: (alumnoId: number) => void;
}

export function Uniformes({ onEntrega }: Readonly<Props>) {
  const { alumnos, estado, recargar } = useUniformes();
  const [tab, setTab] = useState<TabUniformes>('estado');

  if (estado !== 'listo') {
    return <EstadoCarga estado={estado} onReintentar={recargar} />;
  }

  const filas = aFilas(alumnos);

  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 24px' }}>
      <TabsUniformes tab={tab} onTab={setTab} />
      {tab === 'estado' ? (
        <EstadoTab filas={filas} onAbrir={onEntrega} />
      ) : (
        <NumeracionTab filas={filas} onEntrega={onEntrega} />
      )}
    </div>
  );
}
