import { Icon } from './Icon';
import type { TabDef, TabId } from './tabs';

// Navegación responsive: en mobile es tab-bar inferior (con FAB dorado
// central solo si hay `onAction`); en desktop (≥1024px) muta a sidebar
// lateral fija. Ambas variantes se renderizan y `admin.css` decide cuál
// se muestra por ancho. Las tabs las decide el rol (spec 09).
interface Props {
  tabs: readonly TabDef[];
  active: TabId;
  onTab: (id: TabId) => void;
  onAction?: () => void;
}

export function AdminNav({ tabs, active, onTab, onAction }: Readonly<Props>) {
  return (
    <>
      <Sidebar tabs={tabs} active={active} onTab={onTab} />
      <TabBar tabs={tabs} active={active} onTab={onTab} onAction={onAction} />
    </>
  );
}

function Sidebar({ tabs, active, onTab }: Readonly<Omit<Props, 'onAction'>>) {
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
        {tabs.map((t) => {
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

function TabBar({ tabs, active, onTab, onAction }: Readonly<Props>) {
  const item = (t: TabDef) => {
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
  // Con FAB, las tabs se parten en dos mitades y el hueco central lo ocupa el
  // botón flotante; sin FAB (entrenador) se reparten parejas (flex: 1).
  const mitad = Math.ceil(tabs.length / 2);
  return (
    <nav className="admin-tabbar">
      {(onAction ? tabs.slice(0, mitad) : tabs).map(item)}
      {onAction && (
        <>
          <div style={{ width: 64, flexShrink: 0 }} />
          {tabs.slice(mitad).map(item)}
          <button onClick={onAction} aria-label="Acción rápida" className="admin-tabbar__fab">
            <Icon name="plus" size={28} strokeWidth={2.4} />
          </button>
        </>
      )}
    </nav>
  );
}
