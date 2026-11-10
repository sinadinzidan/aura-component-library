import type { ReactNode } from 'react';

type StickyFooterProps = {
  /** The actions, least important first: Cancel, then the primary action. */
  children: ReactNode;
  /** A short status at the start of the bar: "Unsaved changes", "Step 2 of 4". */
  status?: ReactNode;
  /** Match the `ContentContainer` width of the page, so the buttons line up with the form. */
  width?: 'form' | 'detail' | 'wide' | 'full';
  /** Accessible name for the group of buttons. */
  label?: string;
};

const WIDTH = { form: 'max-w-2xl', detail: 'max-w-4xl', wide: 'max-w-7xl', full: 'max-w-none' } as const;

/**
 * The action bar that stays at the bottom of a scrolling page: a full-width band with a rule above
 * it, whose contents line up with the page's content column. Place it as the last child of the
 * scrolling region, so saving never needs a scroll.
 */
export function StickyFooter({ children, status, width = 'form', label = 'Page actions' }: StickyFooterProps) {
  return (
    <div data-slot="sticky-footer" className="sticky bottom-0 z-10 w-full border-t border-default bg-base-background">
      <div className={`mx-auto flex w-full items-center justify-between gap-4 px-6 py-3 ${WIDTH[width]}`}>
        <div aria-live="polite" className="min-w-0 text-sm text-muted-foreground">
          {status}
        </div>
        <div role="group" aria-label={label} className="flex shrink-0 items-center gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
