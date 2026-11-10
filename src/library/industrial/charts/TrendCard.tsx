import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import type { ReactNode } from 'react';

import type { DotShape, GoodDirection, Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { TrendDelta } from '../TrendDelta';
import { ValueReadout } from '../ValueReadout';

export type TrendCardProps = {
  /** Measurement name: "Discharge pressure". */
  title: string;
  /** Tag and context: "23-PT-92531 · 1st stage compressor". */
  description?: string;
  /** Current value, shown above the chart. `value: null` prints an em dash. */
  reading?: { value: number | null; unit?: string; decimals?: number; tone?: Tone };
  /** Change against a reference, printed beside the reading. */
  delta?: { reference: number; caption?: string; goodDirection?: GoodDirection; decimals?: number };
  /** State of the measurement, e.g. "Above high limit". Leave out while it is normal. */
  status?: { tone: Tone; label: string; shape?: DotShape };
  /** Header controls: a range switch, a live toggle, a menu. */
  actions?: ReactNode;
  /** One or two sentences with what the chart shows. Always visible. */
  summary?: string;
  /** Legend, state strip or other content between the chart and the summary. */
  footer?: ReactNode;
  /** The chart. */
  children: ReactNode;
  className?: string;
};

/**
 * The frame a trend sits in on a dashboard: name and tag, the current value with its change and
 * state, a slot for time controls, the plot and a text summary. Use it so every trend on a screen
 * puts the same things in the same places.
 */
export function TrendCard({ title, description, reading, delta, status, actions, summary, footer, children, className }: TrendCardProps) {
  return (
    <Card data-slot="trend-card" className={className ?? 'w-full'}>
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeaderCenter>
        {actions ? <CardHeaderEnd>{actions}</CardHeaderEnd> : null}
      </CardHeader>
      <CardContent>
        {reading ? (
          <div data-slot="trend-card-reading" className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <ValueReadout value={reading.value} unit={reading.unit} decimals={reading.decimals} tone={reading.tone} />
            {delta && reading.value !== null ? (
              <TrendDelta
                value={reading.value}
                reference={delta.reference}
                unit={reading.unit}
                decimals={delta.decimals ?? reading.decimals}
                goodDirection={delta.goodDirection}
                caption={delta.caption}
              />
            ) : null}
            {status ? <StatusIndicator size="sm" className="ml-auto" {...status} /> : null}
          </div>
        ) : null}
        <div className="w-full min-w-0">{children}</div>
        {footer}
        {summary ? <p className="text-sm text-muted-foreground">{summary}</p> : null}
      </CardContent>
    </Card>
  );
}
