import { useLogout } from '../hooks/useLogout';

import { Icon } from './Icon';

// Pie de la barra lateral de desktop (HU-7.7): sesión activa + cierre.
// En mobile el sidebar es `display: none`, así que "Más" conserva el suyo.
interface Props {
  userName: string;
  role: 'admin' | 'entrenador';
}

const ROL_LABEL: Record<Props['role'], string> = {
  admin: 'Administrador',
  entrenador: 'Entrenador',
};

export function SidebarFooter({ userName, role }: Readonly<Props>) {
  const { saliendo, cerrarSesion } = useLogout();

  return (
    <div className="admin-sidebar__footer">
      <div className="admin-sidebar__user">
        <span className="admin-sidebar__user-name">
          {userName || 'Usuario'}
        </span>
        <span className="admin-sidebar__user-role">{ROL_LABEL[role]}</span>
      </div>
      <button
        type="button"
        className="admin-sidebar__logout"
        onClick={() => void cerrarSesion()}
        disabled={saliendo}
      >
        <Icon name="log-out" size={17} />
        <span>{saliendo ? 'Cerrando…' : 'Cerrar sesión'}</span>
      </button>
    </div>
  );
}
