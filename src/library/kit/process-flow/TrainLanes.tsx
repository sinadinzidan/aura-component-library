import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx, formatNumber, type Tone } from '../tones';

import { BLOCK_ANATOMY } from './anatomy';
import { FlowStages, type FlowLinkItem, type FlowStageItem } from './FlowStages';

export type TrainLane = {
  id: string;
  name: string;
  /** State of the whole train in a word. */
  state: string;
  tone: Tone;
  /** Share of the duty the train carries, 0–100. */
  share: number;
  stages: readonly FlowStageItem[];
  links?: readonly (FlowLinkItem | undefined)[];
};

type TrainLanesProps = {
  /** What runs in parallel: "Export pumps". */
  label: string;
  lanes: readonly TrainLane[];
  className?: string;
};

/**
 * Parallel trains as lanes: one row per train, the same stages in the same columns, so duty and
 * standby compare at a glance. The lane head carries the train's state and its share of the duty.
 */
export function TrainLanes({ label, lanes, className }: TrainLanesProps) {
  const look = useLook();
  const solid = BLOCK_ANATOMY[look] === 'solid';
  return (
    <ul data-look={look} aria-label={label} className={cx('flex w-full min-w-0 flex-col', className)}>
      {lanes.map((lane) => (
        <li key={lane.id} data-lane={lane.id} className="grid min-w-0 items-stretch gap-4 border-t border-(--kit-rule) py-4 first:border-t-0 first:pt-0 last:pb-0" style={{ gridTemplateColumns: 'minmax(132px, 0.2fr) minmax(0, 1fr)' }}>
          <div data-tone={lane.tone} className="flex min-w-0 flex-col justify-center gap-2">
            <span className="text-base font-semibold text-(--kit-text)">{lane.name}</span>
            <StatusPill tone={lane.tone} variant={solid ? 'filled' : undefined} className="self-start">
              {lane.state}
            </StatusPill>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-(--kit-text-3) tabular-nums">{formatNumber(lane.share, 0)} % of duty</span>
              <div className="overflow-hidden" style={{ height: 'var(--kit-track-h)', borderRadius: 'var(--kit-track-radius)', background: 'var(--kit-track)', boxShadow: look === 'blueprint' ? 'inset 0 0 0 1px var(--kit-rule-strong)' : undefined }}>
                <div style={{ width: `${Math.max(0, Math.min(100, lane.share))}%`, height: '100%', background: 'var(--t-line)' }} />
              </div>
            </div>
          </div>
          <FlowStages label={`${lane.name} stages`} stages={lane.stages} links={lane.links} size="compact" />
        </li>
      ))}
    </ul>
  );
}
