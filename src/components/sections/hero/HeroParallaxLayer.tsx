import { type ReactNode, useRef } from "react";
import MotionProvider from "@/components/motion/MotionProvider";
import {
    m,
    useScroll,
    useTransform,
    useReducedMotion,
} from "@/components/motion/M";

/**
 * HeroParallaxLayer — wrapper genérico que aplica parallax linked al scroll.
 * Cada layer del hero (imagen, overlay, ticket) puede usar `speed` distinto
 * para crear profundidad cinematográfica.
 *
 * speed = 0.3 → se mueve poco al scrollear (capas de "fondo profundo")
 * speed = 1.0 → se mueve a la velocidad del scroll natural (no hace nada)
 * speed > 1   → se mueve más rápido que el scroll (capas de primer plano)
 */
interface Props {
    speed?: number;
    children: ReactNode;
    className?: string;
}

function ParallaxInner({ speed = 0.5, children, className }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReducedMotion();
    const { scrollY } = useScroll();

    // Distancia que se mueve = (speed - 1) × scrollY hasta el punto en que la capa sale.
    // Capas más lentas (speed<1) dan sensación de fondo lejano.
    const y = useTransform(scrollY, (v) => v * (speed - 1));

    return (
        <m.div
            ref={ref}
            className={className}
            style={reduced ? undefined : { y }}
        >
            {children}
        </m.div>
    );
}

export default function HeroParallaxLayer(props: Props) {
    return (
        <MotionProvider>
            <ParallaxInner {...props} />
        </MotionProvider>
    );
}
