import MotionProvider from "@/components/motion/MotionProvider";
import { m, useScroll, useSpring, useTransform } from "@/components/motion/M";

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
    const heightPct = useTransform(smooth, (v) => `${v * 100}%`);
    const labelPct = useTransform(smooth, (v) =>
        String(Math.round(v * 100)).padStart(2, "0"),
    );

    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
        >
            <m.span
                className="font-display text-[0.65rem] tracking-[0.2em] text-brand-navy-deep/70"
            >
                {labelPct}
            </m.span>
            <div className="relative h-44 w-px overflow-hidden bg-brand-navy/15">
                <m.div
                    className="absolute left-0 top-0 w-full origin-top bg-gradient-to-b from-brand-gold to-brand-gold-deep"
                    style={{ height: heightPct }}
                />
            </div>
            <span className="font-display text-[0.6rem] tracking-[0.2em] text-brand-navy-deep/40">
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
