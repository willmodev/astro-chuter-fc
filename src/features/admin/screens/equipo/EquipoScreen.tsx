import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';

import { NuevoUsuarioSheet } from './NuevoUsuarioSheet';
import { ResetPasswordSheet } from './ResetPasswordSheet';
import { UsuarioCard } from './UsuarioCard';
import { useEquipo } from './useEquipo';
import type { UsuarioRow } from './types';

interface Props {
  onBack: () => void;
}

type SheetState =
  | { tipo: 'nuevo' }
  | { tipo: 'reset'; usuario: UsuarioRow }
  | null;

export function EquipoScreen({ onBack }: Readonly<Props>) {
  const { usuarios, estado, crear, toggleActivo, resetPassword } = useEquipo();
  const [sheet, setSheet] = useState<SheetState>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function alTogglear(u: UsuarioRow): Promise<void> {
    setOcupado(u.id);
    setAviso(null);
    const fallo = await toggleActivo(u.id, !u.activo);
    if (fallo) setAviso(fallo);
    setOcupado(null);
  }

  return (
    <div style={{ display: 'grid', gap: 14, padding: '14px 16px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver"
          style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={19} />
        </button>
        <strong style={{ flex: 1, fontSize: 18, color: 'var(--text-strong)' }}>
          Equipo
        </strong>
        <button
          type="button"
          onClick={() => setSheet({ tipo: 'nuevo' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: 38,
            padding: '0 14px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--brand-navy)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={17} /> Nuevo
        </button>
      </div>

      {aviso && (
        <div className="admin-login__error" role="alert">
          {aviso}
        </div>
      )}

      {estado === 'cargando' && (
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando equipo…</p>
      )}
      {estado === 'error' && (
        <p style={{ color: 'var(--error-deep)', fontSize: 14 }}>
          No se pudo cargar el equipo.
        </p>
      )}

      {estado === 'listo' &&
        usuarios.map((u) => (
          <UsuarioCard
            key={u.id}
            usuario={u}
            ocupado={ocupado === u.id}
            onToggle={() => void alTogglear(u)}
            onReset={() => setSheet({ tipo: 'reset', usuario: u })}
          />
        ))}

      {sheet?.tipo === 'nuevo' && (
        <NuevoUsuarioSheet onClose={() => setSheet(null)} onCrear={crear} />
      )}
      {sheet?.tipo === 'reset' && (
        <ResetPasswordSheet
          nombre={sheet.usuario.name}
          onClose={() => setSheet(null)}
          onReset={(password) => resetPassword(sheet.usuario.id, password)}
        />
      )}
    </div>
  );
}
