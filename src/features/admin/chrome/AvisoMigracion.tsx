import { Icon } from './Icon';

// Aviso de "migración en camino" (spec 11): las vistas de uniformes muestran
// esto para no mezclar el mock viejo con los alumnos reales, hasta el spec 12.
interface Props {
  titulo: string;
  detalle: string;
}

export function AvisoMigracion({ titulo, detalle }: Readonly<Props>) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 10,
        justifyItems: 'center',
        textAlign: 'center',
        padding: '40px 24px',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-subtle)',
        background: 'var(--surface-sunken)',
      }}
    >
      <span style={{ color: 'var(--brand-navy)' }}>
        <Icon name="shirt" size={30} />
      </span>
      <strong style={{ fontSize: 15, color: 'var(--text-strong)' }}>{titulo}</strong>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 320 }}>
        {detalle}
      </p>
    </div>
  );
}
