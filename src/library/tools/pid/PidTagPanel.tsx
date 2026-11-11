import { Button } from '@cognite/aura/components/button';
import { IconFileText } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { Sparkline } from '../../industrial/Sparkline';
import { formatLimit, formatReading, severityStatus } from '../../industrial/status';
import type { Limits, StatusDescriptor } from '../../industrial/status';
import { StatusIndicator } from '../../industrial/StatusIndicator';
import { ValueReadout } from '../../industrial/ValueReadout';
import { SidePanel } from '../../patterns/structure/SidePanel';

import { readingState } from './pidModel';
import type { PidAlarm, PidDocument, PidTagKind, PidTagRef } from './pidModel';

export type PidPanelReading = {
  id: string;
  tag: string;
  name: string;
  value: number | null;
  unit: string;
  decimals: number;
  limits: Limits;
};

export type PidTagPanelProps = {
  tag: Pick<PidTagRef, 'id' | 'tag' | 'name' | 'kind'>;
  /** Run state of equipment or position of a valve. */
  status?: StatusDescriptor;
  /** The tag's own measurement, for an instrument. */
  reading?: PidPanelReading;
  /** Recent values of that measurement, oldest first. */
  trend?: readonly number[];
  trendLabel?: string;
  /** Measurements taken on this equipment. */
  measurements?: readonly PidPanelReading[];
  alarms?: readonly PidAlarm[];
  documents?: readonly PidDocument[];
  onClose?: () => void;
  /** Jump to one of the measurements. */
  onSelectTag?: (id: string) => void;
  onOpenDocument?: (document: PidDocument) => void;
  frame?: 'card' | 'edge';
};

const KIND_LABEL: Record<PidTagKind, string> = { equipment: 'Equipment', valve: 'Valve', instrument: 'Instrument' };

const LIMIT_ROWS: readonly { key: keyof Limits; label: string }[] = [
  { key: 'highHigh', label: 'High-high (trip)' },
  { key: 'high', label: 'High' },
  { key: 'low', label: 'Low' },
  { key: 'lowLow', label: 'Low-low (trip)' },
];

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-baseline gap-2 text-xs font-medium text-muted-foreground">
        {title}
        {count !== undefined ? <span className="tabular-nums">{count}</span> : null}
      </h3>
      {children}
    </section>
  );
}

/**
 * What a P&ID viewer shows for the selected tag: the live value against its limits, a short
 * trend, the open alarms and the documents linked to it. Equipment lists the measurements taken
 * on it instead of a single value.
 */
export function PidTagPanel({
  tag,
  status,
  reading,
  trend,
  trendLabel = 'Last 24 hours',
  measurements = [],
  alarms = [],
  documents = [],
  onClose,
  onSelectTag,
  onOpenDocument,
  frame = 'edge',
}: PidTagPanelProps) {
  const state = reading ? readingState(reading.value, reading.limits) : null;
  const limitRows = reading ? LIMIT_ROWS.filter((row) => reading.limits[row.key] !== undefined) : [];

  return (
    <SidePanel
      title={tag.tag}
      description={`${tag.name} · ${KIND_LABEL[tag.kind]}`}
      status={status ? <StatusIndicator {...status} variant="badge" /> : undefined}
      onClose={onClose}
      frame={frame}
    >
      <div data-slot="pid-tag-panel" className="flex flex-col gap-5">
        {reading && state ? (
          <Section title="Live value">
            <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
              <ValueReadout value={reading.value} unit={reading.unit} decimals={reading.decimals} size="lg" tone={state.tone} />
              <StatusIndicator tone={state.tone} label={state.flag ? `${state.label} (${state.flag})` : state.label} shape={state.tone === 'critical' ? 'diamond' : state.tone === 'warning' ? 'square' : 'dot'} size="sm" />
            </div>
            {limitRows.length > 0 ? (
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 text-sm">
                {limitRows.map((row) => (
                  <div key={row.key} className="contents">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right text-base-foreground tabular-nums">{formatReading(reading.limits[row.key], reading.unit, Number.isInteger(reading.limits[row.key]) ? 0 : reading.decimals)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </Section>
        ) : null}

        {reading && trend && trend.length > 1 ? (
          <Section title={trendLabel}>
            <Sparkline
              values={trend}
              label={`${reading.name}, ${trendLabel.toLowerCase()}`}
              variant="area"
              height={56}
              showLast
              limit={reading.limits.high}
              band={reading.limits.low !== undefined && reading.limits.high !== undefined ? { low: reading.limits.low, high: reading.limits.high } : undefined}
              unit={reading.unit}
              decimals={reading.decimals}
              tone={state?.tone === 'neutral' ? 'neutral' : state?.tone}
            />
            {reading.limits.high !== undefined ? (
              <p className="text-xs text-muted-foreground">
                Dashed line is the high limit, {formatLimit(reading.limits.high, reading.decimals)} {reading.unit}.
              </p>
            ) : null}
          </Section>
        ) : null}

        {measurements.length > 0 ? (
          <Section title="Measurements" count={measurements.length}>
            <ul className="flex flex-col">
              {measurements.map((item) => {
                const itemState = readingState(item.value, item.limits);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTag?.(item.id)}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-1.5 text-left outline-none hover:bg-muted-background focus-visible:ring-2 focus-visible:ring-ring-default"
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm text-base-foreground">{item.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{item.tag}</span>
                      </span>
                      <span className="flex shrink-0 items-baseline gap-1.5">
                        <ValueReadout value={item.value} unit={item.unit} decimals={item.decimals} size="xs" tone={itemState.tone} />
                        {itemState.flag ? <span className="text-xs font-semibold text-base-foreground">{itemState.flag}</span> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Section>
        ) : null}

        <Section title="Open alarms" count={alarms.length}>
          {alarms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open alarms on this tag.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {alarms.map((alarm) => (
                <li key={alarm.id} className="flex flex-col gap-0.5">
                  <StatusIndicator {...severityStatus(alarm.severity)} size="sm" />
                  <span className="text-sm text-base-foreground">{alarm.message}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">{alarm.detail}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Linked documents" count={documents.length}>
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents are linked to this tag.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center gap-2">
                  <IconFileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-base-foreground">{document.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {document.kind} · Rev {document.revision}
                    </span>
                  </span>
                  {onOpenDocument ? (
                    <Button variant="ghost" size="sm" aria-label={`Open ${document.title}`} onClick={() => onOpenDocument(document)}>
                      Open
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </SidePanel>
  );
}
