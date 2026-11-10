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
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconTool } from '@cognite/aura/icons';

import { MetadataList } from '../../../library/display/MetadataList';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { LinearGauge } from '../../../library/industrial/LinearGauge';
import { DistributionBar } from '../../../library/industrial/operations/DistributionBar';
import { healthFromScore, healthTone, rankByRisk, riskScore } from '../../../library/industrial/operations/health';
import { HealthBreakdown } from '../../../library/industrial/operations/HealthBreakdown';
import type { HealthIndicator } from '../../../library/industrial/operations/HealthBreakdown';
import { ProgressRing } from '../../../library/industrial/ProgressRing';
import { RadialGauge } from '../../../library/industrial/RadialGauge';
import { RangeIndicator } from '../../../library/industrial/RangeIndicator';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { TONE_MARK_BG, healthStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { StatusDot } from '../../../library/industrial/StatusDot';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { TrendDelta } from '../../../library/industrial/TrendDelta';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ASSETS, PLANT_KPIS, findAsset, sensorsOf } from '../../data/plant';
import type { Asset } from '../../data/plant';
import { DAY, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './equipment-health.tsx?raw';

function healthAsset(id: string): Asset {
  const asset = findAsset(id);
  if (!asset) throw new Error(`Unknown asset ${id}`);
  return asset;
}

/** Equipment only: the leaves of the asset hierarchy. */
const HEALTH_EQUIPMENT = ASSETS.filter((asset) => !['site', 'area', 'system'].includes(asset.type));

const HEALTH_INDICATOR_NAMES = ['Vibration', 'Temperature', 'Performance', 'Lubrication'] as const;

/** How far each indicator sits from the overall score, rotated per unit so the fleet varies. */
const HEALTH_OFFSETS = [-12, -4, 6, 8] as const;

/** Four indicator scores per unit, derived from its health score so every screen agrees. */
function healthIndicators(asset: Asset): HealthIndicator[] {
  const shift = HEALTH_EQUIPMENT.findIndex((candidate) => candidate.id === asset.id);
  return HEALTH_INDICATOR_NAMES.map((label, index) => ({
    id: label.toLowerCase(),
    label,
    score: Math.min(100, Math.max(0, asset.healthScore + HEALTH_OFFSETS[(index + shift) % HEALTH_OFFSETS.length])),
  }));
}

const COMPRESSOR_INDICATORS: readonly HealthIndicator[] = [
  { id: 'vibration', label: 'Vibration', score: 56, detail: '6.8 mm/s, rising' },
  { id: 'temperature', label: 'Temperature', score: 67, detail: '141.2 °C' },
  { id: 'performance', label: 'Performance', score: 81, detail: '−2.1 % efficiency' },
  { id: 'lubrication', label: 'Lubrication', score: 88, detail: 'Oil sampled 3 Mar' },
];

const HEALTH_TREND = makeValues({ seed: 41, points: 90, base: 84, amplitude: 1.5, noise: 0.8, drift: -12, cycles: 3, stepMs: DAY, decimals: 0 });
const VIBRATION_TREND = makeValues({ seed: 14, points: 60, base: 4.6, amplitude: 0.25, noise: 0.15, drift: 2.2, cycles: 4, stepMs: DAY, decimals: 1 });

/** Velocity amplitude per order of running speed, 0.5× to 12×. A fixed, readable spectrum. */
const VIBRATION_SPECTRUM: readonly number[] = [0.4, 5.2, 0.6, 2.1, 0.5, 0.9, 0.4, 0.7, 0.3, 0.5, 0.3, 0.4, 0.2, 1.6, 0.3, 0.3, 0.2, 0.3, 0.2, 0.2, 0.2, 0.3, 0.2, 0.2];

type HealthBarRow = { id: string; label: string; sublabel?: string; value: number; text: string; tone?: Tone };

/** Ranked horizontal bars with the figure printed, for bad actors and failure modes. */
function HealthBarList({ rows, label, max }: { rows: readonly HealthBarRow[]; label: string; max?: number }) {
  const top = max ?? Math.max(...rows.map((row) => row.value));
  return (
    <ol aria-label={label} className="flex w-full flex-col gap-3">
      {rows.map((row) => (
        <li key={row.id} className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-sm text-base-foreground">{row.label}</span>
              {row.sublabel ? <span className="shrink-0 font-mono text-xs text-muted-foreground">{row.sublabel}</span> : null}
            </span>
            <span className="shrink-0 text-xs font-medium text-base-foreground tabular-nums">{row.text}</span>
          </div>
          <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-chart-neutral-100">
            <span className={`block h-full rounded-full ${TONE_MARK_BG[row.tone ?? 'neutral']}`} style={{ width: `${(row.value / top) * 100}%` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

function EquipmentHealthScoreTile() {
  const asset = healthAsset('23-ka-9101');
  return (
    <KpiTile
      label={`Health score · ${asset.name}`}
      value={asset.healthScore}
      tone="warning"
      status={healthStatus(asset.health)}
      delta={{ reference: 84, goodDirection: 'up', caption: 'vs 90 d ago', decimals: 0 }}
      trend={{ values: HEALTH_TREND, label: 'Health score, last 90 days' }}
      className="w-full max-w-xs"
    />
  );
}

function EquipmentHealthRing() {
  const asset = healthAsset('23-ka-9103');
  return (
    <div className="flex flex-col items-center gap-3">
      <ProgressRing label={`${asset.name} health score`} value={asset.healthScore} unit="" size="lg" tone={healthTone(asset.health)} />
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-medium text-base-foreground">{asset.name}</span>
        <StatusIndicator size="sm" {...healthStatus(asset.health)} label="Poor health" />
      </div>
    </div>
  );
}

function EquipmentHealthNoData() {
  return (
    <KpiTile
      label="Health score · Test separator"
      value={null}
      emptyText="Needs 14 d of running data. 3 d so far"
      className="w-full max-w-xs"
    />
  );
}

function EquipmentHealthBreakdown() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">1st stage compressor</span>
        <span className="font-mono text-xs text-muted-foreground">23-KA-9101</span>
      </div>
      <HealthBreakdown indicators={COMPRESSOR_INDICATORS} />
    </div>
  );
}

function EquipmentHealthTrend() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Health score, last 90 d</span>
          <ValueReadout value={HEALTH_TREND[HEALTH_TREND.length - 1]} size="lg" tone="warning" />
        </div>
        <TrendDelta value={HEALTH_TREND[HEALTH_TREND.length - 1]} reference={HEALTH_TREND[0]} decimals={0} goodDirection="up" caption="in 90 d" />
      </div>
      <Sparkline
        values={HEALTH_TREND}
        label="Health score of the 1st stage compressor, last 90 days, with the watch threshold at 80"
        tone="warning"
        limit={80}
        domain={[50, 100]}
        height={96}
        decimals={0}
        showLast
        className="w-full"
      />
      <div aria-hidden="true" className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>12 Dec</span>
        <span>Watch below 80</span>
        <span>12 Mar</span>
      </div>
    </div>
  );
}

function EquipmentHealthMtbfMttr() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <KpiTile
        label="MTBF"
        value={PLANT_KPIS.mtbf.value}
        unit="h"
        delta={{ reference: PLANT_KPIS.mtbf.previous, goodDirection: 'up', caption: 'vs last quarter', decimals: 0 }}
        target={{ value: PLANT_KPIS.mtbf.target }}
        footnote="Mean time between failures"
      />
      <KpiTile
        label="MTTR"
        value={6.4}
        unit="h"
        decimals={1}
        delta={{ reference: 7.9, goodDirection: 'down', caption: 'vs last quarter' }}
        target={{ value: 6 }}
        footnote="Mean time to repair"
      />
    </div>
  );
}

function EquipmentHealthRunHours() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <LinearGauge
        label="Run hours since overhaul · 23-KA-9101"
        value={21340}
        min={0}
        max={25000}
        unit="h"
        zones={[
          { from: 0, to: 20000, tone: 'neutral' },
          { from: 20000, to: 25000, tone: 'warning' },
        ]}
        showScale
      />
      <MetadataList
        items={[
          { label: 'Overhaul interval', value: <span className="tabular-nums">25,000 h</span> },
          { label: 'Remaining', value: <span className="tabular-nums">3,660 h · about 152 d</span> },
          { label: 'Last overhaul', value: <span className="tabular-nums">4 Oct 2023</span> },
        ]}
      />
    </div>
  );
}

function EquipmentHealthRemainingLife() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <RangeIndicator label="Remaining useful life · drive-end bearing" value={7} min={0} max={18} limits={{ low: 4, high: 11 }} unit="months" tone="neutral" />
      <p className="text-xs text-muted-foreground">
        Most likely 7 months. 80 % confidence range 4 to 11 months, based on the vibration trend since 12 Jan.
      </p>
    </div>
  );
}

function EquipmentHealthBearingTrio() {
  const bearings = [
    { label: 'Drive end', tag: '23-TT-92541', value: 78.4 },
    { label: 'Non-drive end', tag: '23-TT-92542', value: 71.2 },
    { label: 'Thrust', tag: '23-TT-92543', value: 88.6 },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <span className="text-xs text-muted-foreground">Bearing temperatures · 1st stage compressor</span>
      <div className="grid grid-cols-3 gap-4">
        {bearings.map((bearing) => (
          <div key={bearing.tag} className="flex flex-col items-center gap-1">
            <RadialGauge label={bearing.label} value={bearing.value} min={0} max={120} unit="°C" decimals={1} limits={{ high: 85, highHigh: 95 }} size="sm" showRange={false} />
            <span className="font-mono text-xs text-muted-foreground">{bearing.tag}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EquipmentHealthSpectrum() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Vibration spectrum · <span className="font-mono">23-VT-92540</span>
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">Alert 4.5 mm/s</span>
      </div>
      <Sparkline
        values={VIBRATION_SPECTRUM}
        label="Vibration velocity by order of running speed; the 1× peak is above the 4.5 mm/s alert level"
        variant="bar"
        limit={4.5}
        unit="mm/s"
        height={112}
        className="w-full"
      />
      <div aria-hidden="true" className="grid grid-cols-6 text-xs text-muted-foreground tabular-nums">
        <span>1×</span>
        <span>3×</span>
        <span>5×</span>
        <span>7×</span>
        <span>9×</span>
        <span>11×</span>
      </div>
      <p className="text-xs text-muted-foreground">Dominant 1× peak at 5.2 mm/s points to unbalance; the 7× peak matches the blade-pass frequency.</p>
    </div>
  );
}

function EquipmentHealthDegradation() {
  const sensor = sensorsOf('23-ka-9101').find((candidate) => candidate.id === 'vt-92540');
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Drive-end vibration, last 60 d</span>
          <ValueReadout value={sensor?.value ?? null} unit="mm/s" decimals={1} size="lg" />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">High limit 7.1 mm/s</span>
      </div>
      <Sparkline
        values={VIBRATION_TREND}
        label="Drive-end vibration, last 60 days, rising towards the 7.1 mm/s high limit"
        variant="area"
        limit={7.1}
        unit="mm/s"
        height={96}
        showLast
        className="w-full"
      />
      <p className="text-xs text-warning-foreground-strong">At +0.04 mm/s per day it reaches the limit in about 8 d.</p>
    </div>
  );
}

function EquipmentHealthFailureModes() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Likely failure modes</span>
        <span className="text-xs text-muted-foreground">Next 90 d</span>
      </div>
      <HealthBarList
        label="Failure modes by likelihood"
        max={100}
        rows={[
          { id: 'bearing', label: 'Drive-end bearing wear', value: 62, text: '62 % · likely', tone: 'warning' },
          { id: 'unbalance', label: 'Rotor unbalance', value: 24, text: '24 % · possible' },
          { id: 'seal', label: 'Dry gas seal leak', value: 9, text: '9 % · unlikely' },
          { id: 'fouling', label: 'Impeller fouling', value: 5, text: '5 % · unlikely' },
        ]}
      />
    </div>
  );
}

function EquipmentHealthRecommendation() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Plan a bearing inspection</CardTitle>
          <CardDescription>
            1st stage compressor · <span className="font-mono">23-KA-9101</span>
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" tone="warning" label="Within 7 d" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="flex w-full flex-col gap-3">
          <p className="text-sm text-base-foreground">
            Drive-end vibration has risen 48 % in 60 days and will reach its high limit in about 8 days. The 1× peak dominates the spectrum.
          </p>
          <MetadataList
            items={[
              { label: 'Suggested window', value: 'Planned stop, 17 Mar' },
              { label: 'Estimated work', value: <span className="tabular-nums">8 h · 2 technicians</span> },
              { label: 'Confidence', value: 'High' },
            ]}
          />
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Raised 12 Mar, 06:00</span>
        </CardFooterStart>
        <CardFooterEnd className="gap-2">
          <Button variant="ghost" size="sm">
            Dismiss
          </Button>
          <Button size="sm">
            <IconTool aria-hidden="true" />
            Create work order
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function EquipmentHealthConditionTable() {
  const sensors = sensorsOf('23-ka-9101');
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-2xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Indicator
            </th>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Value
            </th>
            <th scope="col" className={`${TH} text-right`}>
              High limit
            </th>
            <th scope="col" className={TH}>
              Share of limit
            </th>
            <th scope="col" className={TH}>
              Last 7 d
            </th>
            <th scope="col" className={TH}>
              Condition
            </th>
          </tr>
        </thead>
        <tbody>
          {sensors.map((sensor) => {
            const used = Math.round((sensor.value / sensor.highLimit) * 100);
            const condition = used >= 100 ? 'poor' : used >= 95 ? 'watch' : 'good';
            return (
              <tr key={sensor.id} className="border-t border-default">
                <td className={`${TD} text-base-foreground`}>{sensor.name}</td>
                <td className={`${TD} whitespace-nowrap font-mono text-xs text-muted-foreground`}>{sensor.tag}</td>
                <td className={`${TD} text-right`}>
                  <ValueReadout
                    size="xs"
                    value={sensor.value}
                    unit={sensor.unit}
                    decimals={sensor.decimals}
                    tone={toneFromLimits(sensor.value, { high: sensor.highLimit, highHigh: sensor.highHighLimit })}
                  />
                </td>
                <td className={`${TD} text-right text-muted-foreground tabular-nums`}>{sensor.highLimit.toLocaleString('en-US')}</td>
                <td className={`${TD} w-40`}>
                  <LinearGauge label={`${sensor.name}, share of high limit`} value={used} unit="%" size="sm" showHeader={false} tone={healthTone(condition)} />
                </td>
                <td className={`${TD} w-32`}>
                  <Sparkline
                    values={makeValues({ seed: sensor.seed, points: 28, base: sensor.value * 0.97, amplitude: sensor.value * 0.015, noise: sensor.value * 0.008, drift: sensor.value * 0.03, decimals: 2 })}
                    label={`${sensor.name}, last 7 days`}
                    unit={sensor.unit}
                    height={24}
                    tone={healthTone(condition)}
                  />
                </td>
                <td className={TD}>
                  <StatusIndicator size="sm" {...healthStatus(condition)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EquipmentHealthRiskRanking() {
  const ranked = rankByRisk(HEALTH_EQUIPMENT).slice(0, 6);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Risk ranking</span>
        <span className="text-xs text-muted-foreground">Criticality × lost health</span>
      </div>
      <ol className="flex flex-col divide-y divide-default">
        {ranked.map((asset, index) => {
          const risk = riskScore(asset.criticality, asset.healthScore);
          return (
            <li key={asset.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_3.5rem_5rem_2rem] items-center gap-3 py-2">
              <span className="text-xs text-muted-foreground tabular-nums">{index + 1}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm text-base-foreground">{asset.name}</span>
                <span className="font-mono text-xs text-muted-foreground">{asset.tag}</span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {asset.criticality} · {asset.healthScore}
              </span>
              <span aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-chart-neutral-100">
                <span
                  className={`block h-full rounded-full ${TONE_MARK_BG[risk >= 120 ? 'critical' : risk >= 60 ? 'warning' : 'neutral']}`}
                  style={{ width: `${Math.min(100, (risk / 200) * 100)}%` }}
                />
              </span>
              <span className="text-right text-sm font-medium text-base-foreground tabular-nums">{risk}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EquipmentHealthScoreList() {
  const units = HEALTH_EQUIPMENT.filter((asset) => asset.parentId === 'nk-23');
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Gas compression</span>
        <span className="text-xs text-muted-foreground">Health score, 0–100</span>
      </div>
      {units.map((asset) => (
        <LinearGauge
          key={asset.id}
          label={asset.name}
          value={asset.healthScore}
          size="sm"
          tone={healthTone(asset.health)}
        />
      ))}
    </div>
  );
}

function EquipmentHealthBadActorsAlarms() {
  const counts = [
    { id: '23-ka-9103', value: 41 },
    { id: '23-ka-9101', value: 28 },
    { id: '23-ha-9114', value: 17 },
    { id: '40-pa-4001', value: 9 },
    { id: '27-pa-2001a', value: 4 },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Bad actors by alarms</span>
        <span className="text-xs text-muted-foreground">Last 30 d</span>
      </div>
      <HealthBarList
        label="Equipment with the most alarms, last 30 days"
        rows={counts.map((entry) => {
          const asset = healthAsset(entry.id);
          return { id: entry.id, label: asset.name, sublabel: asset.tag, value: entry.value, text: `${entry.value} alarms` };
        })}
      />
    </div>
  );
}

function EquipmentHealthBadActorsDowntime() {
  const hours = [
    { id: '23-ka-9103', value: 38.5 },
    { id: '40-pa-4001', value: 21 },
    { id: '23-ha-9114', value: 12.5 },
    { id: '23-ka-9101', value: 6 },
    { id: '20-va-1002', value: 2.5 },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Bad actors by downtime</span>
        <span className="text-xs text-muted-foreground">Last 30 d</span>
      </div>
      <HealthBarList
        label="Equipment with the most downtime, last 30 days"
        rows={hours.map((entry) => {
          const asset = healthAsset(entry.id);
          return { id: entry.id, label: asset.name, sublabel: asset.tag, value: entry.value, text: `${entry.value.toFixed(1)} h` };
        })}
      />
    </div>
  );
}

function EquipmentHealthFleetDistribution() {
  const count = (health: Asset['health']) => HEALTH_EQUIPMENT.filter((asset) => asset.health === health).length;
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Fleet health</span>
        <span className="text-xs text-muted-foreground tabular-nums">{HEALTH_EQUIPMENT.length} units · Nordkapp plant</span>
      </div>
      <DistributionBar
        label="Equipment by health"
        segments={[
          { id: 'good', label: 'Good', value: count('good') },
          { id: 'watch', label: 'Watch', value: count('watch'), tone: 'warning' },
          { id: 'poor', label: 'Poor', value: count('poor'), tone: 'critical' },
        ]}
      />
    </div>
  );
}

function EquipmentHealthScale() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">How the score is judged</span>
      <ul className="flex flex-col gap-2">
        <li className="flex items-center justify-between gap-4">
          <StatusIndicator {...healthStatus('good')} />
          <span className="text-xs text-muted-foreground tabular-nums">80–100 · no action</span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <StatusIndicator {...healthStatus('watch')} />
          <span className="text-xs text-muted-foreground tabular-nums">60–79 · plan an inspection</span>
        </li>
        <li className="flex items-center justify-between gap-4">
          <StatusIndicator {...healthStatus('poor')} />
          <span className="text-xs text-muted-foreground tabular-nums">Below 60 · act this week</span>
        </li>
      </ul>
    </div>
  );
}

function EquipmentHealthMatrix() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-xl border-collapse text-sm">
          <thead>
            <tr>
              <th scope="col" className={TH}>
                Equipment
              </th>
              <th scope="col" className={TH}>
                Tag
              </th>
              {HEALTH_INDICATOR_NAMES.map((name) => (
                <th key={name} scope="col" className={`${TH} text-center`}>
                  {name}
                </th>
              ))}
              <th scope="col" className={`${TH} text-right`}>
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {HEALTH_EQUIPMENT.map((asset) => (
              <tr key={asset.id} className="border-t border-default">
                <th scope="row" className="px-3 py-1.5 text-left text-sm font-normal text-base-foreground">
                  {asset.name}
                </th>
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-muted-foreground">{asset.tag}</td>
                {healthIndicators(asset).map((indicator) => {
                  const status = healthStatus(healthFromScore(indicator.score ?? 0));
                  const text = `${asset.name}, ${indicator.label.toLowerCase()}: ${indicator.score}, ${status.label.toLowerCase()}`;
                  return (
                    <td key={indicator.id} className="px-3 py-1.5 text-center">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button type="button" className="inline-flex size-6 items-center justify-center rounded-md outline-none focus-visible:shadow-focus-ring">
                              <StatusDot tone={status.tone} shape={status.shape} label={text} />
                            </button>
                          }
                        />
                        <TooltipContent>{text}</TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 text-right">
                  <ValueReadout size="xs" value={asset.healthScore} tone={healthTone(asset.health)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-4 px-3 text-xs text-muted-foreground">
        <span>Condition</span>
        <StatusIndicator size="sm" {...healthStatus('good')} />
        <StatusIndicator size="sm" {...healthStatus('watch')} />
        <StatusIndicator size="sm" {...healthStatus('poor')} />
      </div>
    </div>
  );
}

function EquipmentHealthOverview() {
  const asset = healthAsset('23-ka-9101');
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{asset.name}</CardTitle>
          <CardDescription>
            <span className="font-mono">{asset.tag}</span> · Gas compression · criticality {asset.criticality}
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" {...healthStatus(asset.health)} label="Watch health" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="grid w-full gap-8 lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            <ProgressRing label="Health score" value={asset.healthScore} unit="" size="lg" tone={healthTone(asset.health)} />
            <TrendDelta value={asset.healthScore} reference={84} decimals={0} goodDirection="up" caption="in 90 d" />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <span className="text-xs text-muted-foreground">Health by indicator</span>
            <HealthBreakdown indicators={COMPRESSOR_INDICATORS} showStatus={false} />
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <span className="text-xs text-muted-foreground">Health score, last 90 d · watch below 80</span>
            <Sparkline
              values={HEALTH_TREND}
              label="Health score, last 90 days, with the watch threshold at 80"
              variant="area"
              tone="warning"
              limit={80}
              domain={[50, 100]}
              height={104}
              decimals={0}
              showLast
              className="w-full"
            />
            <RangeIndicator label="Remaining useful life · drive-end bearing" value={7} min={0} max={18} limits={{ low: 4, high: 11 }} unit="months" tone="neutral" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-sm text-base-foreground">Recommended: plan a bearing inspection within 7 d</span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button size="sm">
            <IconTool aria-hidden="true" />
            Create work order
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

export default definePage({
  id: 'equipment-health',
  title: 'Equipment health',
  summary:
    'Condition of equipment from one score down to the evidence: what the score is made of, where it is heading, how long the unit has left, and which units to look at first. Good health stays quiet; watch and poor carry colour, shape and the word.',
  guidance: {
    use: [
      'Always show what a health score is made of — a number nobody can explain will not be trusted.',
      'Give predictions a range and say what they are based on; a single date reads as a promise.',
      'Rank by risk (criticality × condition) so a poor pump does not outrank a watch-state compressor.',
      'End on an action: a recommendation with a window and a button to create the work order.',
    ],
    avoid: [
      'Green for every healthy bar and dot in a breakdown; let the weak indicator be the only colour.',
      'Dials for a whole fleet. Use a matrix or a distribution and keep gauges for a few key readings.',
      'Health scores without a time base; show the trend or the change since a named date.',
    ],
  },
  source,
  sections: [
    {
      id: 'scores',
      title: 'Scores',
      description: 'One number, what it is made of and where it is heading.',
      specimens: [
        {
          id: 'EquipmentHealthScoreTile',
          title: 'Health score tile',
          note: 'Pick it on a dashboard: the score, its judgement in words, the change and a 90-day trend.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx', 'industrial/status.ts'],
          align: 'stretch',
          Component: EquipmentHealthScoreTile,
        },
        {
          id: 'EquipmentHealthRing',
          title: 'Health ring',
          note: 'Pick the ring when the score heads an asset page or card; it takes colour only for watch and poor.',
          origin: 'custom',
          uses: ['industrial/ProgressRing.tsx', 'industrial/operations/health.ts', 'industrial/StatusIndicator.tsx'],
          Component: EquipmentHealthRing,
        },
        {
          id: 'EquipmentHealthNoData',
          title: 'Not enough data',
          note: 'Pick it when a score cannot be computed yet: say what is missing and how far along it is.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          align: 'stretch',
          Component: EquipmentHealthNoData,
        },
        {
          id: 'EquipmentHealthBreakdown',
          title: 'Breakdown by indicator',
          note: 'Pick it wherever a score is shown in detail: vibration, temperature, performance and lubrication, each with its finding.',
          origin: 'custom',
          uses: ['industrial/operations/HealthBreakdown.tsx', 'industrial/operations/health.ts'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthBreakdown,
        },
        {
          id: 'EquipmentHealthTrend',
          title: 'Health trend',
          note: 'Pick it to show direction: the score over 90 days against the threshold where it becomes "watch".',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/TrendDelta.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthTrend,
        },
      ],
    },
    {
      id: 'reliability',
      title: 'Reliability and life',
      description: 'How often it fails, how long it has run, how long it has left.',
      specimens: [
        {
          id: 'EquipmentHealthMtbfMttr',
          title: 'MTBF and MTTR tiles',
          note: 'Pick the pair together: time between failures should rise, time to repair should fall.',
          origin: 'custom',
          uses: ['industrial/KpiTile.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthMtbfMttr,
        },
        {
          id: 'EquipmentHealthRunHours',
          title: 'Run hours since overhaul',
          note: 'Pick it for interval-based maintenance: hours run against the overhaul limit, with the last stretch marked.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'display/MetadataList.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthRunHours,
        },
        {
          id: 'EquipmentHealthRemainingLife',
          title: 'Remaining useful life',
          note: 'Pick it for a prediction: the most likely figure as a marker inside its confidence range, with the basis in words.',
          origin: 'custom',
          uses: ['industrial/RangeIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthRemainingLife,
        },
        {
          id: 'EquipmentHealthBearingTrio',
          title: 'Bearing temperature trio',
          note: 'Pick three small dials when the same reading at three positions is compared at a glance.',
          origin: 'custom',
          uses: ['industrial/RadialGauge.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthBearingTrio,
        },
      ],
    },
    {
      id: 'evidence',
      title: 'Evidence and advice',
      description: 'The measurements behind a judgement, and what to do about it.',
      specimens: [
        {
          id: 'EquipmentHealthSpectrum',
          title: 'Vibration spectrum',
          note: 'Pick spectrum-like bars to show which frequency carries the energy; bars over the alert level change colour.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthSpectrum,
        },
        {
          id: 'EquipmentHealthDegradation',
          title: 'Degradation against threshold',
          note: 'Pick it when the question is "when": a rising trend, the limit it is heading for, and the days left at this rate.',
          origin: 'custom',
          uses: ['industrial/Sparkline.tsx', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthDegradation,
        },
        {
          id: 'EquipmentHealthFailureModes',
          title: 'Failure modes with likelihood',
          note: 'Pick it to turn symptoms into causes: ranked failure modes with a percentage and a word.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthFailureModes,
        },
        {
          id: 'EquipmentHealthRecommendation',
          title: 'Maintenance recommendation',
          note: 'Pick it as the conclusion of a health view: the finding, the suggested window and the action.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthRecommendation,
        },
        {
          id: 'EquipmentHealthConditionTable',
          title: 'Condition indicator table',
          note: 'Pick it for the engineer: every monitored indicator with its value, limit, share of limit, week trend and judgement.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/Sparkline.tsx', 'industrial/StatusIndicator.tsx', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: EquipmentHealthConditionTable,
        },
      ],
    },
    {
      id: 'rankings',
      title: 'Rankings and fleets',
      description: 'Which units to look at first.',
      specimens: [
        {
          id: 'EquipmentHealthRiskRanking',
          title: 'Risk ranking',
          note: 'Pick it to prioritise: criticality times lost health, highest first, with both inputs shown.',
          origin: 'custom',
          uses: ['industrial/operations/health.ts'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthRiskRanking,
        },
        {
          id: 'EquipmentHealthScoreList',
          title: 'Scores for an area',
          note: 'Pick stacked bars to compare the units of one area on the same 0–100 scale.',
          origin: 'custom',
          uses: ['industrial/LinearGauge.tsx', 'industrial/operations/health.ts'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthScoreList,
        },
        {
          id: 'EquipmentHealthBadActorsAlarms',
          title: 'Bad actors by alarms',
          note: 'Pick it for reliability reviews: the few units that raise most of the alarms.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthBadActorsAlarms,
        },
        {
          id: 'EquipmentHealthBadActorsDowntime',
          title: 'Bad actors by downtime',
          note: 'Pick it beside the alarm ranking: the units that cost the most hours are not always the noisiest.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthBadActorsDowntime,
        },
        {
          id: 'EquipmentHealthFleetDistribution',
          title: 'Fleet health distribution',
          note: 'Pick one stacked bar for the state of a whole fleet: how many units are good, watch and poor.',
          origin: 'custom',
          uses: ['industrial/operations/DistributionBar.tsx'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthFleetDistribution,
        },
        {
          id: 'EquipmentHealthScale',
          title: 'Score scale',
          note: 'Pick it as the legend of any health view: what each band means and what it asks of people.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: EquipmentHealthScale,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Matrix and overview',
      description: 'Health at the scale of a fleet and of one asset page.',
      specimens: [
        {
          id: 'EquipmentHealthMatrix',
          title: 'Health matrix',
          note: 'Pick it to see where problems cluster: units down the side, indicators across, each cell a shaped dot with its score on hover.',
          origin: 'custom',
          uses: ['industrial/StatusDot.tsx', 'industrial/StatusIndicator.tsx', 'industrial/operations/health.ts', 'industrial/ValueReadout.tsx'],
          size: 'full',
          align: 'stretch',
          Component: EquipmentHealthMatrix,
        },
        {
          id: 'EquipmentHealthOverview',
          title: 'Asset health overview',
          note: 'Pick it as the health panel of an asset page: score, breakdown, trend, remaining life and the recommended action in one card.',
          origin: 'custom',
          uses: [
            'industrial/ProgressRing.tsx',
            'industrial/operations/HealthBreakdown.tsx',
            'industrial/Sparkline.tsx',
            'industrial/RangeIndicator.tsx',
            'industrial/TrendDelta.tsx',
          ],
          size: 'full',
          align: 'stretch',
          Component: EquipmentHealthOverview,
        },
      ],
    },
  ],
});
