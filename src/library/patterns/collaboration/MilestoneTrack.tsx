import { IconCheck } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

export type Milestone = {
  id: string;
  label: string;
  /** A date, a time or who did it: "4 Mar", "Liv Wold". */
  detail?: ReactNode;
  state: 'done' | 'current' | 'pending';
};

type MilestoneTrackProps = {
  /** Accessible name: "Status of WO-104482". */
  label: string;
  milestones: readonly Milestone[];
  /** `numbered` shows the step number in each marker; `dot` keeps the markers small. */
  markers?: 'numbered' | 'dot';
};

const STATE_TEXT = { done: 'Completed', current: 'Current', pending: 'Not started' } as const;

/**
 * A short life cycle on a horizontal line: requested → approved → in progress → done. Completed
 * steps carry a check, the current one is filled and marked `aria-current`, and the line turns
 * dashed for the part that is still ahead. For three to six steps that fit on one row.
 */
export function MilestoneTrack({ label, milestones, markers = 'numbered' }: MilestoneTrackProps) {
  return (
    <ol data-slot="milestone-track" aria-label={label} className="flex w-full min-w-0">
      {milestones.map((milestone, index) => {
        const next = milestones[index + 1];
        const numbered = markers === 'numbered';
        const marker =
          milestone.state === 'done'
            ? 'bg-medium-background text-base-foreground'
            : milestone.state === 'current'
              ? 'bg-primary-background text-primary-foreground'
              : 'border border-emphasized text-muted-foreground';

        return (
          <li
            key={milestone.id}
            data-state={milestone.state}
            aria-current={milestone.state === 'current' ? 'step' : undefined}
            className="flex min-w-0 flex-1 flex-col gap-2 last:flex-none"
          >
            <div className={`flex items-center ${numbered ? 'h-6' : 'h-3'}`}>
              <span
                aria-hidden="true"
                className={`flex shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${numbered ? 'size-6' : 'size-3'} ${marker}`}
              >
                {numbered ? milestone.state === 'done' ? <IconCheck className="size-3.5" /> : index + 1 : null}
              </span>
              {next ? (
                <span
                  aria-hidden="true"
                  className={`mx-2 h-0 flex-1 border-t border-emphasized ${next.state === 'pending' ? 'border-dashed' : ''}`}
                />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col pr-3">
              <span
                className={`text-sm ${
                  milestone.state === 'pending'
                    ? 'text-muted-foreground'
                    : milestone.state === 'current'
                      ? 'font-medium text-base-foreground'
                      : 'text-base-foreground'
                }`}
              >
                {milestone.label}
                <span className="sr-only"> ({STATE_TEXT[milestone.state]})</span>
              </span>
              {milestone.detail ? <span className="text-xs tabular-nums text-muted-foreground">{milestone.detail}</span> : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
