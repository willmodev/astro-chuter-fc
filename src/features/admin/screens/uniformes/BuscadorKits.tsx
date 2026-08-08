import { Icon } from '../../chrome/Icon';

// Campo de búsqueda de la pantalla Uniformes: matchea nombre o número de
// camiseta. El filtrado real ocurre en SQL; aquí solo se captura el texto.
interface Props {
  value: string;
  onChange: (valor: string) => void;
}

const ETIQUETA = 'Buscar por nombre o número';

export function BuscadorKits({ value, onChange }: Readonly<Props>) {
  return (
    <div style={{ position: 'relative' }}>
      <span
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}
      >
        <Icon name="search" size={18} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        placeholder={ETIQUETA}
        aria-label={ETIQUETA}
        style={{
          width: '100%',
          height: 46,
          boxSizing: 'border-box',
          padding: '0 42px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          boxShadow: 'var(--shadow-sm)',
          fontFamily: 'var(--font-sans)',
          fontSize: 14.5,
          color: 'var(--text-strong)',
        }}
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => {
            onChange('');
          }}
          aria-label="Limpiar búsqueda"
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--surface-sunken)',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}
