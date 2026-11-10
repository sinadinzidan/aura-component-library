import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Calendar } from '@cognite/aura/components/calendar';
import { TimePicker } from '@cognite/aura/components/date-time-pickers';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconCalendar } from '@cognite/aura/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';

import { WORK_ORDERS, findAsset } from '../../data/plant';
import { REFERENCE_NOW } from '../../data/series';
import { definePage } from '../../types';

import source from './calendar.tsx?raw';

type Range = [Dayjs | null, Dayjs | null];

/** The calendar day of a UTC timestamp, as a local date, so every time zone renders the same grid. */
function utcDay(timestamp: number): Dayjs {
  const date = new Date(timestamp);
  return dayjs(new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** 12 March 2026, the fixed "today" of the catalog. */
const TODAY = utcDay(REFERENCE_NOW);

const DATE_FORMAT = 'D MMM YYYY';

/** First click starts a range, second click ends it, a third starts over. */
function nextRange([start, end]: Range, day: Dayjs): Range {
  if (!start || end) return [day, null];
  return day.isBefore(start, 'day') ? [day, start] : [start, day];
}

function formatRange([start, end]: Range): string {
  if (!start) return 'No dates selected';
  if (!end) return `${start.format(DATE_FORMAT)} – pick an end date`;
  return `${start.format(DATE_FORMAT)} – ${end.format(DATE_FORMAT)}`;
}

function CalendarSingle() {
  const [date, setDate] = useState<Dayjs>(TODAY);
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <Calendar
      displayedMonth={month}
      selectedRange={[date, date]}
      hoverDate={null}
      onDateClick={setDate}
      onMonthChange={setMonth}
    />
  );
}

function CalendarRange() {
  const [range, setRange] = useState<Range>([TODAY.subtract(6, 'day'), TODAY]);
  const [hover, setHover] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <Calendar
      displayedMonth={month}
      selectedRange={range}
      hoverDate={hover}
      onDateClick={(day) => setRange(nextRange(range, day))}
      onDateHover={setHover}
      onMonthChange={setMonth}
    />
  );
}

function CalendarUnselected() {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <Calendar
      displayedMonth={month}
      selectedRange={[date, date]}
      hoverDate={null}
      onDateClick={setDate}
      onMonthChange={setMonth}
    />
  );
}

function CalendarClearable() {
  const [date, setDate] = useState<Dayjs | null>(TODAY.add(6, 'day'));
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <div className="flex flex-col items-center gap-3">
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={(day) => setDate(date?.isSame(day, 'day') ? null : day)}
        onMonthChange={setMonth}
      />
      <p className="text-sm text-muted-foreground">
        {date ? `Due ${date.format(DATE_FORMAT)}. Select it again to clear.` : 'No due date'}
      </p>
    </div>
  );
}

function CalendarWholeWeek() {
  const [weekStart, setWeekStart] = useState<Dayjs>(TODAY.startOf('week'));
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <Calendar
      displayedMonth={month}
      selectedRange={[weekStart, weekStart.add(6, 'day')]}
      hoverDate={null}
      displayWeekNumber
      onDateClick={(day) => setWeekStart(day.startOf('week'))}
      onMonthChange={setMonth}
    />
  );
}

function CalendarWeekNumbers() {
  const [date, setDate] = useState<Dayjs>(TODAY);
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <Calendar
      displayedMonth={month}
      selectedRange={[date, date]}
      hoverDate={null}
      displayWeekNumber
      onDateClick={setDate}
      onMonthChange={setMonth}
    />
  );
}

function CalendarOtherMonth() {
  const turnaround = TODAY.add(2, 'month').date(8);
  const [date, setDate] = useState<Dayjs>(turnaround);
  const [month, setMonth] = useState<Dayjs>(turnaround);

  return (
    <Calendar
      displayedMonth={month}
      selectedRange={[date, date]}
      hoverDate={null}
      onDateClick={setDate}
      onMonthChange={setMonth}
    />
  );
}

function CalendarJumpToToday() {
  const [date, setDate] = useState<Dayjs>(TODAY.subtract(2, 'month').date(20));
  const [month, setMonth] = useState<Dayjs>(TODAY.subtract(2, 'month'));

  return (
    <div className="flex flex-col items-center gap-3">
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={setDate}
        onMonthChange={setMonth}
      />
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDate(TODAY);
            setMonth(TODAY);
          }}
        >
          Go to today
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setMonth(date)}>
          Show selected date
        </Button>
      </div>
    </div>
  );
}

function CalendarTwoMonths() {
  const [range, setRange] = useState<Range>([TODAY.add(9, 'day'), TODAY.add(27, 'day')]);
  const [hover, setHover] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <div className="flex flex-wrap justify-center gap-8">
      <Calendar
        displayedMonth={month}
        selectedRange={range}
        hoverDate={hover}
        onDateClick={(day) => setRange(nextRange(range, day))}
        onDateHover={setHover}
        onMonthChange={setMonth}
      />
      <Calendar
        displayedMonth={month.add(1, 'month')}
        selectedRange={range}
        hoverDate={hover}
        onDateClick={(day) => setRange(nextRange(range, day))}
        onDateHover={setHover}
        onMonthChange={(next) => setMonth(next.subtract(1, 'month'))}
      />
    </div>
  );
}

function CalendarReadOnly() {
  const shutdown: Range = [TODAY.add(11, 'day'), TODAY.add(15, 'day')];
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <div className="flex flex-col items-center gap-3">
      <Calendar
        displayedMonth={month}
        selectedRange={shutdown}
        hoverDate={null}
        onDateClick={() => undefined}
        onMonthChange={setMonth}
      />
      <p className="text-sm text-muted-foreground">Planned shutdown, gas compression. {formatRange(shutdown)}</p>
    </div>
  );
}

function CalendarMinMax() {
  const earliest = TODAY;
  const latest = TODAY.add(14, 'day');
  const [date, setDate] = useState<Dayjs>(TODAY.add(2, 'day'));
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [rejected, setRejected] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={(day) => {
          const allowed = !day.isBefore(earliest, 'day') && !day.isAfter(latest, 'day');
          setRejected(!allowed);
          if (allowed) setDate(day);
        }}
        onMonthChange={setMonth}
      />
      <HelperText isError={rejected}>
        Pick a date from {earliest.format('D MMM')} to {latest.format(DATE_FORMAT)}.
      </HelperText>
    </div>
  );
}

function CalendarBlockedWeekdays() {
  const [date, setDate] = useState<Dayjs>(TODAY);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [rejected, setRejected] = useState<Dayjs | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={(day) => {
          const weekend = day.day() === 0 || day.day() === 6;
          setRejected(weekend ? day : null);
          if (!weekend) setDate(day);
        }}
        onMonthChange={setMonth}
      />
      <HelperText isError={rejected !== null}>
        {rejected
          ? `${rejected.format('dddd D MMM')} is not a working day. Crews work Monday to Friday.`
          : 'Crews work Monday to Friday.'}
      </HelperText>
    </div>
  );
}

function CalendarFutureOnly() {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [rejected, setRejected] = useState(false);

  return (
    <div className="flex flex-col items-center gap-2">
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={(day) => {
          const past = day.isBefore(TODAY, 'day');
          setRejected(past);
          if (!past) setDate(day);
        }}
        onMonthChange={(next) => setMonth(next.isBefore(TODAY, 'month') ? TODAY : next)}
      />
      <HelperText isError={rejected}>
        {rejected ? 'A deadline cannot be in the past.' : 'Earlier months are not shown.'}
      </HelperText>
    </div>
  );
}

function CalendarCappedRange() {
  const maxDays = 14;
  const [range, setRange] = useState<Range>([TODAY.subtract(13, 'day'), TODAY]);
  const [hover, setHover] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [capped, setCapped] = useState(false);

  const pick = (day: Dayjs) => {
    const [start, end] = nextRange(range, day);
    if (start && end && end.diff(start, 'day') >= maxDays) {
      setCapped(true);
      setRange([start, start.add(maxDays - 1, 'day')]);
      return;
    }
    setCapped(false);
    setRange([start, end]);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Calendar
        displayedMonth={month}
        selectedRange={range}
        hoverDate={hover}
        onDateClick={pick}
        onDateHover={setHover}
        onMonthChange={setMonth}
      />
      <HelperText isError={capped}>
        {capped ? 'Shortened to 14 days, the longest raw-data export.' : 'Up to 14 days of raw data per export.'}
      </HelperText>
    </div>
  );
}

function CalendarWithFooter() {
  const [applied, setApplied] = useState<Dayjs>(TODAY);
  const [draft, setDraft] = useState<Dayjs>(TODAY.add(4, 'day'));
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const changed = !draft.isSame(applied, 'day');

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        displayedMonth={month}
        selectedRange={[draft, draft]}
        hoverDate={null}
        onDateClick={setDraft}
        onMonthChange={setMonth}
      />
      <div className="flex items-center justify-between gap-2 border-t border-default pt-3">
        <span className="text-sm text-muted-foreground">{draft.format(DATE_FORMAT)}</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={!changed} onClick={() => setDraft(applied)}>
            Reset
          </Button>
          <Button size="sm" disabled={!changed} onClick={() => setApplied(draft)}>
            Apply date
          </Button>
        </div>
      </div>
    </div>
  );
}

const CALENDAR_PRESETS = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '14d', label: 'Last 14 days', days: 14 },
  { id: '30d', label: 'Last 30 days', days: 30 },
] as const;

function CalendarWithPresets() {
  const [range, setRange] = useState<Range>([TODAY.subtract(6, 'day'), TODAY]);
  const [hover, setHover] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [start, end] = range;
  const days = start && end?.isSame(TODAY, 'day') ? end.diff(start, 'day') + 1 : null;

  return (
    <div className="flex gap-4">
      <div className="flex w-36 flex-col gap-1 border-r border-default pr-4">
        {CALENDAR_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant={days === preset.days ? 'secondary' : 'ghost'}
            size="sm"
            aria-pressed={days === preset.days}
            className="justify-start"
            onClick={() => {
              setRange([TODAY.subtract(preset.days - 1, 'day'), TODAY]);
              setMonth(TODAY);
            }}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <Calendar
        displayedMonth={month}
        selectedRange={range}
        hoverDate={hover}
        onDateClick={(day) => setRange(nextRange(range, day))}
        onDateHover={setHover}
        onMonthChange={setMonth}
      />
    </div>
  );
}

function CalendarInPopover() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Dayjs>(TODAY);
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconCalendar /> {date.format(DATE_FORMAT)}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-3">
        <Calendar
          displayedMonth={month}
          selectedRange={[date, date]}
          hoverDate={null}
          onDateClick={(day) => {
            setDate(day);
            setOpen(false);
          }}
          onMonthChange={setMonth}
        />
      </PopoverContent>
    </Popover>
  );
}

function CalendarWithTime() {
  const [date, setDate] = useState<Dayjs>(TODAY.add(1, 'day'));
  const [time, setTime] = useState<Dayjs | null>(TODAY.hour(6).minute(30));
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={setDate}
        onMonthChange={setMonth}
      />
      <div className="border-t border-default pt-3">
        <Label htmlFor="calendar-start-time">Start time, UTC</Label>
        <div id="calendar-start-time">
          <TimePicker value={time} onChange={setTime} />
        </div>
        <HelperText>
          Starts {date.format(DATE_FORMAT)}
          {time ? ` at ${time.format('HH:mm')} UTC` : ''}.
        </HelperText>
      </div>
    </div>
  );
}

function CalendarWithTypedDate() {
  const [date, setDate] = useState<Dayjs>(TODAY);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [text, setText] = useState(TODAY.format('YYYY-MM-DD'));
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(text) && dayjs(text).isValid();

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label htmlFor="calendar-typed-date">Inspection date</Label>
        <Input
          id="calendar-typed-date"
          value={text}
          placeholder="YYYY-MM-DD"
          aria-invalid={!valid}
          onChange={(event) => {
            const next = event.target.value;
            setText(next);
            if (/^\d{4}-\d{2}-\d{2}$/.test(next) && dayjs(next).isValid()) {
              setDate(dayjs(next));
              setMonth(dayjs(next));
            }
          }}
        />
        <HelperText isError={!valid}>{valid ? 'Type a date or pick one below.' : 'Use the format YYYY-MM-DD.'}</HelperText>
      </div>
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={(day) => {
          setDate(day);
          setText(day.format('YYYY-MM-DD'));
        }}
        onMonthChange={setMonth}
      />
    </div>
  );
}

function CalendarRangeSummary() {
  const [range, setRange] = useState<Range>([TODAY.subtract(9, 'day'), TODAY.subtract(3, 'day')]);
  const [hover, setHover] = useState<Dayjs | null>(null);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [start, end] = range;
  const days = start && end ? end.diff(start, 'day') + 1 : null;

  return (
    <div className="flex flex-col gap-3">
      <Calendar
        displayedMonth={month}
        selectedRange={range}
        hoverDate={hover}
        onDateClick={(day) => setRange(nextRange(range, day))}
        onDateHover={setHover}
        onMonthChange={setMonth}
      />
      <div className="flex items-center justify-between gap-3 border-t border-default pt-3">
        <span className="text-sm text-base-foreground">{formatRange(range)}</span>
        {days ? (
          <Badge variant="secondary" className="tabular-nums">
            {days} {days === 1 ? 'day' : 'days'}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

function CalendarDayAgenda() {
  const [date, setDate] = useState<Dayjs>(TODAY);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const due = WORK_ORDERS.filter((order) => utcDay(order.dueAt).isSame(date, 'day'));

  return (
    <div className="flex w-full flex-wrap gap-6">
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={setDate}
        onMonthChange={setMonth}
      />
      <div className="flex min-w-48 flex-1 flex-col gap-3">
        <h4 className="text-sm font-medium text-base-foreground">Due {date.format(DATE_FORMAT)}</h4>
        {due.length === 0 ? (
          <p className="text-sm text-muted-foreground">No work orders are due on this day.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {due.map((order) => (
              <li key={order.id} className="flex flex-col gap-0.5">
                <span className="text-sm text-base-foreground">{order.title}</span>
                <span className="text-xs text-muted-foreground">
                  {order.id} · {findAsset(order.assetId)?.tag} · {order.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CalendarInFormCard() {
  const [date, setDate] = useState<Dayjs>(TODAY.add(5, 'day'));
  const [month, setMonth] = useState<Dayjs>(TODAY);

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-base-background p-4">
      <div>
        <h4 className="text-sm font-medium text-base-foreground">Schedule vibration survey</h4>
        <p className="text-sm text-muted-foreground">WO-104466 · 23-KA-9101</p>
      </div>
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        displayWeekNumber
        onDateClick={setDate}
        onMonthChange={setMonth}
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Schedule for {date.format('D MMM')}</Button>
      </div>
    </div>
  );
}

function CalendarWithShift() {
  const [date, setDate] = useState<Dayjs>(TODAY);
  const [month, setMonth] = useState<Dayjs>(TODAY);
  const [shift, setShift] = useState('day');

  return (
    <div className="flex flex-col items-center gap-3">
      <SegmentedControl
        value={shift}
        onValueChange={(next) => {
          if (typeof next === 'string') setShift(next);
        }}
      >
        <SegmentedControlList size="small" aria-label="Shift">
          <SegmentedControlButton value="day">Day shift</SegmentedControlButton>
          <SegmentedControlButton value="night">Night shift</SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <Calendar
        displayedMonth={month}
        selectedRange={[date, date]}
        hoverDate={null}
        onDateClick={setDate}
        onMonthChange={setMonth}
      />
      <p className="text-sm text-muted-foreground">
        Handover log for {date.format(DATE_FORMAT)}, {shift === 'day' ? '07:00–19:00' : '19:00–07:00'} UTC
      </p>
    </div>
  );
}

export default definePage({
  id: 'calendar',
  title: 'Calendar',
  summary:
    'A month grid for picking a date or a date range in place. It is the surface inside every date picker, and stands alone when the dates should stay visible while the user works.',
  docsSlug: 'date-and-time-picker',
  guidance: {
    use: [
      'Inline, when the date drives what is on screen: an agenda, a schedule, a filter panel.',
      'A range when the question is "between when and when"; show the hover preview while picking.',
      'Week numbers for planning in industries that schedule by week.',
      'A Date Picker instead when the date is one field among many in a form.',
    ],
    avoid: [
      'An inline calendar where a compact field would do — it costs 300 pixels of height.',
      'Silently ignoring a click on a date that is not allowed; say which dates are.',
      'Opening on the current month when the selected date is somewhere else.',
      'Asking for a date of birth or a year far away without the month and year menus.',
    ],
  },
  source,
  sections: [
    {
      id: 'selection',
      title: 'Selection',
      description: 'What a click means. The calendar is controlled, so the page decides.',
      specimens: [
        {
          id: 'CalendarSingle',
          title: 'Single date',
          note: 'One exact day, such as a due date or an inspection date.',
          origin: 'aura',
          Component: CalendarSingle,
        },
        {
          id: 'CalendarRange',
          title: 'Date range',
          note: 'A start and an end, with the days between previewed while the pointer moves.',
          origin: 'aura',
          Component: CalendarRange,
        },
        {
          id: 'CalendarUnselected',
          title: 'Nothing selected',
          note: 'An optional date that has not been set; open on the month the user most likely wants.',
          origin: 'aura',
          Component: CalendarUnselected,
        },
        {
          id: 'CalendarClearable',
          title: 'Click again to clear',
          note: 'An optional date the user must be able to remove without a separate button.',
          origin: 'custom',
          Component: CalendarClearable,
        },
        {
          id: 'CalendarWholeWeek',
          title: 'Whole week',
          note: 'Planning that works in weeks: any click selects the week it falls in.',
          origin: 'custom',
          Component: CalendarWholeWeek,
        },
      ],
    },
    {
      id: 'month-and-display',
      title: 'Month and display',
      description: 'Which month is shown, how many, and what the grid tells the user.',
      specimens: [
        {
          id: 'CalendarWeekNumbers',
          title: 'Week numbers',
          note: 'Maintenance and turnaround planning, where people say "week 11" rather than a date.',
          origin: 'aura',
          Component: CalendarWeekNumbers,
        },
        {
          id: 'CalendarOtherMonth',
          title: 'Opens on the selected month',
          note: 'A value that is not in the current month; show where the value is, not where today is.',
          origin: 'aura',
          Component: CalendarOtherMonth,
        },
        {
          id: 'CalendarJumpToToday',
          title: 'Jump to today',
          note: 'Calendars people page far away from, so one click brings them back.',
          origin: 'custom',
          Component: CalendarJumpToToday,
        },
        {
          id: 'CalendarReadOnly',
          title: 'Read-only window',
          note: 'Showing a period that is already decided, such as a planned shutdown.',
          origin: 'custom',
          Component: CalendarReadOnly,
        },
        {
          id: 'CalendarTwoMonths',
          title: 'Two months',
          note: 'Ranges that often cross a month boundary; both ends stay visible while picking.',
          origin: 'custom',
          size: 'lg',
          Component: CalendarTwoMonths,
        },
      ],
    },
    {
      id: 'constraints',
      title: 'Constraints',
      description:
        'The calendar has no disabled days, so the page rejects the click and says which dates are allowed.',
      specimens: [
        {
          id: 'CalendarMinMax',
          title: 'Earliest and latest date',
          note: 'A booking window with a fixed start and end. Click outside it to see the message.',
          origin: 'custom',
          Component: CalendarMinMax,
        },
        {
          id: 'CalendarBlockedWeekdays',
          title: 'Working days only',
          note: 'Dates that recur as unavailable, such as weekends for a day crew.',
          origin: 'custom',
          Component: CalendarBlockedWeekdays,
        },
        {
          id: 'CalendarFutureOnly',
          title: 'Future dates only',
          note: 'Deadlines and schedules; paging back stops at the current month.',
          origin: 'custom',
          Component: CalendarFutureOnly,
        },
        {
          id: 'CalendarCappedRange',
          title: 'Longest range',
          note: 'Queries with a cost limit: a longer range is shortened and the limit is explained.',
          origin: 'custom',
          Component: CalendarCappedRange,
        },
      ],
    },
    {
      id: 'with-controls',
      title: 'With other controls',
      description: 'The calendar next to the control that completes the choice.',
      specimens: [
        {
          id: 'CalendarWithFooter',
          title: 'Apply and reset',
          note: 'When a new date triggers something expensive, such as reloading a dashboard.',
          origin: 'custom',
          Component: CalendarWithFooter,
        },
        {
          id: 'CalendarRangeSummary',
          title: 'Range with summary',
          note: 'When the length of the range matters as much as its ends.',
          origin: 'custom',
          Component: CalendarRangeSummary,
        },
        {
          id: 'CalendarWithShift',
          title: 'Date and shift',
          note: 'A day split into fixed parts, where a time of day would be false precision.',
          origin: 'custom',
          Component: CalendarWithShift,
        },
        {
          id: 'CalendarWithTime',
          title: 'Date and time',
          note: 'A start that needs a time of day, kept in one panel instead of two fields.',
          origin: 'custom',
          Component: CalendarWithTime,
        },
        {
          id: 'CalendarWithTypedDate',
          title: 'Typed or picked',
          note: 'People who know the date type it; the grid follows and confirms the weekday.',
          origin: 'custom',
          Component: CalendarWithTypedDate,
        },
        {
          id: 'CalendarInPopover',
          title: 'In a popover',
          note: 'A date in a toolbar, where a full date field with a label would be too heavy.',
          origin: 'custom',
          Component: CalendarInPopover,
        },
        {
          id: 'CalendarWithPresets',
          title: 'With presets',
          note: 'Filters where "last 7 days" covers most uses and exact dates are the exception.',
          origin: 'custom',
          size: 'md',
          Component: CalendarWithPresets,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'An inline calendar as the driver of a small screen.',
      specimens: [
        {
          id: 'CalendarInFormCard',
          title: 'Scheduling card',
          note: 'A focused task whose only question is "when"; the button repeats the choice.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          Component: CalendarInFormCard,
        },
        {
          id: 'CalendarDayAgenda',
          title: 'Day agenda',
          note: 'Browsing by day: the selected date filters the list next to it.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          Component: CalendarDayAgenda,
        },
      ],
    },
  ],
});
