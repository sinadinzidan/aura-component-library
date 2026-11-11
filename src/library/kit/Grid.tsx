import type { CSSProperties, ReactNode } from 'react';

import { useLook } from '../looks/useLook';

import { cx } from './tones';

type GridProps = {
  /** Number of equal columns; children span them with `col-span-*`. */
  columns?: number;
  /** Stack children in one column instead. */
  stack?: boolean;
  /** Layout classes, for example row sizing. */
  className?: string;
  children: ReactNode;
};

/**
 * The layout grid of a kit screen. The gap belongs to the look — a hairline in console, generous
 * air in editorial — so pages never hard-code one.
 */
export function Grid({ columns = 12, stack = false, className, children }: GridProps) {
  const look = useLook();
  const style: CSSProperties | undefined = stack ? undefined : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  return (
    <div data-look={look} style={style} className={cx(stack ? 'kit-stack' : 'kit-grid', className)}>
      {children}
    </div>
  );
}
