import type { SchedEvent } from './conflicts';
import { createSchedulerState, describeEvent, schedulerReducer } from './schedulerReducer';
import type { SchedulerAction, SchedulerState } from './schedulerReducer';

const EVENTS: readonly SchedEvent[] = [
  { id: 'a', title: 'Inspect drive-end bearing', dayId: '2026-03-12', resourceId: 'mechanical', start: 480, end: 720, kind: 'job', reference: '23-KA-9103' },
  { id: 'b', title: 'Permit PTW-2291', dayId: '2026-03-12', resourceId: 'operations', start: 0, end: 0, kind: 'permit', allDay: true },
];

function run(state: SchedulerState, ...actions: SchedulerAction[]): SchedulerState {
  return actions.reduce(schedulerReducer, state);
}

function start(): SchedulerState {
  return createSchedulerState(EVENTS);
}

describe('describeEvent', () => {
  it('names the item, the day and the time', () => {
    expect(describeEvent(EVENTS[0], { mechanical: 'Mechanical' })).toBe('Inspect drive-end bearing, Thursday 12 March, 08:00–12:00, Mechanical');
  });

  it('says all day for an all-day item', () => {
    expect(describeEvent(EVENTS[1])).toBe('Permit PTW-2291, Thursday 12 March, all day');
  });
});

describe('selecting and opening', () => {
  it('selects an item and clears the selection', () => {
    expect(run(start(), { type: 'select', id: 'a' }).selectedId).toBe('a');
    expect(run(start(), { type: 'select', id: 'a' }, { type: 'select', id: null }).selectedId).toBeNull();
  });

  it('opens the detail panel for a known item and not for an unknown one', () => {
    expect(run(start(), { type: 'open', id: 'a' })).toMatchObject({ selectedId: 'a', detailOpen: true });
    const state = start();
    expect(run(state, { type: 'open', id: 'zzz' })).toBe(state);
  });

  it('closes the panel and keeps the selection', () => {
    expect(run(start(), { type: 'open', id: 'a' }, { type: 'closeDetail' })).toMatchObject({ selectedId: 'a', detailOpen: false });
  });

  it('closes the panel when the selection is cleared', () => {
    expect(run(start(), { type: 'open', id: 'a' }, { type: 'select', id: null }).detailOpen).toBe(false);
  });
});

describe('drafts', () => {
  const draft = { dayId: '2026-03-13', resourceId: 'mechanical', start: 540, end: 600 };

  it('sets and clears a draft', () => {
    expect(run(start(), { type: 'setDraft', draft }).draft).toEqual(draft);
    expect(run(start(), { type: 'setDraft', draft }, { type: 'setDraft', draft: null }).draft).toBeNull();
  });

  it('closes the detail panel while a draft is open', () => {
    expect(run(start(), { type: 'open', id: 'a' }, { type: 'setDraft', draft }).detailOpen).toBe(false);
  });
});

describe('creating', () => {
  const event = { title: '  Replace seal  ', dayId: '2026-03-13', resourceId: 'mechanical', start: 540, end: 600, kind: 'job' as const };

  it('adds the item with a new id, selects it and clears the draft', () => {
    const state = run(start(), { type: 'setDraft', draft: event }, { type: 'create', event });
    expect(state.events).toHaveLength(3);
    expect(state.events[2]).toMatchObject({ id: 'new-1', title: 'Replace seal' });
    expect(state).toMatchObject({ selectedId: 'new-1', draft: null });
    expect(state.announcement).toBe('Created Replace seal, Friday 13 March, 09:00–10:00');
  });

  it('gives each item its own id', () => {
    const state = run(start(), { type: 'create', event }, { type: 'create', event });
    expect(state.events.map((item) => item.id)).toEqual(['a', 'b', 'new-1', 'new-2']);
  });

  it('names an untitled item', () => {
    expect(run(start(), { type: 'create', event: { ...event, title: ' ' } }).events[2].title).toBe('Untitled job');
  });
});

describe('placing', () => {
  const placement = { dayId: '2026-03-13', resourceId: 'instrument', start: 600, end: 840 };

  it('moves an item and announces where it went', () => {
    const state = run(start(), { type: 'place', id: 'a', placement });
    expect(state.events[0]).toMatchObject(placement);
    expect(state.announcement).toBe('Moved Inspect drive-end bearing, Friday 13 March, 10:00–14:00');
  });

  it('does nothing for an unchanged placement, an unknown id or an all-day item', () => {
    const state = start();
    expect(run(state, { type: 'place', id: 'a', placement: { dayId: '2026-03-12', resourceId: 'mechanical', start: 480, end: 720 } })).toBe(state);
    expect(run(state, { type: 'place', id: 'zzz', placement })).toBe(state);
    expect(run(state, { type: 'place', id: 'b', placement })).toBe(state);
  });
});

describe('renaming and removing', () => {
  it('renames an item', () => {
    expect(run(start(), { type: 'rename', id: 'a', title: ' Inspect thrust bearing ' }).events[0].title).toBe('Inspect thrust bearing');
  });

  it('ignores an empty or unchanged title', () => {
    const state = start();
    expect(run(state, { type: 'rename', id: 'a', title: '  ' })).toBe(state);
    expect(run(state, { type: 'rename', id: 'a', title: 'Inspect drive-end bearing' })).toBe(state);
  });

  it('removes an item and clears its selection', () => {
    const state = run(start(), { type: 'open', id: 'a' }, { type: 'remove', id: 'a' });
    expect(state.events.map((event) => event.id)).toEqual(['b']);
    expect(state).toMatchObject({ selectedId: null, detailOpen: false });
    expect(state.announcement).toBe('Deleted Inspect drive-end bearing');
  });

  it('keeps another selection when a different item is removed', () => {
    expect(run(start(), { type: 'select', id: 'a' }, { type: 'remove', id: 'b' }).selectedId).toBe('a');
  });

  it('ignores an unknown id', () => {
    const state = start();
    expect(run(state, { type: 'remove', id: 'zzz' })).toBe(state);
  });
});

describe('history', () => {
  const placement = { dayId: '2026-03-13', resourceId: 'mechanical', start: 600, end: 840 };

  it('undoes and redoes a move', () => {
    const moved = run(start(), { type: 'place', id: 'a', placement });
    const undone = run(moved, { type: 'undo' });
    expect(undone.events).toEqual(EVENTS);
    expect(undone.announcement).toBe('Undid last change');
    expect(run(undone, { type: 'redo' }).events[0]).toMatchObject(placement);
  });

  it('undoes a creation and drops the selection of the vanished item', () => {
    const created = run(start(), { type: 'create', event: { title: 'Replace seal', dayId: '2026-03-13', resourceId: 'mechanical', start: 540, end: 600, kind: 'job' } });
    const undone = run(created, { type: 'open', id: 'new-1' }, { type: 'undo' });
    expect(undone.events).toHaveLength(2);
    expect(undone).toMatchObject({ selectedId: null, detailOpen: false });
  });

  it('undoes a deletion', () => {
    expect(run(start(), { type: 'remove', id: 'a' }, { type: 'undo' }).events).toEqual(EVENTS);
  });

  it('says when there is nothing to undo or redo', () => {
    expect(run(start(), { type: 'undo' }).announcement).toBe('Nothing to undo');
    expect(run(start(), { type: 'redo' }).announcement).toBe('Nothing to redo');
  });

  it('forgets the redo stack after a new change', () => {
    const state = run(start(), { type: 'place', id: 'a', placement }, { type: 'undo' }, { type: 'remove', id: 'b' });
    expect(state.future).toHaveLength(0);
  });

  it('keeps a bounded history', () => {
    let state = start();
    for (let index = 0; index < 70; index += 1) {
      state = schedulerReducer(state, { type: 'place', id: 'a', placement: { ...placement, start: 360 + (index % 2) * 15, end: 900 + index } });
    }
    expect(state.past).toHaveLength(50);
  });
});
