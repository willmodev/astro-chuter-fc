import { Icon } from './Icon';
import { TABS, type TabId } from './tabs';

// Navegación responsive: en mobile es tab-bar inferior con FAB dorado
// central; en desktop (≥1024px) muta a sidebar lateral fija. Ambas
// variantes se renderizan y `admin.css` decide cuál se muestra por ancho.
interface Props {
  active: TabId;
  onTab: (id: TabId) => void;
  onAction: () => void;
}

export function AdminNav({ active, onTab, onAction }: Props) {
  return (
    <>
      <Sidebar active={active} onTab={onTab} />
      <TabBar active={active} onTab={onTab} onAction={onAction} />
    </>
  );
}

function Sidebar({ active, onTab }: Omit<Props, 'onAction'>) {
  return (
    <aside className="admin-sidebar bg-pitch-lines">
      <div className="admin-sidebar__brand">
        <img src="/images/chuter-logo.svg" alt="Chuter FC" width={40} height={40} />
        <div>
          <div className="font-display" style={{ color: '#fff', fontSize: 21, lineHeight: 0.9 }}>
            Chuter FC
          </div>
          <div className="admin-sidebar__tag">Administración</div>
        </div>
      </div>
      <nav className="admin-sidebar__nav">
        {TABS.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTab(t.id)}
              className="admin-sidebar__link"
              data-active={on}
            >
              <Icon name={t.icon} size={18} />
              <span style={{ flex: 1 }}>{t.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function TabBar({ active, onTab, onAction }: Props) {
  const item = (t: (typeof TABS)[number]) => {
    const on = active === t.id;
    return (
      <button
        key={t.id}
        onClick={() => onTab(t.id)}
        className="admin-tabbar__item"
        data-active={on}
      >
        <Icon name={t.icon} size={23} />
        <span style={{ fontSize: 10, fontWeight: on ? 800 : 600, letterSpacing: '.01em' }}>
          {t.label}
        </span>
      </button>
    );
  };
  return (
    <nav className="admin-tabbar">
      {item(TABS[0])}
      {item(TABS[1])}
      <div style={{ width: 64, flexShrink: 0 }} />
      {item(TABS[2])}
      {item(TABS[3])}
      <button onClick={onAction} aria-label="Acción rápida" className="admin-tabbar__fab">
        <Icon name="plus" size={28} strokeWidth={2.4} />
      </button>
    </nav>
  );
}
