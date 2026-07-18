// Campo de texto etiquetado y reutilizable: label + input con estado de error
// por campo. Primitivo presentacional, sin lógica de negocio.
interface Props {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  error?: string;
  inputMode?: 'text' | 'numeric' | 'tel';
  type?: 'text' | 'date';
  opcional?: boolean;
  maxLength?: number;
}

export function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  error,
  inputMode = 'text',
  type = 'text',
  opcional = false,
  maxLength,
}: Readonly<Props>) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span className="eyebrow">{label}</span>
        {opcional && (
          <span style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 }}>
            Opcional
          </span>
        )}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={error !== undefined}
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
      {error && (
        <span style={{ fontSize: 12, color: 'var(--error)', fontWeight: 600 }}>
          {error}
        </span>
      )}
    </label>
  );
}
