import type { ReactNode } from 'react';

import type { LookId } from '../../looks/looks';
import { useLook } from '../../looks/useLook';
import { IconChip } from '../IconChip';
import { Panel } from '../Panel';
import { cx, type Tone } from '../tones';

const TITLE: Record<LookId, string> = {
  studio: 'text-2xl font-semibold tracking-tight',
  console: 'text-xl font-semibold',
  poster: 'text-4xl font-extrabold tracking-tighter',
  glass: 'text-3xl font-semibold tracking-tight',
  editorial: 'text-4xl font-medium tracking-tighter',
  soft: 'text-3xl font-bold tracking-tight',
  blueprint: 'text-2xl font-semibold',
  signal: 'text-3xl font-extrabold tracking-tight',
};

type AuthPanelProps = {
  /** What the person is doing, as the page heading: "Sign in to Nordkapp". */
  title: string;
  /** One or two sentences under the title. */
  description?: ReactNode;
  /** Icon element shown above the title in a chip. */
  icon?: ReactNode;
  tone?: Tone;
  /** `center` for a card alone on the page, `start` when it sits in a column. */
  align?: 'start' | 'center';
  /** The quiet line under the form: the way to the other flow, or legal text. */
  footer?: ReactNode;
  className?: string;
  /** The form. */
  children?: ReactNode;
};

/**
 * The container of one authentication step: a page-level heading, a sentence, the form and a
 * footer line. Its surface is the look's panel, and the heading takes the look's display scale,
 * from a quiet studio card to a poster headline.
 */
export function AuthPanel({ title, description, icon, tone = 'neutral', align = 'start', footer, className, children }: AuthPanelProps) {
  const look = useLook();
  const centered = align === 'center';
  return (
    <Panel tone={tone} footer={footer} className={className}>
      <div className={cx('flex flex-1 flex-col gap-6', look === 'editorial' ? 'pb-2' : 'p-2')}>
        <div className={cx('flex flex-col gap-3', centered && 'items-center text-center')}>
          {icon ? (
            <IconChip tone={tone === 'neutral' ? 'accent' : tone} size="lg">
              {icon}
            </IconChip>
          ) : null}
          <h3 className={cx('text-balance', TITLE[look])}>{title}</h3>
          {description ? <p className="max-w-[46ch] text-sm text-pretty text-(color:--kit-text-2)">{description}</p> : null}
        </div>
        {children}
      </div>
    </Panel>
  );
}
