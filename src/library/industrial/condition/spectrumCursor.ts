import type { SpectrumLine } from './dft';
import { findPeakIndices } from './harmonics';

/** Where the readout cursor of an interactive spectrum is, and which line anchors the harmonic family. */
export type SpectrumCursorState = {
  /** Index of the line under the cursor; `null` before the first move. */
  index: number | null;
  /** Index of the line taken as the fundamental of the harmonic family. */
  fundamentalIndex: number | null;
};

export type SpectrumCursorAction =
  | { type: 'moveTo'; index: number }
  | { type: 'step'; by: number }
  | { type: 'peak'; direction: 1 | -1 }
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'setFundamental'; index?: number }
  | { type: 'clearFundamental' }
  | { type: 'leave' };

export const INITIAL_SPECTRUM_CURSOR: SpectrumCursorState = { index: null, fundamentalIndex: null };

const clampIndex = (index: number, length: number): number => Math.min(Math.max(index, 1), Math.max(1, length - 1));

/** The next peak above the threshold to the left or right of an index; the index itself when there is none. */
export function neighbouringPeak(spectrum: readonly SpectrumLine[], index: number, direction: 1 | -1, threshold: number): number {
  const peaks = findPeakIndices(spectrum, { threshold }).sort((a, b) => a - b);
  const next = direction === 1 ? peaks.find((peakIndex) => peakIndex > index) : [...peaks].reverse().find((peakIndex) => peakIndex < index);
  return next ?? index;
}

/**
 * Cursor movement over a spectrum. The 0 Hz line is skipped: it holds the signal's offset, not a
 * vibration component. `peakThreshold` decides what counts as a peak for peak-to-peak jumps.
 */
export function spectrumCursorReducer(
  state: SpectrumCursorState,
  action: SpectrumCursorAction,
  spectrum: readonly SpectrumLine[],
  peakThreshold = 0
): SpectrumCursorState {
  if (spectrum.length < 2) return state;
  const current = state.index ?? 1;
  switch (action.type) {
    case 'moveTo':
      return { ...state, index: clampIndex(action.index, spectrum.length) };
    case 'step':
      return { ...state, index: clampIndex(current + action.by, spectrum.length) };
    case 'peak':
      return { ...state, index: neighbouringPeak(spectrum, state.index ?? 0, action.direction, peakThreshold) };
    case 'first':
      return { ...state, index: 1 };
    case 'last':
      return { ...state, index: spectrum.length - 1 };
    case 'setFundamental': {
      const index = action.index ?? state.index;
      if (index === null) return state;
      const clamped = clampIndex(index, spectrum.length);
      return { index: clamped, fundamentalIndex: clamped === state.fundamentalIndex ? null : clamped };
    }
    case 'clearFundamental':
      return { ...state, fundamentalIndex: null };
    case 'leave':
      return { ...state, index: null };
  }
}
