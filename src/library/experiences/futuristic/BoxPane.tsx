import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

import { NEON_TEXT, NEON_TEXT_GLOW, NEON_TONE } from './neon';
import type { NeonTone } from './neon';

export type BoxPaneProps = {
  title: string;
  /** Short text set into the top border on the right: a count, a filter, a tag. */
  meta?: string;
  /** The pane the last command acted on. Draws its border bright; the others stay dim. */
  active?: boolean;
  tone?: NeonTone;
  children: ReactNode;
  /** Layout classes for the pane. */
  className?: string;
  /** Layout classes for the body. */
  bodyClassName?: string;
};

/*
 * The border is real box-drawing characters. The runs that stretch are generated content, so
 * they fill whatever width or height the pane gets and never reach assistive technology.
 */
const HORIZONTAL =
  "before:content-['────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────']";
const VERTICAL =
  "before:content-['│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│_│']";

function HorizontalRun() {
  // Positioned, so the long run never adds to the pane's own width.
  return <span aria-hidden="true" className={cn('relative min-w-[1ch] flex-1 overflow-hidden whitespace-nowrap before:absolute before:left-0 before:top-0', HORIZONTAL)} />;
}

function VerticalRun() {
  // Positioned, so the long run never adds to the pane's own height.
  return (
    <span
      aria-hidden="true"
      className={cn('relative w-[1ch] shrink-0 overflow-hidden before:absolute before:left-0 before:top-0 before:w-[1ch] before:break-words', VERTICAL)}
    />
  );
}

/**
 * A pane of a text-mode screen, framed with box-drawing characters and titled in its top border.
 * The frame is decoration around a normal labelled region, so the content inside keeps its own
 * semantics — put a real table, list or tree in it. The body scrolls when it is too long.
 */
export function BoxPane({ title, meta, active = false, tone = 'accent', children, className, bodyClassName }: BoxPaneProps) {
  return (
    <section
      data-slot="box-pane"
      data-active={active ? 'true' : 'false'}
      aria-label={title}
      className={cn(NEON_TONE[tone], 'flex min-h-0 min-w-0 flex-col font-mono text-xs', className)}
    >
      <div
        data-slot="box-pane-frame"
        className={cn('flex min-h-0 flex-1 flex-col leading-none', active ? cn(NEON_TEXT, NEON_TEXT_GLOW) : 'text-[color:color-mix(in_oklab,var(--neon)_50%,transparent)]')}
      >
        <div className="flex whitespace-pre">
          <span aria-hidden="true">{'┌─ '}</span>
          <h3 className={cn('shrink-0 font-semibold uppercase tracking-wider', NEON_TEXT)}>{title}</h3>
          <span aria-hidden="true"> </span>
          <HorizontalRun />
          {meta ? <span className="shrink-0 text-muted-foreground [text-shadow:none]">{` ${meta} `}</span> : null}
          <span aria-hidden="true">{'─┐'}</span>
        </div>
        <div className="flex min-h-0 flex-1">
          <VerticalRun />
          <div
            data-slot="box-pane-body"
            className={cn('min-h-0 min-w-0 flex-1 overflow-auto px-[1ch] py-1 leading-5 text-base-foreground [text-shadow:none]', bodyClassName)}
          >
            {children}
          </div>
          <VerticalRun />
        </div>
        <div className="flex whitespace-pre">
          <span aria-hidden="true">{'└'}</span>
          <HorizontalRun />
          <span aria-hidden="true">{'┘'}</span>
        </div>
      </div>
    </section>
  );
}
