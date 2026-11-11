import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

import { phaseTone, type TrackPhase } from './phases';

type PhaseTrackProps = {
  /** Names the track, for example "Phases of batch B-2603-118". */
  label: string;
  phases: readonly TrackPhase[];
  selectedId?: string;
  /** Makes every phase a button. */
  onSelect?: (id: string) => void;
  className?: string;
};

type Anatomy = 'bar' | 'block';

const LOOK_ANATOMY: Record<LookId, Anatomy> = {
  studio: 'bar',
  console: 'block',
  poster: 'block',
  glass: 'bar',
  editorial: 'bar',
  soft: 'bar',
  blueprint: 'block',
  signal: 'block',
};

const STATE_WORD: Record<TrackPhase['state'], string> = { done: 'Done', current: 'Running', held: 'On hold', upcoming: 'Not started' };

/**
 * A batch as a row of phases, each as wide as the recipe says it should take and filled as far as
 * it has got. Studio, glass and soft draw a slim progress bar per phase; console, poster, signal
 * and blueprint draw blocks that carry the state as a word.
 */
export function PhaseTrack({ label, phases, selectedId, onSelect, className }: PhaseTrackProps) {
  const look = useLook();
  const anatomy = LOOK_ANATOMY[look];
  const outlined = look === 'blueprint';

  return (
    <div role="group" aria-label={label} data-look={look} data-anatomy={anatomy} className={cx('flex min-w-0', anatomy === 'bar' ? 'gap-2' : look === 'poster' || outlined ? 'gap-0' : 'gap-px', className)}>
      {phases.map((phase) => {
        const tone = phaseTone(phase);
        const share = phase.actual === null ? 0 : Math.min(1, phase.actual / phase.expected);
        const over = phase.actual !== null && phase.actual > phase.expected ? phase.actual - phase.expected : 0;
        const minutes = phase.actual === null ? `${phase.expected} min` : `${phase.actual} / ${phase.expected} min`;
        const selected = phase.id === selectedId;
        const active = phase.state !== 'upcoming';
        const body =
          anatomy === 'bar' ? (
            <>
              <span className="flex items-baseline justify-between gap-2">
                <span className={cx('text-sm leading-5 font-semibold', active ? 'text-(--kit-text)' : 'text-(--kit-text-2)')}>{phase.label}</span>
                {phase.state === 'current' || phase.state === 'held' ? <span className="text-xs leading-4 font-medium text-(--t-ink)">{STATE_WORD[phase.state]}</span> : null}
              </span>
              <span className="relative block h-(--kit-track-h) overflow-hidden rounded-(--kit-track-radius) bg-(--kit-track)">
                <span className="absolute inset-y-0 left-0 rounded-(--kit-track-radius) bg-(--t-line)" style={{ width: `${share * 100}%` }} />
              </span>
              <span className="flex items-baseline justify-between gap-2 text-xs leading-4 text-(--kit-text-2) tabular-nums">
                <span>{minutes}</span>
                {over > 0 ? <span className="font-medium text-(--t-ink)">+{over}</span> : null}
              </span>
            </>
          ) : (
            <>
              <span className="text-sm leading-5 font-semibold">{phase.label}</span>
              <span className="text-xs leading-4 font-medium">{STATE_WORD[phase.state]}</span>
              <span className="mt-auto text-xs leading-4 tabular-nums">
                {minutes}
                {over > 0 ? ` · +${over}` : ''}
              </span>
              {phase.state === 'current' || phase.state === 'held' ? (
                <span className="absolute inset-x-0 bottom-0 h-1 bg-(--kit-track)">
                  <span className="absolute inset-y-0 left-0 bg-current" style={{ width: `${share * 100}%` }} />
                </span>
              ) : null}
            </>
          );
        const classes = cx(
          'relative flex min-w-0 flex-col text-left',
          anatomy === 'bar' ? 'gap-1.5' : 'min-h-22 gap-0.5 px-3 py-2.5',
          anatomy === 'block' && !outlined && (active ? 'bg-(--t-vivid) text-(--t-on-vivid)' : 'bg-(--kit-surface) text-(--kit-text-2)'),
          anatomy === 'block' && look === 'poster' && 'border-2 border-(--kit-text) not-first:-ml-0.5',
          outlined && 'border border-(--kit-rule-strong) text-(--kit-text) not-first:-ml-px',
          outlined && active && 'bg-(--t-soft)',
          selected && 'z-10 outline-2 outline-offset-2 outline-(--kit-text)'
        );
        const style = { flexGrow: phase.expected, flexBasis: 0 };
        return onSelect ? (
          <button key={phase.id} type="button" data-tone={tone} data-state={phase.state} aria-pressed={selected} onClick={() => onSelect(phase.id)} style={style} className={cx(classes, 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--kit-text)')}>
            {body}
          </button>
        ) : (
          <div key={phase.id} data-tone={tone} data-state={phase.state} style={style} className={classes}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
