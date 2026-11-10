import { Count, CountUnit, CountValue } from '@cognite/aura/components/count';
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from '@cognite/aura/icons';

type Direction = 'up' | 'down' | 'flat';
type Outcome = 'better' | 'worse' | 'neutral';

const OUTCOME_TEXT: Record<Outcome, string> = {
  better: 'text-success-foreground-strong',
  worse: 'text-critical-foreground-strong',
  neutral: 'text-muted-foreground',
};

const DIRECTION_ICON: Record<Direction, typeof IconMinus> = {
  up: IconArrowUpRight,
  down: IconArrowDownRight,
  flat: IconMinus,
};

function defaultFormat(value: number, decimals: number): string {
  return value.toFixed(decimals);
}

type StatDeltaProps = {
  label: string;
  value: number;
  /** The value it is compared with, for example the previous shift. */
  previous: number;
  unit?: string;
  decimals?: number;
  /** Which direction is an improvement. `neither` keeps the change neutral. */
  betterWhen?: 'higher' | 'lower' | 'neither';
  /** What `previous` refers to, for example "vs last shift". */
  comparison?: string;
  format?: (value: number, decimals: number) => string;
};

/**
 * A Count with its label and the change since a previous value. It works out the direction and
 * whether that direction is good, so status colour is only used when the change means something.
 */
export function StatDelta({
  label,
  value,
  previous,
  unit,
  decimals = 0,
  betterWhen = 'neither',
  comparison = 'vs previous',
  format = defaultFormat,
}: StatDeltaProps) {
  const delta = Number((value - previous).toFixed(decimals));
  const direction: Direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const improved = (direction === 'up' && betterWhen === 'higher') || (direction === 'down' && betterWhen === 'lower');
  const outcome: Outcome = direction === 'flat' || betterWhen === 'neither' ? 'neutral' : improved ? 'better' : 'worse';
  const Icon = DIRECTION_ICON[direction];
  const change = direction === 'flat' ? 'No change' : `${delta > 0 ? '+' : '−'}${format(Math.abs(delta), decimals)}`;

  return (
    <div className="flex items-center gap-3">
      <Count>
        <CountValue>{format(value, decimals)}</CountValue>
        {unit ? <CountUnit>{unit}</CountUnit> : null}
      </Count>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-base-foreground">{label}</span>
        <span className={`flex items-center gap-1 text-xs tabular-nums ${OUTCOME_TEXT[outcome]}`} data-outcome={outcome}>
          <Icon aria-hidden="true" className="size-3.5" />
          {change}
          <span className="text-muted-foreground">{comparison}</span>
        </span>
      </div>
    </div>
  );
}
