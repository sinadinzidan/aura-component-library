import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { useId } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

import { judgeReading } from './rounds';

type ReadingEntryProps = {
  /** What is read: "Discharge pressure". */
  label: string;
  unit: string;
  /** The text in the field, as typed. */
  value: string;
  onChange: (value: string) => void;
  low?: number;
  high?: number;
  /** Ends of the gauge the limits are drawn on. */
  min: number;
  max: number;
  decimals?: number;
  /** The reading from the previous round, for comparison. */
  previous?: number;
  className?: string;
};

function position(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

/**
 * A field reading typed against its limits. The entry is large enough for a gloved hand; under it
 * a gauge shows the allowed band with the typed value on it, and the verdict is written out the
 * moment the value is typed, so a reading outside its limits is never saved unnoticed.
 */
export function ReadingEntry({ label, unit, value, onChange, low, high, min, max, decimals = 1, previous, className }: ReadingEntryProps) {
  const look = useLook();
  const id = useId();
  const verdictId = useId();
  const parsed = value.trim() === '' ? undefined : Number(value);
  const verdict = judgeReading(parsed, low, high, decimals);
  const bandFrom = position(low ?? min, min, max);
  const bandTo = position(high ?? max, min, max);
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'signal';

  return (
    <div data-look={look} data-tone={verdict.tone} data-result={verdict.result} className={cx('flex min-w-0 flex-col gap-3 text-(--kit-text)', className)}>
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <Label htmlFor={id}>
            {label} ({unit})
          </Label>
          <Input id={id} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={verdictId} aria-invalid={verdict.result === 'fail' ? true : undefined} />
        </div>
        {previous !== undefined ? (
          <p className="pb-2 text-right text-xs leading-4 text-(--kit-text-2)">
            Last round
            <span className="block text-sm font-semibold text-(--kit-text) tabular-nums">
              {formatNumber(previous, decimals)} {unit}
            </span>
          </p>
        ) : null}
      </div>

      <div aria-hidden="true">
        <div className={cx('relative h-3 bg-(--kit-track)', square ? '' : 'rounded-full')}>
          <span className={cx('kit-tone-success absolute inset-y-0 bg-(--t-soft)', square ? '' : 'rounded-full')} style={{ left: `${bandFrom}%`, width: `${Math.max(0, bandTo - bandFrom)}%` }} />
          {parsed !== undefined && !Number.isNaN(parsed) ? (
            <span className="absolute -inset-y-1.5 w-1 -translate-x-1/2 bg-(--t-solid) ring-2 ring-(--kit-surface)" style={{ left: `${position(parsed, min, max)}%` }} />
          ) : null}
        </div>
        <div className="relative mt-1.5 h-4 text-xs text-(--kit-text-2) tabular-nums">
          <span className="absolute left-0">{formatNumber(min, decimals)}</span>
          {low !== undefined ? (
            <span className="absolute -translate-x-1/2" style={{ left: `${bandFrom}%` }}>
              {formatNumber(low, decimals)}
            </span>
          ) : null}
          {high !== undefined ? (
            <span className="absolute -translate-x-1/2" style={{ left: `${bandTo}%` }}>
              {formatNumber(high, decimals)}
            </span>
          ) : null}
          <span className="absolute right-0">{formatNumber(max, decimals)}</span>
        </div>
      </div>

      <p id={verdictId} role="status" className={cx('px-3 py-2 text-sm font-semibold', square ? '' : 'rounded-(--kit-radius-sm)', verdict.result === 'pending' ? 'bg-(--kit-well) text-(--kit-text-2)' : 'bg-(--t-soft) text-(--t-on-soft)')}>
        {verdict.text}
      </p>
    </div>
  );
}
