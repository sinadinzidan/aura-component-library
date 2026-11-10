import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { GlowText } from './GlowText';
import { NEON_TONE } from './neon';
import type { NeonTone } from './neon';

export type BracketFrameProps = {
  title: string;
  /** Short text on the right of the title line. */
  meta?: ReactNode;
  tone?: NeonTone;
  children: ReactNode;
  /** Layout classes for the frame. */
  className?: string;
  /** Layout classes for the body. */
  bodyClassName?: string;
};

const CORNER = 'absolute size-4 border-[color:var(--neon)] [filter:drop-shadow(0_0_3px_color-mix(in_oklab,var(--neon)_70%,transparent))]';

/**
 * A heads-up panel drawn as four corner brackets and a title rule — no fill and no box, so the
 * scene behind stays visible. Use it for panels docked over or around a central display; pick
 * `NeonPanel` when the content needs a surface of its own.
 */
export function BracketFrame({ title, meta, tone = 'accent', children, className, bodyClassName }: BracketFrameProps) {
  return (
    <section
      data-slot="bracket-frame"
      data-tone={tone}
      aria-label={title}
      className={cn(NEON_TONE[tone], 'relative flex min-h-0 flex-col p-3', className)}
    >
      <span aria-hidden="true" className={cn(CORNER, 'left-0 top-0 border-l-2 border-t-2')} />
      <span aria-hidden="true" className={cn(CORNER, 'right-0 top-0 border-r-2 border-t-2')} />
      <span aria-hidden="true" className={cn(CORNER, 'bottom-0 left-0 border-b-2 border-l-2')} />
      <span aria-hidden="true" className={cn(CORNER, 'bottom-0 right-0 border-b-2 border-r-2')} />

      <header className="flex items-center gap-2">
        <h3 className="shrink-0">
          <GlowText tone={tone} variant="label">
            {title}
          </GlowText>
        </h3>
        <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-[color-mix(in_oklab,var(--neon)_45%,transparent)]" />
        {meta ? <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      </header>
      <div className={cn('flex min-h-0 flex-1 flex-col pt-3', bodyClassName)}>{children}</div>
    </section>
  );
}
