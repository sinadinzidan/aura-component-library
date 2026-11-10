import { Card, CardContent, CardDescription, CardFooter, CardFooterEnd, CardFooterStart, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { IconArrowDownRight, IconArrowUpRight } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { TONE_VALUE_TEXT, formatValue } from '../status';
import type { Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';

import { confidenceLevel } from './forecast';
import type { ConfidenceLevel } from './forecast';

export type PredictionDriver = {
  id: string;
  /** What pushes the prediction: "Discharge temperature rising". */
  label: string;
  /** Quiet second line: the tag, or the observed change. */
  detail?: string;
  /** Relative weight, 0–1. The list is shown strongest first. */
  weight: number;
  /** Whether the driver pushes the predicted value up or down. */
  direction?: 'up' | 'down';
};

export type PredictionCardProps = {
  /** What is predicted: "Time to high limit". */
  title: string;
  /** Tag and equipment the prediction is about. */
  subject?: string;
  /** The prediction in words or figures: "~6 h", "38 days". */
  headline: string;
  /** Range or qualifier after the headline: "between 4 and 9 h". */
  range?: string;
  /** Colours the headline. Only when the prediction itself calls for action. */
  tone?: Tone;
  /** Model confidence, 0–1. Shown as a word and a percentage. */
  confidence?: number;
  /** The inputs behind the prediction, so it can be checked against the plant. */
  drivers?: readonly PredictionDriver[];
  driversTitle?: string;
  /** Model and freshness: "Model v3.2 · trained 2 Mar · updated 13:55". */
  meta?: string;
  /** Buttons in the footer. */
  actions?: ReactNode;
  /** Extra content between the headline and the drivers, e.g. a small chart. */
  children?: ReactNode;
  className?: string;
};

const CONFIDENCE_WORD: Record<ConfidenceLevel, string> = { high: 'High confidence', medium: 'Medium confidence', low: 'Low confidence' };
const CONFIDENCE_TONE: Record<ConfidenceLevel, Tone> = { high: 'neutral', medium: 'neutral', low: 'warning' };
const CONFIDENCE_SHAPE = { high: 'dot', medium: 'ring', low: 'square' } as const;

/**
 * One prediction with the reasons behind it: what is predicted, the figure and its range, how
 * confident the model is, and the ranked drivers ("why"). A prediction without its drivers and its
 * confidence asks for trust it has not earned, so both are part of the card.
 */
export function PredictionCard({
  title,
  subject,
  headline,
  range,
  tone = 'neutral',
  confidence,
  drivers = [],
  driversTitle = 'Why',
  meta,
  actions,
  children,
  className,
}: PredictionCardProps) {
  const level = confidence === undefined ? undefined : confidenceLevel(confidence);
  const ranked = [...drivers].sort((a, b) => b.weight - a.weight);
  const strongest = Math.max(...ranked.map((driver) => driver.weight), 0);

  return (
    <Card data-slot="prediction-card" role="group" aria-label={title} className={className}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">{title}</CardTitle>
          {subject ? <CardDescription>{subject}</CardDescription> : null}
        </CardHeaderCenter>
        {level && confidence !== undefined ? (
          <CardHeaderEnd>
            <StatusIndicator
              size="sm"
              tone={CONFIDENCE_TONE[level]}
              shape={CONFIDENCE_SHAPE[level]}
              label={CONFIDENCE_WORD[level]}
              detail={`${formatValue(confidence * 100)} %`}
            />
          </CardHeaderEnd>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="flex w-full min-w-0 flex-col gap-4">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span data-slot="prediction-headline" className={cn('text-3xl font-semibold tracking-tight tabular-nums', TONE_VALUE_TEXT[tone])}>
              {headline}
            </span>
            {range ? <span className="text-sm text-muted-foreground tabular-nums">{range}</span> : null}
          </p>
          {children}
          {ranked.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">{driversTitle}</p>
              <ol aria-label={`${driversTitle}: drivers of the prediction, strongest first`} className="flex flex-col gap-3">
                {ranked.map((driver) => {
                  const Icon = driver.direction === 'down' ? IconArrowDownRight : IconArrowUpRight;
                  return (
                    <li key={driver.id} data-slot="prediction-driver" className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-1.5 text-sm text-base-foreground">
                          {driver.direction ? <Icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
                          <span className="min-w-0">{driver.label}</span>
                          {driver.direction ? <span className="sr-only">, pushes the prediction {driver.direction}</span> : null}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatValue(driver.weight * 100)} %</span>
                      </div>
                      <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-chart-neutral-100">
                        <div className="h-full rounded-full bg-chart-1-450" style={{ width: `${strongest > 0 ? (driver.weight / strongest) * 100 : 0}%` }} />
                      </div>
                      {driver.detail ? <span className="text-xs text-muted-foreground">{driver.detail}</span> : null}
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
        </div>
      </CardContent>
      {meta || actions ? (
        <CardFooter>
          {meta ? (
            <CardFooterStart>
              <span className="text-xs text-muted-foreground">{meta}</span>
            </CardFooterStart>
          ) : null}
          {actions ? <CardFooterEnd>{actions}</CardFooterEnd> : null}
        </CardFooter>
      ) : null}
    </Card>
  );
}
