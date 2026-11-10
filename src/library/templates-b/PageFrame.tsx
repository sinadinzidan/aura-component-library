import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type PageFrameProps = {
  /** Name of the screen, shown in the title strip: "Sign in". */
  title: string;
  /** Address shown beside the title, without a scheme: "nordkapp.example/sign-in". */
  address?: string;
  /** Accessible name of the frame. Defaults to "Template: <title>". */
  label?: string;
  /** Height of the viewport. A page taller than this scrolls inside the frame. */
  height?: 'sm' | 'md' | 'lg';
  /** `phone` narrows the frame to a handset column and centres it. */
  device?: 'desktop' | 'phone';
  children: ReactNode;
  /** Layout classes for the frame. */
  className?: string;
};

const HEIGHT: Record<NonNullable<PageFrameProps['height']>, string> = {
  sm: 'h-112',
  md: 'h-144',
  lg: 'h-176',
};

/**
 * A window-like frame for showing one whole page inside another page: a quiet title strip and a
 * fixed-height viewport that scrolls. The viewport is a size container, so the page inside lays
 * itself out from the frame's width (`@3xl:`) and not from the browser's. The strip is decoration;
 * everything in the viewport stays live.
 */
export function PageFrame({ title, address, label, height = 'md', device = 'desktop', children, className }: PageFrameProps) {
  return (
    <div
      role="group"
      aria-label={label ?? `Template: ${title}`}
      data-slot="page-frame"
      data-device={device}
      className={cn(
        'flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background',
        device === 'phone' ? 'mx-auto max-w-sm' : undefined,
        className
      )}
    >
      <div
        aria-hidden="true"
        data-slot="page-frame-strip"
        className="flex shrink-0 items-center gap-3 border-b border-default bg-muted-background px-3 py-2"
      >
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2 rounded-full border border-emphasized" />
          <span className="size-2 rounded-full border border-emphasized" />
          <span className="size-2 rounded-full border border-emphasized" />
        </span>
        <span className="min-w-0 shrink truncate text-xs font-medium text-medium-foreground">{title}</span>
        {address ? (
          <span className="ml-auto min-w-0 shrink truncate font-mono text-xs text-muted-foreground">{address}</span>
        ) : null}
      </div>
      <div
        data-slot="page-frame-viewport"
        tabIndex={0}
        className={cn(
          '@container relative min-w-0 overflow-x-hidden overflow-y-auto outline-none focus-visible:shadow-focus-ring',
          HEIGHT[height]
        )}
      >
        {children}
      </div>
    </div>
  );
}
