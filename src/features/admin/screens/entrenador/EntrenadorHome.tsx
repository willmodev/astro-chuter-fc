import { useLogout } from '../mas/useLogout';

interface Props {
  userName: string;
}

// Un entrenador aún no tiene su app (listas, entrenamientos): eso va en otro
// spec. Por ahora ve un placeholder con opción de cerrar sesión.
export function EntrenadorHome({ userName }: Readonly<Props>) {
  const { saliendo, cerrarSesion } = useLogout();

  return (
    <div className="admin-login">
      <div className="admin-login__card" style={{ textAlign: 'center' }}>
        <div style={{ display: 'grid', gap: 4, placeItems: 'center' }}>
          <img src="/images/chuter-logo.svg" alt="Chuter FC" width={56} height={56} />
          <div className="font-display admin-login__title" style={{ marginTop: 8 }}>
            Chuter FC
          </div>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <span className="eyebrow" style={{ color: 'var(--accent-deep)' }}>
            Hola{userName ? `, ${userName}` : ''}
          </span>
          <strong style={{ fontSize: 18, color: 'var(--text-strong)' }}>
            Tu panel está en camino
          </strong>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Muy pronto vas a poder ver tus categorías, listas y entrenamientos
            desde acá.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void cerrarSesion()}
          disabled={saliendo}
          className="admin-login__submit"
          style={{ background: 'var(--brand-navy)' }}
        >
          {saliendo ? 'Cerrando…' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}
