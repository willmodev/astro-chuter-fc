import { useState, type CSSProperties, type FormEvent } from 'react';

import { Sheet } from '../../chrome/Sheet';

interface Props {
  nombre: string;
  onClose: () => void;
  onReset: (password: string) => Promise<string | null>;
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

export function ResetPasswordSheet({ nombre, onClose, onReset }: Readonly<Props>) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo'>('idle');

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setEstado('enviando');
    setError(null);
    const fallo = await onReset(password);
    if (fallo) {
      setError(fallo);
      setEstado('idle');
      return;
    }
    setEstado('listo');
  }

  return (
    <Sheet title={`Resetear contraseña · ${nombre}`} onClose={onClose}>
      {estado === 'listo' ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--text-body)', margin: 0 }}>
            Contraseña actualizada. Comunicásela al usuario por un canal seguro;
            que la cambie pronto.
          </p>
          <button type="button" onClick={onClose} className="admin-login__submit">
            Entendido
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          {error && (
            <div className="admin-login__error" role="alert">
              {error}
            </div>
          )}
          <div>
            <label
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)', marginBottom: 5, display: 'block' }}
              htmlFor="rp-pass"
            >
              Nueva contraseña
            </label>
            <input
              id="rp-pass"
              type="text"
              style={field}
              value={password}
              required
              minLength={8}
              autoComplete="off"
              onChange={(e) => setPassword(e.target.value)}
              disabled={estado === 'enviando'}
            />
          </div>
          <button
            type="submit"
            className="admin-login__submit"
            disabled={estado === 'enviando'}
          >
            {estado === 'enviando' ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </Sheet>
  );
}
