import type { CSSProperties } from 'react';

import { PidCanvas } from '../../tools/pid/PidCanvas';
import type { PidAlarm, PidDrawing, PidLayers, PidPin } from '../../tools/pid/pidModel';
import type { PidSelection } from '../../tools/pid/pidReducer';
import { cx } from '../tones';

type PidSheetProps = {
  drawing: PidDrawing;
  /** Live value per instrument id. `null` is a lost signal. */
  readings?: Readonly<Record<string, number | null>>;
  alarms?: readonly PidAlarm[];
  layers?: PidLayers;
  selection?: PidSelection;
  pins?: readonly PidPin[];
  /** Makes tags, lines and pins selectable. */
  onSelect?: (selection: NonNullable<PidSelection>) => void;
  /** How far the sheet may grow beyond one drawing unit per pixel, as a factor. */
  maxScale?: number;
  className?: string;
};

/**
 * Type on the sheet: the UI sans at 12 units everywhere, including the units after a value. The
 * instrument bubbles are small drawings of their own at 1.25 times the sheet's scale, so their
 * text is set at 9.6 units — 12 on the sheet — and tightened to stay inside the circle.
 */
const SHEET_TYPE = [
  'm-auto block shrink-0',
  '[&_.font-mono]:font-sans [&_.font-mono]:tabular-nums',
  '[&_text]:[font-size:12px] [&_tspan]:[font-size:12px]',
  '[&_svg_text]:[font-size:9.6px] [&_svg_text]:[letter-spacing:-0.06em] [&_svg_text]:[font-variant-numeric:normal]',
].join(' ');

/**
 * A P&ID from the P&ID tool, set for reading in a panel: one drawing unit is at least one pixel,
 * the sheet grows to fit its container up to `maxScale` and the container scrolls when it is
 * smaller than the sheet. Text is set in the UI sans at 12 units, so it never falls under 12 px.
 */
export function PidSheet({ drawing, readings, alarms, layers, selection, pins, onSelect, maxScale = 1.35, className }: PidSheetProps) {
  const style: CSSProperties = {
    width: '100%',
    height: '100%',
    minWidth: drawing.width,
    minHeight: drawing.height,
    maxWidth: Math.round(drawing.width * maxScale),
    maxHeight: Math.round(drawing.height * maxScale),
  };

  return (
    <div data-slot="pid-sheet-frame" className={cx('flex min-h-0 min-w-0 overflow-auto', className)}>
      <svg
        role="group"
        aria-label={`P&ID ${drawing.number}, ${drawing.title}`}
        viewBox={`0 0 ${drawing.width} ${drawing.height}`}
        fill="none"
        style={style}
        className={SHEET_TYPE}
      >
        <PidCanvas drawing={drawing} readings={readings} alarms={alarms} layers={layers} selection={selection} pins={pins} onSelect={onSelect} />
      </svg>
    </div>
  );
}
