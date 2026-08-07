// Selector segmentado de las 3 tabs de la Ficha del admin.
export type TabFicha = 'pagos' | 'uniforme' | 'acudiente';

interface Props {
  tab: TabFicha;
  onTab: (tab: TabFicha) => void;
}

const LABELS: Record<TabFicha, string> = {
  pagos: 'Pagos',
  uniforme: 'Uniforme',
  acudiente: 'Acudiente',
};

const TABS: readonly TabFicha[] = ['pagos', 'uniforme', 'acudiente'];

export function TabsFicha({ tab, onTab }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${String(TABS.length)}, 1fr)`,
        gap: 4,
        padding: 4,
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {TABS.map((id) => {
        const activa = tab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => {
              onTab(id);
            }}
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
            {LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
