import MotionProvider from '@/components/motion/MotionProvider';
import { m, useScroll, useSpring, useTransform } from '@/components/motion/M';

/**
 * ScrollProgress — barra de progreso vertical lateral derecho + indicador % editorial.
 * Visible siempre. Da sensación cinematográfica de "estás dentro de algo".
 */
function ScrollProgressInner() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });
  const heightPct = useTransform(smooth, (v) => `${String(v * 100)}%`);
  const labelPct = useTransform(smooth, (v) =>
    String(Math.round(v * 100)).padStart(2, '0'),
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-1/2 right-3 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
    >
      <m.span className="font-display text-brand-navy-deep/70 text-[0.65rem] tracking-[0.2em]">
        {labelPct}
      </m.span>
      <div className="bg-brand-navy/15 relative h-44 w-px overflow-hidden">
        <m.div
          className="from-brand-gold to-brand-gold-deep absolute top-0 left-0 w-full origin-top bg-gradient-to-b"
          style={{ height: heightPct }}
        />
      </div>
      <span className="font-display text-brand-navy-deep/40 text-[0.6rem] tracking-[0.2em]">
        CHU
      </span>
    </div>
  );
}

export default function ScrollProgress() {
  return (
    <MotionProvider>
      <ScrollProgressInner />
    </MotionProvider>
  );
}
