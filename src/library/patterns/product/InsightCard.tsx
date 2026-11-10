import { IconAlertTriangle, IconBulb, IconCircleCheck, IconHexagon, IconInfoCircle } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';

export type InsightTone = 'neutral' | 'info' | 'success' | 'warning' | 'critical';

export type InsightEvidence = {
  id: string;
  /** What was looked at: a tag, a document, a period. */
  label: string;
  /** What it showed, already formatted: "6.8 mm/s, limit 7.1". */
  value: string;
  /** Renders the label in monospace, for tags and IDs. */
  mono?: boolean;
};

export type InsightCardProps = {
  /** The kind of finding, written out: "Anomaly detected", "Suggestion". */
  kind: string;
  tone?: InsightTone;
  title: string;
  /** What was found and why it matters, in one or two sentences. */
  summary: ReactNode;
  /** The facts the finding rests on. An insight without evidence is an opinion. */
  evidence?: readonly InsightEvidence[];
  evidenceLabel?: string;
  /** Quiet line at the end of the header: when it was generated, or how confident the model is. */
  meta?: ReactNode;
  /** What the reader can do: open the trend, create a work order, dismiss. */
  actions?: ReactNode;
  /** Under the evidence: a limitation, or where the data came from. */
  footnote?: ReactNode;
  className?: string;
};

const TONE_ICON = {
  neutral: IconBulb,
  info: IconInfoCircle,
  success: IconCircleCheck,
  warning: IconAlertTriangle,
  critical: IconHexagon,
} as const;

const TONE_TEXT: Record<InsightTone, string> = {
  neutral: 'text-medium-foreground',
  info: 'text-info-foreground-strong',
  success: 'text-success-foreground-strong',
  warning: 'text-warning-foreground-strong',
  critical: 'text-critical-foreground-strong',
};

/**
 * A finding produced by a model, laid out so it can be checked: what kind of finding it is, the
 * claim, the evidence behind it and what to do next. Status colour is limited to the kind line,
 * which always carries an icon and words.
 */
export function InsightCard({
  kind,
  tone = 'neutral',
  title,
  summary,
  evidence = [],
  evidenceLabel = 'Evidence',
  meta,
  actions,
  footnote,
  className,
}: InsightCardProps) {
  const Icon = TONE_ICON[tone];

  return (
    <article
      aria-label={`${kind}: ${title}`}
      data-slot="insight-card"
      data-tone={tone}
      className={cn('flex w-full min-w-0 flex-col gap-4 rounded-xl border border-default bg-card-background p-4', className)}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span data-slot="insight-kind" className={cn('inline-flex items-center gap-1.5 text-xs font-medium', TONE_TEXT[tone])}>
            <Icon aria-hidden className="size-4" />
            {kind}
          </span>
          {meta ? <span className="text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
        </div>
        <h3 className="text-base font-semibold text-base-foreground">{title}</h3>
        <p className="text-sm text-pretty text-medium-foreground">{summary}</p>
      </div>

      {evidence.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">{evidenceLabel}</p>
          <dl className="flex flex-col gap-1.5">
            {evidence.map((item) => (
              <div key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-sm">
                <dt className={cn('text-medium-foreground', item.mono ? 'font-mono text-xs' : undefined)}>{item.label}</dt>
                <dd className="tabular-nums text-base-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {footnote ? <p className="text-xs text-muted-foreground">{footnote}</p> : null}

      {actions ? (
        <div data-slot="insight-actions" className="flex flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </article>
  );
}
