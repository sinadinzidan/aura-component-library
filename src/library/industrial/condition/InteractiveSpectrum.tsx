import { useReducer, useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { cn } from '../../../lib/utils';
import { formatValue } from '../status';

import type { SpectrumLine } from './dft';
import { harmonicFamily, lineIndexAt, toOrders } from './harmonics';
import { INITIAL_SPECTRUM_CURSOR, spectrumCursorReducer } from './spectrumCursor';
import type { SpectrumCursorAction, SpectrumCursorState } from './spectrumCursor';
import { SpectrumPlot } from './SpectrumPlot';
import type { SpectrumMarker } from './SpectrumPlot';

export type InteractiveSpectrumProps = {
  /** What the spectrum shows. Becomes the accessible name of the cursor control. */
  label: string;
  spectrum: readonly SpectrumLine[];
  unit: string;
  runningHz: number;
  maxHz?: number;
  markers?: readonly SpectrumMarker[];
  /** Amplitude above which a line counts as a peak for Shift + arrow jumps. */
  peakThreshold?: number;
  /** How many harmonics the family draws from the chosen fundamental. */
  harmonics?: number;
  /** Line the cursor starts on, by frequency. */
  initialHz?: number;
  /** Fundamental the harmonic family starts on, by frequency. */
  initialFundamentalHz?: number;
  /** Called when the cursor moves, with the line under it. */
  onCursorChange?: (line: SpectrumLine | null) => void;
  decimals?: number;
  heightClassName?: string;
  className?: string;
};

/**
 * A spectrum with a readout cursor. Hover or use the arrow keys to read frequency (Hz and orders)
 * and amplitude; Shift + arrow jumps between peaks; click, Enter or Space takes the line under the
 * cursor as the fundamental of a harmonic family, and Escape clears it. Every change is announced.
 */
export function InteractiveSpectrum({
  label,
  spectrum,
  unit,
  runningHz,
  maxHz,
  markers,
  peakThreshold = 0,
  harmonics = 6,
  initialHz,
  initialFundamentalHz,
  onCursorChange,
  decimals = 2,
  heightClassName = 'h-64',
  className,
}: InteractiveSpectrumProps) {
  const lastHz = maxHz ?? spectrum[spectrum.length - 1]?.frequencyHz ?? 1;
  const visible = spectrum.filter((line) => line.frequencyHz <= lastHz);
  const area = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(
    (current: SpectrumCursorState, action: SpectrumCursorAction) => spectrumCursorReducer(current, action, visible, peakThreshold),
    undefined,
    (): SpectrumCursorState => ({
      index: initialHz === undefined ? INITIAL_SPECTRUM_CURSOR.index : lineIndexAt(visible, initialHz),
      fundamentalIndex: initialFundamentalHz === undefined ? null : lineIndexAt(visible, initialFundamentalHz),
    })
  );

  const line = state.index === null ? null : (visible[state.index] ?? null);
  const fundamental = state.fundamentalIndex === null ? null : (visible[state.fundamentalIndex] ?? null);
  const family = fundamental ? harmonicFamily(fundamental.frequencyHz, { count: harmonics, maxHz: lastHz }) : [];

  const send = (action: SpectrumCursorAction) => {
    const next = spectrumCursorReducer(state, action, visible, peakThreshold);
    dispatch(action);
    if (next.index !== state.index) onCursorChange?.(next.index === null ? null : (visible[next.index] ?? null));
  };

  const indexFromPointer = (event: PointerEvent<HTMLDivElement>): number | null => {
    const bounds = area.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return null;
    const fraction = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    return lineIndexAt(visible, fraction * lastHz);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const actions: Record<string, SpectrumCursorAction> = {
      ArrowRight: event.shiftKey ? { type: 'peak', direction: 1 } : { type: 'step', by: 1 },
      ArrowLeft: event.shiftKey ? { type: 'peak', direction: -1 } : { type: 'step', by: -1 },
      PageUp: { type: 'step', by: 10 },
      PageDown: { type: 'step', by: -10 },
      Home: { type: 'first' },
      End: { type: 'last' },
      Enter: { type: 'setFundamental' },
      ' ': { type: 'setFundamental' },
      Escape: { type: 'clearFundamental' },
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    send(action);
  };

  const readout = line
    ? `${formatValue(line.frequencyHz, 1)} Hz, ${formatValue(toOrders(line.frequencyHz, runningHz), 2)} orders, ${formatValue(line.amplitude, decimals)} ${unit}`
    : 'Move over the spectrum to read a line';

  return (
    <div data-slot="interactive-spectrum" className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
        {[
          { term: 'Frequency', value: line ? `${formatValue(line.frequencyHz, 1)} Hz` : '—' },
          { term: 'Order', value: line ? `${formatValue(toOrders(line.frequencyHz, runningHz), 2)}×` : '—' },
          { term: 'Amplitude', value: line ? `${formatValue(line.amplitude, decimals)} ${unit}` : '—' },
          { term: 'Harmonic family', value: fundamental ? `${formatValue(fundamental.frequencyHz, 1)} Hz (${formatValue(toOrders(fundamental.frequencyHz, runningHz), 2)}×)` : 'None set' },
        ].map((item) => (
          <div key={item.term} className="flex items-baseline gap-2">
            <dt className="text-xs text-muted-foreground">{item.term}</dt>
            <dd className="font-medium text-base-foreground tabular-nums">{item.value}</dd>
          </div>
        ))}
      </dl>
      <SpectrumPlot
        label={label}
        interactive
        spectrum={visible}
        unit={unit}
        maxHz={lastHz}
        runningHz={runningHz}
        cursors={family}
        markers={markers}
        cursorHz={line?.frequencyHz}
        heightClassName={heightClassName}
        overlay={() => (
          <div
            ref={area}
            role="slider"
            tabIndex={0}
            aria-label={`${label}. Readout cursor`}
            aria-valuemin={0}
            aria-valuemax={Math.round(lastHz)}
            aria-valuenow={line ? Math.round(line.frequencyHz) : 0}
            aria-valuetext={readout}
            data-slot="spectrum-cursor-area"
            className="absolute inset-0 cursor-crosshair touch-none rounded-xs outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-default)]"
            onPointerMove={(event) => {
              const index = indexFromPointer(event);
              if (index !== null && index !== state.index) send({ type: 'moveTo', index });
            }}
            onPointerLeave={() => send({ type: 'leave' })}
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              if (bounds.width === 0) return;
              const fraction = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
              send({ type: 'setFundamental', index: lineIndexAt(visible, fraction * lastHz) });
            }}
            onKeyDown={onKeyDown}
          />
        )}
      />
      <p aria-live="polite" className="sr-only">
        {readout}
        {fundamental ? `. Harmonic family on ${formatValue(fundamental.frequencyHz, 1)} Hz.` : ''}
      </p>
    </div>
  );
}
