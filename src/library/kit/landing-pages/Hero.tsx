import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

const TITLE: Record<LookId, string> = {
  studio: 'text-5xl font-semibold tracking-tight',
  console: 'text-4xl font-semibold',
  poster: 'text-7xl font-extrabold tracking-tighter',
  glass: 'text-6xl font-semibold tracking-tighter',
  editorial: 'text-6xl font-medium tracking-tighter',
  soft: 'text-5xl font-bold tracking-tight',
  blueprint: 'text-4xl font-semibold',
  signal: 'text-6xl font-extrabold tracking-tighter',
};

type HeroProps = {
  /** The promise of the page, as its largest line. */
  title: string;
  /** A short line above the title: the product, the audience, the release. */
  eyebrow?: ReactNode;
  /** One or two sentences that make the promise concrete. */
  lead?: ReactNode;
  /** One primary and at most one secondary action. */
  actions?: ReactNode;
  /** Under the actions: a reassurance, logos or a figure. */
  proof?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
};

/**
 * The opening of a landing page: eyebrow, a display headline, a lead and the actions. The
 * headline takes the look's display scale and weight, from a tight studio line to a poster shout.
 */
export function Hero({ title, eyebrow, lead, actions, proof, align = 'start', className }: HeroProps) {
  const look = useLook();
  const centered = align === 'center';
  return (
    <div data-look={look} className={cx('flex min-w-0 flex-col gap-5', centered && 'items-center text-center', className)}>
      {eyebrow ? <div className="text-sm font-semibold text-(color:--kit-line-accent)">{eyebrow}</div> : null}
      <h3 className={cx('leading-[1.02] text-balance text-(color:--kit-text)', TITLE[look])}>{title}</h3>
      {lead ? <p className={cx('max-w-[52ch] text-lg text-pretty text-(color:--kit-text-2)', look === 'poster' && 'font-medium')}>{lead}</p> : null}
      {actions ? <div className={cx('flex flex-wrap items-center gap-3', centered && 'justify-center')}>{actions}</div> : null}
      {proof ? <div className="text-sm text-(color:--kit-text-2)">{proof}</div> : null}
    </div>
  );
}
