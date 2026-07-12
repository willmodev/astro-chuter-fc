import { Card } from '../../ui/Card';
import { BotonMenu } from './BotonMenu';
import { useLogout } from './useLogout';

interface Props {
  userName: string;
  role: 'admin' | 'entrenador';
  onOpenEquipo: () => void;
  onOpenUniformes: () => void;
}

const ROL_LABEL: Record<Props['role'], string> = {
  admin: 'Administrador',
  entrenador: 'Entrenador',
};

export function MasMenu({
  userName,
  role,
  onOpenEquipo,
  onOpenUniformes,
}: Readonly<Props>) {
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
        <BotonMenu
          icon="users"
          label="Equipo"
          hint="Gestionar usuarios"
          onClick={onOpenEquipo}
        />
      )}

      <BotonMenu
        icon="shirt"
        label="Uniformes"
        hint="Control de kits"
        onClick={onOpenUniformes}
      />

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
