import type { ReactNode } from "react";
import { LazyMotion, domAnimation } from "motion/react";

interface Props {
    children: ReactNode;
}

export default function MotionProvider({ children }: Props) {
    return (
        <LazyMotion features={domAnimation} strict>
            {children}
        </LazyMotion>
    );
}
