import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

import { LINE_WEIGHT } from './anatomy';

type FlowConnectorProps = {
  /** What moves along the line: a rate, a stream number. */
  label?: string;
  /** `stopped` draws a broken line with no arrow head. */
  state?: 'flowing' | 'stopped';
  tone?: Tone;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

/**
 * The line between two stages, with the direction of flow and what moves along it. Drawn heavy in
 * poster, dashed like a dimension line in blueprint, and broken when nothing flows.
 */
export function FlowConnector({ label, state = 'flowing', tone = 'neutral', orientation = 'horizontal', className }: FlowConnectorProps) {
  const look = useLook();
  const weight = LINE_WEIGHT[look];
  const stopped = state === 'stopped';
  const vertical = orientation === 'vertical';
  const dash = stopped ? '3 5' : look === 'blueprint' ? '7 4' : undefined;
  const head = 5 + weight * 1.5;

  return (
    <div
      data-look={look}
      data-tone={tone}
      data-state={state}
      role="img"
      aria-label={label ? `${stopped ? 'No flow' : 'Flow'}, ${label}` : stopped ? 'No flow' : 'Flow'}
      className={cx('flex min-w-0 shrink-0 items-center justify-center', vertical ? 'h-12 flex-row gap-2' : 'w-full flex-col gap-1', className)}
      style={{ color: stopped ? 'var(--kit-text-3)' : 'var(--t-line)' }}
    >
      {label && !vertical ? <span className="max-w-full text-center text-xs font-medium whitespace-nowrap text-(--kit-text-2) tabular-nums">{label}</span> : null}
      <svg aria-hidden="true" className={vertical ? 'h-full w-4 shrink-0' : 'h-4 w-full'} preserveAspectRatio="none">
        {vertical ? (
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth={weight} strokeDasharray={dash} />
        ) : (
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="currentColor" strokeWidth={weight} strokeDasharray={dash} />
        )}
        {stopped ? null : vertical ? (
          <svg x="50%" y="100%" overflow="visible">
            <path d={`M ${-head} ${-head * 1.4} L 0 0 L ${head} ${-head * 1.4} Z`} fill="currentColor" />
          </svg>
        ) : (
          <svg x="100%" y="50%" overflow="visible">
            <path d={`M ${-head * 1.4} ${-head} L 0 0 L ${-head * 1.4} ${head} Z`} fill="currentColor" />
          </svg>
        )}
      </svg>
      {label && vertical ? <span className="text-xs font-medium whitespace-nowrap text-(--kit-text-2) tabular-nums">{label}</span> : null}
    </div>
  );
}
