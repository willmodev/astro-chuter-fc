import {
  ArrowLeft,
  Bell,
  CircleCheck,
  Footprints,
  Gift,
  Grid3x3,
  LayoutDashboard,
  MessageCircle,
  Plus,
  TriangleAlert,
  Users,
  Wallet,
  type LucideProps,
} from 'lucide-react';

// Registro tipado kebab-case → componente lucide-react. Reemplaza el
// hack CDN `data-lucide` del prototipo. Solo se importan los iconos que
// la app usa hoy → tree-shakeable. Crecerá al portar nuevas pantallas.
const ICONS = {
  'arrow-left': ArrowLeft,
  bell: Bell,
  'circle-check': CircleCheck,
  footprints: Footprints,
  gift: Gift,
  'grid-3x3': Grid3x3,
  'layout-dashboard': LayoutDashboard,
  'message-circle': MessageCircle,
  plus: Plus,
  'triangle-alert': TriangleAlert,
  users: Users,
  wallet: Wallet,
} as const;

export type IconName = keyof typeof ICONS;

interface Props extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, size = 20, strokeWidth = 1.75, ...rest }: Readonly<Props>) {
  const Glyph = ICONS[name];
  return <Glyph size={size} strokeWidth={strokeWidth} {...rest} />;
}
