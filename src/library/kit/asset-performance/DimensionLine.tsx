import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

type DimensionLineProps = {
  /** What is measured: "Health score". */
  label: string;
  value: number;
  /** The full length of the scale the value is drawn against. */
  max: number;
  /** The value as it should be written, with its unit: "72 / 100". */
  display: string;
  /** A reference on the same scale: a target or an action limit. */
  limit?: { value: number; label: string };
  tone?: Tone;
  className?: string;
};

/**
 * A figure drawn the way a drawing gives a length: extension lines, a dimension line with
 * arrowheads whose length is the value, and the number written on the line.
 */
export function DimensionLine({ label, value, max, display, limit, tone = 'accent', className }: DimensionLineProps) {
  const look = useLook();
  const length = Math.min(Math.max(value / max, 0), 1) * 100;
  const limitAt = limit ? Math.min(Math.max(limit.value / max, 0), 1) * 100 : undefined;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={limit ? `${display}, ${limit.label.toLowerCase()} ${limit.value}` : display}
      data-look={look}
      data-tone={tone}
      className={cx('grid min-w-0 grid-cols-[9rem_minmax(0,1fr)] items-center gap-x-4 py-1 text-sm text-(--kit-text)', className)}
    >
      <span className="font-medium">{label}</span>
      <div className="relative h-12">
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-dotted border-(--kit-rule)" />
        <div aria-hidden="true" className="absolute inset-y-1 left-0 border-l border-(--kit-rule-strong)" />
        <div aria-hidden="true" className="absolute inset-y-1 border-l border-(--kit-rule-strong)" style={{ left: `${length}%` }} />
        <div aria-hidden="true" className="absolute top-1/2 left-0 border-t-2 border-(--t-line)" style={{ width: `${length}%` }} />
        <svg aria-hidden="true" viewBox="0 0 8 8" className="absolute top-1/2 left-0 size-2 -translate-y-1/2 fill-(--t-line)">
          <path d="M0 4 8 0v8z" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 8 8" className="absolute top-1/2 size-2 -translate-x-full -translate-y-1/2 fill-(--t-line)" style={{ left: `${length}%` }}>
          <path d="M8 4 0 0v8z" />
        </svg>
        <span
          className="absolute top-0 text-sm leading-5 font-semibold whitespace-nowrap text-(--t-ink) tabular-nums"
          style={length > 45 ? { left: `${length / 2}%`, transform: 'translateX(-50%)' } : { left: `calc(${length}% + 8px)` }}
        >
          {display}
        </span>
        {limit && limitAt !== undefined ? (
          <>
            <div aria-hidden="true" className="absolute top-[42%] bottom-0 border-l border-dashed border-(--kit-text-2)" style={{ left: `${limitAt}%` }} />
            <span
              aria-hidden="true"
              className="absolute bottom-0 text-xs leading-4 whitespace-nowrap text-(--kit-text-2) tabular-nums"
              style={limitAt > 70 ? { right: `calc(${100 - limitAt}% + 5px)` } : { left: `calc(${limitAt}% + 5px)` }}
            >
              {limit.label} {limit.value}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}
