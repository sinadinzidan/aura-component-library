import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { pace } from './lines';

type TaktClockProps = {
  /** What is counted: "Actuators, day shift". */
  label: string;
  count: number;
  target: number;
  /** Share of the shift that has passed, 0–1. */
  elapsedShare: number;
  /** Time left, written out: "3 h 10 min left". */
  remaining: string;
  /** Current rate against the rate needed to finish on target, already formatted. */
  rate?: string;
  className?: string;
};

const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

/**
 * The count of a shift against its target, with pace: a very large count, the target beside it,
 * and a bar on which a marker shows where the count should be by now. The verdict says how many
 * parts ahead or behind the line is, which is what the team acts on.
 */
export function TaktClock({ label, count, target, elapsedShare, remaining, rate, className }: TaktClockProps) {
  const look = useLook();
  const result = pace(count, target, elapsedShare);
  const square = SQUARE_LOOKS.includes(look);
  const at = target <= 0 ? 0 : Math.min(100, (count / target) * 100);
  const expectedAt = target <= 0 ? 0 : Math.min(100, (result.expected / target) * 100);

  return (
    <div role="group" aria-label={label} data-look={look} data-tone={result.tone} className={cx('min-w-0 text-(--kit-text)', className)}>
      <p className="text-sm font-medium text-(--kit-text-2)">{label}</p>
      <p className="mt-1 flex items-baseline gap-3 tabular-nums">
        <span className="text-6xl leading-none font-semibold tracking-tight">{formatNumber(count)}</span>
        <span className="text-xl text-(--kit-text-2)">of {formatNumber(target)}</span>
      </p>
      <p className="mt-2 text-base font-semibold text-(--t-ink)">{result.word}</p>
      <div
        role="meter"
        aria-label={`${label}, count against target`}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={count}
        aria-valuetext={`${count} of ${target}, ${result.word.toLowerCase()}`}
        className={cx('relative mt-3 h-4 bg-(--kit-track) ring-1 ring-(--kit-rule) ring-inset', square ? '' : 'rounded-full')}
      >
        <span className={cx('absolute inset-y-0 left-0 bg-(--t-solid)', square ? '' : 'rounded-full')} style={{ width: `${at}%` }} />
        <span className="absolute -inset-y-1.5 w-0.5 bg-(--kit-text)" style={{ left: `${expectedAt}%` }} />
      </div>
      <p className="relative mt-1.5 h-4 text-xs text-(--kit-text-2) tabular-nums">
        <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${Math.max(12, Math.min(88, expectedAt))}%` }}>
          Should be {formatNumber(result.expected)}
        </span>
      </p>
      <p className="mt-3 flex flex-wrap justify-between gap-x-4 text-sm text-(--kit-text-2) tabular-nums">
        <span>{remaining}</span>
        {rate ? <span>{rate}</span> : null}
      </p>
    </div>
  );
}
