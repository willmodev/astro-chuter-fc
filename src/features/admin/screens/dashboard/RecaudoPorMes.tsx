import { Card } from '../../ui/Card';
import { Monto } from '../../ui/Monto';

// Mini barras de recaudo por mes (hasta el mes vivo), con el monto encima de
// cada barra. La altura de la barra es relativa al máximo del set.
interface Props {
  monthly: { m: string; total: number }[];
}

// La barra se mide en % de su zona (no en px) para que el reparto vertical lo
// decida el CSS: mobile rota la cifra y necesita banda alta; desktop no.
const ALTO_BARRA_MIN = 6;
const ALTO_MES = 12;

// El gráfico usa padding lateral propio (8px en vez de los 20 de la card):
// cada píxel horizontal es ancho de columna en el peor caso de 320px.
const PADDING_GRAFICO = '8px 8px 10px';

function gapColumnas(columnas: number): number {
  if (columnas >= 10) return 2;
  if (columnas >= 8) return 4;
  return 8;
}

export function RecaudoPorMes({ monthly }: Readonly<Props>) {
  const max = Math.max(...monthly.map((x) => x.total), 1);
  return (
    <div style={{ padding: '12px 16px 0' }}>
      <Card title="Recaudo por mes" eyebrow="Temporada 2026" pad={false}>
        <div
          className="admin-chart"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: gapColumnas(monthly.length),
            padding: PADDING_GRAFICO,
          }}
        >
          {monthly.map((d) => (
            <div
              key={d.m}
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
              }}
            >
              {/* Banda con la altura ya reservada por CSS: un `transform` no
                  ocupa espacio en el flujo y la cifra rotada la necesita. */}
              <div className="admin-chart__banda">
                <span
                  className="admin-chart__valor"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    lineHeight: 1.1,
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    color: 'var(--text-strong)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Monto valor={d.total} corto />
                </span>
              </div>
              <div className="admin-chart__zona">
                <div
                  style={{
                    width: '100%',
                    maxWidth: 22,
                    height: `${String((d.total / max) * 100)}%`,
                    minHeight: ALTO_BARRA_MIN,
                    background:
                      'linear-gradient(180deg, var(--brand-blue), var(--brand-navy))',
                    borderRadius: '5px 5px 0 0',
                  }}
                />
              </div>
              <div
                className="eyebrow"
                style={{
                  fontSize: 9.5,
                  flexShrink: 0,
                  lineHeight: `${String(ALTO_MES)}px`,
                  paddingTop: 4,
                }}
              >
                {d.m}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
