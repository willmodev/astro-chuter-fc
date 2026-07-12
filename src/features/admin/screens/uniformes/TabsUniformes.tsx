// Selector segmentado de la pantalla Uniformes: Estado / Numeración (spec 08).
export type TabUniformes = 'estado' | 'numeracion';

interface Props {
  tab: TabUniformes;
  onTab: (tab: TabUniformes) => void;
}

const TABS: readonly { id: TabUniformes; label: string }[] = [
  { id: 'estado', label: 'Estado' },
  { id: 'numeracion', label: 'Numeración' },
];

export function TabsUniformes({ tab, onTab }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 4,
        padding: 4,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {TABS.map((t) => {
        const activa = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onTab(t.id)}
            aria-pressed={activa}
            style={{
              height: 36,
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activa ? 'var(--surface-card)' : 'transparent',
              boxShadow: activa ? 'var(--shadow-sm)' : 'none',
              color: activa ? 'var(--brand-navy)' : 'var(--text-muted)',
              fontSize: 13,
              fontWeight: activa ? 700 : 600,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
