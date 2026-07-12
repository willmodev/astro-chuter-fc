import { useState } from 'react';

// Acudiente con autocomplete sobre existentes (R4): elegir uno de la lista copia
// el nombre exacto y garantiza el vínculo de hermanos. Texto libre = acudiente nuevo.
interface Props {
  value: string;
  sugerencias: string[];
  onChange: (valor: string) => void;
  onElegir: (acu: string) => void;
  error?: string;
}

export function AutocompleteAcudiente({
  value,
  sugerencias,
  onChange,
  onElegir,
  error,
}: Readonly<Props>) {
  const [foco, setFoco] = useState(false);
  const abierto = foco && value.trim() !== '' && sugerencias.length > 0;

  return (
    <label style={{ display: 'grid', gap: 6, position: 'relative' }}>
      <span className="eyebrow">Acudiente</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFoco(true)}
        onBlur={() => setFoco(false)}
        placeholder="Nombre del acudiente"
        aria-invalid={error !== undefined}
        autoComplete="off"
        style={{
          height: 46,
          width: '100%',
          boxSizing: 'border-box',
          padding: '0 14px',
          borderRadius: 'var(--radius-md)',
          border: error
            ? '1px solid var(--error)'
            : '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          color: 'var(--text-strong)',
          fontSize: 15,
          fontFamily: 'var(--font-sans)',
          outline: 'none',
        }}
      />
      {abierto && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 5,
            margin: '4px 0 0',
            padding: 4,
            listStyle: 'none',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            boxShadow: 'var(--shadow-pop)',
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {sugerencias.map((acu) => (
            <li key={acu}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onElegir(acu);
                  setFoco(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {acu}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>
          {error}
        </span>
      )}
    </label>
  );
}
