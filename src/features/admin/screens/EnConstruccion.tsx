interface Props {
  nombre: string;
}

// Stub transitorio del spec 09: los bloques C–E lo reemplazan por las
// pantallas reales (entrenos, sesión, plantel, entrenamientos).
export function EnConstruccion({ nombre }: Readonly<Props>) {
  return (
    <p style={{ padding: '24px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
      {nombre} — en construcción (spec 09).
    </p>
  );
}
