import { useEffect, useId, useReducer, useRef, useState } from 'react';
import type { Dispatch, FormEvent, KeyboardEvent, ReactNode } from 'react';

import { BoxPane } from '../../../library/experiences/futuristic/BoxPane';
import { CharChart } from '../../../library/experiences/futuristic/CharChart';
import { COMMAND_HELP } from '../../../library/experiences/futuristic/commandParser';
import { GlowText } from '../../../library/experiences/futuristic/GlowText';
import { neonFromStatus } from '../../../library/experiences/futuristic/neon';
import {
  effectiveAlarmState,
  initialTerminalState,
  subtreeIds,
  terminalReducer,
  visibleNodes,
} from '../../../library/experiences/futuristic/terminalSession';
import type { TerminalAction, TerminalLine, TerminalState, TerminalWorld } from '../../../library/experiences/futuristic/terminalSession';
import { TextMeter } from '../../../library/experiences/futuristic/TextMeter';
import { formatLimit, formatValue, runStateStatus, severityStatus, toneFromLimits } from '../../../library/industrial/status';
import type { Tone } from '../../../library/industrial/status';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARMS, ASSETS, SENSORS, findAsset } from '../../data/plant';
import type { Sensor } from '../../data/plant';
import { REFERENCE_NOW, formatAgo, formatDateTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './neon-terminal.tsx?raw';

type NeonTerminalPane = 'tree' | 'tags' | 'trend' | 'alarms' | 'output';
type NeonTerminalSession = { state: TerminalState; dispatch: Dispatch<TerminalAction>; run: (input: string) => void };

/** The shared plant, in the shape the console session reads. */
const NEON_TERMINAL_WORLD: TerminalWorld = {
  nodes: ASSETS.map((asset) => ({ id: asset.id, tag: asset.tag, name: asset.name, parentId: asset.parentId })),
  tags: SENSORS.map((sensor) => ({ tag: sensor.tag, name: sensor.name, nodeId: sensor.assetId })),
  alarms: ALARMS.map((alarm) => ({ id: alarm.id, state: alarm.state })),
};

const NEON_TERMINAL_REDUCER = terminalReducer(NEON_TERMINAL_WORLD);

/** One character per run state, so the tree reads without colour. */
const NEON_TERMINAL_STATE_GLYPH: Record<string, string> = {
  running: '●',
  standby: '○',
  stopped: '□',
  tripped: '◆',
  maintenance: '■',
};

const NEON_TERMINAL_TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-muted-foreground',
  success: 'text-success-foreground-strong',
  warning: 'text-warning-foreground-strong',
  critical: 'text-critical-foreground-strong',
  info: 'text-info-foreground-strong',
};

const NEON_TERMINAL_LINE_STYLE: Record<TerminalLine['kind'], { prefix: string; className: string }> = {
  input: { prefix: '> ', className: 'text-[color:var(--primary-background)]' },
  ok: { prefix: 'ok  ', className: 'text-base-foreground' },
  error: { prefix: 'err ', className: 'text-critical-foreground-strong' },
  info: { prefix: '    ', className: 'text-medium-foreground' },
};

const NEON_TERMINAL_SEVERITY_CODE: Record<string, string> = { critical: 'CRIT', high: 'HIGH', medium: 'MED', low: 'LOW' };

const NEON_TERMINAL_INVERSE = 'bg-[color:var(--primary-background)] text-[color:var(--primary-foreground)]';

function neonTerminalSeries(sensor: Sensor): number[] {
  const span = sensor.rangeMax - sensor.rangeMin;
  const values = makeValues({
    seed: sensor.seed,
    points: 48,
    base: sensor.value,
    amplitude: span * 0.04,
    noise: span * 0.012,
    cycles: 2,
    min: sensor.rangeMin,
    max: sensor.rangeMax,
    decimals: sensor.decimals,
  });
  return [...values.slice(0, -1), sensor.value];
}

function neonTerminalSensorTone(sensor: Sensor): Tone {
  if (sensor.quality === 'bad') return 'neutral';
  return toneFromLimits(sensor.value, { low: sensor.lowLimit, high: sensor.highLimit, highHigh: sensor.highHighLimit });
}

/** The pane the last command acted on, read from the scrollback. */
function neonTerminalActivePane(lines: readonly TerminalLine[]): NeonTerminalPane {
  const last = [...lines].reverse().find((line) => line.kind === 'input');
  const words = last?.text.toLowerCase().split(/\s+/) ?? [];
  if (words[0] === 'trend') return 'trend';
  if (words[0] === 'ack' || (words[0] === 'show' && words[1] === 'alarms')) return 'alarms';
  if (words[0] === 'goto') return 'tree';
  if (words[0] === 'show' && words[1] === 'tags') return 'tags';
  return 'output';
}

function neonTerminalAlarmCounts(state: TerminalState): { unacknowledged: number; open: number } {
  const states = NEON_TERMINAL_WORLD.alarms.map((alarm) => effectiveAlarmState(alarm, state.acknowledged));
  return {
    unacknowledged: states.filter((alarmState) => alarmState === 'active').length,
    open: states.filter((alarmState) => alarmState === 'active' || alarmState === 'acknowledged').length,
  };
}

function neonTerminalTopActiveAlarm(state: TerminalState) {
  return ALARMS.find((alarm) => effectiveAlarmState(alarm, state.acknowledged) === 'active');
}

function useNeonTerminalSession(overrides: Partial<TerminalState> = {}): NeonTerminalSession {
  const [state, dispatch] = useReducer(NEON_TERMINAL_REDUCER, overrides, (initial) => initialTerminalState(NEON_TERMINAL_WORLD, initial));
  return { state, dispatch, run: (input: string) => dispatch({ type: 'command', input }) };
}

function NeonTerminalTree({ state, dispatch, active = false, className }: Pick<NeonTerminalSession, 'state' | 'dispatch'> & { active?: boolean; className?: string }) {
  const treeId = useId();
  const rows = visibleNodes(NEON_TERMINAL_WORLD.nodes, state.collapsed);
  const selected = rows.find((row) => row.node.id === state.selectedId);

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown') dispatch({ type: 'move', direction: 1 });
    else if (event.key === 'ArrowUp') dispatch({ type: 'move', direction: -1 });
    else if (event.key === 'ArrowLeft' && selected?.hasChildren && !selected.collapsed) dispatch({ type: 'collapse', id: state.selectedId });
    else if (event.key === 'ArrowLeft' && selected?.node.parentId) dispatch({ type: 'select', id: selected.node.parentId });
    else if (event.key === 'ArrowRight' && selected?.collapsed) dispatch({ type: 'expand', id: state.selectedId });
    else return;
    event.preventDefault();
  };

  return (
    <BoxPane title="Process tree" meta={`${NEON_TERMINAL_WORLD.nodes.length} nodes`} active={active} className={className} bodyClassName="px-0">
      <ul
        role="tree"
        aria-label="Process tree"
        tabIndex={0}
        aria-activedescendant={`${treeId}-${state.selectedId}`}
        onKeyDown={handleKeyDown}
        className="outline-none focus-visible:bg-[color-mix(in_oklab,var(--primary-background)_8%,transparent)]"
      >
        {rows.map((row) => {
          const asset = findAsset(row.node.id);
          const status = asset ? runStateStatus(asset.state) : undefined;
          const isSelected = row.node.id === state.selectedId;
          const marker = row.hasChildren ? (row.collapsed ? '▸' : '▾') : '·';
          return (
            <li
              key={row.node.id}
              id={`${treeId}-${row.node.id}`}
              role="treeitem"
              aria-level={row.depth + 1}
              aria-selected={isSelected}
              aria-expanded={row.hasChildren ? !row.collapsed : undefined}
              onClick={() => dispatch({ type: 'select', id: row.node.id })}
              onDoubleClick={() => dispatch({ type: row.collapsed ? 'expand' : 'collapse', id: row.node.id })}
              className={`flex cursor-pointer gap-[1ch] whitespace-pre px-[1ch] ${isSelected ? NEON_TERMINAL_INVERSE : 'hover:bg-[color-mix(in_oklab,var(--primary-background)_14%,transparent)]'}`}
            >
              <span aria-hidden="true">{`${'  '.repeat(row.depth)}${marker}`}</span>
              <span className="shrink-0 font-semibold">{row.node.tag}</span>
              <span className={`min-w-0 flex-1 truncate ${isSelected ? '' : 'text-medium-foreground'}`}>{row.node.name}</span>
              {status && asset ? (
                <span className={`shrink-0 ${isSelected ? '' : NEON_TERMINAL_TONE_TEXT[status.tone]}`}>
                  <span aria-hidden="true">{NEON_TERMINAL_STATE_GLYPH[asset.state]}</span>
                  <span className="sr-only">{status.label}</span>
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </BoxPane>
  );
}

function NeonTerminalTagTable({ state, run, active = false, className }: Pick<NeonTerminalSession, 'state' | 'run'> & { active?: boolean; className?: string }) {
  const scope = subtreeIds(NEON_TERMINAL_WORLD.nodes, state.selectedId);
  const sensors = SENSORS.filter((sensor) => scope.includes(sensor.assetId));
  const selected = findAsset(state.selectedId);

  return (
    <BoxPane title="Tags" meta={`${selected?.tag ?? ''} · ${sensors.length} tags`} active={active} className={className}>
      {sensors.length === 0 ? (
        <p className="text-medium-foreground">{`No tags mapped under ${selected?.tag ?? 'this node'}. Select a parent, or type show tags.`}</p>
      ) : (
        <table className="w-full whitespace-nowrap">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th scope="col" className="pr-[2ch] font-normal">
                TAG
              </th>
              <th scope="col" className="pr-[2ch] font-normal">
                NAME
              </th>
              <th scope="col" className="pr-[1ch] text-right font-normal">
                VALUE
              </th>
              <th scope="col" className="pr-[2ch] font-normal">
                UNIT
              </th>
              <th scope="col" className="pr-[2ch] font-normal">
                RANGE
              </th>
              <th scope="col" className="pr-[2ch] font-normal">
                LIMITS
              </th>
              <th scope="col" className="font-normal">
                STATE
              </th>
            </tr>
          </thead>
          <tbody>
            {sensors.map((sensor) => {
              const tone = neonTerminalSensorTone(sensor);
              const bad = sensor.quality === 'bad';
              const trended = sensor.tag === state.trendTag;
              const word = bad ? 'BAD Q' : tone === 'critical' ? 'TRIP' : tone === 'warning' ? 'HIGH' : sensor.quality === 'uncertain' ? 'UNCERT' : 'OK';
              return (
                <tr key={sensor.id} className={trended ? 'bg-[color-mix(in_oklab,var(--primary-background)_14%,transparent)]' : undefined}>
                  <th scope="row" className="pr-[2ch] text-left font-normal">
                    <button
                      type="button"
                      aria-label={`Trend ${sensor.tag}`}
                      aria-pressed={trended}
                      onClick={() => run(`trend ${sensor.tag}`)}
                      className="font-semibold text-[color:var(--primary-background)] underline-offset-2 outline-none hover:underline focus-visible:underline"
                    >
                      {`${trended ? '►' : ' '} ${sensor.tag}`}
                    </button>
                  </th>
                  <td className="pr-[2ch] text-medium-foreground">{sensor.name}</td>
                  <td className={`pr-[1ch] text-right tabular-nums ${tone === 'neutral' ? '' : NEON_TERMINAL_TONE_TEXT[tone]}`}>
                    {formatValue(bad ? null : sensor.value, sensor.decimals)}
                  </td>
                  <td className="pr-[2ch] text-muted-foreground">{sensor.unit}</td>
                  <td className="pr-[2ch]">
                    <TextMeter
                      value={bad ? null : sensor.value}
                      label={`${sensor.name}, share of range`}
                      min={sensor.rangeMin}
                      max={sensor.rangeMax}
                      width={14}
                      unit={sensor.unit}
                      decimals={sensor.decimals}
                      tone={bad ? 'neutral' : neonFromStatus(tone)}
                    />
                  </td>
                  <td className="pr-[2ch] tabular-nums text-muted-foreground">
                    {`${formatLimit(sensor.lowLimit, sensor.decimals)}–${formatLimit(sensor.highLimit, sensor.decimals)}`}
                  </td>
                  <td className={word === 'OK' ? 'text-muted-foreground' : bad ? 'text-critical-foreground-strong' : 'text-warning-foreground-strong'}>{word}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </BoxPane>
  );
}

function NeonTerminalTrend({ state, active = false, columns = 40, className }: Pick<NeonTerminalSession, 'state'> & { active?: boolean; columns?: number; className?: string }) {
  const sensor = SENSORS.find((candidate) => candidate.tag === state.trendTag);
  return (
    <BoxPane title="Trend" meta={sensor ? `${sensor.tag} · ${sensor.unit}` : undefined} active={active} className={className}>
      {sensor ? (
        <div className="flex flex-col gap-1">
          <span className="text-medium-foreground">{`${sensor.name}, 48 h, limit ${formatLimit(sensor.highLimit, sensor.decimals)}`}</span>
          <CharChart
            values={neonTerminalSeries(sensor)}
            label={`${sensor.tag} ${sensor.name}, last 48 hours`}
            columns={columns}
            rows={6}
            limit={sensor.highLimit}
            unit={sensor.unit}
            decimals={sensor.decimals}
            startLabel="-48 h"
            endLabel="now"
            tone={neonFromStatus(neonTerminalSensorTone(sensor))}
          />
        </div>
      ) : (
        <p className="text-medium-foreground">No tag plotted. Type trend and a tag.</p>
      )}
    </BoxPane>
  );
}

function NeonTerminalAlarmLog({ state, run, active = false, className }: Pick<NeonTerminalSession, 'state' | 'run'> & { active?: boolean; className?: string }) {
  const rows = ALARMS.map((alarm) => ({ alarm, current: effectiveAlarmState(alarm, state.acknowledged) })).filter(
    (row) => state.alarmFilter === 'all' || row.current === 'active'
  );
  return (
    <BoxPane title="Alarm log" meta={state.alarmFilter === 'all' ? `all · ${rows.length}` : `unacknowledged · ${rows.length}`} active={active} tone="warning" className={className}>
      {rows.length === 0 ? (
        <p className="text-medium-foreground">Nothing unacknowledged. Type show alarms all for the whole log.</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="whitespace-nowrap text-left text-muted-foreground">
              <th scope="col" className="pr-[2ch] font-normal">
                ID
              </th>
              <th scope="col" className="pr-[2ch] font-normal">
                SEV
              </th>
              <th scope="col" className="pr-[2ch] font-normal">
                MESSAGE
              </th>
              <th scope="col" className="font-normal">
                STATE
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ alarm, current }) => {
              const severity = severityStatus(alarm.severity);
              return (
                <tr key={alarm.id} className="align-top">
                  <th scope="row" className="whitespace-nowrap pr-[2ch] text-left font-semibold">
                    {alarm.id}
                  </th>
                  <td className={`whitespace-nowrap pr-[2ch] ${NEON_TERMINAL_TONE_TEXT[severity.tone]}`}>{NEON_TERMINAL_SEVERITY_CODE[alarm.severity]}</td>
                  <td className="pr-[2ch]">
                    {alarm.message}
                    <span className="block text-muted-foreground">{`${alarm.sensorTag} \u00b7 ${formatAgo(alarm.raisedAt)}`}</span>
                  </td>
                  <td className="whitespace-nowrap">
                    {current === 'active' ? (
                      <button
                        type="button"
                        onClick={() => run(`ack ${alarm.id}`)}
                        aria-label={`Acknowledge ${alarm.id}`}
                        className="text-[color:var(--primary-background)] underline-offset-2 outline-none hover:underline focus-visible:underline"
                      >
                        [ack]
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{current === 'acknowledged' ? 'acked' : current}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </BoxPane>
  );
}

function NeonTerminalOutput({ lines, active = false, className }: { lines: readonly TerminalLine[]; active?: boolean; className?: string }) {
  const endRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const list = endRef.current?.parentElement?.parentElement;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lines]);

  return (
    <BoxPane title="Output" meta={`${lines.length} lines`} active={active} className={className}>
      <ol role="log" aria-label="Command output" className="whitespace-pre-wrap">
        {lines.map((line, index) => (
          <li key={index} className={NEON_TERMINAL_LINE_STYLE[line.kind].className}>
            <span aria-hidden="true">{NEON_TERMINAL_LINE_STYLE[line.kind].prefix}</span>
            {line.kind === 'error' ? <span className="sr-only">Error: </span> : null}
            {line.text}
          </li>
        ))}
        <li ref={endRef} aria-hidden="true" />
      </ol>
    </BoxPane>
  );
}

function NeonTerminalStatusLine({ state }: Pick<NeonTerminalSession, 'state'>) {
  const counts = neonTerminalAlarmCounts(state);
  const selected = findAsset(state.selectedId);
  return (
    <p role="status" className={`flex flex-wrap gap-x-[2ch] whitespace-pre px-[1ch] font-semibold ${NEON_TERMINAL_INVERSE}`}>
      <span>NORMAL</span>
      <span>{`SEL ${selected?.tag ?? '-'}`}</span>
      <span>{`TREND ${state.trendTag || '-'}`}</span>
      <span>{`ALARMS ${counts.unacknowledged} unack / ${counts.open} open`}</span>
      <span className="ml-auto">{`${formatDateTime(REFERENCE_NOW)} UTC`}</span>
    </p>
  );
}

function NeonTerminalPrompt({ state, dispatch, run }: NeonTerminalSession) {
  const promptId = useId();
  const [value, setValue] = useState('');
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    run(value);
    setValue('');
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // With nothing typed, the arrows drive the tree, so one hand never leaves the prompt.
    if (value !== '' || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    dispatch({ type: 'move', direction: event.key === 'ArrowDown' ? 1 : -1 });
  };
  const selected = findAsset(state.selectedId);

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-[1ch] px-[1ch]">
      <label htmlFor={promptId} className="shrink-0 font-semibold text-[color:var(--primary-background)]">
        <span className="sr-only">Command</span>
        <span aria-hidden="true">{`nk:${selected?.tag ?? ''}>`}</span>
      </label>
      <input
        id={promptId}
        name="command"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Type a command, then Enter. Try help"
        className="min-w-0 flex-1 bg-transparent py-1 text-base-foreground caret-[color:var(--primary-background)] outline-none placeholder:text-muted-foreground focus-visible:bg-[color-mix(in_oklab,var(--primary-background)_10%,transparent)]"
      />
    </form>
  );
}

/** The function keys as command strings, so the legend and the keyboard run the same thing. */
function neonTerminalFunctionKeys(state: TerminalState): readonly { key: string; label: string; command: string }[] {
  const scope = subtreeIds(NEON_TERMINAL_WORLD.nodes, state.selectedId);
  const firstTag = SENSORS.find((sensor) => scope.includes(sensor.assetId) && sensor.tag !== state.trendTag) ?? SENSORS[0];
  const alarm = neonTerminalTopActiveAlarm(state);
  const alarmAsset = alarm ? findAsset(alarm.assetId) : undefined;
  return [
    { key: 'F1', label: 'Help', command: 'help' },
    { key: 'F2', label: state.alarmFilter === 'all' ? 'Unacked' : 'All alarms', command: state.alarmFilter === 'all' ? 'show alarms' : 'show alarms all' },
    { key: 'F3', label: 'Trend next', command: `trend ${firstTag.tag}` },
    { key: 'F4', label: 'Goto alarm', command: alarmAsset ? `goto ${alarmAsset.tag}` : 'show alarms' },
    { key: 'F5', label: 'Ack top', command: alarm ? `ack ${alarm.id}` : 'show alarms' },
    { key: 'F6', label: 'Clear', command: 'clear' },
  ];
}

function NeonTerminalFunctionKeys({ state, run }: Pick<NeonTerminalSession, 'state' | 'run'>) {
  return (
    <ul aria-label="Function keys" className="flex flex-wrap gap-x-[2ch] gap-y-1 px-[1ch]">
      {neonTerminalFunctionKeys(state).map((entry) => (
        <li key={entry.key}>
          <button
            type="button"
            onClick={() => run(entry.command)}
            aria-label={`${entry.key} ${entry.label}: ${entry.command}`}
            className="group flex items-center gap-[1ch] outline-none"
          >
            <span className={`px-[0.5ch] font-semibold ${NEON_TERMINAL_INVERSE}`}>{entry.key}</span>
            <span className="text-medium-foreground underline-offset-2 group-hover:text-base-foreground group-hover:underline group-focus-visible:underline">
              {entry.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function NeonTerminalShell({ children, label, onKeyDown, className = '' }: { children: ReactNode; label: string; onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void; className?: string }) {
  return (
    <div
      role="region"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={`relative overflow-hidden rounded-xl border border-default bg-base-background font-mono text-xs leading-5 text-base-foreground ${className}`.trim()}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,color-mix(in_oklab,var(--primary-background)_6%,transparent)_0,color-mix(in_oklab,var(--primary-background)_6%,transparent)_1px,transparent_1px,transparent_3px)]"
      />
      {children}
    </div>
  );
}

function NeonTerminalScreen({ initialCommands = [] }: { initialCommands?: readonly string[] }) {
  const session = useNeonTerminalSession(
    initialCommands.reduce((state, input) => NEON_TERMINAL_REDUCER(state, { type: 'command', input }), initialTerminalState(NEON_TERMINAL_WORLD))
  );
  const { state, dispatch, run } = session;
  const active = neonTerminalActivePane(state.lines);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const entry = neonTerminalFunctionKeys(state).find((candidate) => candidate.key === event.key);
    if (!entry) return;
    event.preventDefault();
    run(entry.command);
  };

  return (
    <NeonTerminalShell label="Plant console" onKeyDown={handleKeyDown} className="h-[44rem]">
      <div className="relative flex h-full flex-col gap-1 p-3">
        <div className="flex flex-wrap justify-between gap-x-[2ch] px-[1ch]">
          <GlowText variant="label">Nordkapp plant console</GlowText>
          <span className="text-muted-foreground">tty1 · operator ih · read/ack</span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-[21rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)_12rem] gap-x-[1ch] gap-y-1">
          <NeonTerminalTree state={state} dispatch={dispatch} active={active === 'tree'} className="row-span-2" />
          <NeonTerminalTagTable state={state} run={run} active={active === 'tags'} />
          <div className="flex min-h-0 min-w-0 gap-[1ch]">
            <NeonTerminalTrend state={state} active={active === 'trend'} columns={30} className="w-[44ch] shrink-0" />
            <NeonTerminalAlarmLog state={state} run={run} active={active === 'alarms'} className="flex-1" />
          </div>
        </div>
        <NeonTerminalOutput lines={state.lines} active={active === 'output'} className="h-32 shrink-0" />
        <NeonTerminalStatusLine state={state} />
        <NeonTerminalPrompt {...session} />
        <NeonTerminalFunctionKeys state={state} run={run} />
      </div>
    </NeonTerminalShell>
  );
}

function NeonTerminalStage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <ThemeScope preset="night-vision" className="w-full">
      <NeonTerminalShell label="Console part" className={className}>
        <div className="relative flex h-full flex-col gap-2 p-3">{children}</div>
      </NeonTerminalShell>
    </ThemeScope>
  );
}

function NeonTerminalExperience() {
  return (
    <ThemeScope preset="night-vision" className="w-full">
      <NeonTerminalScreen />
    </ThemeScope>
  );
}

function NeonTerminalThemeTerminal() {
  return (
    <ThemeScope preset="terminal" className="w-full">
      <NeonTerminalScreen initialCommands={['goto 23-KA-9101', 'trend 23-TT-92532']} />
    </ThemeScope>
  );
}

function NeonTerminalThemeEmber() {
  return (
    <ThemeScope preset="ember" className="w-full">
      <NeonTerminalScreen initialCommands={['show alarms all', 'ack alm-4811', 'goto NK-23']} />
    </ThemeScope>
  );
}

function NeonTerminalPartTagTable() {
  const session = useNeonTerminalSession({ selectedId: 'nk-23' });
  return (
    <NeonTerminalStage>
      <NeonTerminalTagTable state={session.state} run={session.run} active />
    </NeonTerminalStage>
  );
}

function NeonTerminalPartTree() {
  const session = useNeonTerminalSession({ selectedId: '23-ka-9103', collapsed: ['nk-20'] });
  return (
    <NeonTerminalStage className="h-[21rem]">
      <NeonTerminalTree state={session.state} dispatch={session.dispatch} active className="flex-1" />
    </NeonTerminalStage>
  );
}

function NeonTerminalPartChart() {
  const session = useNeonTerminalSession({ trendTag: '23-VT-92540' });
  return (
    <NeonTerminalStage className="h-[21rem]">
      <NeonTerminalTrend state={session.state} active columns={44} className="flex-1" />
    </NeonTerminalStage>
  );
}

function NeonTerminalPartAlarmLog() {
  const session = useNeonTerminalSession({ alarmFilter: 'all' });
  return (
    <NeonTerminalStage className="h-[24rem]">
      <NeonTerminalAlarmLog state={session.state} run={session.run} active className="flex-1" />
    </NeonTerminalStage>
  );
}

function NeonTerminalPartCommandLine() {
  const session = useNeonTerminalSession({
    lines: [
      { kind: 'input', text: 'trend 23-pt-92531' },
      { kind: 'ok', text: 'Trending 23-PT-92531 Discharge pressure' },
      { kind: 'input', text: 'ack alm-4809' },
      { kind: 'error', text: 'alm-4809 is already acknowledged' },
    ],
  });
  return (
    <NeonTerminalStage className="h-[24rem]">
      <NeonTerminalOutput lines={session.state.lines} active className="min-h-0 flex-1" />
      <NeonTerminalStatusLine state={session.state} />
      <NeonTerminalPrompt {...session} />
    </NeonTerminalStage>
  );
}

function NeonTerminalPartTextMeter() {
  return (
    <NeonTerminalStage>
      <dl className="grid grid-cols-[auto_auto_1fr] items-center gap-x-[2ch] gap-y-1">
        <dt className="text-medium-foreground">Level</dt>
        <dd>
          <TextMeter value={54.3} label="Separator level" unit="%" decimals={1} width={12} />
        </dd>
        <dd className="tabular-nums">54.3 %</dd>
        <dt className="text-medium-foreground">Vibration</dt>
        <dd>
          <TextMeter value={7.6} label="Drive-end vibration" max={15} unit="mm/s" decimals={1} width={12} tone="warning" />
        </dd>
        <dd className="tabular-nums text-warning-foreground-strong">7.6 mm/s HIGH</dd>
        <dt className="text-medium-foreground">Trip</dt>
        <dd>
          <TextMeter value={11.6} label="Recompressor vibration" max={15} unit="mm/s" decimals={1} width={12} tone="critical" />
        </dd>
        <dd className="tabular-nums text-critical-foreground-strong">11.6 mm/s TRIP</dd>
        <dt className="text-medium-foreground">No signal</dt>
        <dd>
          <TextMeter value={null} label="Bearing temperature" max={120} unit="°C" width={12} tone="neutral" />
        </dd>
        <dd className="text-muted-foreground">— BAD Q</dd>
      </dl>
    </NeonTerminalStage>
  );
}

function NeonTerminalPartBoxPane() {
  return (
    <NeonTerminalStage>
      <BoxPane title="Active" meta="bright frame" active>
        <p>The pane the last command acted on.</p>
      </BoxPane>
      <BoxPane title="Resting" meta="dim frame">
        <p className="text-medium-foreground">Every other pane on the screen.</p>
      </BoxPane>
    </NeonTerminalStage>
  );
}

function NeonTerminalPartFunctionKeys() {
  const session = useNeonTerminalSession();
  const last = session.state.lines[session.state.lines.length - 1];
  return (
    <NeonTerminalStage>
      <NeonTerminalFunctionKeys state={session.state} run={session.run} />
      <p role="status" className="px-[1ch] text-medium-foreground">
        {last ? `Last: ${last.text}` : 'Output cleared.'}
      </p>
      <p className="px-[1ch] text-muted-foreground">{`${COMMAND_HELP.length} commands in the grammar. Each key runs one of them.`}</p>
    </NeonTerminalStage>
  );
}

export default definePage({
  id: 'neon-terminal',
  title: 'Neon terminal',
  summary:
    'A text-mode plant: one monospaced screen split into panes with box-drawing characters, bar meters made of block characters, and a command prompt that really drives it. Underneath it is ordinary tables, a tree and a form.',
  guidance: {
    use: [
      'For engineers and operators who live at a keyboard and want every action to be a command they can repeat.',
      'When the same console must run in a constrained or remote environment and look intentional doing it.',
      'Keep real semantics underneath: a tree, tables, a log and a labelled input. The characters are decoration.',
      'Give every command a mouse path too; here tags, alarms and the function-key row are all clickable.',
    ],
    avoid: [
      'As the only way into a product. A prompt has no affordances, so pair it with a conventional screen.',
      'Drawing data with characters where precision matters; the character chart shows shape, not values.',
      'Colour as the only state signal. States are words (HIGH, TRIP, BAD Q) and shapes as well.',
      'Proportional fonts. The screen sets its own monospaced type, whatever the theme says.',
    ],
  },
  source,
  sections: [
    {
      id: 'experience',
      title: 'Experience',
      description:
        'Shown in the Night vision theme. Click the prompt and type help, show alarms all, trend 23-PT-92531, goto 23-KA-9101, ack alm-4811 or clear, then Enter. With the prompt empty, or with the tree focused, the up and down arrows move the selection; left and right fold the tree. F1 to F6 run the legend, which is also clickable.',
      specimens: [
        {
          id: 'NeonTerminalExperience',
          title: 'Neon terminal',
          note: 'Pick it for keyboard-first users who want the whole plant on one screen and every action as a command.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'experiences/futuristic/BoxPane.tsx',
            'experiences/futuristic/TextMeter.tsx',
            'experiences/futuristic/CharChart.tsx',
            'experiences/futuristic/commandParser.ts',
            'experiences/futuristic/terminalSession.ts',
            'experiences/futuristic/textCharts.ts',
            'experiences/futuristic/GlowText.tsx',
            'experiences/futuristic/neon.ts',
            'themes/ThemeScope.tsx',
          ],
          Component: NeonTerminalExperience,
        },
      ],
    },
    {
      id: 'themes',
      title: 'Themes',
      description: 'The same console in two other presets, each after a few commands. The screen keeps its monospaced type in both.',
      specimens: [
        {
          id: 'NeonTerminalThemeTerminal',
          title: 'Terminal',
          note: 'Pick it inside developer tools; neutral dark surfaces, shown after goto and trend.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: NeonTerminalThemeTerminal,
        },
        {
          id: 'NeonTerminalThemeEmber',
          title: 'Ember',
          note: 'Pick it for an amber-phosphor look at high contrast; shown with the whole alarm log and one acknowledgement.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: NeonTerminalThemeEmber,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The panes and their pieces on their own. Each one is interactive here too.',
      specimens: [
        {
          id: 'NeonTerminalPartTagTable',
          title: 'Tag table with bar meters',
          note: 'Pick it for a dense list of readings; the meter shows position in range, the last column says the state.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BoxPane.tsx', 'experiences/futuristic/TextMeter.tsx'],
          Component: NeonTerminalPartTagTable,
        },
        {
          id: 'NeonTerminalPartTree',
          title: 'Process tree',
          note: 'Pick it as the navigation pane; arrows move and fold, and a glyph carries the run state.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BoxPane.tsx', 'experiences/futuristic/terminalSession.ts'],
          Component: NeonTerminalPartTree,
        },
        {
          id: 'NeonTerminalPartChart',
          title: 'Character chart',
          note: 'Pick it to show the shape of a trend in text mode, with its limit as a dashed row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/CharChart.tsx', 'experiences/futuristic/textCharts.ts', 'experiences/futuristic/BoxPane.tsx'],
          Component: NeonTerminalPartChart,
        },
        {
          id: 'NeonTerminalPartAlarmLog',
          title: 'Alarm log',
          note: 'Pick it for the alarm pane; active rows carry their own acknowledge action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BoxPane.tsx', 'experiences/futuristic/terminalSession.ts'],
          Component: NeonTerminalPartAlarmLog,
        },
        {
          id: 'NeonTerminalPartCommandLine',
          title: 'Command line',
          note: 'Pick the output, status line and prompt together; errors are printed in words, never only in colour.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/commandParser.ts', 'experiences/futuristic/terminalSession.ts', 'experiences/futuristic/BoxPane.tsx'],
          Component: NeonTerminalPartCommandLine,
        },
        {
          id: 'NeonTerminalPartTextMeter',
          title: 'Text meters',
          note: 'Pick one wherever a bar has to live inside a line of monospaced text.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/TextMeter.tsx', 'experiences/futuristic/textCharts.ts'],
          Component: NeonTerminalPartTextMeter,
        },
        {
          id: 'NeonTerminalPartBoxPane',
          title: 'Box pane',
          note: 'Pick it to frame any region of a text-mode screen; mark only one pane active at a time.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/BoxPane.tsx'],
          Component: NeonTerminalPartBoxPane,
        },
        {
          id: 'NeonTerminalPartFunctionKeys',
          title: 'Function-key legend',
          note: 'Pick it as the mouse path to the commands; each key shows what it will run.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          surface: 'muted',
          uses: ['experiences/futuristic/commandParser.ts', 'experiences/futuristic/terminalSession.ts'],
          Component: NeonTerminalPartFunctionKeys,
        },
      ],
    },
  ],
});
