import {
  ArrowLeft,
  Banknote,
  Bell,
  ChevronRight,
  CircleCheck,
  Footprints,
  Gift,
  Grid3x3,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Table2,
  TriangleAlert,
  UserPlus,
  Users,
  Wallet,
  X,
  type LucideProps,
} from 'lucide-react';

// Registro tipado kebab-case → componente lucide-react. Reemplaza el
// hack CDN `data-lucide` del prototipo. Solo se importan los iconos que
// la app usa hoy → tree-shakeable. Crecerá al portar nuevas pantallas.
const ICONS = {
  'arrow-left': ArrowLeft,
  banknote: Banknote,
  bell: Bell,
  'chevron-right': ChevronRight,
  'circle-check': CircleCheck,
  footprints: Footprints,
  gift: Gift,
  'grid-3x3': Grid3x3,
  landmark: Landmark,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'message-circle': MessageCircle,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  'table-2': Table2,
  'triangle-alert': TriangleAlert,
  'user-plus': UserPlus,
  users: Users,
  wallet: Wallet,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;

interface Props extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, ...rest }: Readonly<Props>) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={strokeWidth} {...rest} />;
}
