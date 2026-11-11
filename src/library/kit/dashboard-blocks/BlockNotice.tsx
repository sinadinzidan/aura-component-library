import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

type BlockNoticeProps = {
  /** What happened, in a few words: "Could not load alarms". */
  title: string;
  /** What it means and what the reader can do. */
  detail?: string;
  tone?: Tone;
  /** Icon element shown before the title. */
  icon?: ReactNode;
  /** One action that resolves it: retry, open the source. */
  action?: ReactNode;
  /** `banner` is one line above a block; `block` replaces the content of a block. */
  variant?: 'banner' | 'block';
  className?: string;
};

const FILLED: Record<string, boolean> = { signal: true, poster: true };

/**
 * Says that a block is not showing live, complete data — failed, stale or partly missing — where
 * the data would have been. Filled with the state in signal and poster, a tinted strip elsewhere.
 */
export function BlockNotice({ title, detail, tone = 'warning', icon, action, variant = 'banner', className }: BlockNoticeProps) {
  const look = useLook();
  const filled = FILLED[look] ?? false;
  return (
    <div
      role={tone === 'critical' ? 'alert' : 'status'}
      data-look={look}
      data-tone={tone}
      data-variant={variant}
      className={cx(
        'flex min-w-0 gap-3 rounded-(--kit-radius-sm) text-sm',
        filled ? 'bg-(--t-vivid) text-(--t-on-vivid)' : 'bg-(--t-soft) text-(--kit-text)',
        look === 'blueprint' || look === 'editorial' ? 'border border-(--t-line)' : 'border-l-4 border-(--t-line)',
        variant === 'banner' ? 'items-center px-3 py-2.5' : 'h-full flex-col items-start justify-center p-5',
        className
      )}
    >
      {icon ? (
        <span aria-hidden="true" className={cx('shrink-0', filled ? '' : 'text-(--t-ink)', variant === 'banner' ? '[&>svg]:size-5' : '[&>svg]:size-8')}>
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className={cx('font-semibold', variant === 'block' ? 'text-lg leading-6' : 'leading-5')}>{title}</p>
        {detail ? <p className={cx('leading-5', filled ? '' : 'text-(--kit-text-2)', variant === 'block' ? 'mt-1' : '')}>{detail}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
