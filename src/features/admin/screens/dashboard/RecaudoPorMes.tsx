import { Card } from '../../ui/Card';

// Mini barras de recaudo por mes (hasta el mes vivo). La altura es relativa
// al máximo del set.
interface Props {
  monthly: { m: string; total: number }[];
}

export function RecaudoPorMes({ monthly }: Props) {
  const max = Math.max(...monthly.map((x) => x.total), 1);
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <Card title="Recaudo por mes" eyebrow="Temporada 2026">
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 110 }}>
          {monthly.map((d) => (
            <div
              key={d.m}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 22,
                  height: `${Math.max(6, (d.total / max) * 78)}px`,
                  background: 'linear-gradient(180deg, var(--brand-blue), var(--brand-navy))',
                  borderRadius: '5px 5px 0 0',
                }}
              />
              <div className="eyebrow" style={{ fontSize: 9.5 }}>
                {d.m}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
