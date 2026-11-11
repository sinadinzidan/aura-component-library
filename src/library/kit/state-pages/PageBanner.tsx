import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

const SURFACE: Record<LookId, string> = {
  studio: 'rounded-(--kit-radius) border border-[color-mix(in_oklab,var(--t-line)_35%,transparent)] bg-[color-mix(in_oklab,var(--t-line)_10%,var(--kit-surface))]',
  console: 'bg-(--t-solid) text-(color:--t-on-solid)',
  poster: 'border-2 border-(--kit-rule-strong) bg-(--t-pop) text-(color:--t-on-pop) shadow-(--kit-panel-shadow)',
  glass: 'rounded-(--kit-radius) border border-[color-mix(in_oklab,var(--t-line)_45%,transparent)] bg-[color-mix(in_oklab,var(--t-line)_18%,transparent)] backdrop-blur-xl',
  editorial: 'border-y-2 border-(--t-line)',
  soft: 'rounded-(--kit-radius) bg-[color-mix(in_oklab,var(--t-soft)_80%,var(--kit-surface))]',
  blueprint: 'border border-(--t-line) bg-(--kit-surface)',
  signal: 'rounded-(--kit-radius) bg-(--t-solid) text-(color:--t-on-solid)',
};

type PageBannerProps = {
  /** The state in a few words: "Archived", "You are offline", "38 rows failed". */
  title: string;
  /** What it means for the page below. */
  children?: ReactNode;
  /** Icon element for the state. */
  icon?: ReactNode;
  tone?: Tone;
  /** The way out: restore, retry, reconnect. */
  action?: ReactNode;
  className?: string;
};

/**
 * A full-width strip that tells the reader the state of the whole page before they read it:
 * read-only, offline, partly failed. A tinted card in studio, a solid block on a console or
 * signal screen, between two coloured rules in editorial.
 */
export function PageBanner({ title, children, icon, tone = 'info', action, className }: PageBannerProps) {
  const look = useLook();
  const solid = look === 'console' || look === 'poster' || look === 'signal';
  return (
    <div role="status" data-look={look} data-tone={tone} className={cx('flex min-w-0 items-center gap-4', look === 'editorial' ? 'py-4' : 'px-5 py-4', SURFACE[look], className)}>
      {icon ? (
        <span aria-hidden="true" className={cx('shrink-0 [&>svg]:size-6', solid ? '' : 'text-(color:--t-line)')}>
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <p className={cx('text-base font-semibold', solid ? '' : 'text-(color:--kit-text)')}>{title}</p>
        {children ? <div className={cx('text-sm', solid ? '' : 'text-(color:--kit-text-2)')}>{children}</div> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
