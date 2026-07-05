// Selector segmentado de las 3 tabs de la Ficha.
export type TabFicha = 'pagos' | 'uniforme' | 'acudiente';

interface Props {
  tab: TabFicha;
  onTab: (tab: TabFicha) => void;
}

const TABS: readonly { id: TabFicha; label: string }[] = [
  { id: 'pagos', label: 'Pagos' },
  { id: 'uniforme', label: 'Uniforme' },
  { id: 'acudiente', label: 'Acudiente' },
];

export function TabsFicha({ tab, onTab }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
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
