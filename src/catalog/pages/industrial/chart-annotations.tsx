import { IconAlertOctagon, IconAlertTriangle, IconBell, IconCircleCheck, IconFlag, IconInbox, IconTool } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { AnnotatedTrend, type EventMark, type RegionMark } from '../../../library/kit/chart-annotations/AnnotatedTrend';
import { findCrossings, findExtremes, summarizeRange } from '../../../library/kit/chart-annotations/annotations';
import { EventBadge } from '../../../library/kit/chart-annotations/EventBadge';
import { FilterPills } from '../../../library/kit/dashboard-blocks/FilterPills';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { Grid } from '../../../library/kit/Grid';
import { HeatStrip } from '../../../library/kit/HeatStrip';
import { IconChip } from '../../../library/kit/IconChip';
import { Legend } from '../../../library/kit/Legend';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber } from '../../../library/kit/tones';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { MINUTE, formatTime, makeSeries, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './chart-annotations.tsx?raw';

const CA_POINTS = 49;

const CA_LAST = CA_POINTS - 1;

const CA_LABELS = makeSeries({ seed: 1, points: CA_POINTS, base: 0, stepMs: 30 * MINUTE }).map((point) => formatTime(point.t));

const CA_PRESSURE = makeValues({ seed: 11, points: CA_POINTS, base: 48.2, amplitude: 1.4, noise: 0.4, cycles: 2 });

const CA_INTERSTAGE = makeValues({ seed: 18, points: CA_POINTS, base: 44.6, amplitude: 0.9, noise: 0.3, cycles: 2 });

const CA_TEMPERATURE = [...makeValues({ seed: 13, points: CA_POINTS - 4, base: 137, amplitude: 2.5, noise: 0.8, drift: 4, cycles: 2 }), 143.6, 144.8, 145.7, 146.3];

const CA_CROSSING = findCrossings(CA_TEMPERATURE, 145)[0]?.index ?? CA_LAST;

const CA_VIBRATION = makeValues({ seed: 14, points: CA_POINTS, base: 5.4, amplitude: 0.3, noise: 0.12, cycles: 3 }).map((value, index) =>
  index >= 30 && index <= 34 ? Math.round((value + [0.9, 1.7, 2.3, 1.6, 0.7][index - 30]) * 10) / 10 : value
);

const CA_VIBRATION_PEAK = findExtremes(CA_VIBRATION);

const CA_STOPS: RegionMark[] = [
  { id: 'planned', from: 12, to: 20, label: 'Planned stop', tone: 'info' },
  { id: 'trip', from: 41, to: 44, label: 'Trip', tone: 'critical' },
];

const CA_FLOW = makeValues({ seed: 16, points: CA_POINTS, base: 182, amplitude: 10, noise: 3, cycles: 2, decimals: 0 }).map((value, index) =>
  CA_STOPS.some((stop) => index > stop.from && index < stop.to) ? 0 : value
);

const CA_NOW = 32;

const CA_EXPORT_FLOW = makeValues({ seed: 20, points: CA_POINTS, base: 412, amplitude: 16, noise: 5, cycles: 1.5, decimals: 0 }).map((value, index) =>
  index > CA_NOW ? Math.round(412 + (index - CA_NOW) * 1.8) : value
);

const CA_COOLER = makeValues({ seed: 19, points: CA_POINTS, base: 37.5, amplitude: 1.2, noise: 0.35, cycles: 2 });

const CA_WEEKS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

const CA_OEE = [80.1, 80.9, 81.4, 80.7, 82.2, 82.9, 83.4, 82.6, 83.8, 84.1, 81.9, 82.7];

type CaEvent = EventMark & { kind: 'Alarm' | 'Work order' | 'Operator'; detail: string };

const CA_EVENTS: CaEvent[] = [
  { id: 'e1', at: 14, mark: '1', kind: 'Alarm', title: 'Cooler outlet temperature high', detail: '23-TT-91141 reached 40.8 °C', tone: 'info' },
  { id: 'e2', at: 26, mark: '2', kind: 'Operator', title: 'Anti-surge valve opened 5 %', detail: 'Ingrid Haugen, control room', tone: 'purple' },
  { id: 'e3', at: 38, mark: '3', kind: 'Work order', title: 'Vibration survey started', detail: 'WO-104466, 1st stage compressor', tone: 'teal' },
  { id: 'e4', at: CA_CROSSING, mark: '4', kind: 'Alarm', title: 'Discharge temperature high', detail: '146.3 °C against a limit of 145.0 °C', tone: 'warning' },
];

const CA_MANY: EventMark[] = [2, 4, 5, 9, 10, 11, 17, 18, 25, 26, 27, 33, 34, 35, 36, 40, 43, 44, 46].map((at) => ({ id: `m${at}`, at, mark: '', title: 'Alarm', tone: 'warning' }));

const CA_LAYERS = [
  { id: 'limits', label: 'Limits' },
  { id: 'events', label: 'Events' },
  { id: 'periods', label: 'Periods' },
  { id: 'notes', label: 'Notes' },
];

const CA_TEMPERATURE_SERIES = [{ id: 'temperature', label: 'Discharge temperature', values: CA_TEMPERATURE }];

const CA_PRESSURE_PAIR = [
  { id: 'discharge', label: 'Discharge pressure', values: CA_PRESSURE },
  { id: 'interstage', label: 'Interstage pressure', values: CA_INTERSTAGE, tone: 'teal' as const },
];

const CA_TEMPERATURE_LIMITS = [
  { value: 145, label: 'High', tone: 'warning' as const },
  { value: 155, label: 'Trip', tone: 'critical' as const },
];

const CA_KIND_ICON: Record<CaEvent['kind'], ReactNode> = { Alarm: <IconBell />, 'Work order': <IconTool />, Operator: <IconFlag /> };

function CaSheet({ look, children }: { look: LookId; children: ReactNode }) {
  return (
    <LookScope look={look}>
      <Canvas>{children}</Canvas>
    </LookScope>
  );
}

function CaEventRows({ events, selectedId, onSelect }: { events: readonly CaEvent[]; selectedId?: string; onSelect?: (id: string) => void }) {
  return (
    <ul>
      {events.map((event) => (
        <ListRow
          key={event.id}
          tone={event.id === selectedId ? event.tone : 'neutral'}
          leading={
            onSelect ? (
              <button type="button" aria-label={`Show event ${event.mark} on the chart`} aria-pressed={event.id === selectedId} onClick={() => onSelect(event.id)} className="cursor-pointer">
                <EventBadge tone={event.tone} selected={event.id === selectedId}>
                  {event.mark}
                </EventBadge>
              </button>
            ) : (
              <EventBadge tone={event.tone}>{event.mark}</EventBadge>
            )
          }
          title={event.title}
          meta={
            <>
              <StatusPill tone={event.tone} icon={CA_KIND_ICON[event.kind]}>
                {event.kind}
              </StatusPill>
              <span>{event.detail}</span>
            </>
          }
          trailing={CA_LABELS[event.at]}
        />
      ))}
    </ul>
  );
}

function ChartAnnotationLimits() {
  return (
    <CaSheet look="studio">
      <Panel title="Discharge temperature" subtitle="23-TT-92532 · last 24 hours against the high and trip limits" icon={<IconChip tone="warning"><IconAlertTriangle /></IconChip>}>
        <AnnotatedTrend
          label="Discharge temperature over the last 24 hours with the high limit at 145 and the trip limit at 155 degrees"
          series={CA_TEMPERATURE_SERIES}
          labels={CA_LABELS}
          tickEvery={8}
          unit="°C"
          fill
          yDomain={[130, 158]}
          limits={CA_TEMPERATURE_LIMITS}
          keyItems={[
            { label: 'High limit', tone: 'warning', mark: 'dashed' },
            { label: 'Trip limit', tone: 'critical', mark: 'dashed' },
          ]}
          headline={<Stat variant="plain" label="Now" value={146.3} decimals={1} unit="°C" tone="warning" target="1.3 °C above the high limit" />}
        />
      </Panel>
    </CaSheet>
  );
}

function ChartAnnotationTarget() {
  return (
    <CaSheet look="soft">
      <Grid>
        <Stat className="col-span-4" size="lg" label="OEE this week" value={82.7} decimals={1} unit="%" tone="teal" delta={{ value: 0.8, caption: 'vs last week' }} target="Target 85.0 %" />
        <Panel className="col-span-8" title="OEE by week" subtitle="Twelve weeks against the 85 % target">
          <AnnotatedTrend
            label="Overall equipment effectiveness per week for twelve weeks against the 85 percent target"
            series={[{ id: 'oee', label: 'OEE', values: CA_OEE, tone: 'teal' }]}
            labels={CA_WEEKS}
            tickEvery={1}
            unit="%"
            fill
            height={220}
            yDomain={[78, 87]}
            limits={[{ value: 85, label: 'Target', tone: 'success', solid: true }]}
            points={[{ id: 'best', at: 9, text: 'Best week 84.1', tone: 'teal' }]}
          />
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationForecast() {
  return (
    <CaSheet look="glass">
      <Panel title="Export flow" subtitle="27-FT-20011 · measured to now, forecast for the next eight hours">
        <AnnotatedTrend
          label="Export flow measured until now and forecast for the next eight hours"
          series={[{ id: 'flow', label: 'Export flow', values: CA_EXPORT_FLOW, dashedFrom: CA_NOW }]}
          labels={CA_LABELS}
          tickEvery={8}
          unit="m³/h"
          decimals={0}
          fill
          nowAt={CA_NOW}
          yDomain={[380, 460]}
          regions={[{ id: 'forecast', from: CA_NOW, to: CA_LAST, label: 'Forecast', tone: 'purple' }]}
          limits={[{ value: 450, label: 'Pump capacity', tone: 'warning' }]}
          keyItems={[
            { label: 'Measured', tone: 'accent', mark: 'line' },
            { label: 'Forecast', tone: 'accent', mark: 'dashed' },
          ]}
        />
      </Panel>
    </CaSheet>
  );
}

function ChartAnnotationEvents() {
  const [selectedId, setSelectedId] = useState('e4');
  return (
    <CaSheet look="studio">
      <Grid>
        <Panel className="col-span-7" title="Discharge temperature" subtitle="Select a marker or a row to link the two">
          <AnnotatedTrend
            label="Discharge temperature over the last 24 hours with four numbered events"
            series={CA_TEMPERATURE_SERIES}
            labels={CA_LABELS}
            tickEvery={8}
            unit="°C"
            fill
            height={300}
            yDomain={[130, 150]}
            limits={[CA_TEMPERATURE_LIMITS[0]]}
            events={CA_EVENTS}
            selectedEventId={selectedId}
            onSelectEvent={setSelectedId}
          />
        </Panel>
        <Panel className="col-span-5" title="Events" subtitle={`${CA_EVENTS.length} in the last 24 hours`}>
          <CaEventRows events={CA_EVENTS} selectedId={selectedId} onSelect={setSelectedId} />
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationWindow() {
  return (
    <CaSheet look="blueprint">
      <Panel title="Cooler outlet temperature" subtitle="23-TT-91141 · °C · maintenance window hatched">
        <AnnotatedTrend
          label="Cooler outlet temperature over the last 24 hours with the tube bundle cleaning window from 06:00 to 10:00"
          series={[{ id: 'cooler', label: 'Cooler outlet temperature', values: CA_COOLER }]}
          labels={CA_LABELS}
          tickEvery={4}
          unit="°C"
          height={280}
          yDomain={[34, 42]}
          limits={[{ value: 40, label: 'High', tone: 'warning' }]}
          regions={[{ id: 'wo', from: 32, to: 40, label: 'WO-104471 · tube bundle cleaning', tone: 'amber', hatched: true }]}
          points={[{ id: 'after', at: 44, text: 'After cleaning 36.9', placement: 'below' }]}
        />
      </Panel>
    </CaSheet>
  );
}

function ChartAnnotationStops() {
  return (
    <CaSheet look="console">
      <Panel title="Gas flow · 23-FT-92510" subtitle="kSm³/h · 24 h" actions={<Legend items={[{ label: 'Planned stop', tone: 'info' }, { label: 'Trip', tone: 'critical' }]} />}>
        <AnnotatedTrend
          label="Gas flow over the last 24 hours with a planned stop and a trip shaded"
          series={[{ id: 'flow', label: 'Gas flow', values: CA_FLOW }]}
          labels={CA_LABELS}
          tickEvery={4}
          unit="kSm³/h"
          decimals={0}
          height={260}
          yDomain={[0, 220]}
          regions={CA_STOPS}
        />
      </Panel>
    </CaSheet>
  );
}

function ChartAnnotationCrowded() {
  return (
    <CaSheet look="editorial">
      <Grid>
        <SectionHeader className="col-span-12" size="sm" eyebrow="Alarm review" title="Nineteen alarms in a day cluster around the two load changes" />
        <div className="col-span-12 flex flex-col gap-4">
          <AnnotatedTrend
            label="Discharge pressure over the last 24 hours with nineteen alarm ticks along the top"
            series={[{ id: 'pressure', label: 'Discharge pressure', values: CA_PRESSURE }]}
            labels={CA_LABELS}
            tickEvery={8}
            unit="barg"
            height={220}
            events={CA_MANY}
            eventStyle="tick"
          />
          <HeatStrip
            label="Alarms per two hours over the last 24 hours"
            rows={[{ label: 'Alarms per 2 h', values: Array.from({ length: 12 }, (_, slot) => CA_MANY.filter((event) => Math.floor(event.at / 4) === slot).length), tone: 'warning' }]}
            axis={['24 h ago', 'Now']}
          />
        </div>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationCrossing() {
  return (
    <CaSheet look="signal">
      <Grid>
        <Stat className="col-span-4" size="lg" label="Discharge temperature" value={146.3} decimals={1} unit="°C" tone="warning" state="Above high" stateIcon={<IconAlertTriangle />} target={`Crossed 145.0 at ${CA_LABELS[CA_CROSSING]}`} />
        <Panel className="col-span-8" title="Last 24 hours">
          <AnnotatedTrend
            label="Discharge temperature over the last 24 hours with the point where it crossed the high limit"
            series={[{ id: 'temperature', label: 'Discharge temperature', values: CA_TEMPERATURE, tone: 'warning' }]}
            labels={CA_LABELS}
            tickEvery={8}
            unit="°C"
            fill
            height={230}
            yDomain={[130, 150]}
            limits={[CA_TEMPERATURE_LIMITS[0]]}
            points={[{ id: 'cross', at: CA_CROSSING, text: `Crossed at ${CA_LABELS[CA_CROSSING]}`, tone: 'critical', placement: 'below' }]}
          />
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationAnomaly() {
  return (
    <CaSheet look="glass">
      <Panel
        title="Drive-end vibration"
        subtitle="23-VT-92540 · anomaly detected against the learned band"
        actions={
          <StatusPill tone="warning" icon={<IconAlertTriangle />}>
            1 anomaly
          </StatusPill>
        }
      >
        <AnnotatedTrend
          label="Drive-end vibration over the last 24 hours with an anomaly between 15:00 and 17:00"
          series={[{ id: 'vibration', label: 'Vibration', values: CA_VIBRATION }]}
          labels={CA_LABELS}
          tickEvery={8}
          unit="mm/s"
          fill
          yDomain={[4, 9]}
          limits={[{ value: 7.1, label: 'High', tone: 'warning' }]}
          regions={[{ id: 'anomaly', from: 29, to: 35, label: 'Anomaly · score 0.91', tone: 'pink' }]}
          points={CA_VIBRATION_PEAK ? [{ id: 'peak', at: CA_VIBRATION_PEAK.maxIndex, text: `Peak ${formatNumber(CA_VIBRATION_PEAK.max, 1)} mm/s`, tone: 'pink' }] : []}
        />
      </Panel>
    </CaSheet>
  );
}

function ChartAnnotationMinMax() {
  const extremes = findExtremes(CA_PRESSURE);
  return (
    <CaSheet look="poster">
      <Grid>
        <Panel className="col-span-8" title="Discharge pressure" subtitle="Highest and lowest of the day">
          <AnnotatedTrend
            label="Discharge pressure over the last 24 hours with its minimum and maximum marked"
            series={[{ id: 'pressure', label: 'Discharge pressure', values: CA_PRESSURE }]}
            labels={CA_LABELS}
            tickEvery={8}
            unit="barg"
            height={260}
            yDomain={[44, 53]}
            points={
              extremes
                ? [
                    { id: 'max', at: extremes.maxIndex, text: `Max ${formatNumber(extremes.max, 1)}`, tone: 'pink' },
                    { id: 'min', at: extremes.minIndex, text: `Min ${formatNumber(extremes.min, 1)}`, tone: 'blue', placement: 'below' },
                  ]
                : []
            }
          />
        </Panel>
        <Grid stack className="col-span-4">
          <Stat label="Maximum" value={extremes?.max ?? 0} decimals={1} unit="barg" tone="pink" target={`at ${CA_LABELS[extremes?.maxIndex ?? 0]}`} />
          <Stat label="Minimum" value={extremes?.min ?? 0} decimals={1} unit="barg" tone="blue" target={`at ${CA_LABELS[extremes?.minIndex ?? 0]}`} />
        </Grid>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationPointNote() {
  return (
    <CaSheet look="editorial">
      <Grid>
        <div className="col-span-8">
          <AnnotatedTrend
            label="Discharge pressure over the last 24 hours with an operator note at 03:00"
            series={[{ id: 'pressure', label: 'Discharge pressure', values: CA_PRESSURE }]}
            labels={CA_LABELS}
            tickEvery={8}
            unit="barg"
            height={260}
            yDomain={[44, 53]}
            events={[CA_EVENTS[1]]}
            points={[{ id: 'note', at: 26, text: 'Anti-surge valve opened 5 %' }]}
          />
        </div>
        <div className="col-span-4 flex flex-col gap-3 border-t border-(--kit-rule-strong) pt-4">
          <div className="flex items-center gap-2">
            <EventBadge>2</EventBadge>
            <p className="text-base font-semibold">Operator note, {CA_LABELS[26]}</p>
          </div>
          <p className="text-sm leading-6 text-(--kit-text-2)">
            Suction pressure was drifting towards the surge line after the load change. Opening the anti-surge valve 5 % restored the margin; discharge pressure settled within twenty minutes.
          </p>
          <p className="text-sm font-medium">Ingrid Haugen, control room operator</p>
        </div>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationCursor() {
  const [cursor, setCursor] = useState<number | null>(null);
  const at = cursor ?? CA_LAST;
  return (
    <CaSheet look="studio">
      <Grid>
        <Panel className="col-span-8" title="Compression pressures" subtitle="Move the pointer over the chart">
          <AnnotatedTrend
            label="Discharge and interstage pressure over the last 24 hours with a cursor that reads both"
            series={CA_PRESSURE_PAIR}
            labels={CA_LABELS}
            tickEvery={8}
            unit="barg"
            height={280}
            yDomain={[42, 52]}
            cursor={cursor}
            onCursor={setCursor}
          />
        </Panel>
        <Panel className="col-span-4" title={cursor === null ? 'Latest values' : `Values at ${CA_LABELS[at]}`} subtitle={cursor === null ? CA_LABELS[CA_LAST] : 'Under the cursor'}>
          <div className="flex h-full flex-col justify-between gap-4">
            <Stat variant="plain" size="lg" label="Discharge pressure" value={CA_PRESSURE[at]} decimals={1} unit="barg" tone="accent" target="23-PT-92531" />
            <Stat variant="plain" size="lg" label="Interstage pressure" value={CA_INTERSTAGE[at]} decimals={1} unit="barg" tone="teal" target="23-PT-92518" />
            <Stat variant="plain" label="Difference" value={CA_PRESSURE[at] - CA_INTERSTAGE[at]} decimals={1} unit="bar" />
          </div>
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationBrush() {
  const [range, setRange] = useState({ from: 28, to: 38 });
  const summary = summarizeRange(CA_VIBRATION, range.from, range.to);
  return (
    <CaSheet look="blueprint">
      <Grid>
        <Panel className="col-span-12" title="Drive-end vibration" subtitle="Drag across the plot to select a period">
          <AnnotatedTrend
            label="Drive-end vibration over the last 24 hours with a selected period"
            series={[{ id: 'vibration', label: 'Vibration', values: CA_VIBRATION }]}
            labels={CA_LABELS}
            tickEvery={4}
            unit="mm/s"
            height={240}
            yDomain={[4, 9]}
            selection={range}
            onSelection={setRange}
          />
        </Panel>
        <Stat className="col-span-3" label="Selected" value={`${CA_LABELS[range.from]}–${CA_LABELS[range.to]}`} target={`${(range.to - range.from) / 2} h`} />
        <Stat className="col-span-3" label="Mean" value={summary?.mean ?? 0} decimals={2} unit="mm/s" />
        <Stat className="col-span-3" label="Maximum" value={summary?.max ?? 0} decimals={1} unit="mm/s" />
        <Stat className="col-span-3" label="Change" value={summary?.change ?? 0} decimals={1} unit="mm/s" />
      </Grid>
    </CaSheet>
  );
}

type CaCompareRow = { id: string; label: string; a: number; b: number; unit: string };

const CA_COMPARE_COLUMNS: DataTableColumn<CaCompareRow>[] = [
  { id: 'signal', header: 'Signal', cell: (row) => row.label },
  { id: 'a', header: 'A', numeric: true, cell: (row) => formatNumber(row.a, 1) },
  { id: 'b', header: 'B', numeric: true, cell: (row) => formatNumber(row.b, 1) },
  { id: 'diff', header: 'B − A', numeric: true, cell: (row) => `${row.b - row.a >= 0 ? '+' : '−'}${formatNumber(Math.abs(row.b - row.a), 1)} ${row.unit}` },
];

function ChartAnnotationCompare() {
  const [pinB, setPinB] = useState(40);
  const pinA = 16;
  const rows: CaCompareRow[] = [
    { id: 'discharge', label: 'Discharge pressure', a: CA_PRESSURE[pinA], b: CA_PRESSURE[pinB], unit: 'bar' },
    { id: 'interstage', label: 'Interstage pressure', a: CA_INTERSTAGE[pinA], b: CA_INTERSTAGE[pinB], unit: 'bar' },
  ];
  return (
    <CaSheet look="console">
      <Grid>
        <Panel className="col-span-8" title="Compression pressures" subtitle="Cursor B follows the pointer">
          <AnnotatedTrend
            label="Discharge and interstage pressure with two cursors, A and B"
            series={CA_PRESSURE_PAIR}
            labels={CA_LABELS}
            tickEvery={4}
            unit="barg"
            height={260}
            yDomain={[42, 52]}
            pins={[
              { at: pinA, label: 'A', tone: 'amber' },
              { at: pinB, label: 'B', tone: 'pink' },
            ]}
            onCursor={(index) => (index === null ? undefined : setPinB(index))}
          />
        </Panel>
        <Panel className="col-span-4" title={`A ${CA_LABELS[pinA]} · B ${CA_LABELS[pinB]}`} subtitle={`${Math.abs(pinB - pinA) / 2} h apart`} padding="none">
          <DataTable label="Values at cursor A and cursor B" flush columns={CA_COMPARE_COLUMNS} rows={rows} rowKey={(row) => row.id} />
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationLayers() {
  const [layers, setLayers] = useState<readonly string[]>(['limits', 'events', 'periods']);
  const on = (id: string) => layers.includes(id);
  return (
    <CaSheet look="soft">
      <Panel
        title="Discharge temperature"
        subtitle="Switch annotation layers on and off"
        actions={<FilterPills label="Annotation layers" items={CA_LAYERS} selected={layers} onToggle={(id) => setLayers((current) => (current.includes(id) ? current.filter((layer) => layer !== id) : [...current, id]))} />}
      >
        <AnnotatedTrend
          label="Discharge temperature over the last 24 hours with switchable annotation layers"
          series={CA_TEMPERATURE_SERIES}
          labels={CA_LABELS}
          tickEvery={8}
          unit="°C"
          fill
          height={280}
          yDomain={[130, 150]}
          limits={on('limits') ? [CA_TEMPERATURE_LIMITS[0]] : []}
          events={on('events') ? CA_EVENTS : []}
          regions={on('periods') ? [{ id: 'survey', from: 38, to: 42, label: 'Vibration survey', tone: 'teal' }] : []}
          points={on('notes') ? [{ id: 'note', at: 26, text: 'Anti-surge valve opened', tone: 'purple', placement: 'below' }] : []}
        />
      </Panel>
    </CaSheet>
  );
}

function ChartAnnotationKey() {
  return (
    <CaSheet look="studio">
      <Grid>
        <Panel className="col-span-6" title="Lines and fills" subtitle="What each stroke on the plot means">
          <Legend
            direction="column"
            items={[
              { label: 'Measured value', tone: 'accent', mark: 'line', value: 'solid line' },
              { label: 'Forecast or plan', tone: 'accent', mark: 'dashed', value: 'dashed line' },
              { label: 'High limit', tone: 'warning', mark: 'dashed', value: 'labelled on the line' },
              { label: 'Trip limit', tone: 'critical', mark: 'dashed', value: 'labelled on the line' },
              { label: 'Planned stop', tone: 'info', mark: 'swatch', value: 'shaded period' },
              { label: 'Anomaly', tone: 'pink', mark: 'swatch', value: 'shaded period' },
            ]}
          />
        </Panel>
        <Panel className="col-span-6" title="Event markers" subtitle="A number on the chart, the same number in the list">
          <ul>
            <ListRow leading={<EventBadge tone="warning">1</EventBadge>} title="Alarm" meta="Raised by the control system" />
            <ListRow leading={<EventBadge tone="teal">2</EventBadge>} title="Work order" meta="Started, paused or finished on the asset" />
            <ListRow leading={<EventBadge tone="purple">3</EventBadge>} title="Operator action" meta="Logged by the control room" />
            <ListRow leading={<EventBadge tone="accent" selected>4</EventBadge>} title="Selected event" meta="Outlined on the chart and in the list" />
          </ul>
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationNoEvents() {
  return (
    <CaSheet look="studio">
      <Grid>
        <Panel className="col-span-7" title="Interstage pressure" subtitle="23-PT-92518 · last 24 hours">
          <AnnotatedTrend label="Interstage pressure over the last 24 hours, with no events" series={[{ id: 'interstage', label: 'Interstage pressure', values: CA_INTERSTAGE, tone: 'teal' }]} labels={CA_LABELS} tickEvery={8} unit="barg" fill height={240} />
        </Panel>
        <Panel className="col-span-5" title="Events" subtitle="Last 24 hours">
          <EmptyPanel icon={<IconInbox />} title="No events in this period" description="Alarms, work orders and operator notes on 23-PT-92518 appear here and as numbered markers on the chart." />
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationInvestigation() {
  const [selectedId, setSelectedId] = useState('e4');
  const selected = CA_EVENTS.find((event) => event.id === selectedId);
  return (
    <CaSheet look="studio">
      <Grid>
        <SectionHeader
          className="col-span-12"
          eyebrow="1st stage compressor · 23-KA-9101"
          title="Discharge temperature investigation"
          description="Thursday 12 March · last 24 hours"
          actions={
            <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
              Above high limit
            </StatusPill>
          }
        />
        <Stat className="col-span-3" label="Now" value={146.3} decimals={1} unit="°C" tone="warning" icon={<IconAlertTriangle />} target="High 145.0" />
        <Stat className="col-span-3" label="Margin to trip" value={8.7} decimals={1} unit="°C" tone="critical" icon={<IconAlertOctagon />} target="Trip 155.0" />
        <Stat className="col-span-3" label="Rise in 2 hours" value={4.9} decimals={1} unit="°C" tone="amber" icon={<IconFlag />} target="2.5 °C per hour" />
        <Stat className="col-span-3" label="Cooler after cleaning" value={36.9} decimals={1} unit="°C" tone="success" icon={<IconCircleCheck />} target="High 40.0" />
        <Panel className="col-span-8" title="Discharge temperature" subtitle={selected ? `Event ${selected.mark}: ${selected.title}` : 'Select an event'}>
          <AnnotatedTrend
            label="Discharge temperature over the last 24 hours with limits, events, a maintenance window and the limit crossing"
            series={CA_TEMPERATURE_SERIES}
            labels={CA_LABELS}
            tickEvery={8}
            unit="°C"
            fill
            height={320}
            yDomain={[130, 158]}
            limits={CA_TEMPERATURE_LIMITS}
            regions={[{ id: 'wo', from: 32, to: 37, label: 'Cooler cleaning', tone: 'teal' }]}
            events={CA_EVENTS}
            selectedEventId={selectedId}
            onSelectEvent={setSelectedId}
            keyItems={[
              { label: 'High', tone: 'warning', mark: 'dashed' },
              { label: 'Trip', tone: 'critical', mark: 'dashed' },
              { label: 'Maintenance', tone: 'teal' },
            ]}
          />
        </Panel>
        <Panel className="col-span-4" title="Timeline" subtitle="Alarms, actions and work">
          <CaEventRows events={CA_EVENTS} selectedId={selectedId} onSelect={setSelectedId} />
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationOperatorTrend() {
  const [cursor, setCursor] = useState<number | null>(null);
  const at = cursor ?? CA_LAST;
  return (
    <CaSheet look="console">
      <Grid>
        <Panel className="col-span-12" title="Trend 4 · Gas flow and stops" subtitle={`Cursor ${CA_LABELS[at]}`} padding="none">
          <StatGroup columns={4} joined label="Values at the cursor">
            <Stat variant="plain" size="sm" label="Gas flow" value={CA_FLOW[at]} unit="kSm³/h" tone={CA_FLOW[at] === 0 ? 'critical' : 'accent'} />
            <Stat variant="plain" size="sm" label="Discharge pressure" value={CA_PRESSURE[at]} decimals={1} unit="barg" />
            <Stat variant="plain" size="sm" label="Discharge temperature" value={CA_TEMPERATURE[at]} decimals={1} unit="°C" tone={CA_TEMPERATURE[at] > 145 ? 'warning' : 'neutral'} />
            <Stat variant="plain" size="sm" label="Vibration" value={CA_VIBRATION[at]} decimals={1} unit="mm/s" />
          </StatGroup>
        </Panel>
        <Panel className="col-span-12" title="23-FT-92510" subtitle="kSm³/h · planned stop and trip shaded">
          <AnnotatedTrend
            label="Gas flow with a planned stop and a trip, read with a cursor"
            series={[{ id: 'flow', label: 'Gas flow', values: CA_FLOW }]}
            labels={CA_LABELS}
            tickEvery={4}
            unit="kSm³/h"
            decimals={0}
            height={240}
            yDomain={[0, 220]}
            regions={CA_STOPS}
            events={[{ id: 'restart', at: 44, mark: 'R', title: 'Restart', tone: 'success' }]}
            cursor={cursor}
            onCursor={setCursor}
          />
        </Panel>
      </Grid>
    </CaSheet>
  );
}

function ChartAnnotationReportFigure() {
  return (
    <CaSheet look="editorial">
      <Grid>
        <SectionHeader className="col-span-12" eyebrow="Figure 3" title="Vibration rose for two hours before the survey, then returned to its band" />
        <div className="col-span-8">
          <AnnotatedTrend
            label="Drive-end vibration over the last 24 hours with the anomaly, the survey and the high limit"
            series={[{ id: 'vibration', label: 'Vibration', values: CA_VIBRATION }]}
            labels={CA_LABELS}
            tickEvery={8}
            unit="mm/s"
            height={300}
            yDomain={[4, 9]}
            limits={[{ value: 7.1, label: 'High', tone: 'warning' }]}
            regions={[{ id: 'anomaly', from: 29, to: 35, label: 'Anomaly', tone: 'warning' }]}
            events={[
              { id: 'a', at: 26, mark: '1', title: 'Anti-surge valve opened' },
              { id: 'b', at: 38, mark: '2', title: 'Vibration survey started' },
            ]}
          />
        </div>
        <ol className="col-span-4 flex flex-col gap-4 border-t border-(--kit-rule-strong) pt-4 text-sm leading-6">
          <li className="flex gap-3">
            <EventBadge>1</EventBadge>
            <span>
              <strong>{CA_LABELS[26]}.</strong> The anti-surge valve was opened 5 % after a load change.
            </span>
          </li>
          <li className="flex gap-3">
            <EventBadge>2</EventBadge>
            <span>
              <strong>{CA_LABELS[38]}.</strong> The survey under <TagId>WO-104466</TagId> found a loose guard on the drive end.
            </span>
          </li>
          <li className="text-(--kit-text-2)">The peak of {formatNumber(CA_VIBRATION_PEAK?.max ?? 0, 1)} mm/s stayed below the trip limit of 11.0 mm/s.</li>
        </ol>
      </Grid>
    </CaSheet>
  );
}

export default definePage({
  id: 'chart-annotations',
  title: 'Chart annotations',
  summary:
    'What turns a trend into an explanation: labelled limits, shaded periods, numbered events, notes on single points, a now line, cursors and selections — in eight looks and three finished compositions.',
  guidance: {
    use: [
      'Label a limit on the line itself with its name and value, and keep the same colour for it everywhere.',
      'Number events and repeat the number in a list beside the chart; do not write sentences on the plot.',
      'Shade a period when the state of the asset explains the trend: a stop, a trip, maintenance.',
      'Give a cursor a readout with units; give a selection its summary.',
    ],
    avoid: [
      'More than five numbered events on one chart: switch to ticks and a density strip.',
      'Colour as the only difference between a limit and a target.',
      'Notes that cover the line they explain.',
      'Annotations without a key when a chart mixes more than two kinds.',
    ],
  },
  source,
  sections: [
    {
      id: 'lines',
      title: 'Lines and boundaries',
      description: 'Horizontal and vertical references a value is read against.',
      specimens: [
        {
          id: 'ChartAnnotationLimits',
          title: 'Limit lines with labels',
          note: 'Pick it whenever a value has an operating and a trip limit: both lines carry their name and value.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/Panel.tsx', 'kit/Stat.tsx'],
          Component: ChartAnnotationLimits,
        },
        {
          id: 'ChartAnnotationTarget',
          title: 'Target line',
          note: 'Pick it for a goal rather than a limit: a solid line in the success colour, with the best point called out.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/Stat.tsx'],
          Component: ChartAnnotationTarget,
        },
        {
          id: 'ChartAnnotationForecast',
          title: 'Now line and forecast',
          note: 'Pick it when the chart runs into the future: a now line, a dashed forecast and a shaded forecast period.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/Panel.tsx'],
          Component: ChartAnnotationForecast,
        },
      ],
    },
    {
      id: 'events',
      title: 'Events and periods',
      description: 'Things that happened, and states that lasted.',
      specimens: [
        {
          id: 'ChartAnnotationEvents',
          title: 'Numbered events with a linked list',
          note: 'Pick it to explain a trend with what happened: select a marker or a row and the other follows.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/chart-annotations/EventBadge.tsx', 'kit/ListRow.tsx'],
          Component: ChartAnnotationEvents,
        },
        {
          id: 'ChartAnnotationWindow',
          title: 'Maintenance window',
          note: 'Pick it to show work on the asset as a hatched period, with the result noted after it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/Panel.tsx'],
          Component: ChartAnnotationWindow,
        },
        {
          id: 'ChartAnnotationStops',
          title: 'Planned stop and trip',
          note: 'Pick it when zero is not a fault of the sensor: the stops are shaded and named by kind.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/Legend.tsx'],
          Component: ChartAnnotationStops,
        },
        {
          id: 'ChartAnnotationCrowded',
          title: 'Many events as ticks',
          note: 'Pick it past five events: ticks along the top and a density strip below say where they cluster.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/HeatStrip.tsx'],
          Component: ChartAnnotationCrowded,
        },
      ],
    },
    {
      id: 'points',
      title: 'Points and highlights',
      description: 'Single moments worth a note.',
      specimens: [
        {
          id: 'ChartAnnotationCrossing',
          title: 'Threshold crossing',
          note: 'Pick it for a wall screen: the state tile says it in words and the chart marks when it happened.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/chart-annotations/annotations.ts', 'kit/Stat.tsx'],
          Component: ChartAnnotationCrossing,
        },
        {
          id: 'ChartAnnotationAnomaly',
          title: 'Annotated anomaly',
          note: 'Pick it for a detected anomaly: the period is shaded with its score and the peak carries its value.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/StatusPill.tsx'],
          Component: ChartAnnotationAnomaly,
        },
        {
          id: 'ChartAnnotationMinMax',
          title: 'Minimum and maximum',
          note: 'Pick it for a daily summary: the two extremes are marked on the line and repeated as figures.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/chart-annotations/annotations.ts', 'kit/Stat.tsx'],
          Component: ChartAnnotationMinMax,
        },
        {
          id: 'ChartAnnotationPointNote',
          title: 'Point with a note beside',
          note: 'Pick it in a report: a short label on the point and the full note in the margin.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/chart-annotations/EventBadge.tsx'],
          Component: ChartAnnotationPointNote,
        },
      ],
    },
    {
      id: 'cursor',
      title: 'Cursor and selection',
      description: 'Reading exact values and stretches of time.',
      specimens: [
        {
          id: 'ChartAnnotationCursor',
          title: 'Cursor with readout panel',
          note: 'Pick it when exact values matter: the panel shows every series at the cursor, and the latest when idle.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/Stat.tsx'],
          Component: ChartAnnotationCursor,
        },
        {
          id: 'ChartAnnotationBrush',
          title: 'Range selection with summary',
          note: 'Pick it to measure a stretch: drag across the plot and read its mean, maximum and change.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/chart-annotations/annotations.ts', 'kit/Stat.tsx'],
          Component: ChartAnnotationBrush,
        },
        {
          id: 'ChartAnnotationCompare',
          title: 'Two cursors with difference',
          note: 'Pick it to compare two moments: cursor A is fixed, B follows the pointer, the table gives the difference.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/DataTable.tsx'],
          Component: ChartAnnotationCompare,
        },
      ],
    },
    {
      id: 'keys',
      title: 'Keys and layers',
      description: 'Explaining the marks and controlling how many are shown.',
      specimens: [
        {
          id: 'ChartAnnotationLayers',
          title: 'Layer toggles',
          note: 'Pick it when a chart carries several kinds of annotation: readers switch each layer on and off.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/dashboard-blocks/FilterPills.tsx'],
          Component: ChartAnnotationLayers,
        },
        {
          id: 'ChartAnnotationKey',
          title: 'Annotation key',
          note: 'Pick it beside any chart that mixes lines, fills and markers: one entry for each kind.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Legend.tsx', 'kit/chart-annotations/EventBadge.tsx', 'kit/ListRow.tsx'],
          Component: ChartAnnotationKey,
        },
        {
          id: 'ChartAnnotationNoEvents',
          title: 'No events',
          note: 'Pick it for a quiet period: the list says that nothing happened and what would appear there.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/EmptyPanel.tsx'],
          Component: ChartAnnotationNoEvents,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Annotation kinds combined into finished screens.',
      specimens: [
        {
          id: 'ChartAnnotationInvestigation',
          title: 'Investigation view',
          note: 'Pick it as the page for one signal under investigation: figures, an annotated chart and the linked timeline.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/chart-annotations/EventBadge.tsx', 'kit/SectionHeader.tsx', 'kit/Stat.tsx'],
          Component: ChartAnnotationInvestigation,
        },
        {
          id: 'ChartAnnotationOperatorTrend',
          title: 'Operator trend display',
          note: 'Pick it for a control-room trend: a strip of values at the cursor above a chart with stops shaded.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/StatGroup.tsx', 'kit/Panel.tsx'],
          Component: ChartAnnotationOperatorTrend,
        },
        {
          id: 'ChartAnnotationReportFigure',
          title: 'Report figure with numbered notes',
          note: 'Pick it for a printed or shared report: the headline states the finding and the notes carry the numbers.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/chart-annotations/AnnotatedTrend.tsx', 'kit/chart-annotations/EventBadge.tsx', 'kit/SectionHeader.tsx'],
          Component: ChartAnnotationReportFigure,
        },
      ],
    },
  ],
});
