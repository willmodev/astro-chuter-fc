import { useId } from 'react';

// Desplegable de filtro con `<select>` nativo: en móvil abre la rueda del
// sistema operativo y no agrega JavaScript. Primitivo presentacional.
export interface OpcionFiltro {
  valor: string;
  label: string;
}

interface Props<T extends string> {
  label: string;
  value: T;
  onChange: (valor: T) => void;
  opciones: readonly OpcionFiltro[];
}

export function SelectFiltro<T extends string>({
  label,
  value,
  onChange,
  opciones,
}: Readonly<Props<T>>) {
  const id = useId();

  return (
    <div style={{ display: 'grid', gap: 6, minWidth: 0 }}>
      <label className="eyebrow" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value as T);
        }}
        style={{
          height: 44,
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          padding: '0 10px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-card)',
          color: 'var(--text-strong)',
          fontSize: 14.5,
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
