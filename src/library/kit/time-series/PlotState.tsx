import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type PlotStateProps = {
  /** `loading` draws a moving-free skeleton trace; `empty` and `error` explain themselves in words. */
  state: 'loading' | 'empty' | 'error';
  title: string;
  /** Why, and what happens next. */
  description?: string;
  /** Icon element above the title. */
  icon?: ReactNode;
  /** One action that resolves the state: retry, widen the range. */
  action?: ReactNode;
  /** Same height as the plot it stands in for, so the layout does not jump. */
  height?: number;
  className?: string;
};

const TRACE = 'M0 62 C80 40 120 70 200 52 S320 30 400 48 S520 78 600 56 S720 26 800 44 S920 60 1000 38';

/**
 * What a chart shows when it has no line to draw: a skeleton while loading, a reason when the
 * range is empty, the failure and a way out when the request failed. It keeps the plot's size
 * and its gridlines so the screen does not reflow when data arrives.
 */
export function PlotState({ state, title, description, icon, action, height = 240, className }: PlotStateProps) {
  const look = useLook();
  return (
    <div
      role={state === 'error' ? 'alert' : 'status'}
      aria-busy={state === 'loading'}
      data-look={look}
      data-state={state}
      data-tone={state === 'error' ? 'critical' : 'neutral'}
      className={cx('relative flex min-w-0 items-center justify-center overflow-hidden', className)}
      style={{ height, borderRadius: 'var(--kit-radius-sm)', background: 'color-mix(in oklab, var(--kit-text) 3%, transparent)' }}
    >
      <svg aria-hidden="true" viewBox="0 0 1000 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {[20, 40, 60, 80].map((line) => (
          <line key={line} x1={0} x2={1000} y1={line} y2={line} stroke="var(--kit-grid)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        ))}
        {state === 'loading' ? <path d={TRACE} fill="none" stroke="var(--kit-text-3)" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.3} /> : null}
      </svg>
      <div className="relative flex max-w-sm flex-col items-center gap-2 px-5 py-3 text-center" style={state === 'loading' ? { background: 'var(--kit-surface)', borderRadius: 'var(--kit-radius-sm)', border: '1px solid var(--kit-rule)' } : undefined}>
        {icon ? (
          <span aria-hidden="true" className="flex size-10 items-center justify-center [&>svg]:size-5" style={{ background: 'var(--t-soft)', color: 'var(--t-on-soft)', borderRadius: 'var(--kit-radius-sm)' }}>
            {icon}
          </span>
        ) : null}
        <p className="m-0 text-sm font-semibold text-(--kit-text)">{title}</p>
        {description ? <p className="m-0 text-sm text-(--kit-text-2)">{description}</p> : null}
        {action ? <div className="mt-1">{action}</div> : null}
      </div>
    </div>
  );
}
