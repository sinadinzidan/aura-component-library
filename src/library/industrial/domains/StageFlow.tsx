import { IconCheck } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { TONE_BORDER, TONE_DOT, TONE_TEXT } from '../status';
import type { Tone } from '../status';

export type Stage = {
  id: string;
  label: string;
  /** Quiet second line: who, when or how much. */
  detail?: string;
};

export type StageFlowProps = {
  /** What moves through the stages, e.g. "Sample S-260312-07 status". */
  label: string;
  stages: readonly Stage[];
  /** The stage the item is in now. Stages before it are done; `null` means nothing has started. */
  current: string | null;
  /** Every stage is done, including the last. */
  complete?: boolean;
  /** Set when the current stage is held up or failed; the stage then also shows `currentNote`. */
  currentTone?: Tone;
  /** Replaces the current stage's detail, e.g. "Held at customs". */
  currentNote?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
};

type StageState = 'done' | 'current' | 'upcoming';

const STATE_WORD: Record<StageState, string> = { done: 'done', current: 'current', upcoming: 'not started' };

function stateOf(index: number, currentIndex: number, complete: boolean): StageState {
  if (complete || index < currentIndex) return 'done';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

function Marker({ state, tone }: { state: StageState; tone: Tone }) {
  if (state === 'done') {
    return (
      <span data-slot="stage-marker" className="flex size-5 shrink-0 items-center justify-center rounded-full border border-emphasized text-base-foreground">
        <IconCheck aria-hidden="true" className="size-3" />
      </span>
    );
  }
  if (state === 'current') {
    return (
      <span
        data-slot="stage-marker"
        className={cn('flex size-5 shrink-0 items-center justify-center rounded-full border-2', tone === 'neutral' ? 'border-base-foreground' : TONE_BORDER[tone])}
      >
        <span className={cn('size-2 rounded-full', tone === 'neutral' ? 'bg-base-foreground' : TONE_DOT[tone])} />
      </span>
    );
  }
  return <span data-slot="stage-marker" className="size-5 shrink-0 rounded-full border border-dashed border-emphasized" />;
}

/**
 * A fixed sequence of stages with the current one marked: sample taken → in lab → approved, a
 * permit's life cycle, a delivery on its way. Done stages carry a check, the current stage is
 * filled and bold, upcoming stages are dashed — so progress reads without colour.
 */
export function StageFlow({
  label,
  stages,
  current,
  complete = false,
  currentTone = 'neutral',
  currentNote,
  orientation = 'horizontal',
  className,
}: StageFlowProps) {
  const currentIndex = current === null ? -1 : stages.findIndex((stage) => stage.id === current);
  const vertical = orientation === 'vertical';

  return (
    <ol data-slot="stage-flow" aria-label={label} className={cn('flex w-full min-w-0', vertical ? 'flex-col' : 'flex-row', className)}>
      {stages.map((stage, index) => {
        const state = stateOf(index, currentIndex, complete);
        const isLast = index === stages.length - 1;
        const tone = state === 'current' ? currentTone : 'neutral';
        const detail = state === 'current' && currentNote ? currentNote : stage.detail;
        const connector = stateOf(index + 1, currentIndex, complete) === 'upcoming' ? 'border-dashed border-default' : 'border-emphasized';

        return (
          <li
            key={stage.id}
            data-state={state}
            aria-current={state === 'current' ? 'step' : undefined}
            className={cn('flex min-w-0', vertical ? 'flex-row gap-3' : 'flex-col gap-2', !vertical && !isLast ? 'flex-1' : undefined)}
          >
            <div className={cn('flex items-center', vertical ? 'flex-col' : 'flex-row')}>
              <Marker state={state} tone={tone} />
              {isLast ? null : (
                <span aria-hidden="true" className={cn(vertical ? 'my-1 min-h-4 flex-1 border-l' : 'mx-2 flex-1 border-t', connector)} />
              )}
            </div>
            <div className={cn('flex min-w-0 flex-col gap-0.5', vertical ? 'pb-4' : 'pr-3', vertical && isLast ? 'pb-0' : undefined)}>
              <span className={cn('text-sm', state === 'current' ? 'font-medium text-base-foreground' : state === 'done' ? 'text-base-foreground' : 'text-muted-foreground')}>
                {stage.label}
                <span className="sr-only">, {STATE_WORD[state]}</span>
              </span>
              {detail ? (
                <span className={cn('text-xs tabular-nums', state === 'current' && tone !== 'neutral' ? TONE_TEXT[tone] : 'text-muted-foreground')}>{detail}</span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
