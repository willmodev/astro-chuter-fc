import type { IconName } from './Icon';

// Las 4 secciones del back-office. Solo `dashboard` es real en este spec;
// el resto son placeholders "Próximamente" (otros specs).
export type TabId = 'dashboard' | 'alumnos' | 'cartera' | 'mas';

export interface TabDef {
  id: TabId;
  icon: IconName;
  label: string;
}

export const TABS: readonly TabDef[] = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Inicio' },
  { id: 'alumnos', icon: 'users', label: 'Alumnos' },
  { id: 'cartera', icon: 'wallet', label: 'Cartera' },
  { id: 'mas', icon: 'grid-3x3', label: 'Más' },
] as const;
