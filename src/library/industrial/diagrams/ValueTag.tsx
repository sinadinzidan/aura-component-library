import { cn } from '../../../lib/utils';
import { formatValue } from '../status';
import type { Tone } from '../status';

import { estimateTextWidth } from './diagramGeometry';
import type { Point } from './diagramGeometry';

export type ValueTagProps = {
  /** Anchor point in diagram units: the top edge, at the side `anchor` names. */
  x: number;
  y: number;
  anchor?: 'start' | 'middle' | 'end';
  /** Small line above the value: an instrument tag or a short name. */
  label?: string;
  /** Sets the label in monospace, for tags. */
  mono?: boolean;
  /** `null` prints an em dash. */
  value: number | null;
  unit?: string;
  decimals?: number;
  /** Tints the callout. Leave neutral unless the reading is outside its limits. */
  tone?: Tone;
  /** Limit state in letters, such as H or HH, so the state does not rest on colour. */
  flag?: string;
  /** Draws a thin leader from the callout to the point it measures. */
  leaderTo?: Point;
  /** Fixed width in diagram units; estimated from the text when left out. */
  width?: number;
  className?: string;
};

const BOX: Record<Tone, string> = {
  neutral: 'fill-muted-background',
  success: 'fill-success-background',
  warning: 'fill-warning-background',
  critical: 'fill-critical-background',
  info: 'fill-info-background',
};

const VALUE: Record<Tone, string> = {
  neutral: 'fill-base-foreground',
  success: 'fill-success-foreground',
  warning: 'fill-warning-foreground',
  critical: 'fill-critical-foreground',
  info: 'fill-info-foreground',
};

const QUIET: Record<Tone, string> = {
  neutral: 'fill-muted-foreground',
  success: 'fill-success-foreground',
  warning: 'fill-warning-foreground',
  critical: 'fill-critical-foreground',
  info: 'fill-info-foreground',
};

const PADDING = 6;
const LABEL_SIZE = 9;
const VALUE_SIZE = 12;
const UNIT_SIZE = 10;

/**
 * A live value callout on a diagram: optional tag, number, unit and a limit flag. Neutral while
 * the reading is normal; tinted with a letter flag when it is not. Draw it inside a
 * `DiagramCanvas`.
 */
export function ValueTag({
  x,
  y,
  anchor = 'start',
  label,
  mono = false,
  value,
  unit,
  decimals = 0,
  tone = 'neutral',
  flag,
  leaderTo,
  width,
  className,
}: ValueTagProps) {
  const text = formatValue(value, decimals);
  const valueWidth =
    estimateTextWidth(text, VALUE_SIZE) + (unit ? estimateTextWidth(unit, UNIT_SIZE) + 3 : 0) + (flag ? estimateTextWidth(flag, UNIT_SIZE) + 5 : 0);
  const labelWidth = label ? estimateTextWidth(label, LABEL_SIZE, mono) : 0;
  const boxWidth = width ?? Math.ceil(Math.max(valueWidth, labelWidth) + PADDING * 2);
  const boxHeight = label ? 32 : 20;
  const left = anchor === 'start' ? x : anchor === 'middle' ? x - boxWidth / 2 : x - boxWidth;
  const leaderFrom = leaderTo ? { x: left + boxWidth / 2, y: leaderTo.y < y ? y : y + boxHeight } : null;

  return (
    <g data-slot="value-tag" data-tone={tone} className={className}>
      {leaderTo && leaderFrom ? (
        <path
          data-slot="value-tag-leader"
          d={`M ${leaderFrom.x} ${leaderFrom.y} L ${leaderTo.x} ${leaderTo.y}`}
          strokeWidth={1}
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
          className="stroke-muted-foreground"
        />
      ) : null}
      <rect data-slot="value-tag-box" x={left} y={y} width={boxWidth} height={boxHeight} rx={4} className={BOX[tone]} />
      {label ? (
        <text data-slot="value-tag-label" x={left + PADDING} y={y + 11} fontSize={LABEL_SIZE} className={cn(QUIET[tone], mono && 'font-mono')}>
          {label}
        </text>
      ) : null}
      <text x={left + PADDING} y={y + boxHeight - 6} fontSize={VALUE_SIZE} className={cn('font-medium tabular-nums', VALUE[tone])}>
        <tspan data-slot="value-tag-value">{text}</tspan>
        {unit ? (
          <tspan dx={3} fontSize={UNIT_SIZE} className={cn('font-normal', QUIET[tone])}>
            {unit}
          </tspan>
        ) : null}
        {flag ? (
          <tspan data-slot="value-tag-flag" dx={5} fontSize={UNIT_SIZE} className="font-semibold">
            {flag}
          </tspan>
        ) : null}
      </text>
    </g>
  );
}
