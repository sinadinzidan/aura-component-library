import type { ReactNode } from 'react';

import { Panel } from '../Panel';
import { StatusPill } from '../StatusPill';
import { cx, formatNumber } from '../tones';

import { STATION_TONE, STATION_WORD, taktVerdict, type Station } from './lines';

type StationCardProps = {
  station: Station;
  taktSeconds: number;
  /** Good parts this shift. */
  count: number;
  /** First-pass yield in percent. */
  yieldPercent: number;
  /** One action for a station that needs someone: "Call maintenance". */
  action?: ReactNode;
  className?: string;
};

/**
 * One station in detail: its state, the last cycle time on a scale where takt is marked, the
 * count and first-pass yield, and the reason when it is not running. The cycle bar turns to the
 * warning colour and says "over takt" when the station cannot keep up.
 */
export function StationCard({ station, taktSeconds, count, yieldPercent, action, className }: StationCardProps) {
  const tone = STATION_TONE[station.state];
  const verdict = station.cycleSeconds === undefined ? undefined : taktVerdict(station.cycleSeconds, taktSeconds);
  const scaleEnd = taktSeconds * 1.5;
  const at = station.cycleSeconds === undefined ? 0 : Math.min(100, (station.cycleSeconds / scaleEnd) * 100);
  const taktAt = (taktSeconds / scaleEnd) * 100;

  return (
    <Panel
      className={className}
      title={station.name}
      subtitle={`Station ${station.code}`}
      tone={station.state === 'down' ? 'critical' : 'neutral'}
      actions={<StatusPill tone={tone}>{STATION_WORD[station.state]}</StatusPill>}
      footer={
        station.reason ? (
          <div className="flex w-full items-center justify-between gap-3">
            <span data-tone={tone} className="text-sm font-medium text-(--t-ink)">
              {station.reason}
              {station.since ? ` · ${station.since}` : ''}
            </span>
            {action}
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-4">
        <div data-tone={verdict?.tone ?? 'neutral'}>
          <div className="flex items-baseline justify-between gap-3">
            <p className="tabular-nums">
              <span className="text-3xl leading-none font-semibold tracking-tight">{station.cycleSeconds === undefined ? '—' : station.cycleSeconds}</span>
              <span className="ml-1.5 text-sm text-(--kit-text-2)">s cycle</span>
            </p>
            <p className="text-sm font-medium text-(--t-ink)">{verdict?.word ?? 'Not cycling'}</p>
          </div>
          <div
            role="meter"
            aria-label={`Cycle time, ${station.name}`}
            aria-valuemin={0}
            aria-valuemax={scaleEnd}
            aria-valuenow={station.cycleSeconds ?? 0}
            aria-valuetext={station.cycleSeconds === undefined ? 'Not cycling' : `${station.cycleSeconds} seconds against a takt of ${taktSeconds} seconds`}
            className="relative mt-2 h-3 bg-(--kit-track)"
          >
            <span className="absolute inset-y-0 left-0 bg-(--t-solid)" style={{ width: `${at}%` }} />
            <span className="absolute -inset-y-1 w-0.5 bg-(--kit-text)" style={{ left: `${taktAt}%` }} />
          </div>
          <p className="relative mt-1 h-4 text-xs text-(--kit-text-2) tabular-nums">
            <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${taktAt}%` }}>
              Takt {taktSeconds} s
            </span>
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-4 border-t border-(--kit-rule) pt-3">
          <div>
            <dt className="text-xs text-(--kit-text-2)">Good parts this shift</dt>
            <dd className="text-lg leading-7 font-semibold tabular-nums">{formatNumber(count)}</dd>
          </div>
          <div>
            <dt className="text-xs text-(--kit-text-2)">First-pass yield</dt>
            <dd className={cx('text-lg leading-7 font-semibold tabular-nums')}>{formatNumber(yieldPercent, 1)} %</dd>
          </div>
        </dl>
      </div>
    </Panel>
  );
}
