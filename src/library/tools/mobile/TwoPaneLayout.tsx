import type { ReactNode } from 'react';

export type TwoPaneLayoutProps = {
  /** The list on the left. */
  primary: ReactNode;
  /** The selected item on the right. */
  secondary: ReactNode;
  /** Accessible names of the two panes. */
  primaryLabel: string;
  secondaryLabel: string;
};

/**
 * The tablet layout of a phone stack: the list stays on the left and the screen that a phone would
 * push opens on the right, so there is no back button to press and no list to come back to.
 */
export function TwoPaneLayout({ primary, secondary, primaryLabel, secondaryLabel }: TwoPaneLayoutProps) {
  return (
    <div data-slot="two-pane" className="grid min-h-0 flex-1 grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section aria-label={primaryLabel} className="flex min-h-0 min-w-0 flex-col border-r border-default">
        {primary}
      </section>
      <section aria-label={secondaryLabel} className="flex min-h-0 min-w-0 flex-col">
        {secondary}
      </section>
    </div>
  );
}
