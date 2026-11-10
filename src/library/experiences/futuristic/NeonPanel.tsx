import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { GlowText } from './GlowText';
import { NEON_TONE } from './neon';
import type { NeonTone } from './neon';

export type NeonPanelProps = {
  title: string;
  /** Short text on the right of the header: an id, a count, a state. */
  meta?: ReactNode;
  tone?: NeonTone;
  children: ReactNode;
  /** Layout classes for the panel. */
  className?: string;
  /** Layout classes for the body. */
  bodyClassName?: string;
};

/** Two corners cut at 45°: top right and bottom left. */
const CUT = 'polygon(0 0, calc(100% - 0.875rem) 0, 100% 0.875rem, 100% 100%, 0.875rem 100%, 0 calc(100% - 0.875rem))';

/**
 * A framed readout panel: a one-line neon outline with two cut corners, angled brackets on the
 * other two, a soft outer glow and a captioned header. The fill is nearly opaque, so text on it
 * keeps its contrast whatever is drawn behind. Use it for the one panel that answers a selection.
 */
export function NeonPanel({ title, meta, tone = 'accent', children, className, bodyClassName }: NeonPanelProps) {
  return (
    <section
      data-slot="neon-panel"
      data-tone={tone}
      aria-label={title}
      className={cn(
        NEON_TONE[tone],
        'relative flex min-h-0 flex-col [filter:drop-shadow(0_0_10px_color-mix(in_oklab,var(--neon)_28%,transparent))]',
        className
      )}
    >
      <span
        aria-hidden="true"
        style={{ clipPath: CUT }}
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--neon)_60%,transparent)]"
      />
      <span
        aria-hidden="true"
        style={{ clipPath: CUT }}
        className="absolute inset-px bg-[color-mix(in_oklab,var(--neon)_6%,var(--base-background))]"
      />
      <span aria-hidden="true" className="absolute -left-1 -top-1 size-3 border-l-2 border-t-2 border-[color:var(--neon)]" />
      <span aria-hidden="true" className="absolute -bottom-1 -right-1 size-3 border-b-2 border-r-2 border-[color:var(--neon)]" />

      <header className="relative flex items-center gap-3 px-4 pt-3">
        <span aria-hidden="true" className="h-3 w-1 shrink-0 bg-[color:var(--neon)]" />
        <h3 className="min-w-0 flex-1 truncate">
          <GlowText tone={tone} variant="label">
            {title}
          </GlowText>
        </h3>
        {meta ? <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </header>
      <div className={cn('relative flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3', bodyClassName)}>{children}</div>
    </section>
  );
}
