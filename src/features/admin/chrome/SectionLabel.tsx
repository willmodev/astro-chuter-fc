import type { ReactNode } from 'react';

// Encabezado de sección dentro de una pantalla: eyebrow + acción opcional.
interface Props {
  children: ReactNode;
  action?: ReactNode;
}

export function SectionLabel({ children, action }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 20px 8px',
      }}
    >
      <span className="eyebrow">{children}</span>
      {action}
    </div>
  );
}
