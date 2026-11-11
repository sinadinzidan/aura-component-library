import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { Panel } from '../Panel';
import { StatusPill } from '../StatusPill';
import { cx, type Tone } from '../tones';

import { PersonChip } from './PersonChip';

export type HandoverState = 'draft' | 'handed-over' | 'accepted';

export type HandoverTopic = { id: string; heading: string; tone: Tone; points: readonly string[] };

type HandoverCardProps = {
  /** e.g. `Day shift to evening shift`. */
  title: string;
  /** Date and time of the handover. */
  when: string;
  from: { name: string; role: string };
  to: { name: string; role: string };
  state: HandoverState;
  topics: readonly HandoverTopic[];
  /** Sign-off block or buttons at the bottom. */
  footer?: ReactNode;
  className?: string;
};

const STATE: Record<HandoverState, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  'handed-over': { label: 'Waiting for acceptance', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'success' },
};

/**
 * A shift handover note: who hands over to whom, the state of the handover, and what the next
 * shift needs to know under a few fixed headings. Each heading carries a colour family as a
 * left rule so the note is scanned by topic. The panel takes the state tone in the signal look.
 */
export function HandoverCard({ title, when, from, to, state, topics, footer, className }: HandoverCardProps) {
  const look = useLook();
  const status = STATE[state];
  return (
    <Panel tone={look === 'signal' ? status.tone : 'neutral'} title={title} subtitle={when} actions={<StatusPill tone={status.tone} variant={look === 'signal' ? 'outline' : undefined}>{status.label}</StatusPill>} footer={footer} className={cx('h-full', className)}>
      <div data-state={state} className="flex flex-1 flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <PersonChip name={from.name} tone="blue" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--kit-text)">{from.name}</p>
              <p className="text-xs text-(--kit-text-3)">{from.role}</p>
            </div>
          </div>
          <span aria-hidden className="text-xl text-(--kit-text-3)">
            →
          </span>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <PersonChip name={to.name} tone="teal" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--kit-text)">{to.name}</p>
              <p className="text-xs text-(--kit-text-3)">{to.role}</p>
            </div>
          </div>
        </div>
        <div className="grid gap-x-6 gap-y-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))' }}>
          {topics.map((topic) => (
            <section key={topic.id} data-tone={topic.tone} className="min-w-0 pl-3" style={{ boxShadow: 'inset 3px 0 0 var(--t-line)' }}>
              <h4 className="text-sm font-semibold text-(--kit-text)">{topic.heading}</h4>
              <ul className="mt-1 flex flex-col gap-1">
                {topic.points.map((point) => (
                  <li key={point} className="text-sm leading-5 text-(--kit-text-2)">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Panel>
  );
}
