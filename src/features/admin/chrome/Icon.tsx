import {
  ArrowLeft,
  Banknote,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  CirclePlus,
  Flame,
  Footprints,
  Gift,
  Grid3x3,
  ImagePlus,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Shirt,
  Table2,
  Wind,
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
  'calendar-days': CalendarDays,
  check: Check,
  'chevron-right': ChevronRight,
  'circle-check': CircleCheck,
  'circle-plus': CirclePlus,
  flame: Flame,
  footprints: Footprints,
  gift: Gift,
  'grid-3x3': Grid3x3,
  'image-plus': ImagePlus,
  landmark: Landmark,
  'layout-dashboard': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'map-pin': MapPin,
  'message-circle': MessageCircle,
  pencil: Pencil,
  plus: Plus,
  search: Search,
  shirt: Shirt,
  'table-2': Table2,
  'triangle-alert': TriangleAlert,
  'user-plus': UserPlus,
  users: Users,
  wallet: Wallet,
  wind: Wind,
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
