import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { ProgressRing } from '../../industrial/ProgressRing';
import { RangeIndicator } from '../../industrial/RangeIndicator';
import { LABEL_TEXT, TONE_TEXT, formatLimit, qualityStatus, severityStatus } from '../../industrial/status';
import { StatusDot } from '../../industrial/StatusDot';
import { StatusIndicator } from '../../industrial/StatusIndicator';
import { ValueReadout } from '../../industrial/ValueReadout';

import { LEVEL_LABEL, OPEN_ALARMS_METRIC, descendantsAt, isAbnormal, isOpen } from './hierarchy';
import type { DrillAlarm, DrillNode } from './hierarchy';
import { NodeRow } from './NodeRow';
import { SensorTrend } from './SensorTrend';

export type NodePreviewProps = {
  node: DrillNode;
  /** Formats an alarm's `raisedAt`: "14 min ago". */
  formatAge: (raisedAt: number) => string;
  /** Makes the rows of child nodes selectable. */
  onSelect?: (id: string) => void;
  /** Most alarms listed. */
  maxAlarms?: number;
  /** What the sensor trend covers. */
  period?: string;
  className?: string;
};

const ALARM_STATE: Record<DrillAlarm['state'], string> = {
  active: 'Active',
  acknowledged: 'Acknowledged',
  cleared: 'Cleared',
  shelved: 'Shelved',
};

const CHILD_HEADING: Record<DrillNode['level'], string> = {
  site: 'Areas',
  area: 'Equipment',
  equipment: 'Readings',
  sensor: '',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      {children}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className={LABEL_TEXT}>{label}</dt>
      <dd className="text-sm text-base-foreground tabular-nums">{children}</dd>
    </div>
  );
}

function AlarmLines({ alarms, formatAge }: { alarms: readonly DrillAlarm[]; formatAge: (raisedAt: number) => string }) {
  if (alarms.length === 0) return <p className="text-sm text-muted-foreground">No alarms in the last 7 days</p>;
  return (
    <ul className="flex flex-col gap-2">
      {alarms.map((alarm) => {
        const severity = severityStatus(alarm.severity);
        return (
          <li key={alarm.id} className="flex items-start gap-2">
            <span className="flex h-5 items-center">
              <StatusDot tone={isOpen(alarm) ? severity.tone : 'neutral'} shape={severity.shape} size="sm" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className={cn('text-sm leading-5', isOpen(alarm) ? 'text-base-foreground' : 'text-muted-foreground')}>{alarm.message}</span>
              <span className="text-xs text-muted-foreground">
                {severity.label} · {ALARM_STATE[alarm.state]} · <span className="font-mono">{alarm.sensorTag}</span> · {alarm.value}
              </span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatAge(alarm.raisedAt)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * What a drill-down shows about the node it is on, different at each altitude: a site or area as
 * a roll-up with its children, a piece of equipment as health plus live readings, a sensor as a
 * large value on its limits bar with its trend and last alarms.
 */
export function NodePreview({ node, formatAge, onSelect, maxAlarms = 3, period = 'last 24 hours', className }: NodePreviewProps) {
  const abnormal = isAbnormal(node.status.tone);
  const alarms = node.alarms.slice(0, maxAlarms);
  const reading = node.reading;

  const childRows =
    node.children.length > 0 ? (
      <Section title={CHILD_HEADING[node.level]}>
        <ul className="flex flex-col">
          {node.children.map((child) => (
            <li key={child.id} className="border-t border-default first:border-t-0">
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(child.id)}
                  className="w-full rounded-md px-1 py-2 outline-none hover:bg-base-background-hover focus-visible:ring-2 focus-visible:ring-ring-default"
                >
                  <NodeRow node={child} showChevron />
                </button>
              ) : (
                <div className="px-1 py-2">
                  <NodeRow node={child} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </Section>
    ) : null;

  return (
    <article data-slot="node-preview" data-level={node.level} className={cn('flex min-w-0 flex-col gap-5', className)}>
      <header className="flex flex-col gap-1">
        <span className={LABEL_TEXT}>
          {LEVEL_LABEL[node.level]} · <span className="font-mono">{node.tag}</span>
        </span>
        <h3 className="text-lg font-semibold text-base-foreground">{node.name}</h3>
        <StatusIndicator {...node.status} className={abnormal ? TONE_TEXT[node.status.tone] : undefined} />
      </header>

      {node.level === 'sensor' && reading ? (
        <>
          <div className="flex flex-col gap-3">
            <ValueReadout value={reading.value} unit={reading.unit} decimals={reading.decimals} size="xl" tone={node.figure.tone} />
            <RangeIndicator
              label={node.name}
              value={reading.value}
              min={reading.rangeMin}
              max={reading.rangeMax}
              limits={reading.limits}
              unit={reading.unit}
              decimals={reading.decimals}
              tone={node.figure.tone}
              showHeader={false}
            />
          </div>
          <dl className="grid grid-cols-4 gap-3">
            <Fact label="Low">{reading.limits.low === undefined ? '—' : formatLimit(reading.limits.low, reading.decimals)}</Fact>
            <Fact label="High">{reading.limits.high === undefined ? '—' : formatLimit(reading.limits.high, reading.decimals)}</Fact>
            <Fact label="Trip">{reading.limits.highHigh === undefined ? '—' : formatLimit(reading.limits.highHigh, reading.decimals)}</Fact>
            <Fact label="Signal">{qualityStatus(reading.quality).label}</Fact>
          </dl>
          <Section title={`Trend, ${period}`}>
            <SensorTrend node={node} period={period} heightClassName="h-40" maxTicks={4} />
          </Section>
        </>
      ) : null}

      {node.level === 'equipment' ? (
        <div className="flex items-center gap-5">
          <ProgressRing label="Health" value={node.healthScore ?? null} unit="%" size="lg" tone={node.figure.tone} />
          <dl className="grid flex-1 grid-cols-2 gap-3">
            <Fact label="Type">
              <span className="capitalize">{node.kind}</span>
            </Fact>
            <Fact label="Open alarms">{node.metrics[OPEN_ALARMS_METRIC] ?? 0}</Fact>
            <Fact label="Measurement points">{node.children.length}</Fact>
            <Fact label="Outside limits">{node.children.filter((child) => isAbnormal(child.status.tone)).length}</Fact>
          </dl>
        </div>
      ) : null}

      {node.level === 'site' || node.level === 'area' ? (
        <dl className="grid grid-cols-4 gap-3">
          <div className="flex flex-col gap-0.5">
            <dt className={LABEL_TEXT}>Health</dt>
            <dd>
              <ValueReadout value={node.healthScore ?? null} unit="%" size="md" tone={node.figure.tone} />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={LABEL_TEXT}>Open alarms</dt>
            <dd>
              <ValueReadout value={node.metrics[OPEN_ALARMS_METRIC] ?? 0} size="md" />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={LABEL_TEXT}>Equipment</dt>
            <dd>
              <ValueReadout value={descendantsAt(node, 'equipment').length} size="md" />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className={LABEL_TEXT}>Sensors</dt>
            <dd>
              <ValueReadout value={descendantsAt(node, 'sensor').length} size="md" />
            </dd>
          </div>
        </dl>
      ) : null}

      {node.level !== 'sensor' && node.children.length === 0 ? (
        <p className="rounded-md bg-muted-background px-3 py-2 text-sm text-muted-foreground">
          Nothing is modelled under this {LEVEL_LABEL[node.level].toLowerCase()} yet.
        </p>
      ) : null}

      {childRows}

      <Section title={node.level === 'sensor' ? 'Last alarms' : 'Latest alarms'}>
        <AlarmLines alarms={alarms} formatAge={formatAge} />
      </Section>
    </article>
  );
}
