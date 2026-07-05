import { Icon } from '../../chrome/Icon';

// Estado vacío de la lista cuando búsqueda + chips no dan coincidencias.
export function SinResultados() {
  return (
    <div
      role="status"
      style={{
        display: 'grid',
        placeItems: 'center',
        minHeight: 200,
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          <Icon name="search" size={28} />
        </span>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-strong)',
          }}
        >
          Sin resultados
        </p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          Prueba con otro nombre o cambia la categoría.
        </p>
      </div>
    </div>
  );
}
