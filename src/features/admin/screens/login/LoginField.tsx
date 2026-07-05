import { Eye, EyeOff } from 'lucide-react';
import { useState, type CSSProperties } from 'react';

interface Props {
  id: string;
  label: string;
  type: 'email' | 'password';
  value: string;
  autoComplete: string;
  disabled: boolean;
  onChange: (value: string) => void;
}

const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'var(--text-body)',
};

const inputStyle: CSSProperties = {
  width: '100%',
  height: 46,
  padding: '0 14px',
  fontSize: 15,
  fontFamily: 'var(--font-sans)',
  color: 'var(--text-strong)',
  background: 'var(--surface-sunken)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
};

const toggleStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  height: 46,
  width: 46,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 0,
};

export function LoginField({
  id,
  label,
  type,
  value,
  autoComplete,
  disabled,
  onChange,
}: Readonly<Props>) {
  const [visible, setVisible] = useState(false);
  const esPassword = type === 'password';
  const inputType = esPassword && visible ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          name={id}
          type={inputType}
          value={value}
          required
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...inputStyle,
            paddingRight: esPassword ? 46 : inputStyle.padding,
          }}
        />
        {esPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            style={toggleStyle}
          >
            {visible ? <EyeOff size={19} strokeWidth={1.75} /> : <Eye size={19} strokeWidth={1.75} />}
          </button>
        )}
      </div>
    </div>
  );
}
