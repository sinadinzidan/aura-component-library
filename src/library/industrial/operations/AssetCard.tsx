import { Badge } from '@cognite/aura/components/badge';
import { Card } from '@cognite/aura/components/card';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconBell, IconTool } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { cn } from '../../../lib/utils';
import { ProgressRing } from '../ProgressRing';
import { Sparkline } from '../Sparkline';
import { LABEL_TEXT, TONE_SURFACE, runStateStatus } from '../status';
import type { Health, RunState, Severity, Tone } from '../status';
import { StatusIndicator } from '../StatusIndicator';
import { ValueReadout } from '../ValueReadout';

import { healthTone } from './health';
import type { Criticality } from './health';
import { SeverityBadge } from './SeverityBadge';

export type AssetCardReading = {
  label: string;
  /** `null` prints an em dash. */
  value: number | null;
  unit?: string;
  decimals?: number;
  /** Only for a reading that is itself outside its limits. */
  tone?: Tone;
};

export type AssetCardTrend = {
  values: readonly number[];
  /** What the trend shows, e.g. "Discharge pressure, last 24 hours". */
  label: string;
  unit?: string;
  decimals?: number;
  limit?: number;
  tone?: Tone;
};

export type AssetCardProps = {
  /** Functional location tag, printed in monospace. */
  tag: string;
  name: string;
  state: RunState;
  /** Quiet text after the state: "for 41 d", "14 min ago". */
  stateDetail?: string;
  /** Equipment type icon. */
  icon?: ReactNode;
  criticality?: Criticality;
  /** Health score as a ring in the corner; coloured only when watch or poor. */
  health?: { score: number; health: Health };
  /** Two to four key readings. The same card grammar holds whatever the equipment type. */
  readings?: readonly AssetCardReading[];
  trend?: AssetCardTrend;
  /** Open alarms. Zero is shown as quiet text, so the absence is explicit. */
  alarms?: { count: number; severity?: Severity };
  /** Open work orders. */
  workOrders?: number;
  /** A tinted line for the one thing that explains an abnormal state. */
  notice?: { tone: Tone; text: string };
  /** `row` lays the same parts out on one line for lists. */
  layout?: 'card' | 'row';
  /** Makes the card a toggle button. */
  onSelect?: () => void;
  selected?: boolean;
  /** Skeleton in the card's own layout. */
  loading?: boolean;
  /** Extra rows: maintenance dates, responsible person. */
  children?: ReactNode;
  className?: string;
};

const READING_COLUMNS: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-2' };

function Identity({ tag, name, icon, criticality }: Pick<AssetCardProps, 'tag' | 'name' | 'icon' | 'criticality'>) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      {icon ? <span className="flex h-9 shrink-0 items-center text-muted-foreground [&>svg]:size-5">{icon}</span> : null}
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2">
          <span data-slot="asset-tag" className="truncate font-mono text-xs text-muted-foreground">
            {tag}
          </span>
          {criticality ? (
            <Badge variant="secondary" aria-label={`Criticality ${criticality}`}>
              Crit {criticality}
            </Badge>
          ) : null}
        </span>
        <span className="line-clamp-2 text-sm font-medium text-base-foreground">{name}</span>
      </div>
    </div>
  );
}

function Counts({ alarms, workOrders }: Pick<AssetCardProps, 'alarms' | 'workOrders'>) {
  if (alarms === undefined && workOrders === undefined) return null;
  return (
    <div data-slot="asset-counts" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {alarms === undefined ? null : alarms.count > 0 ? (
        <SeverityBadge severity={alarms.severity ?? 'medium'} count={alarms.count} label={alarms.count === 1 ? 'alarm' : 'alarms'} />
      ) : (
        <span className={cn(LABEL_TEXT, 'inline-flex items-center gap-1.5')}>
          <IconBell aria-hidden="true" className="size-3.5" />
          No alarms
        </span>
      )}
      {workOrders === undefined ? null : (
        <span className={cn('inline-flex items-center gap-1.5 text-xs tabular-nums', workOrders > 0 ? 'text-base-foreground' : 'text-muted-foreground')}>
          <IconTool aria-hidden="true" className="size-3.5 text-muted-foreground" />
          {workOrders === 0 ? 'No work orders' : `${workOrders} work ${workOrders === 1 ? 'order' : 'orders'}`}
        </span>
      )}
    </div>
  );
}

/**
 * One piece of equipment at a glance: tag, name and run state, then — as the screen needs —
 * health, key readings, a trend, and open alarms and work orders. Every equipment type uses the
 * same grammar; only the readings differ. Normal is quiet: colour appears for an abnormal state.
 */
export function AssetCard({
  tag,
  name,
  state,
  stateDetail,
  icon,
  criticality,
  health,
  readings,
  trend,
  alarms,
  workOrders,
  notice,
  layout = 'card',
  onSelect,
  selected = false,
  loading = false,
  children,
  className,
}: AssetCardProps) {
  if (loading) {
    return (
      <div
        data-slot="asset-card"
        role="status"
        aria-label={`${name}, loading`}
        className={cn('flex w-full min-w-0 flex-col gap-3 rounded-xl border border-default p-4', className)}
      >
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs text-muted-foreground">{tag}</span>
          <span className="truncate text-sm font-medium text-base-foreground">{name}</span>
        </div>
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    );
  }

  const stateIndicator = <StatusIndicator size="sm" {...runStateStatus(state)} detail={stateDetail} />;
  const ring = health ? (
    <ProgressRing label="Health score" value={health.score} unit="" size={layout === 'row' ? 'sm' : 'md'} tone={healthTone(health.health)} className="shrink-0" />
  ) : null;

  const body =
    layout === 'row' ? (
      <Card data-slot="asset-card" data-layout="row" data-state={state} className={cn('w-full min-w-0 flex-row flex-wrap items-center gap-x-4 gap-y-3', className)}>
        <div className="min-w-0 flex-1 basis-48">
          <Identity tag={tag} name={name} icon={icon} criticality={criticality} />
        </div>
        <div className="w-28 shrink-0">{stateIndicator}</div>
        {readings?.map((reading) => (
          <div key={reading.label} className="flex w-32 shrink-0 flex-col gap-1.5">
            <span className={cn(LABEL_TEXT, 'truncate')}>{reading.label}</span>
            <ValueReadout value={reading.value} unit={reading.value === null ? undefined : reading.unit} decimals={reading.decimals} size="xs" tone={reading.tone} />
          </div>
        ))}
        {ring ? <div className="flex w-16 shrink-0 flex-col gap-1.5"><span className={LABEL_TEXT}>Health</span>{ring}</div> : null}
        {alarms !== undefined || workOrders !== undefined ? (
          <div className="w-28 shrink-0">
            <Counts alarms={alarms} workOrders={workOrders} />
          </div>
        ) : null}
        {children}
      </Card>
    ) : (
      <Card data-slot="asset-card" data-layout="card" data-state={state} className={cn('w-full min-w-0 gap-3', className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <Identity tag={tag} name={name} icon={icon} criticality={criticality} />
            {stateIndicator}
          </div>
          {ring}
        </div>

        {notice ? (
          <p data-slot="asset-notice" className={cn('rounded-md px-2 py-1.5 text-xs', TONE_SURFACE[notice.tone])}>
            {notice.text}
          </p>
        ) : null}

        {readings && readings.length > 0 ? (
          <dl className={cn('grid gap-x-4 gap-y-3', READING_COLUMNS[Math.min(readings.length, 4)] ?? 'grid-cols-2')}>
            {readings.map((reading) => (
              <div key={reading.label} className="flex min-w-0 flex-col gap-1.5">
                <dt className={cn(LABEL_TEXT, 'truncate')}>{reading.label}</dt>
                <dd>
                  <ValueReadout value={reading.value} unit={reading.value === null ? undefined : reading.unit} decimals={reading.decimals} size="sm" tone={reading.tone} />
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {trend ? (
          <Sparkline values={trend.values} label={trend.label} unit={trend.unit} decimals={trend.decimals} limit={trend.limit} tone={trend.tone} height={36} showLast className="w-full" />
        ) : null}

        {children}

        <Counts alarms={alarms} workOrders={workOrders} />
      </Card>
    );

  if (!onSelect) return body;

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${tag} ${name}`}
      onClick={onSelect}
      className="w-full min-w-0 rounded-xl text-left outline-none ring-2 ring-transparent transition-shadow focus-visible:shadow-focus-ring aria-pressed:ring-primary-background"
    >
      {body}
    </button>
  );
}
