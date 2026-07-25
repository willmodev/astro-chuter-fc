// Toggle "Mostrar retirados" (solo admin): por defecto apagado, así la lista
// diaria queda limpia. Encendido, la Action trae también los retirados y la
// fila los marca con badge (spec 14).
interface Props {
  activo: boolean;
  onChange: (activo: boolean) => void;
}

export function ChipRetirados({ activo, onChange }: Readonly<Props>) {
  return (
    <button
      type="button"
      onClick={() => onChange(!activo)}
      aria-pressed={activo}
      style={{
        flexShrink: 0,
        height: 30,
        padding: '0 12px',
        borderRadius: 'var(--radius-pill)',
        border: activo ? 'none' : '1px solid var(--border-subtle)',
        background: activo ? 'var(--brand-navy)' : 'var(--surface-card)',
        color: activo ? '#fff' : 'var(--text-muted)',
        fontSize: 12.5,
        fontWeight: activo ? 700 : 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      Mostrar retirados
    </button>
  );
}
