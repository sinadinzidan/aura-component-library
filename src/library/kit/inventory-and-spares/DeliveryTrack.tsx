import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type DeliveryStage = {
  id: string;
  /** "Ordered", "Shipped from supplier". */
  name: string;
  /** When it happened or is expected: "3 Mar", "Expected 19 Mar". */
  when: string;
  /** A line of detail: carrier, reference, the reason for a delay. */
  detail?: string;
  state: 'done' | 'current' | 'delayed' | 'upcoming';
};

type DeliveryTrackProps = {
  /** Accessible name: "Delivery of PO 4500128841". */
  label: string;
  stages: readonly DeliveryStage[];
  className?: string;
};

const STAGE_TONE: Record<DeliveryStage['state'], Tone> = {
  done: 'success',
  current: 'accent',
  delayed: 'critical',
  upcoming: 'neutral',
};

const STAGE_WORD: Record<DeliveryStage['state'], string> = {
  done: 'Done',
  current: 'Now',
  delayed: 'Delayed',
  upcoming: 'To come',
};

/**
 * A delivery as a vertical track from order to shelf. Each stage has a marker on the line, when
 * it happened or is expected, and its state in a word; a delayed stage carries the reason.
 */
export function DeliveryTrack({ label, stages, className }: DeliveryTrackProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint' || look === 'signal';

  return (
    <ol aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col text-(--kit-text)', className)}>
      {stages.map((stage, index) => {
        const last = index === stages.length - 1;
        const reached = stage.state !== 'upcoming';
        return (
          <li key={stage.id} data-tone={STAGE_TONE[stage.state]} data-state={stage.state} aria-current={stage.state === 'current' || stage.state === 'delayed' ? 'step' : undefined} className="relative grid grid-cols-[1.25rem_minmax(0,1fr)_auto] gap-x-3 pb-5 last:pb-0">
            {last ? null : <span aria-hidden="true" className={cx('absolute top-5 bottom-0 left-[0.5625rem] border-l-2', stage.state === 'done' ? 'border-(--t-solid)' : 'border-dashed border-(--kit-rule-strong)')} />}
            <span
              aria-hidden="true"
              className={cx('relative mt-0.5 size-5', square ? '' : 'rounded-full', reached ? 'bg-(--t-solid)' : 'border-2 border-(--kit-rule-strong) bg-(--kit-surface)', stage.state === 'current' || stage.state === 'delayed' ? 'ring-4 ring-(--t-soft)' : '')}
            />
            <div className="min-w-0">
              <p className="text-sm leading-5 font-medium">{stage.name}</p>
              {stage.detail ? <p className={cx('text-xs leading-5', stage.state === 'delayed' ? 'font-medium text-(--t-ink)' : 'text-(--kit-text-2)')}>{stage.detail}</p> : null}
            </div>
            <div className="text-right">
              <p className="text-sm leading-5 tabular-nums">{stage.when}</p>
              <p className="text-xs leading-5 font-semibold text-(--t-ink)">{STAGE_WORD[stage.state]}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
