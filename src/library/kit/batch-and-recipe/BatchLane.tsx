import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type LaneBooking = {
  id: string;
  /** Shown on the bar: the batch number. */
  label: string;
  /** Hours from the start of the window. */
  from: number;
  to: number;
  state: 'done' | 'running' | 'hold' | 'planned';
};

export type LaneRow = { id: string; name: string; tag: string; bookings: readonly LaneBooking[] };

type BatchLaneProps = {
  /** Names the chart, for example "Vessel allocation, next 18 hours". */
  label: string;
  rows: readonly LaneRow[];
  /** Length of the window in hours. */
  hours: number;
  /** Clock label per tick, evenly spaced from the start to the end of the window. */
  ticks: readonly string[];
  /** Hours from the start of the window to the present. */
  nowAt?: number;
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

const STATE_TONE: Record<LaneBooking['state'], Tone> = { done: 'neutral', running: 'info', hold: 'warning', planned: 'accent' };

const STATE_WORD: Record<LaneBooking['state'], string> = { done: 'Done', running: 'Running', hold: 'On hold', planned: 'Planned' };

/**
 * Which vessel holds which batch when: one lane per vessel, one bar per booking. Finished,
 * running and held bookings are filled; planned ones are outlined, so the future never looks
 * like a fact.
 */
export function BatchLane({ label, rows, hours, ticks, nowAt, selectedId, onSelect, className }: BatchLaneProps) {
  const look = useLook();
  const solid = look === 'console' || look === 'poster' || look === 'signal';
  const left = (hour: number): string => `${(hour / hours) * 100}%`;

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('grid min-w-0 grid-cols-[9rem_minmax(0,1fr)] gap-x-4 text-sm', className)}>
      {rows.map((row) => (
        <div key={row.id} className="col-span-2 grid grid-cols-subgrid items-center border-b border-(--kit-rule) py-2.5">
          <div className="min-w-0">
            <p className="leading-5 font-semibold text-(--kit-text)">{row.name}</p>
            <p className="text-xs leading-4 font-medium text-(--kit-text-2) tabular-nums">{row.tag}</p>
          </div>
          <div className="relative h-11">
            {ticks.map((tick, index) => (
              <span key={tick} className="absolute inset-y-0 border-l border-(--kit-grid)" style={{ left: `${(index / (ticks.length - 1)) * 100}%` }} />
            ))}
            {row.bookings.map((booking) => {
              const tone = STATE_TONE[booking.state];
              const selected = booking.id === selectedId;
              const classes = cx(
                'absolute inset-y-1 flex min-w-0 flex-col justify-center rounded-(--kit-radius-sm) px-2 text-left leading-4',
                booking.state === 'planned'
                  ? 'border border-dashed border-(--kit-rule-strong) bg-transparent text-(--kit-text)'
                  : solid
                    ? 'bg-(--t-vivid) text-(--t-on-vivid)'
                    : look === 'blueprint'
                      ? 'border border-(--t-line) bg-(--t-soft) text-(--kit-text)'
                      : 'border-l-4 border-(--t-line) bg-(--t-soft) text-(--kit-text)',
                selected && 'z-10 outline-2 outline-offset-2 outline-(--kit-text)'
              );
              const style = { left: left(booking.from), width: left(booking.to - booking.from) };
              const body = (
                <>
                  <span className="text-xs font-semibold whitespace-nowrap tabular-nums">{booking.label}</span>
                  {(booking.to - booking.from) / hours >= 0.15 ? <span className="text-xs whitespace-nowrap">{STATE_WORD[booking.state]}</span> : null}
                </>
              );
              return onSelect ? (
                <button key={booking.id} type="button" data-tone={tone} data-state={booking.state} aria-pressed={selected} onClick={() => onSelect(booking.id)} style={style} className={cx(classes, 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--kit-text)')}>
                  {body}
                </button>
              ) : (
                <div key={booking.id} data-tone={tone} data-state={booking.state} style={style} className={classes}>
                  {body}
                </div>
              );
            })}
            {nowAt !== undefined ? <span data-now="" className="absolute -inset-y-2.5 border-l-2 border-(--kit-text)" style={{ left: left(nowAt) }} /> : null}
          </div>
        </div>
      ))}
      <span />
      <div className="relative h-5 pt-1">
        {ticks.map((tick, index) => (
          <span
            key={tick}
            className={cx('absolute text-xs leading-4 whitespace-nowrap text-(--kit-text-2) tabular-nums', index === ticks.length - 1 ? '-translate-x-full' : index === 0 ? '' : '-translate-x-1/2')}
            style={{ left: `${(index / (ticks.length - 1)) * 100}%` }}
          >
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}
