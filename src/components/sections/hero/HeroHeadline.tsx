import { useRef } from "react";
import MotionProvider from "@/components/motion/MotionProvider";
import {
    m,
    useScroll,
    useTransform,
    useReducedMotion,
} from "@/components/motion/M";
import { ease } from "@/lib/motion";

/**
 * HeroHeadline — headline cinematográfico con:
 * - Reveal carácter por carácter en el primer mount (stagger)
 * - Parallax linked al scroll (cada línea se desplaza a velocidad distinta)
 * - "campeones" gold serif italic con un offset y rotation propio
 * - Underline gold dibujándose
 *
 * Cuando el usuario scrollea, el headline entero se eleva mientras se
 * desvanece, dejando ver mejor la imagen de fondo.
 */

type HeadlineLine = {
    text: string;
    weight: "display" | "serif-italic";
    color: "white" | "gold";
    underline?: boolean;
};

const lines: readonly HeadlineLine[] = [
    { text: "Formando", weight: "display", color: "white" },
    { text: "campeones", weight: "serif-italic", color: "gold" },
    { text: "dentro y", weight: "display", color: "white" },
    { text: "fuera de la", weight: "display", color: "white" },
    { text: "cancha", weight: "display", color: "white", underline: true },
];

function HeroHeadlineInner() {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const headlineY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
    const headlineOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.7, 0]);
    const headlineScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

    return (
        <m.div
            ref={ref}
            style={
                reduced
                    ? undefined
                    : { y: headlineY, opacity: headlineOpacity, scale: headlineScale }
            }
            className="origin-top-left will-change-transform"
        >
            <h1 className="font-display text-[clamp(3rem,8vw,7rem)] leading-[0.88] text-white">
                {lines.map((line, lineIdx) => {
                    const chars = Array.from(line.text);
                    const baseDelay = 0.25 + lineIdx * 0.08;

                    return (
                        <span
                            key={lineIdx}
                            className={`relative block ${
                                line.weight === "serif-italic"
                                    ? "font-serif italic font-light text-brand-gold"
                                    : ""
                            }`}
                            style={
                                line.weight === "serif-italic"
                                    ? {
                                          fontVariationSettings:
                                              "'opsz' 144, 'SOFT' 100, 'wght' 300",
                                      }
                                    : undefined
                            }
                        >
                            <span className="inline-block">
                                {chars.map((ch, charIdx) => (
                                    <m.span
                                        key={charIdx}
                                        className="inline-block"
                                        initial={
                                            reduced
                                                ? false
                                                : { opacity: 0, y: "0.6em", rotate: 8 }
                                        }
                                        animate={{ opacity: 1, y: 0, rotate: 0 }}
                                        transition={{
                                            duration: 0.7,
                                            delay: baseDelay + charIdx * 0.025,
                                            ease: ease.outExpo,
                                        }}
                                    >
                                        {ch === " " ? "\u00A0" : ch}
                                    </m.span>
                                ))}
                            </span>
                            {line.underline && (
                                <>
                                    <svg
                                        className="hero-underline absolute -bottom-2 left-0 w-full"
                                        viewBox="0 0 200 12"
                                        preserveAspectRatio="none"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M2 8 Q 50 2, 100 6 T 198 7"
                                            pathLength="1"
                                            stroke="#F5C842"
                                            strokeWidth="3"
                                            fill="none"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <m.span
                                        className="inline-block"
                                        initial={
                                            reduced ? false : { opacity: 0 }
                                        }
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.2 }}
                                    >
                                        .
                                    </m.span>
                                </>
                            )}
                        </span>
                    );
                })}
            </h1>
        </m.div>
    );
}

export default function HeroHeadline() {
    return (
        <MotionProvider>
            <HeroHeadlineInner />
        </MotionProvider>
    );
}
