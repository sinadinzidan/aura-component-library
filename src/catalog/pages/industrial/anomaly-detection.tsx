import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { IconCheck, IconCircleCheck, IconEyeOff, IconThumbDown, IconThumbUp } from '@cognite/aura/icons';
import { useState } from 'react';

import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { SliderField } from '../../../library/forms/SliderField';
import { anomalyRegions, bandScores, classifyPattern, flaggedScores, rankContributors, rollingScores, sensitivityThreshold } from '../../../library/industrial/analytics/anomaly';
import type { AnomalyPattern } from '../../../library/industrial/analytics/anomaly';
import { AnomalyRow } from '../../../library/industrial/analytics/AnomalyRow';
import type { AnomalyRecord, AnomalyStatus } from '../../../library/industrial/analytics/AnomalyRow';
import { ScoreStrip } from '../../../library/industrial/analytics/ScoreStrip';
import { HeatMapGrid } from '../../../library/industrial/charts/HeatMapGrid';
import { TrendCard } from '../../../library/industrial/charts/TrendCard';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import type { TrendPoint } from '../../../library/industrial/charts/trendData';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { formatValue } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { ASSETS, findAsset } from '../../data/plant';
import { HOUR, MINUTE, REFERENCE_NOW, formatDateTime, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './anomaly-detection.tsx?raw';

const NOW = REFERENCE_NOW;
const STEP = 10 * MINUTE;
const DRIFT_FROM = NOW - 150 * MINUTE;
const BLIP_AT = NOW - 14 * HOUR;

/** Expected range of drive-end vibration at the current load, from the model. */
const EXPECTED_LOW = 5.1;
const EXPECTED_HIGH = 6.0;

/** Drive-end vibration for 24 hours: steady, one short blip at midnight, then a drift over the last 2.5 hours. */
const VIBRATION: TrendPoint[] = makeSeries({ seed: 14, points: 145, base: 5.55, amplitude: 0.12, cycles: 2, noise: 0.06, stepMs: STEP, decimals: 2 }).map((point) => {
  const drift = point.t > DRIFT_FROM ? ((point.t - DRIFT_FROM) / (NOW - DRIFT_FROM)) * 1.25 : 0;
  const blip = Math.abs(point.t - BLIP_AT) <= STEP ? 0.62 : 0;
  return { t: point.t, v: Math.round((point.v + drift + blip) * 100) / 100 };
});

const EXPECTED = VIBRATION.map((point) => ({ t: point.t, low: EXPECTED_LOW, high: EXPECTED_HIGH }));
const SCORES = bandScores(VIBRATION, EXPECTED);
const DEFAULT_THRESHOLD = sensitivityThreshold(50);
const REGIONS = anomalyRegions(SCORES, DEFAULT_THRESHOLD, 1);
const MAIN_REGION = REGIONS[REGIONS.length - 1] ?? { from: DRIFT_FROM, to: NOW, peak: 1, count: 0 };

/** Inset that lines a strip up with the plot of a TrendChart: its axis width and right margin. */
const PLOT_INSET = { left: 44, right: 12 };

const anomalyDetectDuration = (ms: number): string => {
  const minutes = Math.round(ms / MINUTE);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};

type AnomalyDetectEntry = AnomalyRecord & { assetId: string; startedAt: number; durationMs: number; pattern: string };

const ANOMALIES: readonly AnomalyDetectEntry[] = [
  { id: 'an-2071', tag: '23-VT-92540', name: 'Drive-end vibration', assetId: '23-ka-9101', score: MAIN_REGION.peak, status: 'new', startedAt: MAIN_REGION.from, durationMs: NOW - MAIN_REGION.from, pattern: 'Drift' },
  { id: 'an-2070', tag: '23-TT-92532', name: 'Discharge temperature', assetId: '23-ka-9101', score: 0.83, status: 'new', startedAt: NOW - 95 * MINUTE, durationMs: 95 * MINUTE, pattern: 'Drift' },
  { id: 'an-2068', tag: '23-TT-91141', name: 'Cooler outlet temperature', assetId: '23-ha-9114', score: 0.74, status: 'acknowledged', startedAt: NOW - 5 * HOUR, durationMs: 5 * HOUR, pattern: 'Drift' },
  { id: 'an-2064', tag: '40-TT-40015', name: 'Bearing temperature', assetId: '40-pa-4001', score: 0.92, status: 'acknowledged', startedAt: NOW - 9 * HOUR, durationMs: 9 * HOUR, pattern: 'Flatline' },
  { id: 'an-2061', tag: '27-IT-20013', name: 'Motor current', assetId: '27-pa-2001a', score: 0.58, status: 'dismissed', startedAt: NOW - 16 * HOUR, durationMs: 20 * MINUTE, pattern: 'Spike' },
  { id: 'an-2057', tag: '20-LT-10012', name: 'Separator level', assetId: '20-va-1001', score: 0.66, status: 'dismissed', startedAt: NOW - 21 * HOUR, durationMs: 45 * MINUTE, pattern: 'Spike' },
];

const CONTRIBUTORS = rankContributors([
  { id: 'vt', tag: '23-VT-92540', name: 'Drive-end vibration', contribution: 0.46 },
  { id: 'tt', tag: '23-TT-92532', name: 'Discharge temperature', contribution: 0.27 },
  { id: 'vt2', tag: '23-VT-92541', name: 'Non-drive-end vibration', contribution: 0.14 },
  { id: 'pt', tag: '23-PT-92531', name: 'Discharge pressure', contribution: 0.08 },
  { id: 'st', tag: '23-ST-92501', name: 'Shaft speed', contribution: 0.05 },
]);

/** Anomaly score per sensor in two-hour buckets over the last 24 hours. */
const MATRIX_COLUMNS = Array.from({ length: 12 }, (_, index) => formatTime(NOW - (11 - index) * 2 * HOUR - 2 * HOUR));
const MATRIX_ROWS = [
  { tag: '23-VT-92540', seed: 81, tail: [0.42, 0.71, 0.97] },
  { tag: '23-VT-92541', seed: 82, tail: [0.3, 0.48, 0.66] },
  { tag: '23-TT-92532', seed: 83, tail: [0.35, 0.62, 0.83] },
  { tag: '23-PT-92531', seed: 84, tail: [0.2, 0.31, 0.44] },
  { tag: '23-PT-92530', seed: 85, tail: [0.12, 0.15, 0.18] },
  { tag: '23-ST-92501', seed: 86, tail: [0.1, 0.16, 0.22] },
];
const MATRIX_VALUES = MATRIX_ROWS.map((row) => [...makeSeries({ seed: row.seed, points: 9, base: 0.14, noise: 0.07, min: 0.02, max: 0.34, decimals: 2 }).map((point) => point.v), ...row.tail]);

/** One hour of one-minute samples for each pattern. */
const PATTERN_BASE = makeSeries({ seed: 91, points: 60, base: 61, noise: 0.35, amplitude: 0.3, cycles: 2, stepMs: MINUTE, decimals: 2 });
const PATTERN_SERIES: Record<'flatline' | 'spike' | 'drift', TrendPoint[]> = {
  flatline: PATTERN_BASE.map((point, index) => ({ t: point.t, v: index >= 38 ? PATTERN_BASE[38].v : point.v })),
  spike: PATTERN_BASE.map((point, index) => ({ t: point.t, v: index === 41 ? point.v + 6.5 : point.v })),
  drift: PATTERN_BASE.map((point, index) => ({ t: point.t, v: Math.round((point.v + Math.max(0, index - 20) * 0.09) * 100) / 100 })),
};

const PATTERN_WORD: Record<AnomalyPattern, string> = { flatline: 'Flatline', spike: 'Spike', drift: 'Drift', none: 'No pattern' };

const SIMILAR_EVENTS = [
  { id: 'ev-1', date: '18 Nov 2025', similarity: 0.91, asset: '23-KA-9103', outcome: 'Drive-end bearing replaced', order: 'WO-101877', lead: '9 days before failure' },
  { id: 'ev-2', date: '2 Jul 2025', similarity: 0.84, asset: '23-KA-9101', outcome: 'Coupling realigned', order: 'WO-098213', lead: 'Found at inspection' },
  { id: 'ev-3', date: '14 Feb 2025', similarity: 0.71, asset: '23-KA-9102', outcome: 'False alarm: sensor loose', order: 'WO-094406', lead: 'No fault' },
];

const anomalyDetectAsset = (assetId: string): string | undefined => findAsset(assetId)?.name;

type AnomalyDetectPatternProps = { kind: 'flatline' | 'spike' | 'drift'; title: string; tag: string; text: string };

function AnomalyDetectPattern({ kind, title, tag, text }: AnomalyDetectPatternProps) {
  const points = PATTERN_SERIES[kind];
  const found = classifyPattern(points);
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">{title}</span>
        <Badge variant="secondary">{PATTERN_WORD[found]}</Badge>
      </div>
      <TrendChart compact heightClassName="h-24" label={`${title} on ${tag} over the last hour, classified as ${PATTERN_WORD[found].toLowerCase()}`} series={[{ key: 'value', label: title, points }]} />
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">{tag}</span> · {text}
      </p>
    </div>
  );
}

function AnomalyDetectRegion() {
  return (
    <TrendChart
      label={`Drive-end vibration over the last 24 hours with the anomalous period from ${formatTime(MAIN_REGION.from)} shaded; vibration rises from 5.6 to 6.8 millimetres per second`}
      series={[{ key: 'vibration', label: 'Drive-end vibration', points: VIBRATION }]}
      regions={[{ from: MAIN_REGION.from, to: NOW, label: 'Anomaly', tone: 'warning' }]}
      limits={[{ value: 7.1, label: 'High 7.1', tone: 'warning', align: 'left' }]}
      yDomain={[4.5, 7.5]}
      yTicks={[4.5, 5.5, 6.5, 7.5]}
      unit="mm/s"
      summary={`Flagged since ${formatTime(MAIN_REGION.from)}, while the value is still under its 7.1 mm/s high limit. The anomaly comes before the alarm.`}
    />
  );
}

function AnomalyDetectScoreStrip() {
  return (
    <div className="flex w-full flex-col gap-2">
      <TrendChart
        label="Drive-end vibration over the last 24 hours, with its anomaly score in a strip underneath on the same time axis"
        series={[{ key: 'vibration', label: 'Drive-end vibration', points: VIBRATION }]}
        yDomain={[4.5, 7.5]}
        yTicks={[4.5, 5.5, 6.5, 7.5]}
        unit="mm/s"
      />
      <ScoreStrip label="Anomaly score, drive-end vibration" scores={SCORES} threshold={DEFAULT_THRESHOLD} formatTime={formatTime} insetLeft={PLOT_INSET.left} insetRight={PLOT_INSET.right} />
    </div>
  );
}

function AnomalyDetectExpectedBand() {
  return (
    <TrendChart
      legend
      label="Drive-end vibration against the range the model expects at this load, 5.1 to 6.0 millimetres per second; the last two hours run above the range and are highlighted"
      series={[{ key: 'vibration', label: 'Measured', points: VIBRATION }]}
      envelopes={[{ key: 'expected', label: 'Expected range', points: EXPECTED, color: 'var(--color-chart-neutral-100)' }]}
      highlight={{ seriesKey: 'vibration', above: EXPECTED_HIGH, tone: 'warning' }}
      yDomain={[4.5, 7.5]}
      yTicks={[4.5, 5.5, 6.5, 7.5]}
      unit="mm/s"
      summary={`Two excursions above the expected range: a 20 minute blip at midnight and the drift that was flagged at ${formatTime(MAIN_REGION.from)}.`}
    />
  );
}

function AnomalyDetectSensitivity() {
  const [sensitivity, setSensitivity] = useState([50]);
  const threshold = sensitivityThreshold(sensitivity[0]);
  const flagged = flaggedScores(SCORES, threshold).length;
  const regions = anomalyRegions(SCORES, threshold, 1);

  return (
    <div className="flex w-full flex-col gap-3">
      <SliderField
        label="Sensitivity"
        value={sensitivity}
        onValueChange={setSensitivity}
        min={0}
        max={100}
        step={10}
        unit="%"
        helperText={`Threshold ${formatValue(threshold, 2)} · ${flagged} of ${SCORES.length} samples flagged in ${regions.length} ${regions.length === 1 ? 'period' : 'periods'}`}
      />
      <TrendChart
        heightClassName="h-44"
        label={`Drive-end vibration with the periods flagged at ${sensitivity[0]} percent sensitivity shaded: ${regions.length} periods`}
        series={[{ key: 'vibration', label: 'Drive-end vibration', points: VIBRATION }]}
        regions={regions.map((region) => ({ from: region.from - STEP / 2, to: region.to + STEP / 2, tone: 'warning' }))}
        yDomain={[4.5, 7.5]}
        yTicks={[4.5, 5.5, 6.5, 7.5]}
        unit="mm/s"
      />
      <ScoreStrip label="Anomaly score, drive-end vibration" scores={SCORES} threshold={threshold} showCaption={false} insetLeft={PLOT_INSET.left} insetRight={PLOT_INSET.right} />
    </div>
  );
}

function AnomalyDetectFlatline() {
  return <AnomalyDetectPattern kind="flatline" title="Flatline" tag="40-TT-40015" text="The value stopped moving at 13:38. Usually a frozen transmitter, not a steady process." />;
}

function AnomalyDetectSpike() {
  return <AnomalyDetectPattern kind="spike" title="Spike" tag="27-IT-20013" text="One sample far from its neighbours at 13:41. Often electrical noise; worth a look if it repeats." />;
}

function AnomalyDetectDrift() {
  return <AnomalyDetectPattern kind="drift" title="Drift" tag="23-TT-91141" text="A slow move away from normal since 13:20. Fouling, wear or a calibration shift." />;
}

function AnomalyDetectList() {
  return (
    <ul aria-label="Anomalies, last 24 hours" className="flex w-full flex-col divide-y divide-default">
      {ANOMALIES.map((anomaly) => (
        <AnomalyRow
          key={anomaly.id}
          anomaly={anomaly}
          threshold={DEFAULT_THRESHOLD}
          started={formatDateTime(anomaly.startedAt)}
          duration={anomalyDetectDuration(anomaly.durationMs)}
          pattern={anomaly.pattern}
          assetName={anomalyDetectAsset(anomaly.assetId)}
        />
      ))}
    </ul>
  );
}

function AnomalyDetectAssetBadges() {
  const counts = ASSETS.filter((asset) => ANOMALIES.some((anomaly) => anomaly.assetId === asset.id)).map((asset) => ({
    asset,
    fresh: ANOMALIES.filter((anomaly) => anomaly.assetId === asset.id && anomaly.status === 'new').length,
    open: ANOMALIES.filter((anomaly) => anomaly.assetId === asset.id && anomaly.status !== 'dismissed').length,
  }));
  return (
    <ul aria-label="Anomalies by asset" className="flex w-full max-w-xs flex-col divide-y divide-default">
      {counts.map(({ asset, fresh, open }) => (
        <li key={asset.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm text-base-foreground">{asset.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
          </div>
          {fresh > 0 ? <Badge variant="warning">{fresh} new</Badge> : open > 0 ? <Badge variant="secondary">{open} in review</Badge> : <span className="text-xs text-muted-foreground">None open</span>}
        </li>
      ))}
    </ul>
  );
}

function AnomalyDetectRowActions() {
  const [statuses, setStatuses] = useState<Record<string, AnomalyStatus>>({});
  const rows = ANOMALIES.slice(0, 3);
  const set = (id: string, status: AnomalyStatus) => setStatuses((current) => ({ ...current, [id]: status }));

  return (
    <ul aria-label="Anomalies to review" className="flex w-full flex-col divide-y divide-default">
      {rows.map((anomaly) => {
        const status = statuses[anomaly.id] ?? anomaly.status;
        return (
          <AnomalyRow
            key={anomaly.id}
            density="compact"
            anomaly={{ ...anomaly, status }}
            threshold={DEFAULT_THRESHOLD}
            started={formatTime(anomaly.startedAt)}
            duration={anomalyDetectDuration(anomaly.durationMs)}
            actions={
              <>
                <IconAction label={`Acknowledge anomaly on ${anomaly.tag}`} disabled={status !== 'new'} onClick={() => set(anomaly.id, 'acknowledged')}>
                  <IconCheck />
                </IconAction>
                <IconAction label={`Dismiss anomaly on ${anomaly.tag}`} disabled={status === 'dismissed'} onClick={() => set(anomaly.id, 'dismissed')}>
                  <IconEyeOff />
                </IconAction>
              </>
            }
          />
        );
      })}
    </ul>
  );
}

function AnomalyDetectFeedback() {
  const [verdict, setVerdict] = useState<'true' | 'false' | null>(null);
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <p className="text-sm font-medium text-base-foreground">Was this a real anomaly?</p>
      <div role="group" aria-label="Feedback on the anomaly" className="flex flex-wrap gap-2">
        <Button variant={verdict === 'true' ? 'default' : 'secondary'} size="sm" aria-pressed={verdict === 'true'} onClick={() => setVerdict('true')}>
          <IconThumbUp aria-hidden="true" />
          True anomaly
        </Button>
        <Button variant={verdict === 'false' ? 'default' : 'secondary'} size="sm" aria-pressed={verdict === 'false'} onClick={() => setVerdict('false')}>
          <IconThumbDown aria-hidden="true" />
          False alarm
        </Button>
      </div>
      <p role="status" className="text-xs text-muted-foreground">
        {verdict === null
          ? 'Your answer is used the next time the model is trained.'
          : verdict === 'true'
            ? 'Marked as a true anomaly. Similar behaviour will be flagged earlier.'
            : 'Marked as a false alarm. Similar behaviour will be scored lower.'}
      </p>
    </div>
  );
}

function AnomalyDetectSimilarEvents() {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-sm font-medium text-base-foreground">Similar past events</p>
      <ul aria-label="Similar past events, most similar first" className="flex flex-col divide-y divide-default">
        {SIMILAR_EVENTS.map((event) => (
          <li key={event.id} className="flex items-start gap-4 py-2.5">
            <span className="w-12 shrink-0 text-sm font-medium tabular-nums text-base-foreground" aria-label={`Similarity ${formatValue(event.similarity * 100)} percent`}>
              {formatValue(event.similarity * 100)} %
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-base-foreground">{event.outcome}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-mono">{event.asset}</span> · <span className="font-mono">{event.order}</span> · {event.lead}
              </p>
            </div>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{event.date}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Two of the three most similar events ended in mechanical work on the drive train.</p>
    </div>
  );
}

function AnomalyDetectSummaryTiles() {
  return (
    <div className="grid w-full grid-cols-2 gap-4 xl:grid-cols-4">
      <KpiTile label="New anomalies" value={2} decimals={0} status={{ tone: 'warning', label: 'Needs review', shape: 'square' }} delta={{ reference: 1, goodDirection: 'down', caption: 'vs yesterday', decimals: 0 }} />
      <KpiTile label="In review" value={2} decimals={0} footnote="Oldest acknowledged 9 h ago" />
      <KpiTile label="Confirmed, last 30 days" value={78} unit="%" decimals={0} delta={{ reference: 71, goodDirection: 'up', caption: 'vs previous 30 days', decimals: 0 }} footnote="18 of 23 reviewed were true anomalies" />
      <KpiTile label="Median time to review" value={14} unit="min" decimals={0} delta={{ reference: 22, goodDirection: 'down', caption: 'vs previous 30 days', decimals: 0 }} />
    </div>
  );
}

function AnomalyDetectMatrix() {
  return (
    <HeatMapGrid
      label="Anomaly score by sensor on the 1st stage compressor in two-hour steps over the last 24 hours; both vibration sensors and the discharge temperature rise in the last six hours"
      rows={MATRIX_ROWS.map((row) => row.tag)}
      columns={MATRIX_COLUMNS}
      values={MATRIX_VALUES}
      domain={[0, 1]}
      decimals={2}
      showValues
      columnLabelEvery={2}
      cellClassName="h-8"
      rowLabelClassName="w-28"
      legend={{ low: '0', high: '1', title: 'Anomaly score' }}
      summary="Three sensors move together from 08:00: drive-end vibration first, then discharge temperature and the non-drive-end. Pressures and speed stay normal."
    />
  );
}

function AnomalyDetectContributors() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <p className="text-sm font-medium text-base-foreground">Contributing sensors</p>
      <ol aria-label="Sensors contributing to the anomaly, largest first" className="flex flex-col gap-3">
        {CONTRIBUTORS.map((sensor) => (
          <li key={sensor.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm text-base-foreground">{sensor.name}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatValue(sensor.share)} %</span>
            </div>
            <div aria-hidden="true" className="h-1.5 w-full overflow-hidden rounded-full bg-chart-neutral-100">
              <div className="h-full rounded-full bg-chart-1-450" style={{ width: `${(sensor.share / CONTRIBUTORS[0].share) * 100}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground">{sensor.tag}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AnomalyDetectEmpty() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconCircleCheck aria-hidden="true" />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No anomalies</EmptyStateTitle>
      <EmptyStateDescription>All 212 monitored tags on Gas compression behaved as expected in the last 24 hours.</EmptyStateDescription>
    </EmptyState>
  );
}

function AnomalyDetectTraining() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <StatusIndicator tone="info" shape="ring" label="Training" detail="started 13:42" />
      <LabelledProgress label="Training the compressor model" value={62} hint="About 6 minutes left. Detection keeps running on model v1.7 until then." />
      <p className="text-xs text-muted-foreground">90 days of data from 14 tags · 23 reviewed anomalies used as labels</p>
    </div>
  );
}

function AnomalyDetectLearning() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <StatusIndicator tone="neutral" shape="ring" label="Learning normal behaviour" detail="day 5 of 14" />
      <LabelledProgress label="History collected" value={5} max={14} valueText="5 of 14 days" hint="Export pump B, 27-PA-2001B. No anomalies are reported for it until 21 March." />
    </div>
  );
}

function AnomalyDetectCompactList() {
  return (
    <ul aria-label="Anomalies on the 1st stage compressor" className="flex w-full flex-col divide-y divide-default">
      {ANOMALIES.slice(0, 4).map((anomaly) => (
        <AnomalyRow key={anomaly.id} density="compact" anomaly={anomaly} threshold={DEFAULT_THRESHOLD} started={formatTime(anomaly.startedAt)} duration={anomalyDetectDuration(anomaly.durationMs)} pattern={anomaly.pattern} />
      ))}
    </ul>
  );
}

function AnomalyDetectCard() {
  const rolling = rollingScores(VIBRATION, 18);
  const peak = Math.max(...rolling.map((point) => point.score));
  return (
    <Card className="w-full" role="group" aria-label="Anomaly on drive-end vibration">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle as="h4">Drive-end vibration is drifting up</CardTitle>
          <CardDescription>
            <span className="font-mono">23-VT-92540</span> · 1st stage compressor · since {formatTime(MAIN_REGION.from)}
          </CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Badge variant="warning">New</Badge>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <div className="flex w-full min-w-0 flex-col gap-4">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="text-muted-foreground">
              Score <span className="font-medium tabular-nums text-base-foreground">{formatValue(MAIN_REGION.peak, 2)}</span>
            </span>
            <span className="text-muted-foreground">
              Duration <span className="font-medium tabular-nums text-base-foreground">{anomalyDetectDuration(NOW - MAIN_REGION.from)}</span>
            </span>
            <span className="text-muted-foreground">
              Against own history <span className="font-medium tabular-nums text-base-foreground">{formatValue(peak, 2)}</span>
            </span>
          </div>
          <TrendChart
            heightClassName="h-36"
            label="Drive-end vibration over the last 24 hours against its expected range, above the range for the last two hours"
            series={[{ key: 'vibration', label: 'Measured', points: VIBRATION }]}
            envelopes={[{ key: 'expected', label: 'Expected range', points: EXPECTED, color: 'var(--color-chart-neutral-100)' }]}
            highlight={{ seriesKey: 'vibration', above: EXPECTED_HIGH, tone: 'warning' }}
            yDomain={[4.5, 7.5]}
            yTicks={[4.5, 6, 7.5]}
            unit="mm/s"
          />
          <ol aria-label="Contributing sensors, largest first" className="flex flex-col gap-1.5">
            {CONTRIBUTORS.slice(0, 3).map((sensor, index) => (
              <li key={sensor.id} className="flex items-baseline gap-3 text-sm">
                <span className="w-4 shrink-0 tabular-nums text-muted-foreground">{index + 1}</span>
                <span className="min-w-0 flex-1 truncate text-base-foreground">{sensor.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{formatValue(sensor.share)} %</span>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            <Button size="sm">Acknowledge anomaly</Button>
            <Button variant="secondary" size="sm">
              Create work order
            </Button>
            <Button variant="ghost" size="sm">
              Mark as false alarm
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnomalyDetectRolling() {
  const points = PATTERN_SERIES.spike;
  const scores = rollingScores(points, 15);
  return (
    <div className="flex w-full flex-col gap-2">
      <TrendChart
        heightClassName="h-44"
        label="Motor current over the last hour with one spike at 13:41, scored against its own previous 15 minutes"
        series={[{ key: 'current', label: 'Motor current', points }]}
        yDomain={[58, 70]}
        yTicks={[58, 62, 66, 70]}
        unit="A"
        maxTicks={5}
      />
      <ScoreStrip label="Anomaly score against own history, motor current" scores={scores} threshold={DEFAULT_THRESHOLD} formatTime={formatTime} insetLeft={PLOT_INSET.left} insetRight={PLOT_INSET.right} />
      <p className="text-xs text-muted-foreground">No model is needed: each sample is compared with the 15 minutes before it. It finds jumps, and misses slow drifts.</p>
    </div>
  );
}

function AnomalyDetectInvestigation() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-3">
      <TrendCard
        className="xl:col-span-2"
        title="Drive-end vibration"
        description="23-VT-92540 · 1st stage compressor · last 24 hours"
        reading={{ value: 6.8, unit: 'mm/s', decimals: 1 }}
        delta={{ reference: 5.6, caption: 'in 2.5 h', goodDirection: 'down' }}
        status={{ tone: 'warning', label: `Anomaly since ${formatTime(MAIN_REGION.from)}`, shape: 'square' }}
        footer={<ScoreStrip label="Anomaly score, drive-end vibration" scores={SCORES} threshold={DEFAULT_THRESHOLD} formatTime={formatTime} insetLeft={PLOT_INSET.left} insetRight={PLOT_INSET.right} />}
        summary={`Flagged since ${formatTime(MAIN_REGION.from)} and now 0.3 mm/s under the high limit. Discharge temperature and the non-drive-end bearing follow the same pattern.`}
      >
        <TrendChart
          heightClassName="h-64"
          legend
          label="Drive-end vibration over the last 24 hours against its expected range and high limit; above the range for the last two hours and approaching the 7.1 limit"
          series={[{ key: 'vibration', label: 'Measured', points: VIBRATION }]}
          envelopes={[{ key: 'expected', label: 'Expected range', points: EXPECTED, color: 'var(--color-chart-neutral-100)' }]}
          highlight={{ seriesKey: 'vibration', above: EXPECTED_HIGH, tone: 'warning' }}
          limits={[{ value: 7.1, label: 'High 7.1', tone: 'warning', align: 'left' }]}
          yDomain={[4.5, 7.5]}
          yTicks={[4.5, 5.5, 6.5, 7.5]}
          maxTicks={8}
          unit="mm/s"
        />
      </TrendCard>
      <Card role="group" aria-label="Why it was flagged">
        <CardHeader>
          <CardHeaderCenter>
            <CardTitle as="h4">Why it was flagged</CardTitle>
            <CardDescription>Compressor model v1.7 · updated 13:55</CardDescription>
          </CardHeaderCenter>
        </CardHeader>
        <CardContent>
          <div className="flex w-full min-w-0 flex-col gap-5">
            <AnomalyDetectContributors />
            <AnomalyDetectFeedback />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default definePage({
  id: 'anomaly-detection',
  title: 'Anomaly detection',
  summary:
    'Behaviour a model finds unusual before any limit is crossed: flagged periods on a trend, the score behind them, lists to review, and the feedback that makes the model better. An anomaly is a question for a person, not an alarm.',
  guidance: {
    use: [
      'Shade and name the flagged period on the trend itself, with the expected range it is judged against.',
      'Show the score and the threshold together, and let people see what a different sensitivity would flag.',
      'Give every anomaly a review state and a way to say "true" or "false alarm".',
      'Rank the contributing sensors so the first look goes to the right instrument.',
    ],
    avoid: [
      'Alarm red for an anomaly; it is a warning to review until someone confirms it.',
      'A score without a threshold, or a flag without the data that caused it.',
      'Reporting anomalies while the model is still learning; say that it is learning.',
      'Dropping dismissed anomalies from the list; mute them so the decision stays visible.',
    ],
  },
  source,
  sections: [
    {
      id: 'on-the-trend',
      title: 'On the trend',
      description: 'The flagged period, the score and the expected range, on the time axis of the measurement.',
      specimens: [
        {
          id: 'AnomalyDetectRegion',
          title: 'Anomalous period shaded',
          note: 'Pick it as the default: the flagged stretch of a trend is shaded and labelled, limits stay visible.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectRegion,
        },
        {
          id: 'AnomalyDetectScoreStrip',
          title: 'Score strip under a trend',
          note: 'Pick it to show how the score built up; cells darken before they cross the threshold.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ScoreStrip.tsx', 'industrial/charts/TrendChart.tsx', 'industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectScoreStrip,
        },
        {
          id: 'AnomalyDetectExpectedBand',
          title: 'Expected range with excursions',
          note: 'Pick it to explain a flag: the measured line is recoloured where it leaves the range the model expects.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx'],
          Component: AnomalyDetectExpectedBand,
        },
        {
          id: 'AnomalyDetectSensitivity',
          title: 'Sensitivity slider',
          note: 'Pick it where engineers tune detection: moving the slider shows at once what would be flagged.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SliderField.tsx', 'industrial/analytics/anomaly.ts', 'industrial/analytics/ScoreStrip.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: AnomalyDetectSensitivity,
        },
      ],
    },
    {
      id: 'patterns',
      title: 'Patterns',
      description: 'The three shapes most anomalies take, each named by the same classifier.',
      specimens: [
        {
          id: 'AnomalyDetectFlatline',
          title: 'Flatline',
          note: 'Pick the flatline label when a signal stops moving; it points at the instrument, not the process.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectFlatline,
        },
        {
          id: 'AnomalyDetectSpike',
          title: 'Spike',
          note: 'Pick the spike label for a single sample far from the rest; it rarely needs more than a note.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectSpike,
        },
        {
          id: 'AnomalyDetectDrift',
          title: 'Drift',
          note: 'Pick the drift label for a slow, sustained move; this is the pattern that predicts failures.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectDrift,
        },
      ],
    },
    {
      id: 'lists-and-review',
      title: 'Lists and review',
      description: 'Anomalies as work to get through: rows, per-asset counts and review actions.',
      specimens: [
        {
          id: 'AnomalyDetectList',
          title: 'Anomaly list',
          note: 'Pick it as the review queue: tag, score, start, duration and review state in aligned columns.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/analytics/AnomalyRow.tsx'],
          Component: AnomalyDetectList,
        },
        {
          id: 'AnomalyDetectAssetBadges',
          title: 'Per-asset anomaly badge',
          note: 'Pick it in an asset list or tree: a count badge only where something is new or in review.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: AnomalyDetectAssetBadges,
        },
        {
          id: 'AnomalyDetectRowActions',
          title: 'Rows with review actions',
          note: 'Pick it when review happens in the list: acknowledge or dismiss without opening the anomaly.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/AnomalyRow.tsx', 'patterns/collections/IconAction.tsx'],
          Component: AnomalyDetectRowActions,
        },
        {
          id: 'AnomalyDetectCompactList',
          title: 'Compact rows',
          note: 'Pick it in a side panel or card, where the start time moves into the tag line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/AnomalyRow.tsx'],
          Component: AnomalyDetectCompactList,
        },
        {
          id: 'AnomalyDetectSimilarEvents',
          title: 'Similar past events',
          note: 'Pick it to give an anomaly a history: what the most similar events turned out to be.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: AnomalyDetectSimilarEvents,
        },
        {
          id: 'AnomalyDetectFeedback',
          title: 'Feedback buttons',
          note: 'Pick it on every anomaly: one tap to confirm or reject, and a line saying what the answer changes.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: AnomalyDetectFeedback,
        },
      ],
    },
    {
      id: 'summaries',
      title: 'Summaries and context',
      description: 'How much there is to review, where it sits and what happened last time.',
      specimens: [
        {
          id: 'AnomalyDetectSummaryTiles',
          title: 'Anomaly summary tiles',
          note: 'Pick it at the top of a monitoring page: what is new, what is in review, and how well detection performs.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/KpiTile.tsx'],
          Component: AnomalyDetectSummaryTiles,
        },
        {
          id: 'AnomalyDetectMatrix',
          title: 'Multi-sensor anomaly matrix',
          note: 'Pick it to see which sensors moved together and in what order; darker cells are higher scores.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['industrial/charts/HeatMapGrid.tsx'],
          Component: AnomalyDetectMatrix,
        },
        {
          id: 'AnomalyDetectContributors',
          title: 'Contributing sensors',
          note: 'Pick it for anomalies found across several sensors: the ranking says where to look first.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectContributors,
        },
        {
          id: 'AnomalyDetectTraining',
          title: 'Model training status',
          note: 'Pick it while a model retrains: progress, what it trains on and that detection keeps running.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx', 'industrial/StatusIndicator.tsx'],
          Component: AnomalyDetectTraining,
        },
        {
          id: 'AnomalyDetectEmpty',
          title: 'No anomalies',
          note: 'Pick it when nothing is flagged; say how much was checked and over what period.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: AnomalyDetectEmpty,
        },
        {
          id: 'AnomalyDetectLearning',
          title: 'Learning period',
          note: 'Pick it for new or changed equipment: no anomalies are reported until the model knows what normal is.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx', 'industrial/StatusIndicator.tsx'],
          Component: AnomalyDetectLearning,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Anomaly card and investigation',
      description: 'One anomaly with its evidence, and the full block an engineer works in.',
      specimens: [
        {
          id: 'AnomalyDetectCard',
          title: 'Anomaly card',
          note: 'Pick it in a feed or inbox: what was found, the evidence, the top contributors and the next actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/charts/TrendChart.tsx', 'industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectCard,
        },
        {
          id: 'AnomalyDetectRolling',
          title: 'Score against own history',
          note: 'Pick it for sensors without a model: the score compares each sample with the hours before it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/analytics/ScoreStrip.tsx', 'industrial/analytics/anomaly.ts', 'industrial/charts/TrendChart.tsx'],
          Component: AnomalyDetectRolling,
        },
        {
          id: 'AnomalyDetectInvestigation',
          title: 'Investigation block',
          note: 'Pick it as the main block of an anomaly page: trend, score, contributors and feedback together.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['industrial/charts/TrendCard.tsx', 'industrial/charts/TrendChart.tsx', 'industrial/analytics/ScoreStrip.tsx', 'industrial/analytics/anomaly.ts'],
          Component: AnomalyDetectInvestigation,
        },
      ],
    },
  ],
});
