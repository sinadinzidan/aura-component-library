/**
 * Inventory projection for a tank farm: where every tank level will be at a future hour, given the
 * planned movements. Volumes move linearly over a movement's window. Pure and deterministic, so a
 * time scrubber can call it on every step.
 */

export type InventoryTank = {
  id: string;
  /** Working capacity, in the same unit as `volume`. */
  capacity: number;
  /** Volume on hand at hour 0. */
  volume: number;
  /** Average offtake per day, for days of cover. Zero or missing means no cover figure. */
  dailyDemand?: number;
};

/**
 * A planned transfer. `from` or `to` is a tank id; `null` is outside the farm (a ship, a pipeline),
 * so a receipt has `from: null` and a lifting has `to: null`.
 */
export type InventoryMovement = {
  id: string;
  from: string | null;
  to: string | null;
  startHour: number;
  endHour: number;
  /** Total volume moved over the window. */
  volume: number;
};

export type MovementPhase = 'planned' | 'active' | 'done';

/** Share of a movement completed at an hour, 0–1. A zero-length movement completes at its start. */
export function movementProgress(movement: InventoryMovement, hour: number): number {
  const span = movement.endHour - movement.startHour;
  if (span <= 0) return hour >= movement.startHour ? 1 : 0;
  return Math.min(1, Math.max(0, (hour - movement.startHour) / span));
}

export function movementPhase(movement: InventoryMovement, hour: number): MovementPhase {
  if (hour < movement.startHour) return 'planned';
  if (hour >= movement.endHour) return 'done';
  return 'active';
}

/** Movements under way at an hour: started, not yet finished. */
export function activeMovements(movements: readonly InventoryMovement[], hour: number): InventoryMovement[] {
  return movements.filter((movement) => movementPhase(movement, hour) === 'active');
}

/** Movements that fill or draw a tank, in start order. */
export function movementsOf(movements: readonly InventoryMovement[], tankId: string): InventoryMovement[] {
  return movements.filter((movement) => movement.from === tankId || movement.to === tankId).sort((a, b) => a.startHour - b.startHour);
}

/** Signed volume a movement has added to (positive) or drawn from (negative) a tank by an hour. */
export function movedBy(movement: InventoryMovement, tankId: string, hour: number): number {
  const moved = movement.volume * movementProgress(movement, hour);
  return (movement.to === tankId ? moved : 0) - (movement.from === tankId ? moved : 0) + 0;
}

/** Projected volume of one tank at an hour, held between empty and its capacity. */
export function volumeAt(tank: InventoryTank, movements: readonly InventoryMovement[], hour: number): number {
  const projected = movements.reduce((volume, movement) => volume + movedBy(movement, tank.id, hour), tank.volume);
  return Math.min(tank.capacity, Math.max(0, projected));
}

/** Projected volume of every tank at an hour, keyed by tank id. */
export function levelsAt(tanks: readonly InventoryTank[], movements: readonly InventoryMovement[], hour: number): Record<string, number> {
  return Object.fromEntries(tanks.map((tank) => [tank.id, volumeAt(tank, movements, hour)]));
}

/** Fill as a fraction of capacity, 0–1. */
export function fillFraction(volume: number, capacity: number): number {
  if (capacity <= 0) return 0;
  return Math.min(1, Math.max(0, volume / capacity));
}

/** Free space left in a tank. */
export function ullage(volume: number, capacity: number): number {
  return Math.max(0, capacity - volume);
}

/** Days the volume lasts at the daily demand; `null` when nothing draws on the tank. */
export function daysOfCover(volume: number, dailyDemand: number | undefined): number | null {
  if (dailyDemand === undefined || dailyDemand <= 0) return null;
  return Math.max(0, volume) / dailyDemand;
}

/** Projected volume at each of the given hours, for a level trend. */
export function levelSeries(tank: InventoryTank, movements: readonly InventoryMovement[], hours: readonly number[]): number[] {
  return hours.map((hour) => volumeAt(tank, movements, hour));
}

/** Evenly spaced hours from 0 to `horizon`, both included. */
export function hourSteps(horizon: number, step: number): number[] {
  if (horizon <= 0 || step <= 0) return [0];
  return Array.from({ length: Math.floor(horizon / step) + 1 }, (_, index) => index * step);
}

/** Net flow into a tank at an hour, in volume per hour: positive while filling, negative while drawing. */
export function netRateAt(tankId: string, movements: readonly InventoryMovement[], hour: number): number {
  return activeMovements(movements, hour).reduce((rate, movement) => {
    const perHour = movement.volume / (movement.endHour - movement.startHour);
    return rate + (movement.to === tankId ? perHour : 0) - (movement.from === tankId ? perHour : 0);
  }, 0);
}

/** Total on hand across tanks at an hour. */
export function totalAt(tanks: readonly InventoryTank[], movements: readonly InventoryMovement[], hour: number): number {
  return tanks.reduce((total, tank) => total + volumeAt(tank, movements, hour), 0);
}

export type ScrubberState = { hour: number; playing: boolean };

export type ScrubberAction =
  | { type: 'seek'; hour: number }
  | { type: 'play' }
  | { type: 'pause' }
  /** One step forward while playing. Playback stops by itself at the horizon. */
  | { type: 'tick'; step?: number };

/**
 * A bounded time scrubber: playback is started by the user and always stops at `horizon`.
 * Pressing play at the end starts over from hour 0.
 */
export function scrubberReducer(state: ScrubberState, action: ScrubberAction, horizon: number): ScrubberState {
  switch (action.type) {
    case 'seek':
      return { hour: Math.min(horizon, Math.max(0, action.hour)), playing: false };
    case 'play':
      return { hour: state.hour >= horizon ? 0 : state.hour, playing: true };
    case 'pause':
      return state.playing ? { ...state, playing: false } : state;
    case 'tick': {
      if (!state.playing) return state;
      const hour = Math.min(horizon, state.hour + (action.step ?? 1));
      return { hour, playing: hour < horizon };
    }
  }
}
