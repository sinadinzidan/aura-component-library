import { IconLock } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { LookScope } from '../../looks/LookScope';

type BrowserFrameProps = {
  /** Address shown in the window bar, without the scheme: `nordkapp.test/sign-in`. */
  url: string;
  /** The look the page inside is drawn in. */
  look: LookId;
  /** Least height of the page in px, so a short page still reads as a whole screen. */
  minHeight?: number;
  /** The page: an `AppFrame` or a `Canvas`. It is stretched to fill the window. */
  children: ReactNode;
};

/**
 * A browser-like window around a whole page template. The bar stays neutral so the page inside
 * can be in any look, and the page always fills the window: an `AppFrame` keeps its chrome at
 * its natural size and gives the rest of the height to its canvas.
 */
export function BrowserFrame({ url, look, minHeight = 680, children }: BrowserFrameProps) {
  return (
    <div className="flex w-full min-w-0 flex-col bg-base-background">
      <div className="flex items-center gap-4 border-b border-default bg-medium-background px-4 py-2">
        <span aria-hidden="true" className="flex w-16 gap-1.5">
          <span className="size-3 rounded-full bg-emphasized" />
          <span className="size-3 rounded-full bg-emphasized" />
          <span className="size-3 rounded-full bg-emphasized" />
        </span>
        <span className="mx-auto flex h-7 w-full max-w-md items-center justify-center gap-1.5 rounded-md bg-base-background px-3 text-xs font-medium text-medium-foreground">
          <IconLock aria-hidden="true" className="size-3.5" />
          <span className="truncate">{url}</span>
        </span>
        <span aria-hidden="true" className="w-16" />
      </div>
      <div style={{ minHeight }} className="flex min-w-0 flex-col">
        <LookScope
          look={look}
          className="flex min-w-0 flex-1 flex-col *:flex-1 [&>.kit-frame[data-variant=masthead]]:grid-rows-[auto_auto_minmax(0,1fr)] [&>.kit-frame[data-variant=topbar]]:grid-rows-[auto_minmax(0,1fr)]"
        >
          {children}
        </LookScope>
      </div>
    </div>
  );
}
