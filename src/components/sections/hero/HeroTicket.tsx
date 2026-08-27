import MotionProvider from '@/components/motion/MotionProvider';
import { m, useReducedMotion } from '@/components/motion/M';
import {
  CATEGORIAS,
  EDAD_MAX_CAPTACION,
  EDAD_MIN_CAPTACION,
} from '@/lib/domain/categoria';
import { ease, spring } from '@/lib/motion';

interface Props {
  avalLabel?: string;
}

function TicketInner({ avalLabel = 'INDER' }: Props) {
  const reduced = useReducedMotion();

  const enterAnim = reduced
    ? { opacity: 1, y: 0, rotate: 1.5 }
    : { opacity: 1, y: 0, rotate: 1.5 };

  const breatheAnim = reduced
    ? { rotate: 1.5 }
    : { rotate: [1.5, 2.2, 1.5], y: [0, -2, 0] };

  return (
    <m.aside
      className="relative self-end lg:self-center"
      initial={reduced ? false : { opacity: 0, y: 40, rotate: 8 }}
      animate={enterAnim}
      transition={{ ...spring, delay: 0.35 }}
    >
      <m.div
        className="border-brand-gold/30 bg-brand-cream relative rounded-sm border p-6 shadow-2xl shadow-black/40 md:p-8 md:pr-12"
        animate={breatheAnim}
        transition={
          reduced
            ? undefined
            : { duration: 6.5, repeat: Infinity, ease: ease.inOutSine }
        }
      >
        <div className="border-brand-navy/25 flex items-baseline justify-between gap-3 border-b border-dashed pb-3 md:pr-12">
          <span className="font-display text-brand-navy-deep text-2xl tracking-wider">
            CUPO 2026
          </span>
          <span className="section-marker text-brand-clay text-xs italic">
            edición limitada
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <p className="font-display text-brand-clay text-5xl leading-none">
            ¡GRATIS!
          </p>
          <p
            className="text-brand-navy-deep font-serif text-lg leading-snug italic"
            style={{
              fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 400",
            }}
          >
            La inscripción no te cuesta nada. Solo traer a tu hijo o hija con
            ganas de jugar.
          </p>
        </div>

        <dl className="border-brand-navy/25 mt-5 grid grid-cols-3 gap-2 border-t border-dashed pt-4 text-center">
          <div>
            <dt className="text-brand-navy/75 text-[0.65rem] tracking-wider uppercase">
              Categorías
            </dt>
            <dd className="font-display text-brand-navy-deep text-2xl leading-none">
              {CATEGORIAS.length}
            </dd>
          </div>
          <div className="border-brand-navy/25 border-x border-dashed">
            <dt className="text-brand-navy/75 text-[0.65rem] tracking-wider uppercase">
              Edades
            </dt>
            <dd className="font-display text-brand-navy-deep text-2xl leading-none">
              {EDAD_MIN_CAPTACION}–{EDAD_MAX_CAPTACION}
            </dd>
          </div>
          <div>
            <dt className="text-brand-navy/75 text-[0.65rem] tracking-wider uppercase">
              x Semana
            </dt>
            <dd className="font-display text-brand-navy-deep text-2xl leading-none">
              3
            </dd>
          </div>
        </dl>

        <div className="border-brand-navy-deep bg-brand-gold absolute -top-5 -right-5 hidden h-[72px] w-[72px] -rotate-12 items-center justify-center rounded-full border-2 shadow-lg md:flex">
          <span className="section-marker text-brand-navy-deep px-1 text-center text-[0.6rem] leading-tight italic">
            avalado
            <br />
            <span className="font-display text-sm tracking-wide not-italic">
              {avalLabel}
            </span>
          </span>
        </div>

        <div className="bg-brand-navy-deep absolute top-1/2 -left-3 h-6 w-6 -translate-y-1/2 rounded-full" />
        <div className="bg-brand-navy-deep absolute top-1/2 -right-3 h-6 w-6 -translate-y-1/2 rounded-full" />
      </m.div>

      <div className="from-brand-gold/20 pointer-events-none absolute -inset-4 -z-10 rounded-md bg-gradient-to-br to-transparent blur-2xl" />
    </m.aside>
  );
}

export default function HeroTicket(props: Props) {
  return (
    <MotionProvider>
      <TicketInner {...props} />
    </MotionProvider>
  );
}
