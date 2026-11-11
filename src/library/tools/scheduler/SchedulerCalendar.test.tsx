import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ConflictRules, SchedEvent } from './conflicts';
import { SchedulerCalendar } from './SchedulerCalendar';
import type { SchedulerCalendarProps } from './SchedulerCalendar';

const DAYS = ['2026-03-09', '2026-03-10', '2026-03-11'];
const CREWS = [
  { id: 'mechanical', name: 'Mechanical' },
  { id: 'instrument', name: 'Instrument' },
];
const RULES: ConflictRules = {
  hours: {
    mechanical: { weekdays: [1, 2, 3, 4, 5], start: 7 * 60, end: 16 * 60 },
    instrument: { weekdays: [1, 2, 3, 4, 5], start: 7 * 60, end: 16 * 60 },
  },
  names: { mechanical: 'Mechanical', instrument: 'Instrument' },
};
const EVENTS: readonly SchedEvent[] = [
  { id: 'a', title: 'Inspect drive-end bearing', dayId: '2026-03-09', resourceId: 'mechanical', start: 8 * 60, end: 12 * 60, kind: 'job', reference: '23-KA-9103' },
  { id: 'b', title: 'Vibration survey', dayId: '2026-03-09', resourceId: 'mechanical', start: 11 * 60, end: 13 * 60, kind: 'job', reference: '23-KA-9101' },
  { id: 'c', title: 'Calibrate level transmitter', dayId: '2026-03-10', resourceId: 'instrument', start: 13 * 60, end: 14 * 60, kind: 'job' },
  { id: 'p', title: 'Permit PTW-2291', dayId: '2026-03-10', resourceId: 'mechanical', start: 0, end: 0, kind: 'permit', allDay: true, reference: 'PTW-2291' },
];

/** Window 06:00-20:00 over an 840 px tall body, so one pixel is one minute, and 100 px per column. */
function stubLayout() {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function rect(this: Element) {
    const base = { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => ({}) };
    if (this instanceof HTMLElement && this.dataset.slot === 'scheduler-columns') return { ...base, width: 300, height: 840, right: 300, bottom: 840 };
    if (this instanceof HTMLElement && this.dataset.schedCol !== undefined) {
      const index = Number(this.dataset.schedCol);
      return { ...base, left: index * 100, right: index * 100 + 100, width: 100, height: 840, bottom: 840 };
    }
    return base;
  };
  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}

/** The y position of a time of day in the stubbed body. */
const y = (hours: number, minutes = 0) => (hours - 6) * 60 + minutes;

function renderCalendar(props: Partial<SchedulerCalendarProps> = {}) {
  return render(
    <TooltipProvider>
      <SchedulerCalendar label="Maintenance week 11" events={EVENTS} days={DAYS} crews={CREWS} rules={RULES} defaultCrewId="mechanical" focusDay="2026-03-09" {...props} />
    </TooltipProvider>
  );
}

function columns() {
  return screen.getByRole('group', { name: 'Maintenance week 11' }).querySelector('[data-slot="scheduler-columns"]') as HTMLElement;
}

function block(name: RegExp) {
  return screen.getByRole('button', { name });
}

function drag(from: { target: Element; x: number; y: number }, to: { x: number; y: number }) {
  fireEvent.pointerDown(from.target, { button: 0, pointerId: 1, clientX: from.x, clientY: from.y });
  fireEvent.pointerMove(columns(), { pointerId: 1, clientX: to.x, clientY: to.y });
  fireEvent.pointerUp(columns(), { pointerId: 1, clientX: to.x, clientY: to.y });
}

let restore: () => void;
beforeEach(() => {
  restore = stubLayout();
});
afterEach(() => restore());

describe(SchedulerCalendar.name, () => {
  it('shows the days and the jobs, with overlapping jobs side by side', () => {
    renderCalendar();

    expect(screen.getByRole('group', { name: 'Mon 9' })).toBeInTheDocument();
    expect(block(/^Inspect drive-end bearing/)).toBeInTheDocument();
    expect(block(/^Vibration survey/)).toBeInTheDocument();
    expect(block(/^Inspect drive-end bearing/).style.width).toBe('50%');
    expect(block(/^Vibration survey/).style.left).toBe('50%');
  });

  it('puts all-day permits in the all-day row', () => {
    renderCalendar();

    expect(within(screen.getByRole('list', { name: 'All day, Tue 10' })).getByRole('button', { name: /Permit PTW-2291/ })).toBeInTheDocument();
  });

  it('marks a double-booked crew with the word and the reason', () => {
    renderCalendar();

    expect(block(/^Vibration survey/)).toHaveAccessibleName(/conflict: Mechanical is already booked for \u201cInspect drive-end bearing\u201d, 08:00\u201312:00/);
    expect(block(/Calibrate level transmitter/)).not.toHaveAccessibleName(/conflict/);
  });

  it('draws the now line in the day it belongs to', () => {
    renderCalendar({ now: { dayId: '2026-03-10', minute: 14 * 60 } });

    expect(screen.getByText('Now, 14:00')).toBeInTheDocument();
  });

  it('opens a quick-create form after a drag on empty time, snapped to 15 minutes', () => {
    renderCalendar();
    const column = screen.getByRole('group', { name: 'Tue 10' });

    drag({ target: column, x: 150, y: y(9, 3) }, { x: 150, y: y(10, 40) });

    const dialog = screen.getByRole('dialog', { name: 'New job' });
    expect(within(dialog).getByLabelText('Starts')).toHaveValue('09:00');
    expect(within(dialog).getByLabelText('Ends')).toHaveValue('10:45');
  });

  it('creates the job from the quick-create form', async () => {
    renderCalendar();

    drag({ target: screen.getByRole('group', { name: 'Wed 11' }), x: 250, y: y(9) }, { x: 250, y: y(10) });
    const dialog = screen.getByRole('dialog', { name: 'New job' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: /^Job/ }), 'Replace seal');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Schedule job' }));

    expect(screen.queryByRole('dialog', { name: 'New job' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Wed 11' })).getByRole('button', { name: /Replace seal, 09:00\u201310:00/ })).toBeInTheDocument();
  });

  it('drafts one hour from a click on empty time', () => {
    renderCalendar();

    drag({ target: screen.getByRole('group', { name: 'Mon 9' }), x: 50, y: y(15) }, { x: 50, y: y(15) });

    expect(screen.getByLabelText('Starts')).toHaveValue('15:00');
    expect(screen.getByLabelText('Ends')).toHaveValue('16:00');
  });

  it('warns in the form when the new job would clash', () => {
    renderCalendar();

    drag({ target: screen.getByRole('group', { name: 'Mon 9' }), x: 50, y: y(9) }, { x: 50, y: y(10) });

    expect(screen.getByRole('list', { name: 'Conflicts' })).toHaveTextContent('Mechanical is already booked');
  });

  it('closes the quick-create form with Escape and creates nothing', async () => {
    renderCalendar();

    drag({ target: screen.getByRole('group', { name: 'Mon 9' }), x: 50, y: y(15) }, { x: 50, y: y(15) });
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'New job' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /,\s*\d\d:\d\d/ })).toHaveLength(3);
  });

  it('moves a job to another day and time by dragging', () => {
    renderCalendar();

    drag({ target: block(/Calibrate level transmitter/), x: 150, y: y(13, 30) }, { x: 250, y: y(15, 30) });

    expect(within(screen.getByRole('group', { name: 'Wed 11' })).getByRole('button', { name: /Calibrate level transmitter, 15:00\u201316:00/ })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="scheduler-announcer"]')).toHaveTextContent('Moved Calibrate level transmitter, Wednesday 11 March, 15:00\u201316:00');
  });

  it('shows a ghost and the clash while dragging, and drops nothing on Escape', async () => {
    renderCalendar();
    const item = block(/Calibrate level transmitter/);

    fireEvent.pointerDown(item, { button: 0, pointerId: 1, clientX: 150, clientY: y(13, 30) });
    fireEvent.pointerMove(columns(), { pointerId: 1, clientX: 50, clientY: y(11, 30) });
    expect(document.querySelector('[data-slot="scheduler-status"]')).toHaveTextContent(/Move to 11:00\u201312:00, Monday 9 March/);
    await userEvent.keyboard('{Escape}');
    fireEvent.pointerUp(columns(), { pointerId: 1, clientX: 50, clientY: y(11, 30) });

    expect(within(screen.getByRole('group', { name: 'Tue 10' })).getByRole('button', { name: /Calibrate level transmitter, 13:00\u201314:00/ })).toBeInTheDocument();
  });

  it('resizes a job from its bottom edge', () => {
    renderCalendar();
    const handle = document.querySelector('[data-sched-resize="c"]');

    drag({ target: handle as Element, x: 150, y: y(14) }, { x: 150, y: y(15, 20) });

    expect(block(/Calibrate level transmitter/)).toHaveAccessibleName(/13:00\u201315:15/);
  });

  it('does not shorten a job below one slot', () => {
    renderCalendar();
    const handle = document.querySelector('[data-sched-resize="c"]');

    drag({ target: handle as Element, x: 150, y: y(14) }, { x: 150, y: y(10) });

    expect(block(/Calibrate level transmitter/)).toHaveAccessibleName(/13:00\u201313:15/);
  });

  it('moves a focused job a slot with Up and Down and a day with Left and Right', async () => {
    renderCalendar();

    block(/Calibrate level transmitter/).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(block(/Calibrate level transmitter/)).toHaveAccessibleName(/13:15\u201314:15/);

    await userEvent.keyboard('{ArrowRight}');
    expect(within(screen.getByRole('group', { name: 'Wed 11' })).getByRole('button', { name: /Calibrate level transmitter/ })).toHaveFocus();
  });

  it('resizes a focused job with Shift and the arrows', async () => {
    renderCalendar();

    block(/Calibrate level transmitter/).focus();
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}');

    expect(block(/Calibrate level transmitter/)).toHaveAccessibleName(/13:00\u201314:30/);
  });

  it('opens the details with Enter and shows every conflict reason', async () => {
    renderCalendar();

    block(/^Vibration survey/).focus();
    await userEvent.keyboard('{Enter}');

    const panel = screen.getByRole('region', { name: 'Details of Vibration survey' });
    expect(within(panel).getByText('Mechanical is already booked for \u201cInspect drive-end bearing\u201d, 08:00\u201312:00')).toBeInTheDocument();
  });

  it('deletes a focused job with Delete and brings it back with undo', async () => {
    renderCalendar();

    block(/Calibrate level transmitter/).focus();
    await userEvent.keyboard('{Delete}');
    expect(screen.queryByRole('button', { name: /Calibrate level transmitter/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(block(/Calibrate level transmitter/)).toBeInTheDocument();
  });

  it('undoes with Ctrl+Z', async () => {
    renderCalendar();

    block(/Calibrate level transmitter/).focus();
    await userEvent.keyboard('{ArrowDown}{Control>}z{/Control}');

    expect(block(/Calibrate level transmitter/)).toHaveAccessibleName(/13:00\u201314:00/);
  });

  it('creates a job from the New job form without dragging', async () => {
    renderCalendar();

    await userEvent.click(screen.getByRole('button', { name: 'New job' }));
    await userEvent.type(await screen.findByRole('textbox', { name: /^Job/ }), 'Lubricate couplings');
    await userEvent.click(screen.getByRole('button', { name: 'Schedule job' }));

    expect(await screen.findByRole('button', { name: /Lubricate couplings, 09:00\u201310:00/ })).toBeInTheDocument();
  });

  it('switches to the crew view, with one column per crew', async () => {
    renderCalendar();

    await userEvent.click(screen.getByRole('tab', { name: 'By crew' }));

    expect(screen.getByRole('group', { name: 'Mechanical' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Instrument' })).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Mechanical' })).getAllByRole('button')).toHaveLength(2);
  });

  it('assigns the crew of the column a job is dropped on in the crew view', () => {
    renderCalendar({ view: 'resource', showViewSwitch: false });

    drag({ target: block(/^Inspect drive-end bearing/), x: 50, y: y(9) }, { x: 150, y: y(9) });

    expect(within(screen.getByRole('group', { name: 'Instrument' })).getByRole('button', { name: /^Inspect drive-end bearing.*Instrument/ })).toBeInTheDocument();
  });

  it('steps between days in the day view', async () => {
    renderCalendar({ view: 'day', showViewSwitch: false });

    expect(screen.getAllByText('Monday 9 March').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Next day' }));
    expect(screen.getAllByText('Tuesday 10 March').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Previous day' })).toBeEnabled();
  });

  it('can be read but not changed when read-only', async () => {
    renderCalendar({ readOnly: true });

    drag({ target: block(/Calibrate level transmitter/), x: 150, y: y(13, 30) }, { x: 250, y: y(15, 30) });
    block(/Calibrate level transmitter/).focus();
    await userEvent.keyboard('{ArrowDown}{Delete}');

    expect(screen.queryByRole('button', { name: 'New job' })).not.toBeInTheDocument();
    expect(block(/Calibrate level transmitter, 13:00\u201314:00/)).toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(screen.queryByRole('button', { name: 'Delete job' })).not.toBeInTheDocument();
  });

  it('starts with a job open or a draft open when asked', () => {
    renderCalendar({ initialOpenId: 'c' });
    expect(screen.getByRole('region', { name: 'Details of Calibrate level transmitter' })).toBeInTheDocument();
  });

  it('starts with the quick-create form open for a draft', () => {
    renderCalendar({ initialDraft: { dayId: '2026-03-11', resourceId: 'mechanical', start: 600, end: 660 } });

    expect(screen.getByRole('dialog', { name: 'New job' })).toBeInTheDocument();
  });

  it('reports changes', async () => {
    const onEventsChange = vi.fn();
    renderCalendar({ onEventsChange });

    block(/Calibrate level transmitter/).focus();
    await userEvent.keyboard('{Delete}');

    expect(onEventsChange).toHaveBeenCalledTimes(1);
    expect(onEventsChange.mock.calls[0][0]).toHaveLength(3);
  });
});
