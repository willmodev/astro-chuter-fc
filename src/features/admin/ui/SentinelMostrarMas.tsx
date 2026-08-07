import { Icon } from '../chrome/Icon';

import type { RefObject } from 'react';

// Centinela del paginado: lo observa un IntersectionObserver, pero además
// lleva botón real — el scroll infinito puro es inaccesible por teclado.
interface Props {
  sentinelRef: RefObject<HTMLDivElement | null>;
  hayMas: boolean;
  visibles: number;
  total: number;
  paso?: number;
  onMostrarMas: () => void;
}

export function SentinelMostrarMas({
  sentinelRef,
  hayMas,
  visibles,
  total,
  paso = 15,
  onMostrarMas,
}: Readonly<Props>) {
  if (!hayMas) return null;

  const restantes = total - visibles;
  const siguiente = Math.min(paso, restantes);

  return (
    <div
      ref={sentinelRef}
      style={{ display: 'grid', gap: 6, padding: '4px 0' }}
    >
      <button
        type="button"
        onClick={onMostrarMas}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          height: 44,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          color: 'var(--text-strong)',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Mostrar {siguiente} más
        <Icon name="chevron-down" size={17} />
      </button>
      <span
        aria-live="polite"
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          textAlign: 'center',
        }}
      >
        {visibles} de {total}
      </span>
    </div>
  );
}
