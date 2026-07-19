// Contadores del kit seleccionado en el tab Numeración: entregados y los que
// aún faltan por entregar de ese kit (universo N por kit).
interface Props {
  entregados: number;
  pendientes: number;
}

interface Tile {
  label: string;
  valor: number;
  tone: string;
}

export function ContadoresKit({ entregados, pendientes }: Readonly<Props>) {
  const tiles: Tile[] = [
    { label: 'Entregados', valor: entregados, tone: 'var(--success-deep)' },
    { label: 'Por entregar', valor: pendientes, tone: 'var(--text-strong)' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            flex: 1,
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
            {t.label}
          </span>
          <strong
            style={{ display: 'block', fontSize: 24, color: t.tone, lineHeight: 1.1 }}
          >
            {t.valor}
          </strong>
        </div>
      ))}
    </div>
  );
}
