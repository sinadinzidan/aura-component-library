import { Button } from '@cognite/aura/components/button';
import { DateRangePicker } from '@cognite/aura/components/date-time-pickers';

export type DateRangePreset = {
  id: string;
  /** Short label for the preset button: "7 d", "30 d". */
  label: string;
  /** Accessible name: "Last 7 days". */
  name: string;
  /** Number of days covered, counting today. */
  days: number;
};

export type DateRange = [Date | null, Date | null];

type DateRangePresetPickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** "Today" for the presets. Injected so the component never reads the clock itself. */
  now: Date;
  presets?: readonly DateRangePreset[];
  /** dayjs display format for the custom range. */
  format?: string;
  /** Accessible name for the group of presets. */
  label?: string;
};

const DEFAULT_PRESETS: readonly DateRangePreset[] = [
  { id: '1d', label: 'Today', name: 'Today', days: 1 },
  { id: '7d', label: '7 d', name: 'Last 7 days', days: 7 },
  { id: '30d', label: '30 d', name: 'Last 30 days', days: 30 },
  { id: '90d', label: '90 d', name: 'Last 90 days', days: 90 },
];

function startOfDay(date: Date, offsetDays = 0): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offsetDays);
}

function isSameDay(a: Date | null, b: Date): boolean {
  return a !== null && startOfDay(a).getTime() === startOfDay(b).getTime();
}

function rangeOf(preset: DateRangePreset, now: Date): [Date, Date] {
  return [startOfDay(now, 1 - preset.days), startOfDay(now)];
}

/**
 * Relative presets next to a custom date range, for chart and table toolbars. One click covers the
 * common ranges; the picker handles the rest. The preset that matches the current range shows as
 * pressed, and picking custom dates releases it.
 */
export function DateRangePresetPicker({
  value,
  onChange,
  now,
  presets = DEFAULT_PRESETS,
  format = 'D MMM YYYY',
  label = 'Date range',
}: DateRangePresetPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="group" aria-label={label} className="flex items-center gap-1">
        {presets.map((preset) => {
          const [start, end] = rangeOf(preset, now);
          const pressed = isSameDay(value[0], start) && isSameDay(value[1], end);
          return (
            <Button
              key={preset.id}
              variant={pressed ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={pressed}
              aria-label={preset.name}
              onClick={() => onChange([start, end])}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
      <div className="w-64">
        <DateRangePicker<Date>
          value={value}
          onChange={onChange}
          valueType="date"
          defaultDate={now}
          format={format}
        />
      </div>
    </div>
  );
}
