import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';

export type TimeRangeOption = {
  /** Stable id, also the value reported on change: "24h". */
  value: string;
  /** Short visible label: "24 h". */
  label: string;
  /** Spoken name: "Last 24 hours". */
  name?: string;
  /** Length of the window in milliseconds, for callers that derive the time domain from the option. */
  spanMs?: number;
  disabled?: boolean;
};

export type TimeRangeSwitchProps = {
  options?: readonly TimeRangeOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name of the group. */
  label?: string;
  size?: 'small' | 'default';
  className?: string;
};

const HOUR = 3_600_000;

/** The ranges an operator reaches for first: this hour, this shift, this day, this week. */
export const DEFAULT_TIME_RANGES: readonly TimeRangeOption[] = [
  { value: '1h', label: '1 h', name: 'Last hour', spanMs: HOUR },
  { value: '8h', label: '8 h', name: 'Last 8 hours', spanMs: 8 * HOUR },
  { value: '24h', label: '24 h', name: 'Last 24 hours', spanMs: 24 * HOUR },
  { value: '7d', label: '7 d', name: 'Last 7 days', spanMs: 7 * 24 * HOUR },
];

/** The option with the given value, or the first option when there is no match. */
export function findTimeRange(options: readonly TimeRangeOption[], value: string): TimeRangeOption | undefined {
  return options.find((option) => option.value === value) ?? options[0];
}

/**
 * Segmented switch between a handful of relative time ranges. Exactly one is always selected, so
 * it suits a chart header; use preset buttons plus a picker when a custom range must be possible.
 */
export function TimeRangeSwitch({
  options = DEFAULT_TIME_RANGES,
  value,
  onValueChange,
  label = 'Time range',
  size = 'small',
  className,
}: TimeRangeSwitchProps) {
  return (
    <SegmentedControl
      value={value}
      onValueChange={(next: unknown) => {
        if (typeof next === 'string') onValueChange(next);
      }}
      className={className}
    >
      <SegmentedControlList aria-label={label} size={size}>
        {options.map((option) => (
          <SegmentedControlButton
            key={option.value}
            value={option.value}
            size={size}
            tabContent="label-only"
            aria-label={option.name}
            disabled={option.disabled}
          >
            {option.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}
