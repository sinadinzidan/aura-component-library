import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import type { NavDirection, StackEntry } from './navStack';

export type MobileStackProps = {
  /** The screen on top. The component only draws this one; the stack lives in `navReducer`. */
  entry: StackEntry;
  direction: NavDirection;
  /** Draws a screen from its entry. */
  render: (entry: StackEntry) => ReactNode;
};

/**
 * Draws the top screen of a navigation stack. A pushed screen slides in from the right and a popped
 * one settles in from the left; with reduced motion, or when the tab changed, it simply appears.
 * Each entry has its own key, so a new screen starts fresh and an old one is gone.
 */
export function MobileStack({ entry, direction, render }: MobileStackProps) {
  const animated = direction === 'push' || direction === 'pop';
  const [entered, setEntered] = useState(!animated);

  useEffect(() => {
    if (entered) return undefined;
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [entered]);

  return (
    <div
      key={entry.id}
      data-slot="mobile-stack-screen"
      data-direction={direction}
      className="flex min-h-0 flex-1 flex-col motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
      style={{ transform: entered ? 'none' : direction === 'push' ? 'translateX(100%)' : 'translateX(-25%)' }}
    >
      {render(entry)}
    </div>
  );
}
