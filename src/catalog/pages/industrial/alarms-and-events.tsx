import { Banner, BannerAction, BannerActions, BannerClose, BannerIcon, BannerStatus, BannerTitle } from '@cognite/aura/components/banner';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardTitle,
} from '@cognite/aura/components/card';
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconAlertTriangleFilled, IconBell, IconBellZ, IconCheck, IconChevronRight, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ToggleGroup } from '../../../library/actions/ToggleGroup';
import { MetadataList } from '../../../library/display/MetadataList';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { AlarmList } from '../../../library/industrial/operations/AlarmList';
import { AlarmRow } from '../../../library/industrial/operations/AlarmRow';
import { SEVERITY_ORDER, countBySeverity, isOpenAlarm } from '../../../library/industrial/operations/alarms';
import { AlarmStateLabel } from '../../../library/industrial/operations/AlarmStateLabel';
import { AlarmSummary } from '../../../library/industrial/operations/AlarmSummary';
import { EventTimeline } from '../../../library/industrial/operations/EventTimeline';
import type { TimelineEvent } from '../../../library/industrial/operations/EventTimeline';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { severityStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ALARMS, ASSETS, findAsset } from '../../data/plant';
import type { Alarm, Severity } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDateTime, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './alarms-and-events.tsx?raw';

function alarmById(id: string): Alarm {
  const alarm = ALARMS.find((candidate) => candidate.id === id);
  if (!alarm) throw new Error(`Unknown alarm ${id}`);
  return alarm;
}

const alarmAssetName = (alarm: Alarm): string | undefined => findAsset(alarm.assetId)?.name;

/** Alarms that still stand in the plant: unacknowledged or acknowledged, not shelved or cleared. */
const OPEN_ALARMS = ALARMS.filter(isOpenAlarm);

/** Open for more than a day: the ones an alarm review asks about. */
const STANDING_ALARMS = ALARMS.filter((alarm) => alarm.state !== 'cleared' && REFERENCE_NOW - alarm.raisedAt > 8 * HOUR);

const ALARM_TREND = makeValues({ seed: 13, points: 48, base: 141, amplitude: 2.5, noise: 0.9, drift: 5, cycles: 2, decimals: 1 });
const ALARM_RATE = makeValues({ seed: 31, points: 24, base: 3.2, amplitude: 1.4, noise: 0.8, drift: 1.2, min: 0, decimals: 1 });

type PlantEvent = {
  id: string;
  at: number;
  kind: 'Alarm' | 'Acknowledged' | 'Shelved' | 'Operator action' | 'State change' | 'Work order';
  tag: string;
  text: string;
  by: string;
  severity?: Severity;
};

/** The last few hours of the plant journal, newest first. */
const PLANT_EVENTS: readonly PlantEvent[] = [
  { id: 'ev-9', at: REFERENCE_NOW - 6 * MINUTE, kind: 'Work order', tag: 'WO-104482', text: 'Inspect recompressor drive-end bearing set to in progress', by: 'Tomás Barros' },
  { id: 'ev-8', at: REFERENCE_NOW - 14 * MINUTE, kind: 'Alarm', tag: '23-VT-92740', text: 'Recompressor tripped on high vibration', by: 'System', severity: 'critical' },
  { id: 'ev-7', at: REFERENCE_NOW - 14 * MINUTE, kind: 'State change', tag: '23-KA-9103', text: 'Recompressor changed from running to tripped', by: 'System' },
  { id: 'ev-6', at: REFERENCE_NOW - 22 * MINUTE, kind: 'Operator action', tag: '23-FV-92511', text: 'Anti-surge valve set to manual, 35 % open', by: 'Ingrid Haugen' },
  { id: 'ev-5', at: REFERENCE_NOW - 38 * MINUTE, kind: 'Alarm', tag: '23-TT-92532', text: 'Discharge temperature high', by: 'System', severity: 'high' },
  { id: 'ev-4', at: REFERENCE_NOW - 96 * MINUTE, kind: 'Acknowledged', tag: '23-VT-92540', text: 'Drive-end vibration approaching limit acknowledged', by: 'Ingrid Haugen' },
  { id: 'ev-3', at: REFERENCE_NOW - 2 * HOUR, kind: 'Alarm', tag: '23-VT-92540', text: 'Drive-end vibration approaching limit', by: 'System', severity: 'high' },
  { id: 'ev-2', at: REFERENCE_NOW - 160 * MINUTE, kind: 'Shelved', tag: '40-TT-40015', text: 'Bearing temperature signal lost shelved for 12 h', by: 'Jonas Nyberg' },
  { id: 'ev-1', at: REFERENCE_NOW - 3 * HOUR, kind: 'State change', tag: '40-PA-4001', text: 'Cooling water pump changed from stopped to maintenance', by: 'Magnus Solberg' },
];

const hourOf = (timestamp: number): string => `${formatTime(timestamp).slice(0, 2)}:00`;

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

const SHELVE_DURATIONS = [
  { value: '1', label: '1 hour' },
  { value: '4', label: '4 hours' },
  { value: '12', label: 'Until end of shift (12 hours)' },
  { value: '24', label: '24 hours' },
];

function AlarmIconAction({ label, children, onClick }: { label: string; children: ReactNode; onClick?: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function AlarmRowDefault() {
  const alarm = alarmById('alm-4811');
  return (
    <ul className="w-full">
      <AlarmRow alarm={alarm} age={formatAgo(alarm.raisedAt)} assetName={alarmAssetName(alarm)} />
    </ul>
  );
}

function AlarmRowCompact() {
  const alarm = alarmById('alm-4811');
  return (
    <ul className="w-full max-w-md">
      <AlarmRow alarm={alarm} age={formatAgo(alarm.raisedAt)} assetName={alarmAssetName(alarm)} density="compact" />
    </ul>
  );
}

function AlarmSeverityBadges() {
  return (
    <div className="flex flex-col items-start gap-3">
      {SEVERITY_ORDER.map((severity) => (
        <SeverityBadge key={severity} severity={severity} />
      ))}
    </div>
  );
}

function AlarmStates() {
  return (
    <ul aria-label="Alarm states" className="flex w-full flex-col divide-y divide-default">
      <AlarmRow alarm={alarmById('alm-4811')} age="38 min ago" assetName="1st stage compressor" />
      <AlarmRow alarm={alarmById('alm-4809')} age="2 h ago" assetName="1st stage compressor" stateDetail="IH" />
      <AlarmRow alarm={alarmById('alm-4803')} age="9 h ago" assetName="Cooling water pump" stateDetail="until 02:00" />
      <AlarmRow alarm={alarmById('alm-4798')} age="21 h ago" assetName="Inlet separator" />
    </ul>
  );
}

function AlarmStateLabels() {
  return (
    <div className="flex flex-col items-start gap-3">
      <AlarmStateLabel state="active" detail="38 min" />
      <AlarmStateLabel state="acknowledged" detail="by Ingrid Haugen" />
      <AlarmStateLabel state="shelved" detail="until 02:00" />
      <AlarmStateLabel state="cleared" detail="12 Mar, 09:14" />
    </div>
  );
}

function AlarmAssetBadge() {
  const assets = ASSETS.filter((asset) => OPEN_ALARMS.some((alarm) => alarm.assetId === asset.id));
  return (
    <ul className="flex w-full max-w-md flex-col gap-3">
      {assets.map((asset) => {
        const alarms = OPEN_ALARMS.filter((alarm) => alarm.assetId === asset.id);
        const worst = SEVERITY_ORDER.find((severity) => alarms.some((alarm) => alarm.severity === severity)) ?? 'low';
        return (
          <li key={asset.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-base-foreground">{asset.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
            </div>
            <SeverityBadge severity={worst} count={alarms.length} />
          </li>
        );
      })}
    </ul>
  );
}

function AlarmChattering() {
  const alarm = alarmById('alm-4806');
  return (
    <ul className="w-full">
      <AlarmRow
        alarm={{ ...alarm, state: 'active' }}
        age="2 min ago"
        assetName={alarmAssetName(alarm)}
        density="compact"
        repeatCount={14}
      />
    </ul>
  );
}

function AlarmStanding() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Standing alarms</span>
        <span className="text-xs text-muted-foreground">Open for more than 8 h</span>
      </div>
      <ul className="flex w-full flex-col divide-y divide-default">
        {STANDING_ALARMS.map((alarm) => (
          <li key={alarm.id} className="flex items-center gap-4 py-2.5">
            <span className="w-20 shrink-0">
              <StatusIndicator size="sm" {...severityStatus(alarm.severity)} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm text-base-foreground">{alarm.message}</p>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{alarm.sensorTag}</span> · since {formatDateTime(alarm.raisedAt)}
              </p>
            </div>
            <span className="shrink-0 text-right text-sm font-medium text-base-foreground tabular-nums">
              {REFERENCE_NOW - alarm.raisedAt >= DAY
                ? `${Math.round((REFERENCE_NOW - alarm.raisedAt) / DAY)} d`
                : `${Math.round((REFERENCE_NOW - alarm.raisedAt) / HOUR)} h`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlarmFirstOut() {
  const trip = alarmById('alm-4812');
  const sequence: readonly Alarm[] = [
    { ...trip, id: 'seq-1', message: 'Drive-end vibration high-high', raisedAt: trip.raisedAt - 4_200 },
    { ...trip, id: 'seq-2', message: 'Recompressor tripped on high vibration', raisedAt: trip.raisedAt },
    { ...trip, id: 'seq-3', severity: 'high', message: 'Recompressor suction pressure high', sensorTag: '23-PT-92730', value: '15.8 barg', limit: '15.0 barg', raisedAt: trip.raisedAt + 1_800 },
    { ...trip, id: 'seq-4', severity: 'medium', message: 'Anti-surge valve fully open', sensorTag: '23-FV-92711', value: '100 %', limit: '95 %', raisedAt: trip.raisedAt + 3_100 },
  ];
  return (
    <AlarmList
      alarms={sequence}
      label="Trip sequence, recompressor"
      sort="none"
      firstOutId="seq-1"
      formatAge={(raisedAt) => `+${((raisedAt - sequence[0].raisedAt) / 1000).toFixed(1)} s`}
      getAssetName={alarmAssetName}
    />
  );
}

function AlarmSummaryInline() {
  return <AlarmSummary counts={countBySeverity(OPEN_ALARMS)} label="Open alarms by severity" showTotal />;
}

function AlarmSummaryTiles() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Open alarms</span>
        <span className="text-xs text-muted-foreground">Nordkapp plant</span>
      </div>
      <AlarmSummary variant="tiles" counts={countBySeverity(OPEN_ALARMS)} label="Open alarms by severity" />
    </div>
  );
}

function AlarmHeaderStrip() {
  const latest = alarmById('alm-4812');
  return (
    <div className="flex w-full items-center gap-4 rounded-lg bg-muted-background px-4 py-2">
      <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-base-foreground">
        <IconBell aria-hidden="true" className="size-4" />
        Alarms
      </span>
      <AlarmSummary counts={countBySeverity(OPEN_ALARMS)} label="Open alarms by severity" className="shrink-0" />
      <span aria-hidden="true" className="h-4 w-px shrink-0 bg-chart-neutral-300" />
      <p className="min-w-0 flex-1 truncate text-sm text-base-foreground">
        <span className="text-muted-foreground">Latest · {formatAgo(latest.raisedAt)} · </span>
        {latest.message}
      </p>
      <Button variant="ghost" size="sm" className="shrink-0">
        View all
        <IconChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}

function AlarmKpiTiles() {
  const shelved = ALARMS.filter((alarm) => alarm.state === 'shelved').length;
  return (
    <div className="grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiTile
        label="Alarms per hour"
        value={ALARM_RATE[ALARM_RATE.length - 1]}
        decimals={1}
        delta={{ reference: 3.1, goodDirection: 'down', caption: 'vs yesterday' }}
        trend={{ values: ALARM_RATE, variant: 'bar', label: 'Alarms per hour, last 24 hours', limit: 6 }}
      />
      <KpiTile label="Unacknowledged" value={OPEN_ALARMS.filter((alarm) => alarm.state === 'active').length} delta={{ reference: 1, goodDirection: 'down', caption: 'vs 1 h ago', decimals: 0 }} />
      <KpiTile label="Standing alarms" value={STANDING_ALARMS.length} target={{ value: 0 }} footnote="Open for more than 8 h" />
      <KpiTile label="Shelved" value={shelved} footnote="Next returns at 02:00" />
    </div>
  );
}

function AlarmFloodBanner() {
  return (
    <div className="w-full">
      <Banner variant="warning" inset>
        <BannerIcon icon={IconAlertTriangleFilled} />
        <BannerTitle>
          <span className="truncate text-base-foreground">Alarm flood in Gas compression: 34 alarms in the last 10 min</span>
        </BannerTitle>
        <BannerStatus variant="warning">Since 13:46</BannerStatus>
        <BannerActions>
          <BannerAction>Show critical only</BannerAction>
          <BannerClose>Dismiss</BannerClose>
        </BannerActions>
      </Banner>
    </div>
  );
}

function AlarmListSorted() {
  const [acknowledged, setAcknowledged] = useState<readonly string[]>([]);
  const alarms = OPEN_ALARMS.map((alarm) => (acknowledged.includes(alarm.id) ? { ...alarm, state: 'acknowledged' as const } : alarm));
  return (
    <AlarmList
      alarms={alarms}
      label="Open alarms, most severe first"
      formatAge={formatAgo}
      getAssetName={alarmAssetName}
      renderActions={(alarm) => (
        <>
          {alarm.state === 'active' ? (
            <AlarmIconAction label={`Acknowledge ${alarm.message}`} onClick={() => setAcknowledged((current) => [...current, alarm.id])}>
              <IconCheck />
            </AlarmIconAction>
          ) : (
            <span aria-hidden="true" className="size-7" />
          )}
          <AlarmIconAction label={`Shelve ${alarm.message}`}>
            <IconBellZ />
          </AlarmIconAction>
        </>
      )}
    />
  );
}

function AlarmSeverityFilter() {
  const [shown, setShown] = useState<string[]>(['critical', 'high']);
  const counts = countBySeverity(ALARMS);
  const alarms = ALARMS.filter((alarm) => shown.includes(alarm.severity));
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          label="Severities shown"
          variant="outline"
          size="sm"
          value={shown}
          onValueChange={setShown}
          options={SEVERITY_ORDER.map((severity) => ({ value: severity, label: severityStatus(severity).label, count: counts[severity] }))}
        />
        <span role="status" className="text-xs text-muted-foreground tabular-nums">
          {alarms.length} of {ALARMS.length} alarms
        </span>
      </div>
      <AlarmList alarms={alarms} label="Filtered alarms" formatAge={formatAgo} getAssetName={alarmAssetName} empty="Select a severity to show alarms" />
    </div>
  );
}

function AlarmEmpty() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconCheck />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No active alarms</EmptyStateTitle>
      <EmptyStateDescription>Gas export has been clear since 9 Mar, 07:12. 1 alarm is shelved.</EmptyStateDescription>
    </EmptyState>
  );
}

function AlarmListLoading() {
  return (
    <div className="w-full max-w-md">
      <SkeletonList rows={4} media={false} trailing label="Loading alarms" />
    </div>
  );
}

function AlarmLifecycle() {
  const alarm = alarmById('alm-4809');
  const steps: readonly TimelineEvent[] = [
    { id: 'raised', time: formatTime(alarm.raisedAt), title: 'Raised', detail: alarm.value, tone: 'warning', shape: 'square' },
    { id: 'acknowledged', time: formatTime(alarm.raisedAt + 24 * MINUTE), title: 'Acknowledged', detail: 'Ingrid Haugen' },
    { id: 'cleared', title: 'Cleared', pending: true },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-base-foreground">{alarm.message}</p>
        <p className="font-mono text-xs text-muted-foreground">{alarm.sensorTag}</p>
      </div>
      <EventTimeline orientation="horizontal" label="Alarm life cycle" events={steps} />
    </div>
  );
}

function AlarmEventTimeline() {
  const events: readonly TimelineEvent[] = PLANT_EVENTS.map((event) => ({
    id: event.id,
    time: formatTime(event.at),
    title: event.text,
    detail: (
      <>
        <span className="font-mono">{event.tag}</span> · {event.by}
      </>
    ),
    group: hourOf(event.at),
    tone: event.severity ? severityStatus(event.severity).tone : undefined,
    shape: event.severity ? severityStatus(event.severity).shape : undefined,
  }));
  return (
    <div className="w-full max-w-md">
      <EventTimeline label="Plant events by hour, newest first" events={events} />
    </div>
  );
}

function AlarmEventLog() {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-2xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Time
            </th>
            <th scope="col" className={TH}>
              Event
            </th>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              Description
            </th>
            <th scope="col" className={TH}>
              By
            </th>
          </tr>
        </thead>
        <tbody>
          {PLANT_EVENTS.map((event) => (
            <tr key={event.id} className="border-t border-default">
              <td className={`${TD} whitespace-nowrap text-muted-foreground tabular-nums`}>{formatTime(event.at)}</td>
              <td className={`${TD} whitespace-nowrap`}>
                {event.severity ? <StatusIndicator size="sm" {...severityStatus(event.severity)} label={`${severityStatus(event.severity).label} alarm`} /> : <span className="text-xs text-muted-foreground">{event.kind}</span>}
              </td>
              <td className={`${TD} whitespace-nowrap font-mono text-xs text-base-foreground`}>{event.tag}</td>
              <td className={`${TD} text-base-foreground`}>{event.text}</td>
              <td className={`${TD} whitespace-nowrap text-muted-foreground`}>{event.by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlarmAcknowledgeComment() {
  const alarm = alarmById('alm-4811');
  const [comment, setComment] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ul>
        <AlarmRow alarm={acknowledged ? { ...alarm, state: 'acknowledged' } : alarm} age={formatAgo(alarm.raisedAt)} density="compact" className="py-0" />
      </ul>
      {acknowledged ? (
        <div className="flex items-center justify-between gap-3">
          <AlarmStateLabel state="acknowledged" detail="by Ingrid Haugen, just now" />
          <Button variant="ghost" size="sm" onClick={() => setAcknowledged(false)}>
            Undo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col">
          <Label htmlFor="alarm-ack-comment">Comment</Label>
          <Textarea
            id="alarm-ack-comment"
            rows={2}
            placeholder="What you checked or did"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setComment('')}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => setAcknowledged(true)}>
              <IconCheck aria-hidden="true" />
              Acknowledge
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AlarmShelve() {
  const alarm = alarmById('alm-4803');
  const [hours, setHours] = useState('12');
  const until = formatTime(REFERENCE_NOW + Number(hours) * HOUR);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ul>
        <AlarmRow alarm={{ ...alarm, state: 'active' }} age={formatAgo(alarm.raisedAt)} density="compact" className="py-0" />
      </ul>
      <div className="flex flex-col">
        <Label htmlFor="alarm-shelve-duration">Shelve for</Label>
        <Select items={SHELVE_DURATIONS} value={hours} onValueChange={setHours}>
          <SelectTrigger id="alarm-shelve-duration" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SHELVE_DURATIONS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            Returns at {until} UTC. Linked to <span className="font-mono">WO-104479</span>
          </span>
          <Button variant="secondary" size="sm">
            <IconBellZ aria-hidden="true" />
            Shelve alarm
          </Button>
        </div>
      </div>
    </div>
  );
}

function AlarmDetailCard() {
  const alarm = alarmById('alm-4811');
  const asset = findAsset(alarm.assetId);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{alarm.message}</CardTitle>
          <CardDescription>
            <span className="font-mono">{alarm.sensorTag}</span> · {asset?.name} · <span className="font-mono">{asset?.tag}</span>
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <SeverityBadge severity={alarm.severity} />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="grid w-full gap-6 md:grid-cols-[16rem_minmax(0,1fr)]">
          <MetadataList
            items={[
              { label: 'State', value: <AlarmStateLabel state={alarm.state} /> },
              { label: 'Value', value: <span className="tabular-nums">{alarm.value}</span> },
              { label: 'High limit', value: <span className="tabular-nums">{alarm.limit}</span> },
              { label: 'Trip limit', value: <span className="tabular-nums">155.0 °C</span> },
              { label: 'Raised', value: <span className="tabular-nums">{formatDateTime(alarm.raisedAt)}</span> },
              { label: 'Times this week', value: <span className="tabular-nums">3</span> },
            ]}
          />
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs text-muted-foreground">Discharge temperature, last 48 h</span>
              <span className="text-xs text-muted-foreground tabular-nums">Limit 145.0 °C</span>
            </div>
            <Sparkline
              values={ALARM_TREND}
              label="Discharge temperature, last 48 hours, against the 145 °C high limit"
              variant="area"
              tone="warning"
              limit={145}
              unit="°C"
              height={120}
              showLast
              className="w-full"
            />
            <div aria-hidden="true" className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>10 Mar, 14:00</span>
              <span>11 Mar, 14:00</span>
              <span>Now</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Unacknowledged for 38 min</span>
        </CardFooterStart>
        <CardFooterEnd className="gap-2">
          <Button variant="ghost" size="sm">
            <IconTool aria-hidden="true" />
            Create work order
          </Button>
          <Button variant="secondary" size="sm">
            <IconBellZ aria-hidden="true" />
            Shelve
          </Button>
          <Button size="sm">
            <IconCheck aria-hidden="true" />
            Acknowledge
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

export default definePage({
  id: 'alarms-and-events',
  title: 'Alarms and events',
  summary:
    'Alarms as an operator works them: one row grammar for severity, message, tag, value against limit, state and age, then the lists, summaries, timelines and actions built from it. Severity owns the colour; state is carried by words and weight.',
  guidance: {
    use: [
      'Sort by severity first and age second, so the top of the list is always the next thing to handle.',
      'Say severity three ways: colour, dot shape and the word. Say state in words.',
      'Show the value next to the limit it crossed; an alarm without its number sends people to another screen.',
      'Summarise once per view (counts, a flood banner) and keep per-alarm state on the row.',
    ],
    avoid: [
      'Stacking one Alert per alarm — a list of alarms is a list, not a pile of banners.',
      'Pulsing or colouring acknowledged, shelved or cleared alarms; only what is new and unseen asks for attention.',
      'Hiding shelved alarms without saying how many there are and when they return.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'Rows and states',
      description: 'The alarm row and the vocabulary every other specimen reuses.',
      specimens: [
        {
          id: 'AlarmRowDefault',
          title: 'Alarm row',
          note: 'Pick it as the line item of any alarm list: severity, message, tag, value against limit, state and age.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmRow.tsx', 'industrial/operations/alarms.ts'],
          size: 'lg',
          align: 'stretch',
          Component: AlarmRowDefault,
        },
        {
          id: 'AlarmSeverityBadges',
          title: 'Severity badges',
          note: 'Pick the badge where severity labels one record — a card header, a detail page — not for every row of a list.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx'],
          Component: AlarmSeverityBadges,
        },
        {
          id: 'AlarmStates',
          title: 'Alarm states',
          note: 'Pick these four states for the alarm life cycle: unacknowledged, acknowledged, shelved and cleared.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmRow.tsx', 'industrial/operations/AlarmStateLabel.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: AlarmStates,
        },
        {
          id: 'AlarmStateLabels',
          title: 'State labels',
          note: 'Pick the label alone when a table or card needs the alarm state with who or until when.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmStateLabel.tsx'],
          Component: AlarmStateLabels,
        },
        {
          id: 'AlarmRowCompact',
          title: 'Compact row',
          note: 'Pick it in side panels and cards where the limit and state columns do not fit.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmRowCompact,
        },
        {
          id: 'AlarmAssetBadge',
          title: 'Per-asset alarm badge',
          note: 'Pick it beside an asset in a list or tree: the count of open alarms in the colour of the worst one.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmAssetBadge,
        },
      ],
    },
    {
      id: 'markers',
      title: 'Markers',
      description: 'What makes an alarm different from its neighbours: it repeats, it has stood for days, or it came first.',
      specimens: [
        {
          id: 'AlarmChattering',
          title: 'Chattering alarm',
          note: 'Pick it when an alarm re-triggers many times in ten minutes, so it shows as one row with a count instead of fourteen rows.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmChattering,
        },
        {
          id: 'AlarmStanding',
          title: 'Standing alarms',
          note: 'Pick it for alarm reviews: the alarms that have stayed open longest, with how long they have stood.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: AlarmStanding,
        },
        {
          id: 'AlarmFirstOut',
          title: 'First-out indication',
          note: 'Pick it after a trip: alarms in time order with the one that started the sequence flagged.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmList.tsx', 'industrial/operations/AlarmRow.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmFirstOut,
        },
      ],
    },
    {
      id: 'summaries',
      title: 'Summaries',
      description: 'How many, how bad, and how fast they are arriving.',
      specimens: [
        {
          id: 'AlarmSummaryInline',
          title: 'Counts by severity',
          note: 'Pick it as the one-line summary above a list or in a toolbar; zero counts stay in place but go quiet.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmSummary.tsx', 'industrial/operations/alarms.ts'],
          size: 'md',
          Component: AlarmSummaryInline,
        },
        {
          id: 'AlarmSummaryTiles',
          title: 'Counts as figures',
          note: 'Pick it on an overview where the four counts are the content, not a caption.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmSummary.tsx', 'industrial/operations/alarms.ts'],
          size: 'md',
          align: 'stretch',
          Component: AlarmSummaryTiles,
        },
        {
          id: 'AlarmHeaderStrip',
          title: 'Header alarm strip',
          note: 'Pick it under a page header so counts and the latest alarm stay in view on every screen of an area.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmSummary.tsx', 'industrial/operations/alarms.ts'],
          size: 'full',
          align: 'stretch',
          Component: AlarmHeaderStrip,
        },
        {
          id: 'AlarmKpiTiles',
          title: 'Alarm KPI tiles',
          note: 'Pick it to judge alarm system health over a shift: rate, unacknowledged, standing and shelved.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmKpiTiles,
        },
        {
          id: 'AlarmFloodBanner',
          title: 'Alarm flood banner',
          note: 'Pick it when alarms arrive faster than anyone can read them: one banner names the flood and offers the filter that helps.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: AlarmFloodBanner,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists and filters',
      description: 'The working list, its filter and what it shows when there is nothing to show.',
      specimens: [
        {
          id: 'AlarmListSorted',
          title: 'Alarm list by severity',
          note: 'Pick it as the main alarm list: most severe first, newest first within a severity, actions on each row.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmList.tsx', 'industrial/operations/AlarmRow.tsx', 'industrial/operations/alarms.ts'],
          size: 'full',
          align: 'stretch',
          Component: AlarmListSorted,
        },
        {
          id: 'AlarmSeverityFilter',
          title: 'Severity filter',
          note: 'Pick toggles when people switch severities on and off while watching the list; each shows its count.',
          origin: 'custom',
          uses: ['actions/ToggleGroup.tsx', 'industrial/operations/AlarmList.tsx', 'industrial/operations/alarms.ts'],
          size: 'full',
          align: 'stretch',
          Component: AlarmSeverityFilter,
        },
        {
          id: 'AlarmEmpty',
          title: 'No active alarms',
          note: 'Pick it when the list is empty for a good reason: say since when it has been clear and what is shelved.',
          origin: 'custom',
          size: 'md',
          Component: AlarmEmpty,
        },
        {
          id: 'AlarmListLoading',
          title: 'Loading',
          note: 'Pick it while alarms load, so the list does not flash "no alarms" before the first response.',
          origin: 'custom',
          uses: ['feedback/SkeletonList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmListLoading,
        },
      ],
    },
    {
      id: 'events',
      title: 'Timelines and logs',
      description: 'Alarms in time: the life of one alarm, and everything that happened around it.',
      specimens: [
        {
          id: 'AlarmLifecycle',
          title: 'Alarm timeline',
          note: 'Pick it on an alarm detail view to show raised, acknowledged and cleared, with the steps still to come left hollow.',
          origin: 'custom',
          uses: ['industrial/operations/EventTimeline.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmLifecycle,
        },
        {
          id: 'AlarmEventTimeline',
          title: 'Event timeline by hour',
          note: 'Pick it for a shift handover or an incident review: alarms, operator actions and state changes on one line, grouped by hour.',
          origin: 'custom',
          uses: ['industrial/operations/EventTimeline.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: AlarmEventTimeline,
        },
        {
          id: 'AlarmEventLog',
          title: 'Event log table',
          note: 'Pick a table when people scan and compare columns — time, tag, who — across many events.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'full',
          align: 'stretch',
          Component: AlarmEventLog,
        },
      ],
    },
    {
      id: 'actions',
      title: 'Acting on an alarm',
      description: 'Acknowledge, shelve, and the detail card that leads to a work order.',
      specimens: [
        {
          id: 'AlarmAcknowledgeComment',
          title: 'Acknowledge with comment',
          note: 'Pick it when acknowledging should leave a note for the next shift about what was checked.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmRow.tsx', 'industrial/operations/AlarmStateLabel.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmAcknowledgeComment,
        },
        {
          id: 'AlarmShelve',
          title: 'Shelve with duration',
          note: 'Pick it for a known nuisance alarm: shelving always has an end time and says when the alarm returns.',
          origin: 'custom',
          uses: ['industrial/operations/AlarmRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AlarmShelve,
        },
        {
          id: 'AlarmDetailCard',
          title: 'Alarm detail card',
          note: 'Pick it as the detail view of one alarm: the facts, the trend against the limit, and the three actions an operator can take.',
          origin: 'custom',
          uses: ['industrial/operations/SeverityBadge.tsx', 'industrial/operations/AlarmStateLabel.tsx', 'industrial/Sparkline.tsx', 'display/MetadataList.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AlarmDetailCard,
        },
      ],
    },
  ],
});
