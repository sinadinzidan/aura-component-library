import {
  activeMovements,
  daysOfCover,
  fillFraction,
  hourSteps,
  levelSeries,
  levelsAt,
  movedBy,
  movementPhase,
  movementProgress,
  movementsOf,
  netRateAt,
  scrubberReducer,
  totalAt,
  ullage,
  volumeAt,
} from './inventoryProjection';
import type { InventoryMovement, InventoryTank } from './inventoryProjection';

const CRUDE: InventoryTank = { id: 'ta-201', capacity: 10000, volume: 6000, dailyDemand: 1200 };
const DIESEL: InventoryTank = { id: 'ta-202', capacity: 4000, volume: 1000 };
const TANKS = [CRUDE, DIESEL];

const LIFTING: InventoryMovement = { id: 'm1', from: 'ta-201', to: null, startHour: 10, endHour: 20, volume: 4000 };
const RECEIPT: InventoryMovement = { id: 'm2', from: null, to: 'ta-202', startHour: 0, endHour: 8, volume: 2000 };
const TRANSFER: InventoryMovement = { id: 'm3', from: 'ta-201', to: 'ta-202', startHour: 30, endHour: 40, volume: 1000 };
const MOVEMENTS = [LIFTING, RECEIPT, TRANSFER];

describe(movementProgress.name, () => {
  it('is 0 before the start and 1 after the end', () => {
    expect(movementProgress(LIFTING, 4)).toBe(0);
    expect(movementProgress(LIFTING, 25)).toBe(1);
  });

  it('is linear inside the window', () => {
    expect(movementProgress(LIFTING, 15)).toBe(0.5);
    expect(movementProgress(LIFTING, 12.5)).toBe(0.25);
  });

  it('completes a zero-length movement at its start', () => {
    const instant = { ...LIFTING, endHour: 10 };

    expect(movementProgress(instant, 9.9)).toBe(0);
    expect(movementProgress(instant, 10)).toBe(1);
  });
});

describe(movementPhase.name, () => {
  it('names planned, active and done', () => {
    expect(movementPhase(LIFTING, 9)).toBe('planned');
    expect(movementPhase(LIFTING, 10)).toBe('active');
    expect(movementPhase(LIFTING, 19.9)).toBe('active');
    expect(movementPhase(LIFTING, 20)).toBe('done');
  });
});

describe(activeMovements.name, () => {
  it('returns the movements under way', () => {
    expect(activeMovements(MOVEMENTS, 5).map((movement) => movement.id)).toEqual(['m2']);
    expect(activeMovements(MOVEMENTS, 35).map((movement) => movement.id)).toEqual(['m3']);
    expect(activeMovements(MOVEMENTS, 25)).toEqual([]);
  });
});

describe(movementsOf.name, () => {
  it('lists movements into and out of a tank in start order', () => {
    expect(movementsOf(MOVEMENTS, 'ta-202').map((movement) => movement.id)).toEqual(['m2', 'm3']);
    expect(movementsOf(MOVEMENTS, 'ta-201').map((movement) => movement.id)).toEqual(['m1', 'm3']);
  });

  it('is empty for a tank nothing touches', () => {
    expect(movementsOf(MOVEMENTS, 'ta-999')).toEqual([]);
  });
});

describe(movedBy.name, () => {
  it('is negative for the source and positive for the destination', () => {
    expect(movedBy(TRANSFER, 'ta-201', 35)).toBe(-500);
    expect(movedBy(TRANSFER, 'ta-202', 35)).toBe(500);
  });

  it('is zero for a tank the movement does not touch', () => {
    expect(movedBy(LIFTING, 'ta-202', 15)).toBe(0);
  });
});

describe(volumeAt.name, () => {
  it('returns the volume on hand at hour 0', () => {
    expect(volumeAt(CRUDE, MOVEMENTS, 0)).toBe(6000);
  });

  it('draws a lifting down linearly', () => {
    expect(volumeAt(CRUDE, MOVEMENTS, 15)).toBe(4000);
    expect(volumeAt(CRUDE, MOVEMENTS, 20)).toBe(2000);
  });

  it('keeps the level between movements', () => {
    expect(volumeAt(CRUDE, MOVEMENTS, 25)).toBe(2000);
  });

  it('adds up every movement that has run', () => {
    expect(volumeAt(CRUDE, MOVEMENTS, 72)).toBe(1000);
    expect(volumeAt(DIESEL, MOVEMENTS, 72)).toBe(4000);
  });

  it('never goes below empty', () => {
    const drain = { ...LIFTING, volume: 9000 };

    expect(volumeAt(CRUDE, [drain], 72)).toBe(0);
  });

  it('never goes above capacity', () => {
    const flood = { ...RECEIPT, volume: 9000 };

    expect(volumeAt(DIESEL, [flood], 72)).toBe(4000);
  });
});

describe(levelsAt.name, () => {
  it('projects every tank at once', () => {
    expect(levelsAt(TANKS, MOVEMENTS, 4)).toEqual({ 'ta-201': 6000, 'ta-202': 2000 });
    expect(levelsAt(TANKS, MOVEMENTS, 35)).toEqual({ 'ta-201': 1500, 'ta-202': 3500 });
  });

  it('is deterministic', () => {
    expect(levelsAt(TANKS, MOVEMENTS, 17)).toEqual(levelsAt(TANKS, MOVEMENTS, 17));
  });

  it('conserves volume across a tank-to-tank transfer', () => {
    const before = totalAt(TANKS, [TRANSFER], 29);
    const during = totalAt(TANKS, [TRANSFER], 34);

    expect(during).toBe(before);
  });
});

describe(fillFraction.name, () => {
  it('divides volume by capacity', () => {
    expect(fillFraction(2500, 10000)).toBe(0.25);
  });

  it('stays inside 0–1 and survives a zero capacity', () => {
    expect(fillFraction(12000, 10000)).toBe(1);
    expect(fillFraction(-5, 10000)).toBe(0);
    expect(fillFraction(5, 0)).toBe(0);
  });
});

describe(ullage.name, () => {
  it('is the free space', () => {
    expect(ullage(6000, 10000)).toBe(4000);
    expect(ullage(11000, 10000)).toBe(0);
  });
});

describe(daysOfCover.name, () => {
  it('divides the volume by the daily demand', () => {
    expect(daysOfCover(6000, 1200)).toBe(5);
  });

  it('has no figure without demand', () => {
    expect(daysOfCover(6000, undefined)).toBeNull();
    expect(daysOfCover(6000, 0)).toBeNull();
  });
});

describe(hourSteps.name, () => {
  it('includes both ends', () => {
    expect(hourSteps(72, 24)).toEqual([0, 24, 48, 72]);
  });

  it('falls back to a single step', () => {
    expect(hourSteps(0, 6)).toEqual([0]);
  });
});

describe(levelSeries.name, () => {
  it('projects the volume at each hour', () => {
    expect(levelSeries(CRUDE, MOVEMENTS, [0, 15, 20, 40])).toEqual([6000, 4000, 2000, 1000]);
  });
});

describe(netRateAt.name, () => {
  it('is negative while a tank is drawn and positive while it fills', () => {
    expect(netRateAt('ta-201', MOVEMENTS, 12)).toBe(-400);
    expect(netRateAt('ta-202', MOVEMENTS, 4)).toBe(250);
  });

  it('is zero when nothing moves', () => {
    expect(netRateAt('ta-201', MOVEMENTS, 25)).toBe(0);
  });
});

describe(scrubberReducer.name, () => {
  it('seeks inside the horizon and stops playback', () => {
    expect(scrubberReducer({ hour: 3, playing: true }, { type: 'seek', hour: 90 }, 72)).toEqual({ hour: 72, playing: false });
    expect(scrubberReducer({ hour: 3, playing: false }, { type: 'seek', hour: -4 }, 72)).toEqual({ hour: 0, playing: false });
  });

  it('plays from the current hour', () => {
    expect(scrubberReducer({ hour: 12, playing: false }, { type: 'play' }, 72)).toEqual({ hour: 12, playing: true });
  });

  it('starts over when play is pressed at the end', () => {
    expect(scrubberReducer({ hour: 72, playing: false }, { type: 'play' }, 72)).toEqual({ hour: 0, playing: true });
  });

  it('advances one step per tick while playing', () => {
    expect(scrubberReducer({ hour: 12, playing: true }, { type: 'tick' }, 72)).toEqual({ hour: 13, playing: true });
    expect(scrubberReducer({ hour: 12, playing: true }, { type: 'tick', step: 3 }, 72)).toEqual({ hour: 15, playing: true });
  });

  it('ignores ticks while paused', () => {
    const paused = { hour: 12, playing: false };

    expect(scrubberReducer(paused, { type: 'tick' }, 72)).toBe(paused);
  });

  it('stops by itself at the horizon', () => {
    expect(scrubberReducer({ hour: 71, playing: true }, { type: 'tick', step: 2 }, 72)).toEqual({ hour: 72, playing: false });
  });

  it('pauses', () => {
    expect(scrubberReducer({ hour: 12, playing: true }, { type: 'pause' }, 72)).toEqual({ hour: 12, playing: false });
  });
});
