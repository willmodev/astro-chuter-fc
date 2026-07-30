// Contadores de la lista, coherentes con el filtro activo (los calcula
// la pantalla con las reglas de dominio). `sinFecha` (spec 15) señala a
// cuántos les falta la fecha de nacimiento: su categoría sale del año.
interface Props {
  total: number;
  enMora: number;
  sinFecha: number;
}

export function ResumenAlumnos({ total, enMora, sinFecha }: Readonly<Props>) {
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
      {sinFecha > 0 && (
        <>
          {' · '}
          <span
            style={{ color: '#946200' }}
            title="Su categoría se calcula por el año de nacimiento hasta completar la fecha"
          >
            {sinFecha} sin fecha de nacimiento
          </span>
        </>
      )}
    </p>
  );
}
