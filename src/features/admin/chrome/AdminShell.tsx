import type { ReactNode } from 'react';

import { AdminNav } from './AdminNav';
import { AppHeader } from './AppHeader';
import type { TabId } from './tabs';

// Shell adaptativo. Mobile: columna full-height (header sticky + main
// scrollable + tab-bar inferior). Desktop: grid `sidebar | contenido`,
// con el contenido limitado por `max-width` para no estirarse.
// El layout que cambia por viewport vive en `admin.css` (media queries);
// aquí solo se compone la estructura.
interface Props {
  active: TabId;
  onTab: (id: TabId) => void;
  onAction: () => void;
  title: string;
  eyebrow?: string;
  right?: ReactNode;
  children: ReactNode;
}

export function AdminShell({
  active,
  onTab,
  onAction,
  title,
  eyebrow,
  right,
  children,
}: Props) {
  return (
    <div className="admin-shell">
      <AdminNav active={active} onTab={onTab} onAction={onAction} />
      <div className="admin-content">
        <AppHeader title={title} eyebrow={eyebrow} right={right} />
        <main className="admin-main">
          <div className="admin-main__inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
