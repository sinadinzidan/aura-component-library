import { Button } from '@cognite/aura/components/button';
import { IconChevronRight, IconCornerDownLeft, IconHistory, IconSearch } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Donut } from '../../../library/kit/Donut';
import { EmptyPanel } from '../../../library/kit/EmptyPanel';
import { Meter } from '../../../library/kit/Meter';
import { filterCommands, matchCommand, pushHistory, type CommandSpec, type HistoryEntry } from '../../../library/kit/neon-terminal/commands';
import { Panel } from '../../../library/kit/Panel';
import { Stat } from '../../../library/kit/Stat';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { ALARMS, ASSETS, PLANT_KPIS, WORK_ORDERS, childrenOf, findAsset, findPerson, type Alarm, type Asset, type WorkOrder } from '../../data/plant';
import { MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatTime, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './neon-terminal.tsx?raw';

type NtCommand = CommandSpec & { group: string; summary: string; result: string };

const NT_COMMANDS: readonly NtCommand[] = [
  { id: 'status', text: 'status plant', keywords: ['overview', 'areas', 'health'], group: 'Plant', summary: 'State and health of every area', result: '4 areas · 1 reduced' },
  { id: 'trend', text: 'trend 23-PT-92531 24h', keywords: ['pressure', 'discharge', 'chart'], group: 'Time series', summary: 'Discharge pressure against its limits', result: '1 series · 25 points' },
  { id: 'alarms', text: 'alarms open', keywords: ['alerts', 'active', 'critical'], group: 'Events', summary: 'Open alarms, most severe first', result: '6 open · 1 critical' },
  { id: 'compare', text: 'compare compressors', keywords: ['machines', 'trains', 'health'], group: 'Assets', summary: 'The three compressors side by side', result: '3 machines · 2 measures' },
  { id: 'orders', text: 'orders due 7d', keywords: ['work', 'maintenance', 'backlog'], group: 'Maintenance', summary: 'Work orders due this week', result: '5 orders · 1 overdue' },
];

const NT_START_HISTORY: readonly HistoryEntry[] = [
  { id: 'h3', text: 'alarms open', at: REFERENCE_NOW - 6 * MINUTE },
  { id: 'h2', text: 'trend 23-PT-92531 24h', at: REFERENCE_NOW - 21 * MINUTE },
  { id: 'h1', text: 'status plant', at: REFERENCE_NOW - 58 * MINUTE },
];

const NT_SEVERITY: Record<Alarm['severity'], { label: string; tone: Tone }> = {
  critical: { label: 'Critical', tone: 'critical' },
  high: { label: 'High', tone: 'warning' },
  medium: { label: 'Medium', tone: 'info' },
  low: { label: 'Low', tone: 'neutral' },
};

const NT_HEALTH: Record<Asset['health'], { label: string; tone: Tone }> = {
  good: { label: 'Good', tone: 'success' },
  watch: { label: 'Watch', tone: 'warning' },
  poor: { label: 'Poor', tone: 'critical' },
};

const NT_STATE: Record<Asset['state'], { label: string; tone: Tone }> = {
  running: { label: 'Running', tone: 'success' },
  standby: { label: 'Standby', tone: 'info' },
  stopped: { label: 'Stopped', tone: 'neutral' },
  tripped: { label: 'Tripped', tone: 'critical' },
  maintenance: { label: 'Maintenance', tone: 'warning' },
};

const NT_OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state !== 'cleared');

const NT_AREAS = childrenOf('nk');

const NT_COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor');

const NT_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done' && order.dueAt < REFERENCE_NOW + 7 * 24 * 60 * MINUTE);

const NT_PRESSURE = makeSeries({ seed: 11, points: 25, base: 48.2, amplitude: 2.1, noise: 0.6, decimals: 1 });

const NT_PRESSURE_VALUES = NT_PRESSURE.map((point) => point.v);

const NT_ALARM_COLUMNS: DataTableColumn<Alarm>[] = [
  { id: 'severity', header: 'Severity', cell: (alarm) => <StatusPill tone={NT_SEVERITY[alarm.severity].tone}>{NT_SEVERITY[alarm.severity].label}</StatusPill> },
  { id: 'message', header: 'Alarm', cell: (alarm) => alarm.message },
  { id: 'tag', header: 'Tag', cell: (alarm) => <TagId>{alarm.sensorTag}</TagId>, nowrap: true },
  { id: 'value', header: 'Value', cell: (alarm) => alarm.value, numeric: true, nowrap: true },
  { id: 'raised', header: 'Raised', cell: (alarm) => formatAgo(alarm.raisedAt), numeric: true, nowrap: true, muted: true },
];

const NT_AREA_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'name', header: 'Area', cell: (area) => area.name },
  { id: 'tag', header: 'Tag', cell: (area) => <TagId>{area.tag}</TagId>, nowrap: true },
  { id: 'health', header: 'Health', cell: (area) => <StatusPill tone={NT_HEALTH[area.health].tone}>{NT_HEALTH[area.health].label}</StatusPill> },
  { id: 'score', header: 'Score', cell: (area) => area.healthScore, numeric: true },
  { id: 'units', header: 'Units', cell: (area) => childrenOf(area.id).length, numeric: true },
];

const NT_MACHINE_COLUMNS: DataTableColumn<Asset>[] = [
  { id: 'name', header: 'Machine', cell: (asset) => asset.name },
  { id: 'state', header: 'State', cell: (asset) => <StatusPill tone={NT_STATE[asset.state].tone}>{NT_STATE[asset.state].label}</StatusPill> },
  { id: 'score', header: 'Health', cell: (asset) => asset.healthScore, numeric: true },
];

const NT_ORDER_COLUMNS: DataTableColumn<WorkOrder>[] = [
  { id: 'title', header: 'Work order', cell: (order) => order.title },
  { id: 'asset', header: 'Asset', cell: (order) => <TagId>{findAsset(order.assetId)?.tag ?? order.assetId}</TagId>, nowrap: true },
  { id: 'priority', header: 'Priority', cell: (order) => order.priority },
  { id: 'owner', header: 'Owner', cell: (order) => findPerson(order.assigneeId)?.name ?? 'Unassigned', muted: true, nowrap: true },
  { id: 'due', header: 'Due', cell: (order) => formatDate(order.dueAt), numeric: true, nowrap: true },
];

function ntCommand(id: string): NtCommand {
  return NT_COMMANDS.find((command) => command.id === id) ?? NT_COMMANDS[0];
}

type NtCommandBarProps = {
  value: string;
  onChange: (value: string) => void;
  onRun: (text: string) => void;
  /** The quick commands under the field. */
  presets?: boolean;
  /** Id of the command whose result is showing, to mark its preset. */
  current?: string;
};

/** The command bar: one large field that runs the workspace, with the preset commands one click away. */
function NtCommandBar({ value, onChange, onRun, presets = true, current }: NtCommandBarProps) {
  const field = useId();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRun(value);
  };
  return (
    <div className="bg-[var(--mountain-black)]" style={{ boxShadow: 'inset 0 -2px 0 var(--kit-accent), 0 10px 28px -12px var(--kit-accent)' }}>
      <form onSubmit={submit} className="flex items-center gap-3 px-5 pt-4 pb-3">
        <IconChevronRight className="size-7 shrink-0 text-[var(--kit-accent)]" stroke={2.5} aria-hidden="true" style={{ filter: 'drop-shadow(0 0 6px var(--kit-accent))' }} />
        <label htmlFor={field} className="sr-only">
          Command
        </label>
        <input
          id={field}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type a command, for example alarms open"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-2xl font-medium tracking-tight text-[var(--kit-text)] caret-[var(--kit-accent)] outline-none placeholder:text-[var(--kit-text-3)]"
        />
        <Button type="submit" size="sm">
          Run <IconCornerDownLeft />
        </Button>
      </form>
      {presets ? (
        <div role="group" aria-label="Preset commands" className="flex flex-wrap gap-2 px-5 pb-4">
          {NT_COMMANDS.map((command) => (
            <button
              key={command.id}
              type="button"
              aria-pressed={command.id === current}
              onClick={() => onRun(command.text)}
              className={`border px-3 py-1.5 text-sm font-medium outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                command.id === current
                  ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_24%,transparent)] text-[var(--kit-text)]'
                  : 'border-[var(--kit-rule)] bg-[var(--kit-surface)] text-[var(--kit-text-2)]'
              }`}
            >
              {command.text}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** The session so far: every command that was run, newest first; pick one to run it again. */
function NtHistory({ history, onRun, className }: { history: readonly HistoryEntry[]; onRun: (text: string) => void; className?: string }) {
  return (
    <Panel className={className} title="History" subtitle={`${history.length} runs`} padding="none" icon={<IconHistory className="size-4" aria-hidden="true" />}>
      <ol className="flex flex-col">
        {history.map((entry, index) => (
          <li key={entry.id} className="border-b border-[var(--kit-rule)]">
            <button
              type="button"
              onClick={() => onRun(entry.text)}
              className={`flex w-full flex-col gap-0.5 border-l-4 px-3 py-2.5 text-left outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                index === 0 ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_14%,transparent)]' : 'border-transparent'
              }`}
            >
              <span className="text-sm leading-snug font-medium">{entry.text}</span>
              <span className="text-xs text-[var(--kit-text-2)] tabular-nums">{formatTime(entry.at)} UTC</span>
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

function NtResultStatus() {
  return (
    <div className="grid flex-1 grid-cols-12 gap-px">
      <Panel className="col-span-5" tone="warning" title="Plant state" subtitle="Nordkapp">
        <div className="flex flex-1 flex-col justify-between gap-4">
          <p className="text-4xl leading-none font-semibold tracking-tight">Reduced capacity</p>
          <p className="text-sm leading-relaxed text-[var(--kit-text-2)]">
            Recompressor 23-KA-9103 tripped on high vibration at 13:46. Export runs 0.12 MSm³/d under plan while the bearing is inspected.
          </p>
          <Meter label="Gas export against plan" value={PLANT_KPIS.gasExport.value} min={3.5} max={5} decimals={2} unit="MSm³/d" target={{ value: 4.5, label: 'Plan' }} tone="warning" />
        </div>
      </Panel>
      <Panel className="col-span-7" title="Areas" subtitle="Health score out of 100" padding="none">
        <DataTable label="Plant areas" columns={NT_AREA_COLUMNS} rows={NT_AREAS} rowKey={(area) => area.id} rowTone={(area) => NT_HEALTH[area.health].tone} flush />
      </Panel>
      <Panel className="col-span-12" title="Area health" subtitle="Score by area">
        <Bars
          label="Health score by plant area"
          categories={NT_AREAS.map((area) => area.name)}
          series={[{ id: 'score', label: 'Health score', values: NT_AREAS.map((area) => area.healthScore) }]}
          tones={NT_AREAS.map((area) => NT_HEALTH[area.health].tone)}
          orientation="horizontal"
          showValues
          height={176}
        />
      </Panel>
    </div>
  );
}

function NtResultTrend() {
  const low = Math.min(...NT_PRESSURE_VALUES);
  const high = Math.max(...NT_PRESSURE_VALUES);
  const mean = NT_PRESSURE_VALUES.reduce((sum, value) => sum + value, 0) / NT_PRESSURE_VALUES.length;
  return (
    <div className="grid flex-1 grid-cols-12 gap-px">
      <Panel className="col-span-9" title="Discharge pressure" subtitle="23-PT-92531 · 1st stage compressor · last 24 h">
        <TrendLine
          label="Discharge pressure of the 1st stage compressor, last 24 hours, against its high and trip limits"
          series={[{ id: 'pressure', label: 'Discharge pressure', values: NT_PRESSURE_VALUES, tone: 'accent' }]}
          labels={NT_PRESSURE.map((point) => formatTime(point.t))}
          unit="barg"
          decimals={1}
          limits={[
            { value: 52, label: 'High', tone: 'warning' },
            { value: 55, label: 'Trip', tone: 'critical' },
          ]}
          bands={[{ from: 40, to: 52, tone: 'success' }]}
          yDomain={[38, 58]}
          height={372}
          highlightLast
        />
      </Panel>
      <div className="col-span-3 grid grid-rows-4 gap-px">
        <Stat label="Now" value={48.6} decimals={1} unit="barg" tone="accent" size="lg" />
        <Stat label="Mean, 24 h" value={mean} decimals={1} unit="barg" />
        <Stat label="Highest" value={high} decimals={1} unit="barg" target="High limit 52.0" />
        <Stat label="Lowest" value={low} decimals={1} unit="barg" target="Low limit 40.0" />
      </div>
    </div>
  );
}

function NtResultAlarms() {
  const counts = (['critical', 'high', 'medium', 'low'] as const).map((severity) => NT_OPEN_ALARMS.filter((alarm) => alarm.severity === severity).length);
  return (
    <div className="grid flex-1 grid-cols-12 gap-px">
      <Panel className="col-span-8" title="Open alarms" subtitle={`${NT_OPEN_ALARMS.length} open, most severe first`} padding="none">
        <DataTable label="Open alarms" columns={NT_ALARM_COLUMNS} rows={NT_OPEN_ALARMS} rowKey={(alarm) => alarm.id} rowTone={(alarm) => NT_SEVERITY[alarm.severity].tone} flush />
      </Panel>
      <Panel className="col-span-4" title="By severity" subtitle="Open alarms">
        <Bars
          label="Open alarms by severity"
          categories={['Critical', 'High', 'Medium', 'Low']}
          series={[{ id: 'count', label: 'Open alarms', values: counts }]}
          tones={['critical', 'warning', 'info', 'neutral']}
          orientation="horizontal"
          showValues
          height={220}
        />
      </Panel>
    </div>
  );
}

function NtResultCompare() {
  return (
    <div className="grid flex-1 grid-cols-12 gap-px">
      <Panel className="col-span-7" title="Compressors compared" subtitle="Health score and load, percent">
        <Bars
          label="Health score and load of the three compressors"
          categories={NT_COMPRESSORS.map((asset) => asset.name)}
          series={[
            { id: 'health', label: 'Health score', values: NT_COMPRESSORS.map((asset) => asset.healthScore), tone: 'accent' },
            { id: 'load', label: 'Load', values: [97, 91, 0], tone: 'purple' },
          ]}
          limit={{ value: 85, label: 'Good from', tone: 'success' }}
          unit="%"
          height={340}
        />
      </Panel>
      <Panel className="col-span-5" title="Machines" subtitle="Gas compression" padding="none">
        <DataTable label="Compressors" columns={NT_MACHINE_COLUMNS} rows={NT_COMPRESSORS} rowKey={(asset) => asset.id} rowTone={(asset) => NT_STATE[asset.state].tone} flush />
      </Panel>
    </div>
  );
}

function NtResultOrders() {
  const types = ['corrective', 'preventive', 'inspection'] as const;
  return (
    <div className="grid flex-1 grid-cols-12 gap-px">
      <Panel className="col-span-8" title="Work orders due within 7 days" subtitle={`${NT_ORDERS.length} orders`} padding="none">
        <DataTable
          label="Work orders due within seven days"
          columns={NT_ORDER_COLUMNS}
          rows={NT_ORDERS}
          rowKey={(order) => order.id}
          rowTone={(order) => (order.dueAt < REFERENCE_NOW ? 'critical' : order.priority === 'P1' ? 'warning' : 'neutral')}
          flush
        />
      </Panel>
      <Panel className="col-span-4" title="By type" subtitle="Due this week">
        <div className="flex flex-1 items-center">
          <Donut
            label="Work orders due this week by type"
            segments={types.map((type, index) => ({
              label: type.charAt(0).toUpperCase() + type.slice(1),
              value: NT_ORDERS.filter((order) => order.type === type).length,
              tone: (['amber', 'teal', 'purple'] as const)[index],
            }))}
            centerCaption="orders"
            legend="bottom"
            size={150}
            className="w-full"
          />
        </div>
      </Panel>
    </div>
  );
}

function NtResult({ id }: { id: string }) {
  if (id === 'trend') return <NtResultTrend />;
  if (id === 'alarms') return <NtResultAlarms />;
  if (id === 'compare') return <NtResultCompare />;
  if (id === 'orders') return <NtResultOrders />;
  return <NtResultStatus />;
}

/** The echo above a result: what ran and what came back. */
function NtEcho({ text, detail }: { text: string; detail: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 bg-[var(--kit-surface)] px-4 py-2.5">
      <p className="flex items-center gap-2 text-base font-semibold">
        <IconChevronRight className="size-4 text-[var(--kit-accent)]" stroke={2.5} aria-hidden="true" />
        {text}
      </p>
      <p className="text-sm text-[var(--kit-text-2)] tabular-nums">{detail}</p>
    </div>
  );
}

/** The line at the bottom: connection, scope and the two keys worth knowing. */
function NtStatusLine() {
  const key = 'border border-[var(--kit-rule-strong)] bg-[var(--kit-surface)] px-1.5 py-0.5 font-sans text-xs font-medium text-[var(--kit-text)]';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--mountain-black)] px-4 py-2 text-sm text-[var(--kit-text-2)]">
      <p className="flex items-center gap-3">
        <StatusPill tone="success">Connected</StatusPill>
        Nordkapp · 12 tags subscribed · updated 14:00 UTC
      </p>
      <p className="flex items-center gap-2">
        <kbd className={key}>Enter</kbd> run
        <kbd className={key}>Ctrl K</kbd> all commands
      </p>
    </div>
  );
}

function NtWorkspace({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <LookScope look="console">
      <Canvas padding="none" className={`flex flex-col gap-px ${className}`}>
        {children}
      </Canvas>
    </LookScope>
  );
}

function NeonTerminalSignature() {
  const [input, setInput] = useState('trend 23-PT-92531 24h');
  const [current, setCurrent] = useState<{ id: string | null; text: string }>({ id: 'trend', text: 'trend 23-PT-92531 24h' });
  const [history, setHistory] = useState<readonly HistoryEntry[]>(NT_START_HISTORY);
  const run = (text: string) => {
    const typed = text.trim();
    if (typed === '') return;
    const command = matchCommand(typed, NT_COMMANDS);
    const shown = command?.text ?? typed;
    setInput(shown);
    setCurrent({ id: command?.id ?? null, text: shown });
    setHistory(pushHistory(history, { id: `run-${history.length + 1}`, text: shown, at: REFERENCE_NOW }));
  };
  return (
    <NtWorkspace className="min-h-[47.5rem]">
      <NtCommandBar value={input} onChange={setInput} onRun={run} current={current.id ?? undefined} />
      <div className="grid flex-1 grid-cols-[15rem_minmax(0,1fr)] gap-px">
        <NtHistory history={history} onRun={run} />
        <div className="flex min-w-0 flex-col gap-px">
          <NtEcho text={current.text} detail={current.id ? ntCommand(current.id).result : 'No match'} />
          {current.id ? (
            <NtResult id={current.id} />
          ) : (
            <Panel className="flex-1">
              <EmptyPanel
                icon={<IconSearch />}
                title={`No command matches “${current.text}”`}
                description="Try one of the presets under the command bar, or start typing status, trend, alarms, compare or orders."
              />
            </Panel>
          )}
        </div>
      </div>
      <NtStatusLine />
    </NtWorkspace>
  );
}

function NeonTerminalPalette() {
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState('alarms');
  const field = useId();
  const matches = filterCommands(query, NT_COMMANDS);
  return (
    <NtWorkspace className="h-full">
      <div className="flex flex-1 flex-col gap-px bg-[color-mix(in_oklab,var(--mountain-black)_80%,var(--kit-accent))] p-5">
        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col border border-[var(--kit-accent)] bg-[var(--mountain-black)]" style={{ boxShadow: '0 0 40px -8px var(--kit-accent)' }}>
          <div className="flex items-center gap-3 border-b border-[var(--kit-rule)] px-4 py-3">
            <IconSearch className="size-5 shrink-0 text-[var(--kit-accent)]" aria-hidden="true" />
            <label htmlFor={field} className="sr-only">
              Find a command
            </label>
            <input
              id={field}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a command"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-lg font-medium text-[var(--kit-text)] caret-[var(--kit-accent)] outline-none placeholder:text-[var(--kit-text-3)]"
            />
          </div>
          {matches.length === 0 ? (
            <EmptyPanel icon={<IconSearch />} title="No command found" description="Clear the field to see all five commands." />
          ) : (
            <ul className="flex flex-1 flex-col">
              {matches.map((command) => (
                <li key={command.id} className="flex flex-1 border-b border-[var(--kit-rule)]">
                  <button
                    type="button"
                    aria-pressed={command.id === picked}
                    onClick={() => setPicked(command.id)}
                    className={`flex w-full items-center gap-4 border-l-4 px-4 py-3 text-left outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                      command.id === picked ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_18%,transparent)]' : 'border-transparent'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-base font-semibold">{command.text}</span>
                      <span className="block text-sm text-[var(--kit-text-2)]">{command.summary}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-[var(--kit-text-2)]">{command.group}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="px-4 py-2.5 text-sm text-[var(--kit-text-2)]">
            Runs <span className="font-semibold text-[var(--kit-text)]">{ntCommand(picked).text}</span> · {ntCommand(picked).result}
          </p>
        </div>
      </div>
    </NtWorkspace>
  );
}

function NeonTerminalStart() {
  const [input, setInput] = useState('');
  const [ran, setRan] = useState<string | null>(null);
  const run = (text: string) => {
    const command = matchCommand(text, NT_COMMANDS);
    setRan(command?.id ?? null);
    setInput(command?.text ?? text);
  };
  return (
    <NtWorkspace className="h-full">
      <NtCommandBar value={input} onChange={setInput} onRun={run} presets={false} />
      <div className="flex flex-1 flex-col gap-4 bg-[var(--kit-surface)] p-5">
        <div>
          <p className="text-2xl font-semibold tracking-tight">{ran ? ntCommand(ran).summary : 'What do you want to see?'}</p>
          <p className="text-sm text-[var(--kit-text-2)]">{ran ? `Ready: ${ntCommand(ran).result}` : 'Pick a command to start the session, or type one above.'}</p>
        </div>
        <ul className="grid flex-1 grid-cols-1 gap-px bg-[var(--kit-rule)]">
          {NT_COMMANDS.map((command) => (
            <li key={command.id} className="flex">
              <button
                type="button"
                aria-pressed={command.id === ran}
                onClick={() => run(command.text)}
                className={`flex w-full items-center justify-between gap-3 border-l-4 px-3 py-2.5 text-left outline-offset-[-2px] focus-visible:outline-2 focus-visible:outline-[var(--kit-accent)] ${
                  command.id === ran ? 'border-[var(--kit-accent)] bg-[color-mix(in_oklab,var(--kit-accent)_22%,var(--mountain-black))]' : 'border-transparent bg-[var(--mountain-black)]'
                }`}
              >
                <span>
                  <span className="block text-xs text-[var(--kit-text-2)]">{command.group}</span>
                  <span className="block text-sm font-semibold">{command.text}</span>
                </span>
                <IconCornerDownLeft className="size-4 shrink-0 text-[var(--kit-text-2)]" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </NtWorkspace>
  );
}

function NeonTerminalCommandBar() {
  const [input, setInput] = useState('alarms open');
  const [current, setCurrent] = useState('alarms');
  const run = (text: string) => {
    const command = matchCommand(text, NT_COMMANDS);
    if (!command) return;
    setInput(command.text);
    setCurrent(command.id);
  };
  return (
    <NtWorkspace className="w-full">
      <NtCommandBar value={input} onChange={setInput} onRun={run} current={current} />
      <NtEcho text={ntCommand(current).text} detail={ntCommand(current).result} />
    </NtWorkspace>
  );
}

function NeonTerminalHistory() {
  const [history, setHistory] = useState<readonly HistoryEntry[]>(NT_START_HISTORY);
  const run = (text: string) => setHistory(pushHistory(history, { id: `run-${history.length + 1}`, text, at: REFERENCE_NOW }, 5));
  return (
    <NtWorkspace className="h-full w-full">
      <NtHistory history={history} onRun={run} className="flex-1" />
    </NtWorkspace>
  );
}

function NeonTerminalTrendResult() {
  return (
    <NtWorkspace className="w-full">
      <NtEcho text="trend 23-PT-92531 24h" detail="1 series · 25 points" />
      <NtResultTrend />
    </NtWorkspace>
  );
}

function NeonTerminalAlarmResult() {
  return (
    <NtWorkspace className="w-full">
      <NtEcho text="alarms open" detail="6 open · 1 critical" />
      <NtResultAlarms />
    </NtWorkspace>
  );
}

function NeonTerminalStatusResult() {
  return (
    <NtWorkspace className="w-full">
      <NtEcho text="status plant" detail="4 areas · 1 reduced" />
      <NtResultStatus />
      <NtStatusLine />
    </NtWorkspace>
  );
}

export default definePage({
  id: 'neon-terminal',
  title: 'Neon terminal',
  summary:
    'A workspace driven by one command bar: type or pick a command and the canvas below is rebuilt from result cards. Terminal speed, set in readable sans type on an operator console.',
  guidance: {
    use: [
      'For expert users who know what they want and ask for it faster than they could navigate to it.',
      'A small, memorable command set, each with a preset button so the keyboard is never required.',
      'Result cards from the kit, so a command returns a finished view rather than rows of text.',
    ],
    avoid: [
      'Monospace for the interface: commands, tags and figures all use the UI typeface.',
      'Free-form commands with no match feedback; the echo line always says what ran and what came back.',
      'Hiding the only way in behind typing: presets and history stay visible.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Run a preset, type a command and press Enter, or pick an entry in the history: the canvas shows that result.',
      specimens: [
        {
          id: 'NeonTerminalSignature',
          title: 'Command workspace',
          note: 'Pick it for engineers who would rather ask for a view than browse to it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/neon-terminal/commands.ts', 'kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/TrendLine.tsx', 'kit/Bars.tsx', 'kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: NeonTerminalSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Two more screens: the first-run start screen, and the palette that lists every command.',
      specimens: [
        {
          id: 'NeonTerminalPalette',
          title: 'Command palette',
          note: 'Pick it as the overlay behind a shortcut: filter the list, see what a command returns before running it.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/neon-terminal/commands.ts', 'kit/EmptyPanel.tsx'],
          Component: NeonTerminalPalette,
        },
        {
          id: 'NeonTerminalStart',
          title: 'Start screen',
          note: 'Pick it for a new session or a narrow window: the bar on top and every command as one row.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/neon-terminal/commands.ts'],
          Component: NeonTerminalStart,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The bar, the history and three result canvases on their own.',
      specimens: [
        {
          id: 'NeonTerminalCommandBar',
          title: 'Command bar and echo',
          note: 'Pick them together: the bar takes the command, the echo confirms what ran and what came back.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/neon-terminal/commands.ts'],
          Component: NeonTerminalCommandBar,
        },
        {
          id: 'NeonTerminalHistory',
          title: 'History rail',
          note: 'Pick it so a session can be retraced; choosing an entry runs it again and moves it to the top.',
          origin: 'custom',
          align: 'stretch',
          bleed: true,
          uses: ['kit/neon-terminal/commands.ts', 'kit/Panel.tsx'],
          Component: NeonTerminalHistory,
        },
        {
          id: 'NeonTerminalTrendResult',
          title: 'Trend result',
          note: 'Pick it for a time series command: the chart with its limits, and four figures stacked beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Stat.tsx', 'kit/Panel.tsx'],
          Component: NeonTerminalTrendResult,
        },
        {
          id: 'NeonTerminalAlarmResult',
          title: 'Alarm result',
          note: 'Pick it for a list command: a status-banded table with the count by severity beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/Bars.tsx', 'kit/StatusPill.tsx'],
          Component: NeonTerminalAlarmResult,
        },
        {
          id: 'NeonTerminalStatusResult',
          title: 'Status result with status line',
          note: 'Pick it for a summary command: the state in words first, then the table and the ranking.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/DataTable.tsx', 'kit/Bars.tsx', 'kit/Meter.tsx'],
          Component: NeonTerminalStatusResult,
        },
      ],
    },
  ],
});
