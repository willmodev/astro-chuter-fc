import { listarCategorias } from '@/lib/domain/categoria';
import {
  ESTADO_UNIFORME_META,
  ORDEN_ESTADO_UNIFORME,
} from '@/lib/domain/uniformes';
import type { OrdenUniformes } from '@/lib/db/repos/uniformes';
import type { EstadoKit, TipoKit } from '@/lib/domain/uniformes';

import { SelectFiltro } from '../../ui/SelectFiltro';

import { BuscadorKits } from './BuscadorKits';

import type { OpcionFiltro } from '../../ui/SelectFiltro';

// Buscador + los tres desplegables (Kit · Estado · Categoría) + el de orden.
// Solo presenta: el filtrado real ocurre en SQL (spec 18).
interface Props {
  query: string;
  onQuery: (valor: string) => void;
  kit: TipoKit | null;
  onKit: (valor: TipoKit | null) => void;
  estado: EstadoKit | null;
  onEstado: (valor: EstadoKit | null) => void;
  cat: string | null;
  onCat: (valor: string | null) => void;
  orden: OrdenUniformes;
  onOrden: (valor: OrdenUniformes) => void;
  conteos: Record<EstadoKit, number>;
}

const OPCIONES_KIT: readonly OpcionFiltro[] = [
  { valor: '', label: 'Todos' },
  { valor: 'AZUL', label: 'Azul' },
  { valor: 'ORO', label: 'Oro' },
];

const OPCIONES_ORDEN: readonly OpcionFiltro[] = [
  { valor: 'prioridad', label: 'Prioridad' },
  { valor: 'nombre', label: 'Nombre' },
  { valor: 'numero', label: 'Número' },
];

const OPCIONES_CAT: readonly OpcionFiltro[] = [
  { valor: '', label: 'Todas' },
  ...listarCategorias().map((c) => ({
    valor: c.etiqueta,
    label: c.etiqueta,
  })),
];

const kitDe = (valor: string): TipoKit | null =>
  valor === 'AZUL' || valor === 'ORO' ? valor : null;

const estadoDe = (valor: string): EstadoKit | null =>
  ORDEN_ESTADO_UNIFORME.find((e) => e === valor) ?? null;

const ordenDe = (valor: string): OrdenUniformes =>
  valor === 'nombre' || valor === 'numero' ? valor : 'prioridad';

const textoDe = (valor: string): string | null => (valor === '' ? null : valor);

function opcionesEstado(
  conteos: Record<EstadoKit, number>,
): readonly OpcionFiltro[] {
  return [
    { valor: '', label: 'Todos' },
    ...ORDEN_ESTADO_UNIFORME.map((e) => ({
      valor: e,
      label: `${ESTADO_UNIFORME_META[e].label} (${String(conteos[e])})`,
    })),
  ];
}

export function FiltrosUniformes({
  query,
  onQuery,
  kit,
  onKit,
  estado,
  onEstado,
  cat,
  onCat,
  orden,
  onOrden,
  conteos,
}: Readonly<Props>) {
  return (
    <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
      <BuscadorKits value={query} onChange={onQuery} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 10,
          minWidth: 0,
        }}
      >
        <SelectFiltro
          label="Kit"
          value={kit ?? ''}
          onChange={(v) => {
            onKit(kitDe(v));
          }}
          opciones={OPCIONES_KIT}
        />
        <SelectFiltro
          label="Estado"
          value={estado ?? ''}
          onChange={(v) => {
            onEstado(estadoDe(v));
          }}
          opciones={opcionesEstado(conteos)}
        />
        <SelectFiltro
          label="Categoría"
          value={cat ?? ''}
          onChange={(v) => {
            onCat(textoDe(v));
          }}
          opciones={OPCIONES_CAT}
        />
        <SelectFiltro
          label="Orden"
          value={orden}
          onChange={(v) => {
            onOrden(ordenDe(v));
          }}
          opciones={OPCIONES_ORDEN}
        />
      </div>
    </div>
  );
}
