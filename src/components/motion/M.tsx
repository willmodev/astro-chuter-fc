/**
 * Re-export del motion component minified (`m`) para forzar tree-shaking.
 * Siempre importar desde aquí, no desde "motion/react", para evitar
 * que se cargue el bundle completo.
 *
 * Debe envolverse en <MotionProvider> en algún ancestro del árbol.
 */
export {
    m,
    AnimatePresence,
    useInView,
    useMotionValue,
    useTransform,
    animate,
    useReducedMotion,
    useScroll,
    useSpring,
} from "motion/react";
