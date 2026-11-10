import type { StatusDescriptor } from '../status';

/** What a well is doing right now. */
export type WellState = 'producing' | 'shut-in' | 'injecting' | 'workover';

const WELL_STATUS: Record<WellState, StatusDescriptor> = {
  producing: { tone: 'success', label: 'Producing', shape: 'dot' },
  'shut-in': { tone: 'neutral', label: 'Shut in', shape: 'square' },
  injecting: { tone: 'info', label: 'Injecting', shape: 'ring' },
  workover: { tone: 'warning', label: 'Workover', shape: 'diamond' },
};

/** Tone, label and shape of a well state: spread it into `StatusIndicator`. */
export const wellStatus = (state: WellState): StatusDescriptor => WELL_STATUS[state];

/** Water as a share of produced liquid, in percent. `null` when the well produces no liquid. */
export function waterCut(oil: number, water: number): number | null {
  const liquid = oil + water;
  if (!(liquid > 0)) return null;
  return (water / liquid) * 100;
}

/** Gas-oil ratio in Sm³/Sm³. `null` when there is no oil to divide by. */
export function gasOilRatio(gas: number, oil: number): number | null {
  if (!(oil > 0)) return null;
  return gas / oil;
}

/** Voidage replacement: injected volume over produced volume, as a ratio. `null` with no production. */
export function voidageReplacement(injected: number, produced: number): number | null {
  if (!(produced > 0)) return null;
  return injected / produced;
}
