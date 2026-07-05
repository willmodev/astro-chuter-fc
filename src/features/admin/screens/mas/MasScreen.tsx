import { useState } from 'react';

import { EquipoScreen } from '../equipo/EquipoScreen';
import { MasMenu } from './MasMenu';

interface Props {
  userName: string;
  role: 'admin' | 'entrenador';
}

// Router interno de la tab Más: el menú y, para admins, la pantalla Equipo.
export function MasScreen({ userName, role }: Readonly<Props>) {
  const [sub, setSub] = useState<'menu' | 'equipo'>('menu');

  if (sub === 'equipo' && role === 'admin') {
    return <EquipoScreen onBack={() => setSub('menu')} />;
  }

  return (
    <MasMenu
      userName={userName}
      role={role}
      onOpenEquipo={() => setSub('equipo')}
    />
  );
}
