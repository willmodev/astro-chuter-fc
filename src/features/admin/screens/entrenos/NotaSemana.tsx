import type { Semana } from '@/lib/domain/entrenos';

import { Icon } from '../../chrome/Icon';

// Explica qué se puede hacer en la semana seleccionada cuando NO es la actual:
// hacia atrás se completa lo que quedó pendiente, hacia adelante solo se planea
// (la lista se habilita el día del entreno, `puedePasarLista`).
interface Props {
  semana: Semana;
}

function textoDe(offset: number): string | null {
  if (offset > 0)
    return 'Semana ya pasada: puedes completar la planeación y la lista que quedaron pendientes.';
  if (offset < 0)
    return 'Semana que aún no empieza: puedes dejar la planeación lista. La asistencia se habilita el día del entreno.';
  return null;
}

export function NotaSemana({ semana }: Readonly<Props>) {
  const texto = textoDe(semana.offset);
  if (texto === null) return null;

  return (
    <p
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        margin: 0,
        padding: '9px 12px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface-sunken)',
        border: '1px solid var(--border-subtle)',
        fontSize: 12.5,
        lineHeight: 1.45,
        color: 'var(--text-muted)',
      }}
    >
      <span style={{ flexShrink: 0, marginTop: 1 }}>
        <Icon name="info" size={15} />
      </span>
      {texto}
    </p>
  );
}
