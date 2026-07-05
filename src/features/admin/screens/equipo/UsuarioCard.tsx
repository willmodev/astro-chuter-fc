import type { CSSProperties } from 'react';

import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import type { UsuarioRow } from './types';

interface Props {
  usuario: UsuarioRow;
  onToggle: () => void;
  onReset: () => void;
  ocupado: boolean;
}

const accion = (color: string): CSSProperties => ({
  height: 34,
  padding: '0 12px',
  borderRadius: 'var(--radius-md)',
  border: `1px solid ${color}`,
  background: 'transparent',
  color,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
});

export function UsuarioCard({ usuario, onToggle, onReset, ocupado }: Readonly<Props>) {
  const { name, email, role, activo, cats } = usuario;

  return (
    <Card>
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: 15, color: 'var(--text-strong)' }}>{name}</strong>
            <div
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {email}
            </div>
          </div>
          <Badge tone={role === 'admin' ? 'navy' : 'info'}>
            {role === 'admin' ? 'Admin' : 'Entrenador'}
          </Badge>
          <Badge tone={activo ? 'paid' : 'pending'} dot>
            {activo ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        {cats.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {cats.map((c) => (
              <Badge key={c} tone="neutral">
                {c}
              </Badge>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onToggle}
            disabled={ocupado}
            style={accion(activo ? 'var(--error-deep)' : 'var(--success-deep)')}
          >
            {activo ? 'Desactivar' : 'Reactivar'}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={ocupado}
            style={accion('var(--brand-navy)')}
          >
            Resetear contraseña
          </button>
        </div>
      </div>
    </Card>
  );
}
