import { useEffect, useRef } from "react";

/**
 * CursorDot — punto custom que sigue el cursor en desktop ≥1024px con mouse fino.
 * Crece y cambia color al pasar sobre <a>, <button> o elementos data-cursor="link".
 *
 * - rAF + transform translate3d (compositor only)
 * - Sin re-renders React (refs)
 * - Respeta prefers-reduced-motion
 */
export default function CursorDot() {
    const dotRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (
            !matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)")
                .matches
        )
            return;
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const dot = dotRef.current;
        if (!dot) return;

        let x = -100;
        let y = -100;
        let tx = -100;
        let ty = -100;
        let frame = 0;
        let active = false;

        const tick = () => {
            x += (tx - x) * 0.22;
            y += (ty - y) * 0.22;
            dot.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${active ? 1.9 : 1})`;
            frame = requestAnimationFrame(tick);
        };

        const onMove = (e: PointerEvent) => {
            tx = e.clientX;
            ty = e.clientY;
            const target = e.target as HTMLElement | null;
            const isLink = !!target?.closest(
                'a, button, [role="button"], [data-cursor="link"]',
            );
            active = isLink;
            dot.dataset.active = isLink ? "1" : "0";
        };

        const onLeave = () => {
            tx = -100;
            ty = -100;
        };

        window.addEventListener("pointermove", onMove, { passive: true });
        window.addEventListener("pointerleave", onLeave);
        frame = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerleave", onLeave);
        };
    }, []);

    return (
        <div
            ref={dotRef}
            aria-hidden="true"
            className="pointer-events-none fixed left-0 top-0 z-[200] hidden h-3 w-3 rounded-full bg-brand-gold shadow-[0_0_18px_rgba(245,200,66,0.55)] transition-[background-color,box-shadow] duration-200 lg:block"
            style={{
                mixBlendMode: "difference",
                transform: "translate3d(-100px,-100px,0) translate(-50%,-50%)",
            }}
        />
    );
}
