import { Fragment } from 'react';

import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { STATION_TONE, STATION_WORD, bottleneckIndex, type Station } from './lines';

type LineStripProps = {
  /** Accessible name: "Line 3, stations in flow order". */
  label: string;
  stations: readonly Station[];
  taktSeconds: number;
  /** Id of the selected station. */
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

const FILLED_LOOKS = ['console', 'poster', 'signal'];
const SQUARE_LOOKS = ['console', 'poster', 'blueprint', 'signal'];

/**
 * A production line as stations in flow order with the buffers between them. Each station says
 * its state in a word and shows its cycle time; the slowest one is named the bottleneck. A buffer
 * is a small column that fills with waiting parts, so starving and blocking can be traced to their
 * cause. Station cells are cards with a state edge by default and solid state fills in the
 * block-built looks.
 */
export function LineStrip({ label, stations, taktSeconds, selected, onSelect, className }: LineStripProps) {
  const look = useLook();
  const filled = FILLED_LOOKS.includes(look);
  const square = SQUARE_LOOKS.includes(look);
  const slowest = bottleneckIndex(stations);

  return (
    <ol aria-label={label} data-look={look} className={cx('flex min-w-0 items-stretch text-(--kit-text)', className)}>
      {stations.map((station, index) => {
        const isSelected = station.id === selected;
        const over = station.cycleSeconds !== undefined && station.cycleSeconds > taktSeconds;
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-xs leading-4 font-semibold tabular-nums">{station.code}</span>
              {index === slowest ? <span className="text-xs leading-4 font-semibold">Bottleneck</span> : null}
            </span>
            <span className="mt-1 block text-sm leading-5 font-medium">{station.name}</span>
            <span className={cx('mt-2 block text-sm leading-5 font-semibold', filled ? '' : 'text-(--t-ink)')}>{STATION_WORD[station.state]}</span>
            <span className={cx('block text-xs leading-5 tabular-nums', filled ? '' : 'text-(--kit-text-2)')}>
              {station.cycleSeconds === undefined ? (station.since ?? 'Not cycling') : `${station.cycleSeconds} s${over ? ', over takt' : ''}`}
            </span>
          </>
        );
        const frame = cx(
          'flex h-full w-full flex-col p-3 text-left',
          square ? '' : 'rounded-(--kit-radius-sm)',
          filled ? 'bg-(--t-solid) text-(--t-on-solid)' : 'border border-t-4 border-(--kit-rule) border-t-(--t-solid) bg-(--kit-surface)',
          isSelected ? 'ring-2 ring-(--kit-accent) ring-offset-2 ring-offset-(--kit-surface)' : '',
        );
        return (
          <Fragment key={station.id}>
            <li data-tone={STATION_TONE[station.state]} data-state={station.state} data-bottleneck={index === slowest ? '' : undefined} className="min-w-0 flex-1">
              {onSelect ? (
                <button type="button" aria-pressed={isSelected} onClick={() => onSelect(station.id)} className={cx(frame, 'outline-none focus-visible:ring-2 focus-visible:ring-(--kit-accent)')}>
                  {body}
                </button>
              ) : (
                <div className={frame}>{body}</div>
              )}
            </li>
            {station.buffer && index < stations.length - 1 ? (
              <li
                role="img"
                aria-label={`Buffer after ${station.name}: ${station.buffer.count} of ${station.buffer.capacity}`}
                data-tone={station.buffer.count >= station.buffer.capacity ? 'warning' : station.buffer.count === 0 ? 'warning' : 'neutral'}
                className="flex w-9 shrink-0 flex-col items-center justify-center gap-1 px-1.5"
              >
                <span aria-hidden="true" className="flex w-3 flex-1 flex-col-reverse gap-px">
                  {Array.from({ length: station.buffer.capacity }, (_, slot) => (
                    <span key={slot} className={cx('w-full flex-1', slot < (station.buffer?.count ?? 0) ? 'bg-(--t-solid)' : 'bg-(--kit-track) ring-1 ring-(--kit-rule) ring-inset')} />
                  ))}
                </span>
                <span aria-hidden="true" className="text-xs leading-4 font-medium text-(--kit-text-2) tabular-nums">
                  {station.buffer.count}/{station.buffer.capacity}
                </span>
              </li>
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}
