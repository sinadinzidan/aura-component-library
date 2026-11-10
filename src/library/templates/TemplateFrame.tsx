import type { ReactNode } from 'react';

type TemplateFrameProps = {
  /** Window title, the way a browser tab would name the screen: "Work orders · Nordkapp". */
  title: string;
  /** Route shown at the end of the title strip, such as "/maintain/work-orders". */
  address?: string;
  /** Accessible name of the frame. Defaults to "<title> template". */
  label?: string;
  /** Height of the viewport. Pick the one that shows the layout's first screen. */
  height?: 'md' | 'lg' | 'xl';
  /** `mobile` and `tablet` narrow the window and centre it, to show a small-screen layout. */
  width?: 'full' | 'tablet' | 'mobile';
  /** The page. Give it `h-full` to manage its own scrolling, or let the viewport scroll it. */
  children: ReactNode;
};

const HEIGHT = { md: 'h-128', lg: 'h-160', xl: 'h-192' } as const;
const WIDTH = { full: 'w-full', tablet: 'w-full max-w-3xl', mobile: 'w-full max-w-sm' } as const;

/**
 * A window drawn from tokens that shows a whole page at a fixed height: a title strip and a
 * viewport that scrolls. The viewport is a size container, so the page inside can respond to the
 * frame's width with container queries exactly as it would respond to a real screen.
 */
export function TemplateFrame({ title, address, label, height = 'lg', width = 'full', children }: TemplateFrameProps) {
  return (
    <div
      role="group"
      aria-label={label ?? `${title} template`}
      data-slot="template-frame"
      data-width={width}
      className={`mx-auto flex min-w-0 flex-col overflow-hidden rounded-xl border border-default bg-base-background ${WIDTH[width]}`}
    >
      <div aria-hidden="true" className="flex shrink-0 items-center gap-3 border-b border-default bg-muted-background px-3 py-2">
        <span className="flex shrink-0 gap-1.5">
          <span className="size-2 rounded-full border border-emphasized" />
          <span className="size-2 rounded-full border border-emphasized" />
          <span className="size-2 rounded-full border border-emphasized" />
        </span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-medium-foreground">{title}</span>
        {address ? <span className="min-w-0 shrink truncate font-mono text-xs text-muted-foreground">{address}</span> : null}
      </div>
      <div
        data-slot="template-frame-viewport"
        tabIndex={0}
        className={`@container relative isolate min-w-0 overflow-y-auto outline-none focus-visible:shadow-focus-ring ${HEIGHT[height]}`}
      >
        {children}
      </div>
    </div>
  );
}
