import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type StatPlaceholderKind = 'loading' | 'empty' | 'bad' | 'stale';

type StatPlaceholderProps = {
  /** The figure that is missing: "Bearing temperature". */
  label: string;
  kind: StatPlaceholderKind;
  /** One line on why and what happens next: "Signal lost at 05:02". */
  message?: string;
  /** The last trusted value, already formatted with its unit. Shown for `bad` and `stale`. */
  lastValue?: string;
  /** Icon element shown with the state word. */
  icon?: ReactNode;
  /** One action that resolves the state, usually a small button. */
  action?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const KIND_WORD: Record<StatPlaceholderKind, string> = {
  loading: 'Loading',
  empty: 'No data',
  bad: 'Bad signal',
  stale: 'Not updating',
};

const KIND_TONE: Record<StatPlaceholderKind, Tone> = {
  loading: 'neutral',
  empty: 'neutral',
  bad: 'critical',
  stale: 'warning',
};

/**
 * A KPI tile that has no figure to show. It keeps the tile's footprint so the row does not jump:
 * bars where the number will be while loading, a dash and a reason when there is no data, and the
 * last trusted value struck through when the signal is bad or has stopped updating.
 */
export function StatPlaceholder({ label, kind, message, lastValue, icon, action, size = 'md', className }: StatPlaceholderProps) {
  const look = useLook();
  const tone = KIND_TONE[kind];

  return (
    <div
      role="group"
      aria-label={label}
      aria-busy={kind === 'loading' ? true : undefined}
      data-look={look}
      data-tone={tone}
      data-size={size}
      data-variant="tile"
      data-kind={kind}
      className={cx('kit-stat', className)}
    >
      <div className="kit-stat-head">
        <span className="kit-stat-label">{label}</span>
      </div>
      {kind === 'loading' ? (
        <div className="col-span-2 flex flex-col gap-2.5 py-1">
          <span className="sr-only">Loading</span>
          <span aria-hidden="true" className="h-8 w-28 animate-pulse rounded-(--kit-radius-sm) bg-(--kit-track)" />
          <span aria-hidden="true" className="h-3.5 w-40 max-w-full animate-pulse rounded-(--kit-radius-sm) bg-(--kit-track)" />
        </div>
      ) : (
        <>
          <div className="kit-stat-figure">
            {lastValue && kind !== 'empty' ? (
              <s className="kit-stat-value text-(--kit-text-3) decoration-1">{lastValue}</s>
            ) : (
              <span aria-hidden="true" className="kit-stat-value opacity-60">
                —
              </span>
            )}
          </div>
          <div className="col-span-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-(--t-ink) [&_svg]:size-4">
              {icon}
              {KIND_WORD[kind]}
            </span>
            {message ? <span className="text-(--kit-text-2)">{message}</span> : null}
          </div>
          {action ? <div className="col-span-2 mt-2">{action}</div> : null}
        </>
      )}
    </div>
  );
}
