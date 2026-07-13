import { Icon } from '../../chrome/Icon';
import { Card } from '../../ui/Card';
import type { PlanSemana } from '../../data/types';

// Card del plan semanal (cabecera del Excel): tema + objetivos del entrenador
// para la semana visible. Sin plan → CTA para registrarlo (abre el Sheet).
interface Props {
  plan: PlanSemana | null;
  onEditar: () => void;
}

export function PlanCard({ plan, onEditar }: Readonly<Props>) {
  if (plan === null) {
    return (
      <button
        type="button"
        onClick={onEditar}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
          padding: '14px 16px',
          background: 'var(--brand-gold-soft)',
          border: '1.5px dashed var(--brand-gold)',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
        }}
      >
        <span style={{ color: 'var(--brand-gold-deep)', display: 'flex', flexShrink: 0 }}>
          <Icon name="circle-plus" size={20} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--brand-gold-deep)' }}>
            Registrar plan de la semana
          </span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Tema y objetivos de tu planeación
          </span>
        </span>
      </button>
    );
  }

  return (
    <Card
      eyebrow="Plan de la semana"
      title={plan.tema}
      actions={
        <button
          type="button"
          onClick={onEditar}
          aria-label="Editar plan"
          style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            background: 'var(--surface-sunken)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <Icon name="pencil" size={16} />
        </button>
      }
    >
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, color: 'var(--text-body)' }}>
        {plan.objetivos}
      </p>
    </Card>
  );
}
