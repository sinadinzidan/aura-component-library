import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

const SURFACE: Record<LookId, string> = {
  studio: 'rounded-(--kit-radius) border border-(--kit-rule) bg-(--kit-surface) p-6 shadow-(--kit-panel-shadow)',
  console: 'border-l-4 border-(--kit-line-accent) bg-(--kit-surface) p-4',
  poster: 'border-2 border-(--kit-rule-strong) bg-(--kit-text) p-6 text-(color:--kit-surface) shadow-(--kit-panel-shadow)',
  glass: 'rounded-(--kit-radius) border border-(--kit-rule) bg-(--kit-surface) p-6 backdrop-blur-xl',
  editorial: 'border-y-2 border-(--kit-rule-strong) py-6',
  soft: 'rounded-(--kit-radius) bg-[color-mix(in_oklab,var(--kit-line-accent)_12%,var(--kit-surface))] p-7',
  blueprint: 'border border-(--kit-rule-strong) bg-(--kit-surface) p-5',
  signal: 'rounded-(--kit-radius) bg-(--kit-surface) p-6',
};

const QUOTE: Record<LookId, string> = {
  studio: 'text-xl font-medium',
  console: 'text-base font-medium',
  poster: 'text-3xl font-extrabold tracking-tight',
  glass: 'text-2xl font-medium tracking-tight',
  editorial: 'text-3xl font-medium tracking-tight',
  soft: 'text-2xl font-bold tracking-tight',
  blueprint: 'text-lg font-medium',
  signal: 'text-2xl font-bold',
};

type PullQuoteProps = {
  /** What was said, without quotation marks. */
  quote: string;
  /** Who said it. */
  name: string;
  /** Their role and site. */
  role: string;
  /** Avatar of the speaker. */
  avatar?: ReactNode;
  className?: string;
};

/**
 * A customer's words set large, with who said them. A card in studio, between two rules in
 * editorial, an inverted block in poster.
 */
export function PullQuote({ quote, name, role, avatar, className }: PullQuoteProps) {
  const look = useLook();
  const inverted = look === 'poster';
  return (
    <figure data-look={look} className={cx('flex min-w-0 flex-col justify-between gap-5', SURFACE[look], className)}>
      <blockquote className={cx('leading-snug text-balance', QUOTE[look], inverted ? '' : 'text-(color:--kit-text)')}>“{quote}”</blockquote>
      <figcaption className="flex items-center gap-3">
        {avatar}
        <span className="flex flex-col text-sm leading-tight">
          <span className="font-semibold">{name}</span>
          <span className={inverted ? '' : 'text-(color:--kit-text-2)'}>{role}</span>
        </span>
      </figcaption>
    </figure>
  );
}
