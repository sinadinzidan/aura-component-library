import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { IconChip } from '../IconChip';
import { cx, type Tone } from '../tones';

const TITLE: Record<LookId, string> = {
  studio: 'text-3xl font-semibold tracking-tight',
  console: 'text-2xl font-semibold',
  poster: 'text-5xl font-extrabold tracking-tighter',
  glass: 'text-4xl font-semibold tracking-tight',
  editorial: 'text-5xl font-medium tracking-tighter',
  soft: 'text-4xl font-bold tracking-tight',
  blueprint: 'text-2xl font-semibold',
  signal: 'text-5xl font-extrabold tracking-tighter',
};

const CODE: Record<LookId, string> = {
  studio: 'text-sm font-semibold text-(color:--t-ink)',
  console: 'text-sm font-semibold text-(color:--t-ink)',
  poster: 'text-[9rem] leading-[0.8] font-extrabold tracking-tighter',
  glass: 'text-7xl leading-none font-semibold tracking-tighter text-(color:--t-line)',
  editorial: 'text-sm text-(color:--kit-text-3)',
  soft: 'text-sm font-bold text-(color:--t-ink)',
  blueprint: 'w-fit border border-(--kit-rule-strong) px-2 py-0.5 text-sm font-semibold',
  signal: 'text-lg font-semibold',
};

type StateMessageProps = {
  /** What happened, as the page's heading: "This page does not exist". */
  title: string;
  /** Why, and what the reader can do about it. */
  description?: ReactNode;
  /** A status code or short label: "404", "Error 500", "Read only". */
  code?: string;
  /** Icon element for the state. */
  icon?: ReactNode;
  tone?: Tone;
  /** One primary action and at most one alternative. */
  actions?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
  /** Under the actions: details, a reference, a list of alternatives. */
  children?: ReactNode;
};

/**
 * The message of a whole-page state — empty, error, no access, done. Icon, code, heading,
 * explanation and actions, at the look's display scale: the code is a quiet label in studio, a
 * boxed reference on a blueprint and a set of giant numerals on a poster.
 */
export function StateMessage({ title, description, code, icon, tone = 'neutral', actions, align = 'start', className, children }: StateMessageProps) {
  const look = useLook();
  const centered = align === 'center';
  return (
    <div data-look={look} data-tone={tone} className={cx('flex min-w-0 flex-col gap-5', centered && 'items-center text-center', className)}>
      {icon ? (
        <IconChip tone={tone} size="lg">
          {icon}
        </IconChip>
      ) : null}
      <div className={cx('flex flex-col gap-3', centered && 'items-center')}>
        {code ? <p className={cx('tabular-nums', CODE[look])}>{code}</p> : null}
        <h3 className={cx('leading-[1.05] text-balance', TITLE[look])}>{title}</h3>
        {description ? (
          <p className={cx('max-w-[52ch] text-base text-pretty', look === 'signal' || look === 'poster' ? 'font-medium' : 'text-(color:--kit-text-2)')}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className={cx('flex flex-wrap items-center gap-3', centered && 'justify-center')}>{actions}</div> : null}
      {children}
    </div>
  );
}
