import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type HudPanelProps = {
  /** Short heading in the panel's top line. */
  title: string;
  /** Quiet text beside the title: a tag, a count, a timestamp. */
  meta?: ReactNode;
  /** Controls at the end of the heading line. */
  actions?: ReactNode;
  children: ReactNode;
  /** Layout classes: width, height, position. */
  className?: string;
};

/**
 * A glass panel for heads-up content floating over a 3D scene: translucent card surface, blur and
 * a thin border, so the scene stays visible behind it. Scrolls its body when the content is taller
 * than the panel.
 */
export function HudPanel({ title, meta, actions, children, className }: HudPanelProps) {
  return (
    <section
      aria-label={title}
      data-slot="hud-panel"
      className={cn(
        'flex min-h-0 flex-col rounded-xl border border-default backdrop-blur-md',
        'bg-[color-mix(in_oklab,var(--card-background)_78%,transparent)]',
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-default px-3 py-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-base-foreground">{title}</h3>
        {meta ? <span className="shrink-0 text-xs tabular-nums text-medium-foreground">{meta}</span> : null}
        {actions}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">{children}</div>
    </section>
  );
}
