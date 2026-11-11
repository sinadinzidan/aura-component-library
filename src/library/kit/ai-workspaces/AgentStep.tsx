import { IconAlertOctagon, IconCircleCheck, IconCircleDashed, IconClockPause, IconLoader2 } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type AgentStepState = 'done' | 'running' | 'waiting' | 'failed' | 'queued';

const STATE_TONE: Record<AgentStepState, Tone> = {
  done: 'success',
  running: 'info',
  waiting: 'warning',
  failed: 'critical',
  queued: 'neutral',
};

const STATE_WORD: Record<AgentStepState, string> = {
  done: 'Done',
  running: 'Running',
  waiting: 'Needs you',
  failed: 'Failed',
  queued: 'Queued',
};

function StateIcon({ state, className }: { state: AgentStepState; className?: string }) {
  if (state === 'done') return <IconCircleCheck aria-hidden="true" className={className} />;
  if (state === 'running') return <IconLoader2 aria-hidden="true" className={className} />;
  if (state === 'waiting') return <IconClockPause aria-hidden="true" className={className} />;
  if (state === 'failed') return <IconAlertOctagon aria-hidden="true" className={className} />;
  return <IconCircleDashed aria-hidden="true" className={className} />;
}

type AgentStepProps = {
  /** What the agent does in this step: "Read vibration trends". */
  title: string;
  state: AgentStepState;
  /** The tool or data it uses, or what it found. */
  detail?: ReactNode;
  /** How long it took or has been running, already formatted. */
  duration?: string;
  /** The last step draws no connector to a next one. */
  last?: boolean;
  className?: string;
  /** Output of the step: a figure, a table, a request for approval. */
  children?: ReactNode;
};

/**
 * One step of an agent run with its state as icon, word and colour. A timeline entry in most
 * looks; in signal the whole tile is filled with the state so a run reads from across the room,
 * and on a console it is a log row behind a solid state block.
 */
export function AgentStep({ title, state, detail, duration, last = false, className, children }: AgentStepProps) {
  const look = useLook();
  const tone = STATE_TONE[state];

  if (look === 'signal') {
    return (
      <li
        data-look={look}
        data-tone={tone}
        data-state={state}
        className={cx('flex min-w-0 flex-col gap-2 rounded-(--kit-radius) bg-(--t-solid) p-4 text-(color:--t-on-solid)', className)}
      >
        <span className="flex items-center gap-2 text-2xl leading-none font-extrabold tracking-tight">
          <StateIcon state={state} className="size-7 shrink-0" />
          {STATE_WORD[state]}
        </span>
        <span className="text-base font-semibold">{title}</span>
        {detail ? <span className="text-sm">{detail}</span> : null}
        {children}
        {duration ? <span className="mt-auto text-sm font-medium tabular-nums">{duration}</span> : null}
      </li>
    );
  }

  if (look === 'console') {
    return (
      <li data-look={look} data-tone={tone} data-state={state} className={cx('flex min-w-0 items-stretch border-b border-(--kit-rule)', className)}>
        <span className="flex w-36 shrink-0 items-center gap-2 bg-(--t-solid) px-3 text-sm font-semibold text-(color:--t-on-solid)">
          <StateIcon state={state} className="size-4 shrink-0" />
          {STATE_WORD[state]}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-2.5">
          <span className="text-sm font-semibold text-(color:--kit-text)">{title}</span>
          {detail ? <span className="text-sm text-(color:--kit-text-2)">{detail}</span> : null}
          {children}
        </div>
        {duration ? <span className="flex items-center px-3.5 text-sm text-(color:--kit-text-2) tabular-nums">{duration}</span> : null}
      </li>
    );
  }

  return (
    <li data-look={look} data-tone={tone} data-state={state} className={cx('flex min-w-0 gap-3.5', className)}>
      <span className="flex flex-col items-center">
        <span
          className={cx(
            'flex size-8 shrink-0 items-center justify-center rounded-(--kit-track-radius)',
            state === 'queued' ? 'border border-(--kit-rule-strong) text-(color:--kit-text-3)' : 'bg-(--t-soft) text-(color:--t-on-soft)',
            look === 'blueprint' && 'border border-(--t-line) bg-transparent text-(color:--t-line)',
          )}
        >
          <StateIcon state={state} className="size-4.5" />
        </span>
        {last ? null : <span aria-hidden="true" className="my-1 w-px flex-1 bg-(--kit-rule-strong)" />}
      </span>
      <div className={cx('flex min-w-0 flex-1 flex-col gap-1', last ? '' : 'pb-5')}>
        <div className="flex items-baseline gap-3">
          <span className={cx('text-sm font-semibold', state === 'queued' ? 'text-(color:--kit-text-2)' : 'text-(color:--kit-text)')}>{title}</span>
          <span className="text-xs font-medium text-(color:--t-ink)">{STATE_WORD[state]}</span>
          {duration ? <span className="ml-auto text-xs text-(color:--kit-text-3) tabular-nums">{duration}</span> : null}
        </div>
        {detail ? <span className="text-sm text-(color:--kit-text-2)">{detail}</span> : null}
        {children ? <div className="mt-2">{children}</div> : null}
      </div>
    </li>
  );
}
