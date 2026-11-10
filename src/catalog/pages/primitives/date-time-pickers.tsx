import { Button } from '@cognite/aura/components/button';
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
  TimePicker,
  TimeRangePicker,
} from '@cognite/aura/components/date-time-pickers';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconRefresh, IconX } from '@cognite/aura/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { DateRangePresetPicker } from '../../../library/navigation/DateRangePresetPicker';
import type { DateRange } from '../../../library/navigation/DateRangePresetPicker';
import { REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './date-time-pickers.tsx?raw';

type Range = [Dayjs | null, Dayjs | null];

/** The fixed "now" of the catalog, 12 March 2026 at 14:00, as a local time so every time zone agrees. */
function referenceNow(): Dayjs {
  const date = new Date(REFERENCE_NOW);
  return dayjs(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()));
}

const NOW = referenceNow();
const TODAY = NOW.startOf('day');

/** Written dates, as Aura's content guidelines prefer: "12 Mar 2026". */
const WRITTEN = 'D MMM YYYY';

/** A custom format replaces the whole display value, so date-and-time pickers must spell out the time. */
const WRITTEN_WITH_TIME = 'D MMM YYYY HH:mm';

type PickerFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
};

/** Label, picker and helper text. The pickers take no `id`, so the label names a group around them. */
function PickerField({ id, label, required, hint, error, children }: PickerFieldProps) {
  return (
    <div role="group" aria-labelledby={id} className="w-full">
      <Label id={id} required={required}>
        {label}
      </Label>
      {children}
      {error || hint ? <HelperText isError={Boolean(error)}>{error ?? hint}</HelperText> : null}
    </div>
  );
}

function DateTimePickersDate() {
  const [value, setValue] = useState<Dayjs | null>(TODAY);

  return (
    <div className="w-56">
      <DatePicker value={value} onChange={setValue} />
    </div>
  );
}

function DateTimePickersTime() {
  const [value, setValue] = useState<Dayjs | null>(NOW);

  return (
    <div className="w-56">
      <TimePicker value={value} onChange={setValue} />
    </div>
  );
}

function DateTimePickersDateTime() {
  const [value, setValue] = useState<Dayjs | null>(NOW);

  return (
    <div className="w-56">
      <DateTimePicker value={value} onChange={setValue} />
    </div>
  );
}

function DateTimePickersDateRange() {
  const [value, setValue] = useState<Range>([TODAY.subtract(6, 'day'), TODAY]);

  return (
    <div className="w-72">
      <DateRangePicker value={value} onChange={setValue} />
    </div>
  );
}

function DateTimePickersTimeRange() {
  const [value, setValue] = useState<Range>([TODAY.hour(7), TODAY.hour(19)]);

  return (
    <div className="w-72">
      <TimeRangePicker value={value} onChange={setValue} />
    </div>
  );
}

function DateTimePickersDateTimeRange() {
  const [value, setValue] = useState<Range>([NOW.subtract(1, 'day'), NOW]);

  return (
    <div className="w-full">
      <DateTimeRangePicker value={value} onChange={setValue} />
    </div>
  );
}

function DateTimePickersWrittenFormat() {
  const [value, setValue] = useState<Dayjs | null>(TODAY);

  return (
    <div className="w-56">
      <DatePicker value={value} onChange={setValue} format={WRITTEN} />
    </div>
  );
}

function DateTimePickersIsoFormat() {
  const [value, setValue] = useState<Dayjs | null>(TODAY);

  return (
    <div className="w-56">
      <DatePicker value={value} onChange={setValue} format="YYYY-MM-DD" />
    </div>
  );
}

function DateTimePickersTwelveHour() {
  const [value, setValue] = useState<Dayjs | null>(NOW);

  return (
    <div className="w-56">
      <TimePicker value={value} onChange={setValue} timeFormat="12h" />
    </div>
  );
}

function DateTimePickersWeekNumbers() {
  const [value, setValue] = useState<Dayjs | null>(TODAY);

  return (
    <div className="w-56">
      <DatePicker value={value} onChange={setValue} format={WRITTEN} displayWeekNumber />
    </div>
  );
}

function DateTimePickersEmpty() {
  const [value, setValue] = useState<Dayjs | null>(null);

  return (
    <div className="w-56">
      <DatePicker value={value} onChange={setValue} format={WRITTEN} placeholder="Select a due date" />
    </div>
  );
}

function DateTimePickersDefaultMonth() {
  const [value, setValue] = useState<Dayjs | null>(null);

  return (
    <div className="flex w-56 flex-col">
      <DatePicker
        value={value}
        onChange={setValue}
        format={WRITTEN}
        placeholder="Turnaround start"
        defaultDate={TODAY.add(3, 'month').startOf('month')}
      />
      <HelperText>Opens on June 2026, when the turnaround is planned.</HelperText>
    </div>
  );
}

function DateTimePickersNativeDate() {
  const [value, setValue] = useState<Date | null>(new Date(Date.UTC(2026, 2, 12)));

  return (
    <div className="flex w-56 flex-col">
      <DatePicker<Date> value={value} onChange={setValue} valueType="date" format="YYYY-MM-DD" />
      <HelperText>
        <span className="font-mono">{value ? value.toISOString().slice(0, 10) : 'null'}</span>
      </HelperText>
    </div>
  );
}

function DateTimePickersDateShortcuts() {
  const [value, setValue] = useState<Dayjs | null>(TODAY.add(1, 'day'));

  return (
    <div className="w-56">
      <DatePicker
        value={value}
        onChange={setValue}
        format={WRITTEN}
        shortcuts={[
          { id: 'today', label: 'Today', getValue: () => TODAY },
          { id: 'tomorrow', label: 'Tomorrow', getValue: () => TODAY.add(1, 'day') },
          { id: 'week', label: 'In one week', getValue: () => TODAY.add(7, 'day') },
          { id: 'month-end', label: 'End of month', getValue: () => TODAY.endOf('month').startOf('day') },
        ]}
      />
    </div>
  );
}

function DateTimePickersRangeShortcuts() {
  const [value, setValue] = useState<Range>([TODAY.subtract(6, 'day'), TODAY]);

  return (
    <div className="w-72">
      <DateRangePicker
        value={value}
        onChange={setValue}
        format={WRITTEN}
        shortcuts={[
          { id: '7d', label: 'Last 7 days', getValue: () => [TODAY.subtract(6, 'day'), TODAY] },
          { id: '30d', label: 'Last 30 days', getValue: () => [TODAY.subtract(29, 'day'), TODAY] },
          { id: 'month', label: 'This month', getValue: () => [TODAY.startOf('month'), TODAY] },
          {
            id: 'last-month',
            label: 'Last month',
            getValue: () => [
              TODAY.subtract(1, 'month').startOf('month'),
              TODAY.subtract(1, 'month').endOf('month').startOf('day'),
            ],
          },
        ]}
      />
    </div>
  );
}

function DateTimePickersTimeShortcuts() {
  const [value, setValue] = useState<Dayjs | null>(TODAY.hour(7));

  return (
    <div className="w-56">
      <TimePicker
        value={value}
        onChange={setValue}
        shortcuts={[
          { id: 'day', label: 'Day shift start', getValue: () => TODAY.hour(7) },
          { id: 'noon', label: 'Midday handover', getValue: () => TODAY.hour(13) },
          { id: 'night', label: 'Night shift start', getValue: () => TODAY.hour(19) },
        ]}
      />
    </div>
  );
}

function DateTimePickersTrendShortcuts() {
  const [value, setValue] = useState<Range>([NOW.subtract(8, 'hour'), NOW]);

  return (
    <div className="w-full max-w-sm">
      <DateTimeRangePicker
        value={value}
        onChange={setValue}
        format={WRITTEN_WITH_TIME}
        shortcuts={[
          { id: '1h', label: 'Last hour', getValue: () => [NOW.subtract(1, 'hour'), NOW] },
          { id: '8h', label: 'Last 8 hours', getValue: () => [NOW.subtract(8, 'hour'), NOW] },
          { id: '24h', label: 'Last 24 hours', getValue: () => [NOW.subtract(1, 'day'), NOW] },
          { id: '7d', label: 'Last 7 days', getValue: () => [NOW.subtract(7, 'day'), NOW] },
        ]}
      />
    </div>
  );
}

function DateTimePickersWithLabel() {
  const [value, setValue] = useState<Dayjs | null>(TODAY.add(2, 'day'));

  return (
    <div className="w-64">
      <PickerField id="pickers-due-date" label="Due date" hint="The work order turns overdue after this day.">
        <DatePicker value={value} onChange={setValue} format={WRITTEN} />
      </PickerField>
    </div>
  );
}

function DateTimePickersRequired() {
  const [value, setValue] = useState<Dayjs | null>(null);

  return (
    <div className="w-64">
      <PickerField
        id="pickers-isolation-date"
        label="Isolation date"
        required
        error={value ? undefined : 'Select the day the equipment is isolated.'}
      >
        <DatePicker value={value} onChange={setValue} format={WRITTEN} placeholder="Select a date" />
      </PickerField>
    </div>
  );
}

function DateTimePickersOutOfRange() {
  const [value, setValue] = useState<Dayjs | null>(TODAY.subtract(3, 'day'));
  const past = value !== null && value.isBefore(TODAY, 'day');

  return (
    <div className="w-64">
      <PickerField
        id="pickers-planned-start"
        label="Planned start"
        hint="Today or later."
        error={past ? 'Planned start cannot be in the past. Pick 12 Mar 2026 or later.' : undefined}
      >
        <DatePicker value={value} onChange={setValue} format={WRITTEN} />
      </PickerField>
    </div>
  );
}

function DateTimePickersClearable() {
  const [value, setValue] = useState<Dayjs | null>(TODAY.add(9, 'day'));

  return (
    <div className="w-72">
      <PickerField id="pickers-snooze" label="Shelve alarm until" hint="Leave empty to shelve until it clears.">
        <div className="flex items-center gap-1">
          <DateTimePicker value={value} onChange={setValue} format={WRITTEN_WITH_TIME} placeholder="No end time" />
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Clear end time"
                  disabled={value === null}
                  onClick={() => setValue(null)}
                >
                  <IconX />
                </Button>
              }
            />
            <TooltipContent>Clear end time</TooltipContent>
          </Tooltip>
        </div>
      </PickerField>
    </div>
  );
}

function DateTimePickersQuarterHours() {
  const [value, setValue] = useState<Dayjs | null>(TODAY.hour(9).minute(15));

  return (
    <div className="w-64">
      <PickerField id="pickers-slot" label="Crane slot" hint="Slots start every 15 minutes; other times are rounded.">
        <TimePicker
          value={value}
          onChange={(next) => setValue(next ? next.minute(Math.round(next.minute() / 15) * 15).second(0) : null)}
        />
      </PickerField>
    </div>
  );
}

function DateTimePickersRangeLimit() {
  const [value, setValue] = useState<Range>([TODAY.subtract(44, 'day'), TODAY]);
  const [start, end] = value;
  const days = start && end ? end.diff(start, 'day') + 1 : 0;

  return (
    <div className="w-80">
      <PickerField
        id="pickers-export-range"
        label="Export period"
        hint="Up to 31 days of raw data per export."
        error={days > 31 ? `${days} days selected. Shorten the period to 31 days or fewer.` : undefined}
      >
        <DateRangePicker value={value} onChange={setValue} format={WRITTEN} />
      </PickerField>
    </div>
  );
}

function DateTimePickersStartAndEnd() {
  const [start, setStart] = useState<Dayjs | null>(TODAY.add(4, 'day'));
  const [end, setEnd] = useState<Dayjs | null>(TODAY.add(2, 'day'));
  const reversed = start !== null && end !== null && end.isBefore(start, 'day');

  return (
    <div className="grid w-full max-w-md grid-cols-2 gap-4">
      <PickerField id="pickers-permit-from" label="Permit valid from">
        <DatePicker value={start} onChange={setStart} format={WRITTEN} />
      </PickerField>
      <PickerField
        id="pickers-permit-to"
        label="Permit valid to"
        error={reversed ? 'Must be on or after the start date.' : undefined}
      >
        <DatePicker value={end} onChange={setEnd} format={WRITTEN} />
      </PickerField>
    </div>
  );
}

function DateTimePickersScheduleForm() {
  const [date, setDate] = useState<Dayjs | null>(TODAY.add(2, 'day'));
  const [hours, setHours] = useState<Range>([TODAY.hour(8), TODAY.hour(12)]);

  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl bg-base-background p-4">
      <div>
        <h4 className="text-sm font-medium text-base-foreground">Schedule vibration survey</h4>
        <p className="text-sm text-muted-foreground">WO-104466 · 23-KA-9101 · 1st stage compressor</p>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="pickers-crew">Crew</Label>
          <Input id="pickers-crew" defaultValue="Rotating equipment, day shift" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <PickerField id="pickers-survey-date" label="Date" required>
            <DatePicker value={date} onChange={setDate} format={WRITTEN} />
          </PickerField>
          <PickerField id="pickers-survey-hours" label="Working hours, UTC" required>
            <TimeRangePicker value={hours} onChange={setHours} />
          </PickerField>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button disabled={!date || !hours[0] || !hours[1]}>Schedule survey</Button>
      </div>
    </div>
  );
}

function DateTimePickersPresetToolbar() {
  const today = TODAY.toDate();
  const [range, setRange] = useState<DateRange>([TODAY.subtract(6, 'day').toDate(), today]);

  return <DateRangePresetPicker value={range} onChange={setRange} now={today} />;
}

function DateTimePickersChartWindow() {
  const [window, setWindow] = useState<Range>([NOW.subtract(8, 'hour'), NOW]);
  const [start, end] = window;
  const hours = start && end ? end.diff(start, 'hour') : 0;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-medium text-base-foreground">Discharge pressure</h4>
          <p className="text-xs text-muted-foreground">23-PT-92531 · barg</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-96">
            <DateTimeRangePicker
              value={window}
              onChange={setWindow}
              format="D MMM HH:mm"
              shortcuts={[
                { id: '1h', label: 'Last hour', getValue: () => [NOW.subtract(1, 'hour'), NOW] },
                { id: '8h', label: 'Last 8 hours', getValue: () => [NOW.subtract(8, 'hour'), NOW] },
                { id: '24h', label: 'Last 24 hours', getValue: () => [NOW.subtract(1, 'day'), NOW] },
              ]}
            />
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reset to last 8 hours"
                  onClick={() => setWindow([NOW.subtract(8, 'hour'), NOW])}
                >
                  <IconRefresh />
                </Button>
              }
            />
            <TooltipContent>Reset to last 8 hours</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex h-24 items-center justify-center rounded-lg bg-muted-background text-sm text-muted-foreground">
        {hours > 0 ? `Trend for ${hours} ${hours === 1 ? 'hour' : 'hours'} of data` : 'Select a time window'}
      </div>
    </div>
  );
}

export default definePage({
  id: 'date-time-pickers',
  title: 'Date and time pickers',
  summary:
    'Six fields that open a calendar, a time list or both: date, time, date and time, and a range of each. They keep dates well-formed so nobody has to guess a format.',
  docsSlug: 'date-and-time-picker',
  guidance: {
    use: [
      'The narrowest picker that answers the question: a date alone when the time does not matter.',
      'Written dates ("12 Mar 2026") unless the value is copied into code or a query.',
      'Shortcuts for relative ranges such as "Last 7 days" — they cover most filtering.',
      'A label on every picker, and helper text for limits such as the longest range.',
    ],
    avoid: [
      'Two single pickers where a range picker enforces start-before-end for you.',
      'A time picker when both date and time are needed; use the combined picker.',
      'Local time without saying so. Aura shows UTC; put it in the label.',
      'A picker for a fixed or recurring schedule; use an input or a cron expression.',
    ],
  },
  source,
  sections: [
    {
      id: 'pickers',
      title: 'The six pickers',
      description: 'One field per question. Each opens on click and commits a well-formed value.',
      specimens: [
        {
          id: 'DateTimePickersDate',
          title: 'Date',
          note: 'One exact day: a due date, an inspection date.',
          origin: 'aura',
          Component: DateTimePickersDate,
        },
        {
          id: 'DateTimePickersTime',
          title: 'Time',
          note: 'A time of day with no date: a daily report time, a shift start.',
          origin: 'aura',
          Component: DateTimePickersTime,
        },
        {
          id: 'DateTimePickersDateTime',
          title: 'Date and time',
          note: 'One point in time, such as when an alarm is shelved until.',
          origin: 'aura',
          Component: DateTimePickersDateTime,
        },
        {
          id: 'DateTimePickersDateRange',
          title: 'Date range',
          note: 'Filtering and reporting by whole days.',
          origin: 'aura',
          Component: DateTimePickersDateRange,
        },
        {
          id: 'DateTimePickersTimeRange',
          title: 'Time range',
          note: 'Hours within one day: working hours, a maintenance slot.',
          origin: 'aura',
          Component: DateTimePickersTimeRange,
        },
        {
          id: 'DateTimePickersDateTimeRange',
          title: 'Date and time range',
          note: 'Time-series queries, where the window is rarely whole days.',
          origin: 'aura',
          Component: DateTimePickersDateTimeRange,
        },
      ],
    },
    {
      id: 'format-and-options',
      title: 'Format and options',
      description: 'How the value reads in the field, and what the popup shows.',
      specimens: [
        {
          id: 'DateTimePickersWrittenFormat',
          title: 'Written date',
          note: 'The default for people: no day-month ambiguity across regions.',
          origin: 'aura',
          Component: DateTimePickersWrittenFormat,
        },
        {
          id: 'DateTimePickersIsoFormat',
          title: 'ISO date',
          note: 'Values that end up in a query, a file name or an API call.',
          origin: 'aura',
          Component: DateTimePickersIsoFormat,
        },
        {
          id: 'DateTimePickersTwelveHour',
          title: '12-hour time',
          note: 'Only for audiences that read AM and PM; industrial data defaults to 24-hour.',
          origin: 'aura',
          Component: DateTimePickersTwelveHour,
        },
        {
          id: 'DateTimePickersWeekNumbers',
          title: 'Week numbers',
          note: 'Planning that runs on week numbers; they show in the calendar when it opens.',
          origin: 'aura',
          Component: DateTimePickersWeekNumbers,
        },
        {
          id: 'DateTimePickersEmpty',
          title: 'Empty with placeholder',
          note: 'An optional date; the placeholder says what goes here, not the format.',
          origin: 'aura',
          Component: DateTimePickersEmpty,
        },
        {
          id: 'DateTimePickersDefaultMonth',
          title: 'Opens on a set month',
          note: 'An empty field whose likely value is far from today.',
          origin: 'aura',
          Component: DateTimePickersDefaultMonth,
        },
        {
          id: 'DateTimePickersNativeDate',
          title: 'Native Date values',
          note: 'Code that works with Date rather than dayjs; the picker returns what it was given.',
          origin: 'aura',
          Component: DateTimePickersNativeDate,
        },
      ],
    },
    {
      id: 'shortcuts',
      title: 'Shortcuts',
      description: 'Named values beside the calendar. Open each one to see the list.',
      specimens: [
        {
          id: 'DateTimePickersDateShortcuts',
          title: 'Date shortcuts',
          note: 'Deadlines people describe relatively: tomorrow, in a week, end of month.',
          origin: 'aura',
          Component: DateTimePickersDateShortcuts,
        },
        {
          id: 'DateTimePickersTimeShortcuts',
          title: 'Time shortcuts',
          note: 'A few named times cover most picks, such as shift boundaries.',
          origin: 'aura',
          Component: DateTimePickersTimeShortcuts,
        },
        {
          id: 'DateTimePickersRangeShortcuts',
          title: 'Range shortcuts',
          note: 'Report filters, where relative periods beat exact dates.',
          origin: 'aura',
          Component: DateTimePickersRangeShortcuts,
        },
        {
          id: 'DateTimePickersTrendShortcuts',
          title: 'Trend window shortcuts',
          note: 'Charts of live data: last hour, last shift, last day.',
          origin: 'aura',
          size: 'md',
          Component: DateTimePickersTrendShortcuts,
        },
      ],
    },
    {
      id: 'states',
      title: 'Field states',
      description: 'The pickers have no disabled or invalid prop, so the field around them carries the state.',
      specimens: [
        {
          id: 'DateTimePickersWithLabel',
          title: 'Label and helper text',
          note: 'The standard form field: what the date is, and what it affects.',
          origin: 'custom',
          Component: DateTimePickersWithLabel,
        },
        {
          id: 'DateTimePickersRequired',
          title: 'Required and empty',
          note: 'A date the form cannot be saved without; the error says what to pick.',
          origin: 'custom',
          Component: DateTimePickersRequired,
        },
        {
          id: 'DateTimePickersOutOfRange',
          title: 'Outside the allowed dates',
          note: 'There is no minimum or maximum, so validate after the pick and name the limit.',
          origin: 'custom',
          Component: DateTimePickersOutOfRange,
        },
        {
          id: 'DateTimePickersClearable',
          title: 'Clearable',
          note: 'An optional value people need to remove again; the pickers have no clear button.',
          origin: 'custom',
          Component: DateTimePickersClearable,
        },
        {
          id: 'DateTimePickersQuarterHours',
          title: 'Quarter-hour steps',
          note: 'Bookable slots: the picker lists every minute, so round on change and say so.',
          origin: 'custom',
          Component: DateTimePickersQuarterHours,
        },
        {
          id: 'DateTimePickersRangeLimit',
          title: 'Range too long',
          note: 'Exports and queries with a size limit; the error gives the count and the limit.',
          origin: 'custom',
          Component: DateTimePickersRangeLimit,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Pickers in the forms and toolbars they usually live in.',
      specimens: [
        {
          id: 'DateTimePickersStartAndEnd',
          title: 'Separate start and end',
          note: 'When the two dates are separate facts with their own labels, such as a permit.',
          origin: 'custom',
          size: 'md',
          Component: DateTimePickersStartAndEnd,
        },
        {
          id: 'DateTimePickersPresetToolbar',
          title: 'Presets beside a range',
          note: 'Table and chart toolbars: one click for the common ranges, the picker for the rest.',
          origin: 'custom',
          size: 'md',
          uses: ['navigation/DateRangePresetPicker.tsx'],
          Component: DateTimePickersPresetToolbar,
        },
        {
          id: 'DateTimePickersScheduleForm',
          title: 'Scheduling form',
          note: 'A date and working hours side by side, with the commit disabled until both are set.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          Component: DateTimePickersScheduleForm,
        },
        {
          id: 'DateTimePickersChartWindow',
          title: 'Chart time window',
          note: 'The window belongs to the chart header, with a reset back to the default.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: DateTimePickersChartWindow,
        },
      ],
    },
  ],
});
