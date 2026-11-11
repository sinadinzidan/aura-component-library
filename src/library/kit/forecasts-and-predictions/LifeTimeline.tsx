import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type LifeMarker = { at: number; label: string; tone?: Tone };

type LifeTimelineProps = {
  /** What the timeline is about: "Remaining useful life, drive-end bearing". */
  label: string;
  /** Length of the timeline in the unit used by every other number, usually days. */
  span: number;
  /** The window in which the end of life is expected. */
  earliest: number;
  likely: number;
  latest: number;
  /** Planned events on the same scale: a shutdown, a delivery. */
  markers?: readonly LifeMarker[];
  /** Captions under the start and the end of the scale. */
  startLabel?: string;
  endLabel: string;
  /** Unit word after the numbers. */
  unit?: string;
  tone?: Tone;
  className?: string;
};

/**
 * Remaining life as a stretch of time from today: the safe run, then the window in which failure
 * is expected, with the most likely day marked and planned events placed on the same scale so
 * "does the shutdown come first?" is answered by position.
 */
export function LifeTimeline({ label, span, earliest, likely, latest, markers = [], startLabel = 'Today', endLabel, unit = 'd', tone = 'warning', className }: LifeTimelineProps) {
  const look = useLook();
  const at = (value: number) => `${Math.min(100, Math.max(0, (value / (span || 1)) * 100))}%`;
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const hatch = look === 'blueprint' || look === 'editorial';

  return (
    <div
      role="img"
      aria-label={`${label}: most likely ${likely} ${unit}, between ${earliest} and ${latest} ${unit}`}
      data-look={look}
      data-tone={tone}
      className={cx('flex min-w-0 flex-col text-(--kit-text)', className)}
    >
      <div className="relative h-6">
        {markers.map((marker) => (
          <span key={marker.label} data-tone={marker.tone ?? 'info'} className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center text-xs font-medium whitespace-nowrap" style={{ left: at(marker.at), color: 'var(--t-ink)' }}>
            {marker.label}
          </span>
        ))}
      </div>
      <div className="relative h-9">
        <span className="absolute inset-x-0 top-3 h-3 bg-(--kit-track)" style={{ borderRadius: square ? 0 : 999 }} />
        <span data-tone="success" className="absolute top-3 left-0 h-3" style={{ width: at(earliest), background: 'color-mix(in oklab, var(--t-line) 55%, transparent)', borderRadius: square ? 0 : '999px 0 0 999px' }} />
        <span
          data-part="window"
          className="absolute top-3 h-3"
          style={{
            left: at(earliest),
            width: `calc(${at(latest)} - ${at(earliest)})`,
            background: hatch ? 'repeating-linear-gradient(135deg, var(--t-line) 0 2px, transparent 2px 6px)' : 'var(--t-line)',
            boxShadow: look === 'glass' ? '0 0 12px var(--t-line)' : hatch ? 'inset 0 0 0 1px var(--t-line)' : undefined,
          }}
        />
        {markers.map((marker) => (
          <span key={marker.label} data-tone={marker.tone ?? 'info'} className="absolute top-0 h-9 border-l-2 border-dashed" style={{ left: at(marker.at), borderColor: 'var(--t-line)' }} />
        ))}
        <span className="absolute top-1 size-7 -translate-x-1/2 rounded-full border-[3px] bg-(--kit-halo)" style={{ left: at(likely), borderColor: 'var(--t-line)', borderRadius: square ? 0 : 999 }} />
      </div>
      <div className="relative h-10 text-xs text-(--kit-text-3) tabular-nums">
        <span className="absolute top-0 left-0">{startLabel}</span>
        <span className="absolute top-0 right-0">{endLabel}</span>
        <span className="absolute top-0 flex -translate-x-1/2 flex-col items-center whitespace-nowrap" style={{ left: at(likely) }}>
          <span className="text-sm font-semibold text-(--kit-text)">
            {likely} {unit}
          </span>
          <span>
            {earliest}–{latest} {unit}
          </span>
        </span>
      </div>
    </div>
  );
}
