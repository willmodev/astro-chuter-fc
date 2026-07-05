// Contadores de la lista, coherentes con el filtro activo (los calcula
// la pantalla con las reglas de dominio).
interface Props {
  total: number;
  enMora: number;
}

export function ResumenAlumnos({ total, enMora }: Readonly<Props>) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: 12.5,
        fontWeight: 600,
        color: 'var(--text-muted)',
      }}
    >
      <span style={{ color: 'var(--text-strong)' }}>
        {total} {total === 1 ? 'alumno' : 'alumnos'}
      </span>
      {' · '}
      <span style={{ color: enMora > 0 ? 'var(--error-deep)' : undefined }}>
        {enMora} en mora
      </span>
    </p>
  );
}
