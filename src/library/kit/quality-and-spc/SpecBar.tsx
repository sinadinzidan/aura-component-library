import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx, formatNumber } from '../tones';

import { specText, specVerdict } from './spc';

type SpecBarProps = {
  /** The parameter: "Water dew point". */
  label: string;
  value: number;
  /** Lower and upper specification limit; leave one out for a one-sided specification. */
  lsl?: number;
  usl?: number;
  /** Ends of the drawn scale. */
  min: number;
  max: number;
  unit?: string;
  decimals?: number;
  /** Test method or sample point, printed under the label. */
  method?: string;
  className?: string;
};

/**
 * One lab result against its specification: the figure, the verdict in words, and a scale with
 * the allowed window and a pointer at the result. In-spec results stay neutral; only a result
 * outside the window takes the critical colour.
 */
export function SpecBar({ label, value, lsl, usl, min, max, unit = '', decimals = 2, method, className }: SpecBarProps) {
  const look = useLook();
  const verdict = specVerdict(value, lsl, usl);
  const at = (point: number) => Math.min(100, Math.max(0, ((point - min) / (max - min || 1)) * 100));
  const format = (point: number) => formatNumber(point, decimals);
  const from = at(lsl ?? min);
  const to = at(usl ?? max);

  return (
    <div data-look={look} data-tone={verdict.ok ? 'neutral' : 'critical'} data-verdict={verdict.ok ? 'ok' : 'out'} className={cx('min-w-0 text-(--kit-text)', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          {method ? <div className="text-xs text-(--kit-text-2)">{method}</div> : null}
        </div>
        <StatusPill tone={verdict.ok ? 'neutral' : 'critical'}>{verdict.word}</StatusPill>
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={cx('text-2xl leading-7 font-semibold tracking-tight tabular-nums', verdict.ok ? '' : 'text-(--t-ink)')}>{format(value)}</span>
        {unit ? <span className="text-sm font-medium text-(--kit-text-2)">{unit}</span> : null}
        <span className="ml-auto text-xs text-(--kit-text-2) tabular-nums">
          Spec {specText(format, lsl, usl)}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${format(value)}${unit ? ` ${unit}` : ''}, ${verdict.word.toLowerCase()}`}
        className="relative mt-3 h-3 bg-(--kit-track)"
        style={{ borderRadius: 'var(--kit-track-radius)' }}
      >
        <span data-window="" className="absolute inset-y-0 border-x-2 border-(--kit-text) bg-(--kit-text-3)/40" style={{ left: `${from}%`, width: `${to - from}%` }} />
        <span className={cx('absolute -top-1.5 -bottom-1.5 w-1 -translate-x-1/2 rounded-full ring-2 ring-(--kit-halo)', verdict.ok ? 'bg-(--kit-text)' : 'bg-(--t-solid)')} style={{ left: `${at(value)}%` }} />
      </div>
      <div aria-hidden="true" className="mt-1.5 flex justify-between text-xs text-(--kit-text-2) tabular-nums">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}
