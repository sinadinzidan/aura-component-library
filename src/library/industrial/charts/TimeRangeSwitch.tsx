import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';

import { DEFAULT_TIME_RANGES } from './timeRanges';
import type { TimeRangeOption } from './timeRanges';

export type { TimeRangeOption } from './timeRanges';

export type TimeRangeSwitchProps = {
  options?: readonly TimeRangeOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name of the group. */
  label?: string;
  size?: 'small' | 'default';
  className?: string;
};

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
