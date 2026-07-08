export type SegmentoCartera = 'todos' | 'mora';

// Segmento Todos / En mora (HU-3.3): filtra la lista y ajusta los contadores;
// se combina con el toggle de vista. "Con abono" sigue `Won't`.
interface Props {
  segmento: SegmentoCartera;
  onChange: (segmento: SegmentoCartera) => void;
  total: number;
  enMora: number;
}

export function SegmentoFiltro({ segmento, onChange, total, enMora }: Readonly<Props>) {
  const opciones: { id: SegmentoCartera; label: string; count: number }[] = [
    { id: 'todos', label: 'Todos', count: total },
    { id: 'mora', label: 'En mora', count: enMora },
  ];

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {opciones.map((op) => {
        const activo = segmento === op.id;
        return (
          <button
            key={op.id}
            type="button"
            onClick={() => onChange(op.id)}
            aria-pressed={activo}
            style={{
              flex: 1,
              height: 38,
              borderRadius: 'var(--radius-pill)',
              border: activo ? 'none' : '1px solid var(--border-subtle)',
              background: activo ? 'var(--brand-navy)' : 'var(--surface-card)',
              color: activo ? '#fff' : 'var(--text-body)',
              fontSize: 13,
              fontWeight: activo ? 700 : 600,
              cursor: 'pointer',
            }}
          >
            {op.label} ({op.count})
          </button>
        );
      })}
    </div>
  );
}
