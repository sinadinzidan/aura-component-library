type NumberCellTone = 'default' | 'warning' | 'critical';

const TONE_TEXT: Record<NumberCellTone, string> = {
  default: 'text-base-foreground',
  warning: 'text-warning-foreground-strong',
  critical: 'text-critical-foreground-strong',
};

type NumberCellProps = {
  /** `null` and `undefined` render the placeholder. */
  value: number | null | undefined;
  /** Fixed number of decimals, so decimal points line up down the column. */
  decimals?: number;
  unit?: string;
  /** Width of the number in characters. Give every cell in a column the same width so digits align. */
  width?: number;
  /** Marks a value that is outside its limits. Pair it with `toneLabel`. */
  tone?: NumberCellTone;
  /** What the tone means, for example "Above high limit". Read by screen readers and shown as a title. */
  toneLabel?: string;
  /** Shown when there is no value. */
  placeholder?: string;
  locale?: string;
};

/**
 * A number in a table cell: tabular digits, a fixed number of decimals, thousands separators and
 * the unit in a quieter colour. The number is right-aligned inside a fixed-width box, so values
 * line up digit by digit while the cell stays under its left-aligned column header.
 */
export function NumberCell({
  value,
  decimals = 0,
  unit,
  width = 6,
  tone = 'default',
  toneLabel,
  placeholder = '—',
  locale = 'en-GB',
}: NumberCellProps) {
  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const text = hasValue
    ? value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : placeholder;

  return (
    <span className="inline-flex items-baseline gap-1 tabular-nums" title={hasValue ? toneLabel : undefined}>
      <span
        className={`inline-block text-right ${hasValue ? TONE_TEXT[tone] : 'text-muted-foreground'} ${tone !== 'default' && hasValue ? 'font-medium' : ''}`}
        style={{ minWidth: `${width}ch` }}
      >
        {text}
      </span>
      {hasValue && unit ? <span className="text-muted-foreground">{unit}</span> : null}
      {hasValue && toneLabel ? <span className="sr-only">, {toneLabel}</span> : null}
    </span>
  );
}
