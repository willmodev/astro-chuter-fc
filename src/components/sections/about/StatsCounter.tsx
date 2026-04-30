import { useRef } from "react";
import MotionProvider from "@/components/motion/MotionProvider";
import {
    m,
    useScroll,
    useTransform,
    useReducedMotion,
} from "@/components/motion/M";
import { ease } from "@/lib/motion";

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

    const { scrollYProgress } = useScroll({
        target: ref,
        // Empezamos cuando recién entra y terminamos cuando casi sale por arriba.
        // Esto da un track largo de scroll para ver los números subir.
        offset: ["start 90%", "end 30%"],
    });

    return (
        <m.div
            ref={ref}
            initial={reduced ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 1.1, ease: ease.outExpo }}
            className="mt-16 grid grid-cols-1 overflow-hidden border-y-2 border-brand-navy-deep sm:grid-cols-3"
        >
            {stats.map((stat, idx) => (
                <StatCell
                    key={stat.label}
                    stat={stat}
                    idx={idx}
                    progress={scrollYProgress}
                    reduced={!!reduced}
                />
            ))}
        </m.div>
    );
}

interface CellProps {
    stat: Stat;
    idx: number;
    progress: ReturnType<typeof useScroll>["scrollYProgress"];
    reduced: boolean;
}

function StatCell({ stat, idx, progress, reduced }: CellProps) {
    const { value, valueNum, valueSuffix, label, sub } = stat;

    // Cada stat empieza a contar a una fracción ligeramente distinta del scroll.
    const start = 0.05 + idx * 0.06;
    const end = 0.7 + idx * 0.05;

    const display = useTransform(progress, (v) => {
        if (valueNum === undefined || reduced) return value;
        const t = Math.min(1, Math.max(0, (v - start) / (end - start)));
        const eased = 1 - Math.pow(1 - t, 3);
        return `${Math.round(eased * valueNum)}${valueSuffix ?? ""}`;
    });

    const barScale = useTransform(progress, [start, end], [0, 1]);

    return (
        <div
            className={`relative px-6 py-10 text-center ${
                idx > 0 ? "sm:border-l-2 sm:border-brand-navy-deep" : ""
            }`}
        >
            <p className="font-display text-[4.5rem] leading-none text-brand-navy-deep md:text-[6rem]">
                <m.span>{display}</m.span>
            </p>
            <p
                className="mt-3 font-serif italic text-base text-brand-clay md:text-lg"
                style={{ fontVariationSettings: "'opsz' 144, 'wght' 500" }}
            >
                {label}
            </p>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-neutral-500">
                {sub}
            </p>

            {/* Barra de progreso editorial bajo cada stat */}
            <m.span
                aria-hidden="true"
                className="mt-4 block h-px origin-left bg-brand-gold"
                style={reduced ? { transform: "scaleX(1)" } : { scaleX: barScale }}
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
