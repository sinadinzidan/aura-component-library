import type { ReactNode } from 'react';

import { IconChip } from '../IconChip';
import { Panel } from '../Panel';
import type { Tone } from '../tones';

type FeatureCardProps = {
  title: string;
  /** What it does for the reader, in one or two sentences. */
  body: ReactNode;
  /** Icon element for the feature. */
  icon?: ReactNode;
  tone?: Tone;
  /** A figure that proves the point: "38 % fewer nuisance alarms". */
  figure?: { value: string; caption: string };
  /** A link or button at the bottom of the card. */
  action?: ReactNode;
  className?: string;
};

/**
 * One benefit, app or entry point on a landing page: an icon, a name, a sentence, optionally a
 * figure and one action. It is a look panel, so it becomes an elevated card, a pastel tile, a
 * colour-headed poster block or a drawing sheet with a title block.
 */
export function FeatureCard({ title, body, icon, tone = 'accent', figure, action, className }: FeatureCardProps) {
  return (
    <Panel tone={tone} title={title} icon={icon ? <IconChip tone={tone}>{icon}</IconChip> : undefined} className={className}>
      <div className="flex flex-1 flex-col justify-between gap-4">
        <p className="text-sm text-pretty text-(color:--kit-text-2)">{body}</p>
        {figure ? (
          <p className="flex items-baseline gap-2">
            <span className="text-3xl font-(--kit-figure-weight) tracking-tight text-(color:--kit-text) tabular-nums">{figure.value}</span>
            <span className="text-sm text-(color:--kit-text-2)">{figure.caption}</span>
          </p>
        ) : null}
        {action ? <div className="flex">{action}</div> : null}
      </div>
    </Panel>
  );
}
