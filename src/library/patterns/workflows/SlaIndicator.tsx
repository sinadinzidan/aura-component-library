import { IconAlertTriangle, IconClock, IconClockExclamation } from '@cognite/aura/icons';

export type SlaState = 'on-track' | 'due-soon' | 'overdue';

export type SlaIndicatorProps = {
  /** What the clock measures: "Time to decide". */
  label: string;
  /** The time left or past, already formatted: "5 h 20 min left", "2 h overdue". */
  remaining: string;
  /** Share of the allowed time that has passed, 0–1. Values above 1 fill the bar. */
  elapsed: number;
  state: SlaState;
  /** The deadline, already formatted: "Due 12 Mar, 20:00". */
  due?: string;
};

const STATES = {
  'on-track': { word: 'On track', Icon: IconClock, text: 'text-muted-foreground', fill: 'bg-chart-neutral-450' },
  'due-soon': { word: 'Due soon', Icon: IconClockExclamation, text: 'text-warning-foreground-strong', fill: 'bg-chart-warning-450' },
  overdue: { word: 'Overdue', Icon: IconAlertTriangle, text: 'text-critical-foreground-strong', fill: 'bg-chart-critical-450' },
} as const;

/**
 * How much of a response time is used up: the time left in words, a bar that fills as the
 * deadline nears, and a state word with an icon. Stays neutral while on track; colour arrives
 * with "Due soon" and "Overdue".
 */
export function SlaIndicator({ label, remaining, elapsed, state, due }: SlaIndicatorProps) {
  const { word, Icon, text, fill } = STATES[state];
  const share = Math.min(1, Math.max(0, elapsed));

  return (
    <div data-slot="sla-indicator" data-state={state} className="flex w-full min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`flex items-center gap-1 text-xs font-medium ${text}`}>
          <Icon aria-hidden="true" className="size-3.5 shrink-0 self-center" />
          {word}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(share * 100)}
        aria-valuetext={`${remaining}, ${word.toLowerCase()}`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-medium-background"
      >
        <div className={`h-full rounded-full ${fill}`} style={{ width: `${Math.round(share * 1000) / 10}%` }} />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-medium tabular-nums text-base-foreground">{remaining}</span>
        {due ? <span className="text-xs tabular-nums text-muted-foreground">{due}</span> : null}
      </div>
    </div>
  );
}
