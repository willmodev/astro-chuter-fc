import type { TipoKit } from '@/lib/domain/uniformes';

// Chip del kit (AZUL/ORO) con su punto de color. Reutilizado en las filas, la
// ficha y la pantalla de gestión para que el kit se lea de un vistazo.
const COLOR: Record<TipoKit, string> = {
  AZUL: 'var(--brand-blue)',
  ORO: 'var(--brand-gold-deep)',
};
const LABEL: Record<TipoKit, string> = { AZUL: 'Azul', ORO: 'Oro' };

interface Props {
  kit: TipoKit;
}

export function EtiquetaKit({ kit }: Readonly<Props>) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontWeight: 700,
        color: 'var(--text-strong)',
      }}
    >
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: COLOR[kit],
        }}
      />
      Kit {LABEL[kit]}
    </span>
  );
}
