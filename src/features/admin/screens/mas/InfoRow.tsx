import { Icon, type IconName } from '../../chrome/Icon';

// Fila de dato con icono, usada por la tarjeta del club y por "Más" del
// entrenador. Con `href` se vuelve enlace externo; sin él, texto plano.
interface Props {
  icon: IconName;
  title: string;
  sub: string;
  borde?: boolean;
  href?: string;
}

const FILA: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 13,
  padding: '13px 16px',
  color: 'inherit',
  textDecoration: 'none',
};

export function InfoRow({
  icon,
  title,
  sub,
  borde = false,
  href,
}: Readonly<Props>) {
  const contenido = (
    <>
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 'var(--radius-md)',
          background: 'var(--info-soft)',
          color: 'var(--brand-navy)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={19} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>
      </div>
      {href && (
        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <Icon name="chevron-right" size={18} />
        </span>
      )}
    </>
  );

  const estilo: React.CSSProperties = {
    ...FILA,
    borderTop: borde ? '1px solid var(--border-subtle)' : 'none',
  };

  if (!href) return <div style={estilo}>{contenido}</div>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={estilo}>
      {contenido}
    </a>
  );
}
