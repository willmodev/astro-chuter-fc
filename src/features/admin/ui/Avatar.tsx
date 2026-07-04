import type { CSSProperties } from 'react';

// Avatar de jugador/formador. Sin foto, cae a iniciales sobre navy.
// `ring` dibuja el aro dorado (usado para marcar morosos).
interface Props {
  name: string;
  src?: string | null;
  size?: number;
  ring?: boolean;
  style?: CSSProperties;
}

export function Avatar({ name, src = null, size = 40, ring = false, style }: Props) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        overflow: 'hidden',
        background: src ? 'var(--neutral-200)' : 'var(--brand-navy)',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: Math.max(11, Math.round(size * 0.36)),
        boxShadow: ring
          ? '0 0 0 2px var(--surface-card), 0 0 0 4px var(--brand-gold)'
          : 'none',
        ...style,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials || '?'
      )}
    </span>
  );
}
