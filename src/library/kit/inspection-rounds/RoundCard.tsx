import type { ReactNode } from 'react';

import { Panel } from '../Panel';
import { StatusPill } from '../StatusPill';
import type { Tone } from '../tones';

import { ResultStrip } from './ResultStrip';
import { roundProgress, type CheckpointResult } from './rounds';

export type RoundState = 'scheduled' | 'in-progress' | 'overdue' | 'done';

type RoundCardProps = {
  /** "Compressor hall round". */
  name: string;
  /** Area and route length: "NK-23 · 14 checkpoints". */
  area: string;
  state: RoundState;
  /** When it is due or was finished, written out: "Due 15:00", "Finished 06:40". */
  timing: string;
  /** One result per checkpoint, in route order. */
  results: readonly CheckpointResult[];
  /** Who walks it. */
  assignee?: string;
  /** Leading icon element for the panel header. */
  icon?: ReactNode;
  /** One action, usually a button: "Continue", "Start round". */
  action?: ReactNode;
  className?: string;
};

const STATE_TONE: Record<RoundState, Tone> = {
  scheduled: 'neutral',
  'in-progress': 'info',
  overdue: 'critical',
  done: 'success',
};

const STATE_WORD: Record<RoundState, string> = {
  scheduled: 'Scheduled',
  'in-progress': 'In progress',
  overdue: 'Overdue',
  done: 'Done',
};

/**
 * One inspection round at a glance: its state, a large "done of total" count, the route as a
 * strip of checkpoint results, then findings, the person walking it and the next action.
 */
export function RoundCard({ name, area, state, timing, results, assignee, icon, action, className }: RoundCardProps) {
  const progress = roundProgress(results);
  const findings = progress.failed;

  return (
    <Panel
      className={className}
      title={name}
      subtitle={area}
      icon={icon}
      tone={state === 'overdue' ? 'critical' : 'neutral'}
      actions={<StatusPill tone={STATE_TONE[state]}>{STATE_WORD[state]}</StatusPill>}
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-(--kit-text-2)">
            {assignee ? `${assignee} · ` : ''}
            {timing}
          </span>
          {action}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="tabular-nums">
            <span className="text-3xl leading-none font-semibold tracking-tight">{progress.done}</span>
            <span className="ml-1.5 text-sm text-(--kit-text-2)">of {progress.total} checkpoints</span>
          </p>
          <p data-tone={findings > 0 ? 'critical' : 'success'} className="text-sm font-medium text-(--t-ink)">
            {findings === 0 ? 'No findings' : `${findings} ${findings === 1 ? 'finding' : 'findings'}`}
          </p>
        </div>
        <ResultStrip label={name} results={results} size="lg" />
        {progress.skipped > 0 ? <p className="text-xs text-(--kit-text-2)">{progress.skipped} skipped with a reason</p> : null}
      </div>
    </Panel>
  );
}
