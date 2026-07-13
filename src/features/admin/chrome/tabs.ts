import type { IconName } from './Icon';

// Secciones de la navegación por rol. El admin conserva sus 4 tabs + FAB;
// el entrenador tiene tabs propias sin FAB (spec 09). `mas` es compartida.
export type TabId =
  | 'dashboard'
  | 'alumnos'
  | 'cartera'
  | 'mas'
  | 'entrenos'
  | 'plantel';

export interface TabDef {
  id: TabId;
  icon: IconName;
  label: string;
}

export const TABS_ADMIN: readonly TabDef[] = [
  { id: 'dashboard', icon: 'layout-dashboard', label: 'Inicio' },
  { id: 'alumnos', icon: 'users', label: 'Alumnos' },
  { id: 'cartera', icon: 'wallet', label: 'Cartera' },
  { id: 'mas', icon: 'grid-3x3', label: 'Más' },
] as const;

// "Alumnos" del entrenador es su plantel (solo sus categorías).
export const TABS_ENTRENADOR: readonly TabDef[] = [
  { id: 'entrenos', icon: 'calendar-days', label: 'Entrenos' },
  { id: 'plantel', icon: 'users', label: 'Alumnos' },
  { id: 'mas', icon: 'grid-3x3', label: 'Más' },
] as const;
