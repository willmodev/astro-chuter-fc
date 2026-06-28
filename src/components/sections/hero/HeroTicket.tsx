import MotionProvider from "@/components/motion/MotionProvider";
import { m, useReducedMotion } from "@/components/motion/M";
import { ease, spring } from "@/lib/motion";

interface Props {
    avalLabel?: string;
}

function TicketInner({ avalLabel = "INDER" }: Props) {
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
                className="relative rounded-sm border border-brand-gold/30 bg-brand-cream p-6 shadow-2xl shadow-black/40 md:p-8 md:pr-12"
                animate={breatheAnim}
                transition={
                    reduced
                        ? undefined
                        : { duration: 6.5, repeat: Infinity, ease: ease.inOutSine }
                }
            >
                <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-brand-navy/25 pb-3 md:pr-12">
                    <span className="font-display text-2xl tracking-wider text-brand-navy-deep">
                        CUPO 2026
                    </span>
                    <span className="section-marker text-xs italic text-brand-clay">
                        edición limitada
                    </span>
                </div>

                <div className="mt-4 space-y-3">
                    <p className="font-display text-5xl leading-none text-brand-clay">
                        ¡GRATIS!
                    </p>
                    <p
                        className="font-serif italic text-lg leading-snug text-brand-navy-deep"
                        style={{ fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'wght' 400" }}
                    >
                        La inscripción no te cuesta nada. Solo traer a tu hijo o hija con ganas
                        de jugar.
                    </p>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-dashed border-brand-navy/25 pt-4 text-center">
                    <div>
                        <dt className="text-[0.65rem] uppercase tracking-wider text-brand-navy/60">
                            Categorías
                        </dt>
                        <dd className="font-display text-2xl leading-none text-brand-navy-deep">
                            4
                        </dd>
                    </div>
                    <div className="border-x border-dashed border-brand-navy/25">
                        <dt className="text-[0.65rem] uppercase tracking-wider text-brand-navy/60">
                            Edades
                        </dt>
                        <dd className="font-display text-2xl leading-none text-brand-navy-deep">
                            4–14
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[0.65rem] uppercase tracking-wider text-brand-navy/60">
                            x Semana
                        </dt>
                        <dd className="font-display text-2xl leading-none text-brand-navy-deep">
                            3
                        </dd>
                    </div>
                </dl>

                <div className="absolute -right-5 -top-5 hidden h-[72px] w-[72px] -rotate-12 items-center justify-center rounded-full border-2 border-brand-navy-deep bg-brand-gold shadow-lg md:flex">
                    <span className="section-marker px-1 text-center text-[0.6rem] italic leading-tight text-brand-navy-deep">
                        avalado
                        <br />
                        <span className="font-display text-sm not-italic tracking-wide">
                            {avalLabel}
                        </span>
                    </span>
                </div>

                <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-brand-navy-deep" />
                <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-brand-navy-deep" />
            </m.div>

            <div className="pointer-events-none absolute -inset-4 -z-10 rounded-md bg-gradient-to-br from-brand-gold/20 to-transparent blur-2xl" />
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
