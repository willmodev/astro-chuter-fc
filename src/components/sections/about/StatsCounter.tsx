import { useRef, useState, useEffect } from 'react';

import MotionProvider from '@/components/motion/MotionProvider';
import {
  m,
  useScroll,
  useTransform,
  useReducedMotion,
} from '@/components/motion/M';

interface Stat {
  value: string;
  valueNum?: number;
  valueSuffix?: string;
  label: string;
  sub: string;
}

interface Props {
  stats: Stat[];
}

/**
 * StatsCounter — números scrubeados al scroll: conforme el usuario scrollea
 * dentro de la sección, los counters van subiendo en tiempo real (no es
 * un count-up automático, es scroll-linked).
 */
function StatsInner({ stats }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const hidratado = useHidratado();

  const { scrollYProgress } = useScroll({
    target: ref,
    // Empezamos cuando recién entra y terminamos cuando casi sale por arriba.
    // Esto da un track largo de scroll para ver los números subir.
    offset: ['start 90%', 'end 30%'],
  });

  // La entrada la hace `.reveal` (CSS scroll-driven), no Motion: así el bloque
  // sale visible del servidor. Con `initial={{opacity:0}}` quedaba un hueco en
  // blanco de ~750px en mobile hasta que el island terminaba de hidratar.
  return (
    <div
      ref={ref}
      className="reveal border-brand-navy-deep mt-16 grid grid-cols-1 overflow-hidden border-y-2 sm:grid-cols-3"
    >
      {stats.map((stat, idx) => (
        <StatCell
          key={stat.label}
          stat={stat}
          idx={idx}
          progress={scrollYProgress}
          reduced={!!reduced}
          hidratado={hidratado}
        />
      ))}
    </div>
  );
}

/** false durante el render del servidor y el primer render del cliente. */
function useHidratado(): boolean {
  const [hidratado, setHidratado] = useState(false);
  useEffect(() => {
    setHidratado(true);
  }, []);
  return hidratado;
}

interface CellProps {
  stat: Stat;
  idx: number;
  progress: ReturnType<typeof useScroll>['scrollYProgress'];
  reduced: boolean;
  hidratado: boolean;
}

function StatCell({ stat, idx, progress, reduced, hidratado }: CellProps) {
  const { value, valueNum, valueSuffix, label, sub } = stat;

  // Cada stat empieza a contar a una fracción ligeramente distinta del scroll.
  const start = 0.05 + idx * 0.06;
  const end = 0.7 + idx * 0.05;

  // Sin JS el conteo no corre, así que el HTML del servidor lleva ya el valor
  // final: si el island nunca hidrata se lee "7", no un "0" falso.
  const display = useTransform(progress, (v) => {
    if (valueNum === undefined || reduced || !hidratado) return value;
    const t = Math.min(1, Math.max(0, (v - start) / (end - start)));
    const eased = 1 - Math.pow(1 - t, 3);
    return `${String(Math.round(eased * valueNum))}${valueSuffix ?? ''}`;
  });

  const barScale = useTransform(progress, [start, end], [0, 1]);

  return (
    <div
      className={`relative px-6 py-10 text-center ${
        idx > 0 ? 'sm:border-brand-navy-deep sm:border-l-2' : ''
      }`}
    >
      <p className="font-display text-brand-navy-deep text-[4.5rem] leading-none md:text-[6rem]">
        <m.span>{display}</m.span>
      </p>
      <p
        className="text-brand-clay mt-3 font-serif text-base italic md:text-lg"
        style={{ fontVariationSettings: "'opsz' 144, 'wght' 500" }}
      >
        {label}
      </p>
      <p className="mt-1 text-[0.65rem] tracking-[0.2em] text-neutral-500 uppercase">
        {sub}
      </p>

      {/* Barra de progreso editorial bajo cada stat */}
      <m.span
        aria-hidden="true"
        className="bg-brand-gold mt-4 block h-px origin-left"
        style={
          reduced || !hidratado
            ? { transform: 'scaleX(1)' }
            : { scaleX: barScale }
        }
      />
    </div>
  );
}

export default function StatsCounter(props: Props) {
  return (
    <MotionProvider>
      <StatsInner {...props} />
    </MotionProvider>
  );
}
