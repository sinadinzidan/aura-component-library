import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type BrowserFrameProps = {
  /** Address shown in the bar, without a scheme: "fusion.cognite.test/nordkapp/overview". */
  address: string;
  /** What the frame shows, for assistive technology: "Preview of the plant overview". */
  label: string;
  children: ReactNode;
  /** Layout classes for the frame, such as a height. */
  className?: string;
};

/**
 * A browser-like frame drawn from tokens, for showing a real, live piece of product on a landing
 * page instead of a screenshot. The chrome is decoration; the content inside stays interactive.
 */
export function BrowserFrame({ address, label, children, className }: BrowserFrameProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="browser-frame"
      className={cn('flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background', className)}
    >
      <div aria-hidden="true" className="flex items-center gap-3 border-b border-default bg-muted-background px-3 py-2">
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2 rounded-full border border-emphasized" />
          <span className="size-2 rounded-full border border-emphasized" />
          <span className="size-2 rounded-full border border-emphasized" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-base-background px-3 py-1 font-mono text-xs text-muted-foreground">
          {address}
        </span>
      </div>
      <div data-slot="browser-frame-content" className="min-h-0 min-w-0 flex-1 p-4">
        {children}
      </div>
    </div>
  );
}
