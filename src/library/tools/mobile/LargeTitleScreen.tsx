import { useState } from 'react';
import type { ReactNode, UIEvent } from 'react';

import { collapseProgress, isTitleInBar } from './largeTitle';

export type LargeTitleScreenProps = {
  title: string;
  /** Icon actions on the right of the bar. */
  actions?: ReactNode;
  /** Leading control on the left of the bar. */
  leading?: ReactNode;
  /** The scrolling content under the title. */
  children: ReactNode;
  /** Scroll position to start at, for a screen that is shown already scrolled. */
  initialScrollTop?: number;
};

/**
 * A phone screen with a large title that collapses into the bar as the content scrolls. The bar
 * stays at the top; the large title scrolls away with the content and the small title fades in.
 */
export function LargeTitleScreen({ title, actions, leading, children, initialScrollTop = 0 }: LargeTitleScreenProps) {
  const [progress, setProgress] = useState(collapseProgress(initialScrollTop));
  const inBar = isTitleInBar(progress);

  return (
    <div data-slot="large-title-screen" data-collapsed={inBar ? 'true' : undefined} className="flex min-h-0 flex-1 flex-col">
      <header className={`grid min-h-12 shrink-0 grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-1 px-1 ${inBar ? 'border-b border-default' : 'border-b border-transparent'}`}>
        <div className="flex items-center justify-start">{leading}</div>
        <h2 aria-hidden={!inBar} className={`truncate text-center text-sm font-semibold text-base-foreground transition-opacity motion-reduce:transition-none ${inBar ? 'opacity-100' : 'opacity-0'}`}>
          {title}
        </h2>
        <div className="flex min-w-12 items-center justify-end">{actions}</div>
      </header>
      <div
        data-slot="large-title-scroll"
        className="min-h-0 flex-1 overflow-y-auto"
        ref={(element) => {
          if (element && initialScrollTop > 0 && element.scrollTop === 0) element.scrollTop = initialScrollTop;
        }}
        onScroll={(event: UIEvent<HTMLDivElement>) => setProgress(collapseProgress(event.currentTarget.scrollTop))}
      >
        <h1 className="px-4 pb-3 pt-1 text-2xl font-semibold text-base-foreground">{title}</h1>
        {children}
      </div>
    </div>
  );
}
