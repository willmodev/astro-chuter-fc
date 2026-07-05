import { useState, type FormEvent } from 'react';

import { LoginField } from './LoginField';
import { useLogin } from './useLogin';

interface Props {
  next: string;
}

export function LoginScreen({ next }: Readonly<Props>) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { estado, error, ingresar } = useLogin(next);
  const enviando = estado === 'enviando';

  function onSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    void ingresar(email.trim(), password);
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={onSubmit} noValidate>
        <div className="admin-login__brand">
          <img src="/images/chuter-logo.svg" alt="Chuter FC" width={56} height={56} />
          <div>
            <div className="font-display admin-login__title">Chuter FC</div>
            <div className="eyebrow" style={{ color: 'var(--accent-deep)' }}>
              Administración
            </div>
          </div>
        </div>

        <p className="admin-login__lead">
          Ingresá con tu cuenta para gestionar el club.
        </p>

        {error && (
          <div role="alert" className="admin-login__error">
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 14 }}>
          <LoginField
            id="email"
            label="Correo"
            type="email"
            value={email}
            autoComplete="username"
            disabled={enviando}
            onChange={setEmail}
          />
          <LoginField
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            autoComplete="current-password"
            disabled={enviando}
            onChange={setPassword}
          />
        </div>

        <button type="submit" className="admin-login__submit" disabled={enviando}>
          {enviando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
