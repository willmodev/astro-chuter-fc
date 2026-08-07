import { LazyMotion, domAnimation } from 'motion/react';

import type { ReactNode } from 'react';

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
