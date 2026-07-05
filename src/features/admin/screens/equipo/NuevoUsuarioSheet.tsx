import { useState, type CSSProperties, type FormEvent } from 'react';

import { Sheet } from '../../chrome/Sheet';
import type { NuevoUsuarioInput } from './types';

interface Props {
  onClose: () => void;
  onCrear: (input: NuevoUsuarioInput) => Promise<string | null>;
}

const field: CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 12px',
  fontSize: 15,
  fontFamily: 'var(--font-sans)',
  color: 'var(--text-strong)',
  background: 'var(--surface-sunken)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
};

const lbl: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-body)',
  marginBottom: 5,
  display: 'block',
};

export function NuevoUsuarioSheet({ onClose, onCrear }: Readonly<Props>) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'entrenador'>('entrenador');
  const [catsText, setCatsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    const cats =
      role === 'entrenador'
        ? catsText.split(',').map((c) => c.trim()).filter(Boolean)
        : [];
    const fallo = await onCrear({ name: name.trim(), email: email.trim(), password, role, cats });
    if (fallo) {
      setError(fallo);
      setEnviando(false);
      return;
    }
    onClose();
  }

  return (
    <Sheet title="Nuevo usuario" onClose={onClose}>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {error && (
          <div className="admin-login__error" role="alert">
            {error}
          </div>
        )}
        <div>
          <label style={lbl} htmlFor="nu-name">Nombre</label>
          <input id="nu-name" style={field} value={name} required minLength={2}
            onChange={(e) => setName(e.target.value)} disabled={enviando} />
        </div>
        <div>
          <label style={lbl} htmlFor="nu-email">Correo</label>
          <input id="nu-email" type="email" style={field} value={email} required
            autoComplete="off" onChange={(e) => setEmail(e.target.value)} disabled={enviando} />
        </div>
        <div>
          <label style={lbl} htmlFor="nu-pass">Contraseña inicial</label>
          <input id="nu-pass" type="text" style={field} value={password} required minLength={8}
            autoComplete="off" onChange={(e) => setPassword(e.target.value)} disabled={enviando} />
        </div>
        <div>
          <label style={lbl} htmlFor="nu-role">Rol</label>
          <select id="nu-role" style={field} value={role} disabled={enviando}
            onChange={(e) => setRole(e.target.value as 'admin' | 'entrenador')}>
            <option value="entrenador">Entrenador</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        {role === 'entrenador' && (
          <div>
            <label style={lbl} htmlFor="nu-cats">Categorías (ej. SUB 8, SUB 10)</label>
            <input id="nu-cats" style={field} value={catsText} placeholder="SUB 8, SUB 10"
              onChange={(e) => setCatsText(e.target.value)} disabled={enviando} />
          </div>
        )}
        <button type="submit" className="admin-login__submit" disabled={enviando}
          style={{ marginTop: 4 }}>
          {enviando ? 'Creando…' : 'Crear usuario'}
        </button>
      </form>
    </Sheet>
  );
}
