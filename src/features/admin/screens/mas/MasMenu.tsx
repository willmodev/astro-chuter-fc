import { Users } from 'lucide-react';

import { Card } from '../../ui/Card';
import { useLogout } from './useLogout';

interface Props {
  userName: string;
  role: 'admin' | 'entrenador';
  onOpenEquipo: () => void;
}

const ROL_LABEL: Record<Props['role'], string> = {
  admin: 'Administrador',
  entrenador: 'Entrenador',
};

export function MasMenu({ userName, role, onOpenEquipo }: Readonly<Props>) {
  const { saliendo, cerrarSesion } = useLogout();

  return (
    <div style={{ display: 'grid', gap: 16, padding: '14px 16px 0' }}>
      <Card>
        <div style={{ display: 'grid', gap: 4 }}>
          <span className="eyebrow">Sesión activa</span>
          <strong style={{ fontSize: 17, color: 'var(--text-strong)' }}>
            {userName || 'Usuario'}
          </strong>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {ROL_LABEL[role]}
          </span>
        </div>
      </Card>

      {role === 'admin' && (
        <button
          type="button"
          onClick={onOpenEquipo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 56,
            padding: '0 18px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--text-strong)',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Users size={20} strokeWidth={1.75} color="var(--brand-navy)" />
          <span style={{ flex: 1 }}>Equipo</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            Gestionar usuarios
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => void cerrarSesion()}
        disabled={saliendo}
        style={{
          height: 48,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--error)',
          background: 'var(--error-soft)',
          color: 'var(--error-deep)',
          fontSize: 15,
          fontWeight: 600,
          cursor: saliendo ? 'progress' : 'pointer',
          opacity: saliendo ? 0.65 : 1,
        }}
      >
        {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
