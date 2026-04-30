import type { Transition, Variants } from "motion/react";

export const ease = {
    outExpo: [0.16, 1, 0.3, 1] as const,
    outQuint: [0.22, 1, 0.36, 1] as const,
    outBack: [0.34, 1.56, 0.64, 1] as const,
    inOutSine: [0.45, 0, 0.55, 1] as const,
} as const;

export const spring: Transition = {
    type: "spring",
    stiffness: 260,
    damping: 26,
    mass: 0.9,
};

export const springSoft: Transition = {
    type: "spring",
    stiffness: 180,
    damping: 22,
    mass: 1,
};

export const fadeUp = (delay = 0): Variants => ({
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.7, delay, ease: ease.outExpo },
    },
});

export const fadeIn = (delay = 0): Variants => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, delay, ease: ease.outQuint },
    },
});

export const staggerParent = (stagger = 0.08, delayChildren = 0): Variants => ({
    hidden: {},
    visible: {
        transition: {
            staggerChildren: stagger,
            delayChildren,
        },
    },
});
