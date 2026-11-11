import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconAlertTriangle,
  IconCamera,
  IconCircleCheck,
  IconClipboardCheck,
  IconClock,
  IconCloudOff,
  IconCloudUpload,
  IconPlayerSkipForward,
  IconRefresh,
  IconRoute,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Bars } from '../../../library/kit/Bars';
import { Canvas } from '../../../library/kit/Canvas';
import { DataTable, type DataTableColumn } from '../../../library/kit/DataTable';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { CheckpointList } from '../../../library/kit/inspection-rounds/CheckpointList';
import { ReadingEntry } from '../../../library/kit/inspection-rounds/ReadingEntry';
import { ResultStrip } from '../../../library/kit/inspection-rounds/ResultStrip';
import { RoundCard, type RoundState } from '../../../library/kit/inspection-rounds/RoundCard';
import {
  RESULT_TONE,
  RESULT_WORD,
  judgeReading,
  roundProgress,
  type Checkpoint,
  type CheckpointResult,
} from '../../../library/kit/inspection-rounds/rounds';
import { RouteStepper, type RouteStop } from '../../../library/kit/inspection-rounds/RouteStepper';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { SectionHeader } from '../../../library/kit/SectionHeader';
import { Stat } from '../../../library/kit/Stat';
import { StatGroup } from '../../../library/kit/StatGroup';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import type { LookId } from '../../../library/looks/looks';
import { LookScope } from '../../../library/looks/LookScope';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './inspection-rounds.tsx?raw';

const INSPECTION_ROUNDS_CHECKPOINTS: Checkpoint[] = [
  { id: 'cp-1', tag: '20-PT-10010', name: 'Separator pressure', location: 'Inlet deck', unit: 'barg', low: 11, high: 15, value: 13.1, result: 'pass' },
  { id: 'cp-2', tag: '20-LT-10012', name: 'Separator level', location: 'Inlet deck', unit: '%', low: 30, high: 70, value: 54.3, result: 'pass' },
  { id: 'cp-3', tag: '23-PT-92531', name: 'Discharge pressure', location: 'Compressor hall, level 2', unit: 'barg', low: 40, high: 52, value: 48.6, result: 'pass' },
  { id: 'cp-4', tag: '23-VT-92540', name: 'Drive-end vibration', location: 'Compressor hall, level 2', unit: 'mm/s', high: 7.1, value: 7.6, result: 'fail', note: '0.5 above the high limit' },
  { id: 'cp-5', tag: '23-KA-9101', name: 'Lube oil sight glass', location: 'Compressor hall, level 1', result: 'pass' },
  { id: 'cp-6', tag: '23-HA-9114', name: 'Cooler flanges, leak check', location: 'Cooler deck', result: 'skipped', note: 'Scaffolding blocks access' },
  { id: 'cp-7', tag: '23-TT-91141', name: 'Cooler outlet temperature', location: 'Cooler deck', unit: '°C', low: 20, high: 40, result: 'pending' },
  { id: 'cp-8', tag: '27-IT-20013', name: 'Export pump motor current', location: 'Export pump room', unit: 'A', low: 40, high: 95, result: 'pending' },
];

const INSPECTION_ROUNDS_RESULTS: CheckpointResult[] = INSPECTION_ROUNDS_CHECKPOINTS.map((checkpoint) => checkpoint.result);

type InspectionRoundsRound = {
  id: string;
  name: string;
  area: string;
  state: RoundState;
  timing: string;
  assignee: string;
  results: CheckpointResult[];
};

function inspectionRoundsResults(pass: number, fail: number, skipped: number, pending: number): CheckpointResult[] {
  return [
    ...Array.from({ length: pass }, (): CheckpointResult => 'pass'),
    ...Array.from({ length: fail }, (): CheckpointResult => 'fail'),
    ...Array.from({ length: skipped }, (): CheckpointResult => 'skipped'),
    ...Array.from({ length: pending }, (): CheckpointResult => 'pending'),
  ];
}

const INSPECTION_ROUNDS_ROUNDS: InspectionRoundsRound[] = [
  { id: 'r-1', name: 'Compressor hall', area: 'NK-23 · every 8 hours', state: 'in-progress', timing: 'Due 15:00', assignee: 'Tomás Barros', results: INSPECTION_ROUNDS_RESULTS },
  { id: 'r-2', name: 'Export pump room', area: 'NK-27 · every 12 hours', state: 'overdue', timing: 'Due 08:00, 6 h late', assignee: 'Unassigned', results: inspectionRoundsResults(0, 0, 0, 10) },
  { id: 'r-3', name: 'Inlet deck', area: 'NK-20 · every 8 hours', state: 'done', timing: 'Finished 11:42', assignee: 'Jonas Nyberg', results: inspectionRoundsResults(11, 0, 1, 0) },
  { id: 'r-4', name: 'Cooling water', area: 'NK-40 · daily', state: 'scheduled', timing: 'Starts 18:00', assignee: 'Jonas Nyberg', results: inspectionRoundsResults(0, 0, 0, 9) },
  { id: 'r-5', name: 'Safety showers', area: 'Site · weekly', state: 'done', timing: 'Finished 09:15', assignee: 'Liv Wold', results: inspectionRoundsResults(13, 1, 0, 0) },
];

const INSPECTION_ROUNDS_STATE_TONE: Record<RoundState, Tone> = {
  scheduled: 'neutral',
  'in-progress': 'info',
  overdue: 'critical',
  done: 'success',
};

const INSPECTION_ROUNDS_STATE_WORD: Record<RoundState, string> = {
  scheduled: 'Scheduled',
  'in-progress': 'In progress',
  overdue: 'Overdue',
  done: 'Done',
};

const INSPECTION_ROUNDS_COLUMNS: DataTableColumn<InspectionRoundsRound>[] = [
  {
    id: 'round',
    header: 'Round',
    cell: (round) => (
      <span className="flex flex-col">
        <span className="font-medium">{round.name}</span>
        <span className="text-xs text-(--kit-text-2)">{round.area}</span>
      </span>
    ),
  },
  { id: 'route', header: 'Route', width: 'w-56', cell: (round) => <ResultStrip label={round.name} results={round.results} /> },
  {
    id: 'done',
    header: 'Done',
    numeric: true,
    nowrap: true,
    cell: (round) => {
      const progress = roundProgress(round.results);
      return `${progress.done} of ${progress.total}`;
    },
  },
  { id: 'findings', header: 'Findings', numeric: true, cell: (round) => roundProgress(round.results).failed },
  { id: 'who', header: 'Operator', muted: true, nowrap: true, cell: (round) => round.assignee },
  { id: 'when', header: 'Timing', muted: true, nowrap: true, cell: (round) => round.timing },
  { id: 'state', header: 'State', nowrap: true, cell: (round) => <StatusPill tone={INSPECTION_ROUNDS_STATE_TONE[round.state]}>{INSPECTION_ROUNDS_STATE_WORD[round.state]}</StatusPill> },
];

const INSPECTION_ROUNDS_CHECKPOINT_COLUMNS: DataTableColumn<Checkpoint>[] = [
  { id: 'name', header: 'Checkpoint', cell: (checkpoint) => checkpoint.name },
  { id: 'tag', header: 'Tag', nowrap: true, cell: (checkpoint) => <TagId>{checkpoint.tag}</TagId> },
  { id: 'where', header: 'Location', muted: true, cell: (checkpoint) => checkpoint.location },
  { id: 'value', header: 'Reading', numeric: true, nowrap: true, cell: (checkpoint) => (checkpoint.value === undefined ? '—' : `${checkpoint.value.toFixed(1)} ${checkpoint.unit ?? ''}`) },
  {
    id: 'limits',
    header: 'Limits',
    numeric: true,
    muted: true,
    nowrap: true,
    cell: (checkpoint) => (checkpoint.high === undefined ? 'Visual' : `${checkpoint.low === undefined ? '' : `${checkpoint.low}–`}${checkpoint.high}`),
  },
  { id: 'result', header: 'Result', nowrap: true, cell: (checkpoint) => <StatusPill tone={RESULT_TONE[checkpoint.result]}>{RESULT_WORD[checkpoint.result]}</StatusPill> },
];

const INSPECTION_ROUNDS_STOPS: RouteStop[] = [
  { id: 'inlet', name: 'Inlet deck', detail: '2 of 2 checkpoints', state: 'done' },
  { id: 'hall', name: 'Compressor hall', detail: '3 of 3 checkpoints', state: 'issue' },
  { id: 'cooler', name: 'Cooler deck', detail: '1 of 2 checkpoints', state: 'current' },
  { id: 'export', name: 'Export pump room', detail: '0 of 1 checkpoints', state: 'upcoming' },
];

type InspectionRoundsFinding = { id: string; title: string; tag: string; detail: string; tone: Tone; word: string; age: string };

const INSPECTION_ROUNDS_FINDINGS: InspectionRoundsFinding[] = [
  { id: 'f-1', title: 'Drive-end vibration above limit', tag: '23-VT-92540', detail: '7.6 mm/s against 7.1 mm/s · photo attached', tone: 'critical', word: 'High', age: '12 min ago' },
  { id: 'f-2', title: 'Oil film on cooler drip tray', tag: '23-HA-9114', detail: 'About 0.2 l · wiped, source not found', tone: 'warning', word: 'Medium', age: '3 h ago' },
  { id: 'f-3', title: 'Eyewash station seal broken', tag: 'NK-23-SS-04', detail: 'Flushed and resealed on the round', tone: 'info', word: 'Fixed on site', age: '5 h ago' },
  { id: 'f-4', title: 'Tag plate unreadable', tag: '27-PA-2001B', detail: 'New plate ordered, WO-104491', tone: 'neutral', word: 'Low', age: 'Yesterday' },
];

const INSPECTION_ROUNDS_HISTORY = makeValues({ seed: 14, points: 14, base: 6.2, amplitude: 0.3, noise: 0.15, drift: 1.3, decimals: 1 });

const INSPECTION_ROUNDS_HISTORY_LABELS = ['27 Feb', '28 Feb', '1 Mar', '2 Mar', '3 Mar', '4 Mar', '5 Mar', '6 Mar', '7 Mar', '8 Mar', '9 Mar', '10 Mar', '11 Mar', '12 Mar'];

const INSPECTION_ROUNDS_SKIP_REASONS = ['No safe access', 'Equipment isolated', 'Instrument out of service', 'Out of time'];

type InspectionRoundsChoice = 'pass' | 'fail' | 'skipped';

function isInspectionRoundsChoice(value: string): value is InspectionRoundsChoice {
  return value === 'pass' || value === 'fail' || value === 'skipped';
}

/** One sheet of the page: a look scope with its canvas. Without a look it follows the app's look. */
function InspectionRoundsSheet({ look, children }: { look?: LookId; children: ReactNode }) {
  const canvas = <Canvas className="h-full">{children}</Canvas>;
  return look ? (
    <LookScope look={look} className="h-full w-full">
      {canvas}
    </LookScope>
  ) : (
    <div className="h-full w-full">{canvas}</div>
  );
}

function InspectionRoundsCards() {
  return (
    <InspectionRoundsSheet>
      <Grid>
        <RoundCard
          className="col-span-4"
          {...INSPECTION_ROUNDS_ROUNDS[0]}
          icon={<IconRoute />}
          action={<Button size="sm">Continue</Button>}
        />
        <RoundCard
          className="col-span-4"
          {...INSPECTION_ROUNDS_ROUNDS[1]}
          icon={<IconClock />}
          action={
            <Button size="sm" variant="secondary">
              Assign
            </Button>
          }
        />
        <RoundCard
          className="col-span-4"
          {...INSPECTION_ROUNDS_ROUNDS[2]}
          icon={<IconCircleCheck />}
          action={
            <Button size="sm" variant="ghost">
              Open report
            </Button>
          }
        />
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsSchedule() {
  return (
    <InspectionRoundsSheet>
      <Grid>
        <StatGroup className="col-span-12" columns={4} label="Rounds today">
          <Stat label="Rounds today" value={5} icon={<IconClipboardCheck />} tone="blue" target="2 done, 1 in progress" />
          <Stat label="Checkpoints done" value={34} unit="of 53" icon={<IconCircleCheck />} tone="green" target="64 % of today's route" />
          <Stat label="Open findings" value={2} icon={<IconAlertTriangle />} tone="critical" target="1 high, 1 medium" />
          <Stat label="Overdue" value={1} icon={<IconClock />} tone="amber" target="Export pump room, 6 h late" />
        </StatGroup>
        <Panel className="col-span-12" title="Today's rounds" subtitle="Thursday 12 March, day shift" padding="none">
          <DataTable
            label="Today's rounds"
            flush
            columns={INSPECTION_ROUNDS_COLUMNS}
            rows={INSPECTION_ROUNDS_ROUNDS}
            rowKey={(round) => round.id}
            rowTone={(round) => (round.state === 'overdue' ? 'critical' : undefined)}
          />
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsRoute() {
  return (
    <InspectionRoundsSheet>
      <Panel
        title="Compressor hall round"
        subtitle="Four areas, eight checkpoints, about 45 minutes"
        icon={<IconRoute />}
        actions={<StatusPill tone="info">In progress</StatusPill>}
        footer={<span className="text-sm text-(--kit-text-2)">Started 13:20 by Tomás Barros · 25 minutes on the route</span>}
      >
        <RouteStepper label="Route progress, compressor hall round" stops={INSPECTION_ROUNDS_STOPS} />
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsCheckpoints() {
  const [current, setCurrent] = useState('cp-7');
  return (
    <InspectionRoundsSheet>
      <Panel title="Checkpoints" subtitle="Select a stop to open it" padding="tight">
        <CheckpointList label="Checkpoints, compressor hall round" checkpoints={INSPECTION_ROUNDS_CHECKPOINTS.slice(2, 7)} current={current} onSelect={setCurrent} />
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsReading() {
  const [value, setValue] = useState('41.3');
  return (
    <InspectionRoundsSheet>
      <Panel
        title="Cooler outlet temperature"
        subtitle="Checkpoint 7 of 8 · Cooler deck"
        actions={<TagId variant="chip">23-TT-91141</TagId>}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <Button variant="ghost" size="sm">
              <IconCamera />
              Add photo
            </Button>
            <Button size="sm">Save and continue</Button>
          </div>
        }
      >
        <ReadingEntry label="Local gauge reading" unit="°C" value={value} onChange={setValue} low={20} high={40} min={0} max={60} previous={38.9} />
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsVerdict() {
  const [choice, setChoice] = useState<InspectionRoundsChoice>('skipped');
  const [reason, setReason] = useState(INSPECTION_ROUNDS_SKIP_REASONS[0]);
  const tone = RESULT_TONE[choice];
  return (
    <InspectionRoundsSheet>
      <Panel
        title="Cooler flanges, leak check"
        subtitle="Checkpoint 6 of 8 · visual check"
        actions={<StatusPill tone={tone}>{RESULT_WORD[choice]}</StatusPill>}
        footer={<span className="text-sm text-(--kit-text-2)">{choice === 'skipped' ? `Skipped: ${reason.toLowerCase()}. The supervisor is told at sign-off.` : choice === 'fail' ? 'A finding is raised when you save.' : 'Nothing more is needed.'}</span>}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-(--kit-text-2)">Look for wet flanges, staining or dripping on all four cooler nozzles.</p>
          <SegmentedControl
            value={choice}
            onValueChange={(value: string) => {
              if (isInspectionRoundsChoice(value)) setChoice(value);
            }}
          >
            <SegmentedControlList aria-label="Result">
              <SegmentedControlButton value="pass">Pass</SegmentedControlButton>
              <SegmentedControlButton value="fail">Fail</SegmentedControlButton>
              <SegmentedControlButton value="skipped">Skip</SegmentedControlButton>
            </SegmentedControlList>
          </SegmentedControl>
          {choice === 'skipped' ? (
            <div role="radiogroup" aria-label="Reason for skipping" className="grid grid-cols-2 gap-2">
              {INSPECTION_ROUNDS_SKIP_REASONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={option === reason}
                  onClick={() => setReason(option)}
                  className={`rounded-(--kit-radius-sm) border px-3 py-2 text-left text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-(--kit-accent) ${option === reason ? 'kit-tone-warning border-(--t-solid) bg-(--t-soft) text-(--t-on-soft)' : 'border-(--kit-rule-strong) text-(--kit-text)'}`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsSync() {
  return (
    <InspectionRoundsSheet>
      <Panel
        title="Saved on this tablet"
        subtitle="No signal in the compressor hall since 13:31"
        icon={<IconCloudOff />}
        tone="warning"
        actions={
          <Button size="sm" variant="secondary">
            <IconRefresh />
            Try now
          </Button>
        }
        footer={<span className="text-sm text-(--kit-text-2)">Readings are kept on the tablet and sent in order when it reconnects.</span>}
      >
        <div className="flex flex-col">
          <ListRow
            tone="success"
            leading={
              <IconChip tone="success" size="sm">
                <IconCircleCheck />
              </IconChip>
            }
            title="Discharge pressure, 48.6 barg"
            meta="Sent 13:29"
            trailing={<StatusPill tone="success">Synced</StatusPill>}
          />
          <ListRow
            tone="warning"
            leading={
              <IconChip tone="warning" size="sm">
                <IconCloudOff />
              </IconChip>
            }
            title="Drive-end vibration, 7.6 mm/s"
            meta="Saved 13:34 · with 1 photo"
            trailing={<StatusPill tone="warning">Waiting</StatusPill>}
          />
          <ListRow
            tone="warning"
            leading={
              <IconChip tone="warning" size="sm">
                <IconCloudOff />
              </IconChip>
            }
            title="Lube oil sight glass, pass"
            meta="Saved 13:38"
            trailing={<StatusPill tone="warning">Waiting</StatusPill>}
          />
          <ListRow
            tone="info"
            leading={
              <IconChip tone="info" size="sm">
                <IconCloudUpload />
              </IconChip>
            }
            title="Cooler flanges, skipped"
            meta="Sending now"
            trailing={<StatusPill tone="info">Sending</StatusPill>}
          />
        </div>
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsHistory() {
  return (
    <InspectionRoundsSheet>
      <Panel title="Drive-end vibration" subtitle="Field readings from the last 14 rounds" actions={<TagId variant="chip">23-VT-92540</TagId>}>
        <TrendLine
          label="Drive-end vibration field readings over the last 14 rounds, against the high limit"
          labels={INSPECTION_ROUNDS_HISTORY_LABELS}
          unit="mm/s"
          decimals={1}
          height={220}
          yDomain={[5, 9]}
          series={[{ id: 'reading', label: 'Field reading', values: INSPECTION_ROUNDS_HISTORY, tone: 'accent' }]}
          limits={[{ value: 7.1, label: 'High limit', tone: 'critical' }]}
          bands={[{ from: 5, to: 7.1, tone: 'success' }]}
          notes="Readings have climbed steadily since 6 March and now sit above the high limit."
        />
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsFindings() {
  return (
    <InspectionRoundsSheet>
      <Panel title="Findings" subtitle="Raised on rounds in the last 24 hours" icon={<IconAlertTriangle />} actions={<Button size="sm" variant="ghost">View all</Button>}>
        <div className="flex flex-col">
          {INSPECTION_ROUNDS_FINDINGS.map((finding) => (
            <ListRow
              key={finding.id}
              tone={finding.tone}
              title={finding.title}
              meta={
                <>
                  <TagId>{finding.tag}</TagId> · {finding.detail}
                </>
              }
              trailing={
                <span className="flex flex-col items-end gap-1">
                  <StatusPill tone={finding.tone}>{finding.word}</StatusPill>
                  <span className="text-xs text-(--kit-text-2)">{finding.age}</span>
                </span>
              }
            />
          ))}
        </div>
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsSignOff() {
  const [confirmed, setConfirmed] = useState(false);
  const [signed, setSigned] = useState(false);
  const progress = roundProgress(inspectionRoundsResults(11, 1, 1, 0));
  return (
    <InspectionRoundsSheet>
      <Panel
        title="Sign off the round"
        subtitle="Inlet deck round · finished 11:42"
        icon={<IconClipboardCheck />}
        actions={<StatusPill tone={signed ? 'success' : 'neutral'}>{signed ? 'Signed' : 'Not signed'}</StatusPill>}
        footer={
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-sm text-(--kit-text-2)">{signed ? 'Signed by Jonas Nyberg at 11:44. Sent to Liv Wold.' : 'Signing sends the round to the shift supervisor.'}</span>
            <Button size="sm" disabled={!confirmed || signed} onClick={() => setSigned(true)}>
              Sign off
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <StatGroup joined columns={3} label="Round summary">
            <Stat variant="plain" size="sm" label="Passed" value={progress.passed} tone="success" />
            <Stat variant="plain" size="sm" label="Failed" value={progress.failed} tone="critical" />
            <Stat variant="plain" size="sm" label="Skipped" value={progress.skipped} tone="warning" />
          </StatGroup>
          <ResultStrip label="Inlet deck round" results={inspectionRoundsResults(11, 1, 1, 0)} size="lg" />
          <CheckboxItem>
            <CheckboxItemControl checked={confirmed} disabled={signed} onCheckedChange={(checked) => setConfirmed(checked === true)} />
            <CheckboxItemLabel>I walked the route and the readings are mine</CheckboxItemLabel>
          </CheckboxItem>
        </div>
      </Panel>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsConsole() {
  const progress = roundProgress(INSPECTION_ROUNDS_RESULTS);
  return (
    <InspectionRoundsSheet look="console">
      <Grid>
        <StatGroup className="col-span-12" columns={5} label="Compressor hall round">
          <Stat variant="plain" label="Round" value="NK-23" target="Compressor hall · due 15:00" />
          <Stat variant="plain" label="Done" value={progress.done} unit={`of ${progress.total}`} tone="info" target={`${progress.percent} % of the route`} />
          <Stat variant="plain" label="Passed" value={progress.passed} tone="success" target="Within limits" />
          <Stat variant="plain" label="Failed" value={progress.failed} tone="critical" target="Vibration, 23-VT-92540" />
          <Stat variant="plain" label="Skipped" value={progress.skipped} tone="warning" target="No access, cooler deck" />
        </StatGroup>
        <Panel className="col-span-12" title="Checkpoints" subtitle="In route order" padding="none">
          <DataTable
            label="Checkpoints in route order"
            flush
            columns={INSPECTION_ROUNDS_CHECKPOINT_COLUMNS}
            rows={INSPECTION_ROUNDS_CHECKPOINTS}
            rowKey={(checkpoint) => checkpoint.id}
            rowTone={(checkpoint) => (checkpoint.result === 'fail' || checkpoint.result === 'skipped' ? RESULT_TONE[checkpoint.result] : undefined)}
          />
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsPoster() {
  return (
    <InspectionRoundsSheet look="poster">
      <Grid>
        <Stat className="col-span-5" size="hero" tone="blue" label="Checkpoints done today" value={34} unit="of 53" />
        <Stat className="col-span-4" size="hero" tone="pink" label="Open findings" value={2} />
        <Stat className="col-span-3" size="hero" tone="amber" label="Overdue rounds" value={1} />
        <Panel className="col-span-12" title="Rounds today">
          <div className="flex flex-col gap-4">
            {INSPECTION_ROUNDS_ROUNDS.slice(0, 4).map((round) => {
              const progress = roundProgress(round.results);
              return (
                <div key={round.id} className="grid grid-cols-[14rem_minmax(0,1fr)_5rem_7.5rem] items-center gap-4">
                  <span className="text-base font-semibold">{round.name}</span>
                  <ResultStrip label={round.name} results={round.results} size="lg" />
                  <span className="text-right text-base font-semibold tabular-nums">
                    {progress.done}/{progress.total}
                  </span>
                  <StatusPill className="justify-self-end" tone={INSPECTION_ROUNDS_STATE_TONE[round.state]}>
                    {INSPECTION_ROUNDS_STATE_WORD[round.state]}
                  </StatusPill>
                </div>
              );
            })}
          </div>
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsBlueprint() {
  return (
    <InspectionRoundsSheet look="blueprint">
      <Grid>
        <Panel className="col-span-12" title="Route sheet" subtitle="Compressor hall round · rev C · 8 checkpoints">
          <RouteStepper label="Route sheet, compressor hall round" stops={INSPECTION_ROUNDS_STOPS} />
        </Panel>
        <Panel className="col-span-7" title="Checkpoints 3 to 6" subtitle="Compressor hall and cooler deck" padding="tight">
          <CheckpointList label="Checkpoints 3 to 6" checkpoints={INSPECTION_ROUNDS_CHECKPOINTS.slice(2, 6)} current="cp-4" />
        </Panel>
        <Panel className="col-span-5" title="Reading 23-VT-92540" subtitle="Drive-end vibration, taken 13:34">
          <ReadingEntry label="Handheld meter" unit="mm/s" value="7.6" onChange={() => undefined} high={7.1} min={0} max={15} previous={6.8} />
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsSignal() {
  return (
    <InspectionRoundsSheet look="signal">
      <Grid>
        <Stat className="col-span-3" size="lg" tone="critical" state="Overdue" stateIcon={<IconClock />} label="Export pump room" value="0 of 10" target="Due 08:00 · unassigned" />
        <Stat className="col-span-3" size="lg" tone="warning" state="Finding" stateIcon={<IconAlertTriangle />} label="Compressor hall" value="6 of 8" target="Vibration above limit" />
        <Stat className="col-span-3" size="lg" tone="success" state="Done" stateIcon={<IconCircleCheck />} label="Inlet deck" value="12 of 12" target="Finished 11:42" />
        <Stat className="col-span-3" size="lg" tone="neutral" state="Later" stateIcon={<IconClock />} label="Cooling water" value="0 of 9" target="Starts 18:00" />
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsGlass() {
  return (
    <InspectionRoundsSheet look="glass">
      <Grid>
        <Panel className="col-span-7" title="Round completion" subtitle="Share of checkpoints done today, by area">
          <div className="flex h-full items-center justify-around gap-4">
            <RingGauge label="Inlet deck" value={100} tone="green" size={124} />
            <RingGauge label="Compressor hall" value={75} tone="sky" size={124} />
            <RingGauge label="Export pump room" value={0} tone="pink" size={124} />
            <RingGauge label="Cooling water" value={0} tone="neutral" size={124} />
          </div>
        </Panel>
        <Panel className="col-span-5" title="Next on the route" subtitle="Compressor hall round" footer={<Button size="sm">Open checkpoint 7</Button>}>
          <div className="flex flex-col">
            <ListRow tone="accent" title="Cooler outlet temperature" meta="23-TT-91141 · Cooler deck" trailing={<StatusPill tone="accent">Next</StatusPill>} />
            <ListRow title="Export pump motor current" meta="27-IT-20013 · Export pump room" trailing={<StatusPill>To do</StatusPill>} />
          </div>
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsEditorial() {
  return (
    <InspectionRoundsSheet look="editorial">
      <Grid>
        <SectionHeader
          className="col-span-12"
          eyebrow="Round report · Thursday 12 March"
          title="One reading over its limit, one stop not reached"
          description="Tomás Barros walked the compressor hall round between 13:20 and 14:05. Vibration at the drive end read 7.6 mm/s; the cooler flanges could not be reached past the scaffolding."
        />
        <StatGroup className="col-span-12" columns={4} label="Round figures">
          <Stat variant="plain" size="lg" label="Checkpoints done" value={6} unit="of 8" />
          <Stat variant="plain" size="lg" label="Within limits" value={4} />
          <Stat variant="plain" size="lg" label="Findings" value={1} tone="critical" />
          <Stat variant="plain" size="lg" label="Time on route" value={45} unit="min" />
        </StatGroup>
        <Panel className="col-span-12" title="The route, stop by stop">
          <CheckpointList label="The route, stop by stop" checkpoints={INSPECTION_ROUNDS_CHECKPOINTS.slice(2, 6)} />
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsSoft() {
  return (
    <InspectionRoundsSheet look="soft">
      <Grid>
        <SectionHeader className="col-span-12" size="sm" level={4} title="Good afternoon, Tomás" description="Two stops left on your round. One round is waiting for someone." />
        <RoundCard className="col-span-6" {...INSPECTION_ROUNDS_ROUNDS[0]} icon={<IconRoute />} action={<Button size="sm">Continue</Button>} />
        <RoundCard
          className="col-span-6"
          {...INSPECTION_ROUNDS_ROUNDS[3]}
          icon={<IconClock />}
          action={
            <Button size="sm" variant="secondary">
              Start early
            </Button>
          }
        />
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsFieldScreen() {
  const [checkpoints, setCheckpoints] = useState(INSPECTION_ROUNDS_CHECKPOINTS);
  const [currentId, setCurrentId] = useState('cp-7');
  const [draft, setDraft] = useState('');
  const current = checkpoints.find((checkpoint) => checkpoint.id === currentId) ?? checkpoints[0];
  const index = checkpoints.indexOf(current);
  const progress = roundProgress(checkpoints.map((checkpoint) => checkpoint.result));
  const hasReading = current.unit !== undefined;
  const parsed = draft.trim() === '' ? undefined : Number(draft);

  const record = (result: CheckpointResult, value?: number, note?: string) => {
    const updated = checkpoints.map((checkpoint) => (checkpoint.id === current.id ? { ...checkpoint, result, value: value ?? checkpoint.value, note } : checkpoint));
    setCheckpoints(updated);
    const next = updated.find((checkpoint) => checkpoint.result === 'pending');
    if (next) setCurrentId(next.id);
    setDraft('');
  };

  const select = (id: string) => {
    setCurrentId(id);
    setDraft('');
  };

  return (
    <InspectionRoundsSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title="Compressor hall round"
          description={`${progress.done} of ${progress.total} checkpoints · due 15:00`}
          actions={
            <StatusPill tone={progress.failed > 0 ? 'critical' : 'info'} icon={progress.failed > 0 ? <IconAlertTriangle /> : undefined}>
              {progress.failed > 0 ? `${progress.failed} ${progress.failed === 1 ? 'finding' : 'findings'}` : 'In progress'}
            </StatusPill>
          }
        />
        <div className="col-span-12">
          <ResultStrip label="Compressor hall round" results={checkpoints.map((checkpoint) => checkpoint.result)} size="lg" />
        </div>
        <Panel className="col-span-5" title="Route" subtitle="Tap a stop to open it" padding="tight">
          <CheckpointList label="Route, compressor hall round" checkpoints={checkpoints} current={current.id} onSelect={select} density="compact" />
        </Panel>
        <Panel
          className="col-span-7"
          title={current.name}
          subtitle={`Checkpoint ${index + 1} of ${checkpoints.length} · ${current.location}`}
          actions={<TagId variant="chip">{current.tag}</TagId>}
          footer={
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" size="sm" onClick={() => record('skipped', undefined, 'Skipped: no safe access')}>
                <IconPlayerSkipForward />
                Skip with a reason
              </Button>
              {hasReading ? (
                <Button
                  size="sm"
                  disabled={parsed === undefined || Number.isNaN(parsed)}
                  onClick={() => {
                    if (parsed === undefined) return;
                    const verdict = judgeReading(parsed, current.low, current.high);
                    record(verdict.result, parsed, verdict.result === 'fail' ? verdict.text : undefined);
                  }}
                >
                  Save reading
                </Button>
              ) : (
                <span className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => record('fail', undefined, 'Failed the visual check')}>
                    Fail
                  </Button>
                  <Button size="sm" onClick={() => record('pass')}>
                    Pass
                  </Button>
                </span>
              )}
            </div>
          }
        >
          <div className="flex flex-col gap-4">
            {current.result === 'pending' ? null : (
              <p data-tone={RESULT_TONE[current.result]} className="rounded-(--kit-radius-sm) bg-(--t-soft) px-3 py-2 text-sm font-medium text-(--t-on-soft)">
                Recorded: {RESULT_WORD[current.result].toLowerCase()}
                {current.note ? ` · ${current.note}` : ''}. Saving again replaces it.
              </p>
            )}
            {hasReading ? (
              <ReadingEntry
                label="Reading"
                unit={current.unit ?? ''}
                value={draft}
                onChange={setDraft}
                low={current.low}
                high={current.high}
                min={0}
                max={Math.round((current.high ?? 100) * 1.5)}
                previous={current.value}
              />
            ) : (
              <p className="text-sm text-(--kit-text-2)">Visual check. Look, listen and smell for leaks, loose guards and anything that has changed since the last round.</p>
            )}
            <div className="border-t border-(--kit-rule) pt-4">
              <p className="text-sm font-medium">How to take it</p>
              <p className="mt-1 text-sm text-(--kit-text-2)">
                {hasReading ? 'Read the local gauge, not the control room value. Wait until the needle is steady, then type what you see.' : 'Stand at the marked spot. Compare with the reference photo before you decide.'}
              </p>
            </div>
            <StatGroup joined columns={4} label="Earlier rounds at this stop">
              <Stat variant="plain" size="sm" label="Today 06:00" value={hasReading ? (current.high ?? 0) * 0.94 : 'Pass'} decimals={1} unit={current.unit} />
              <Stat variant="plain" size="sm" label="Yesterday 22:00" value={hasReading ? (current.high ?? 0) * 0.92 : 'Pass'} decimals={1} unit={current.unit} />
              <Stat variant="plain" size="sm" label="Yesterday 14:00" value={hasReading ? (current.high ?? 0) * 0.93 : 'Pass'} decimals={1} unit={current.unit} />
              <Stat variant="plain" size="sm" label="Yesterday 06:00" value={hasReading ? (current.high ?? 0) * 0.9 : 'Pass'} decimals={1} unit={current.unit} />
            </StatGroup>
          </div>
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

function InspectionRoundsSupervisor() {
  return (
    <InspectionRoundsSheet>
      <Grid>
        <SectionHeader
          className="col-span-12"
          size="sm"
          level={4}
          title="Operator rounds"
          description="Nordkapp · day shift, Thursday 12 March"
          actions={
            <Button size="sm" variant="secondary">
              <IconTool />
              Plan rounds
            </Button>
          }
        />
        <Stat className="col-span-3" label="Completed on time" value={92} unit="%" icon={<IconCircleCheck />} tone="green" delta={{ value: 3, decimals: 0, unit: ' pts', caption: 'vs last week' }} target="Target 95 %" />
        <Stat className="col-span-3" label="Checkpoints done" value={34} unit="of 53" icon={<IconClipboardCheck />} tone="blue" target="19 left this shift" />
        <Stat className="col-span-3" label="Open findings" value={2} icon={<IconAlertTriangle />} tone="critical" delta={{ value: 1, decimals: 0, good: 'down', caption: 'since 06:00' }} target="1 high" />
        <Stat className="col-span-3" label="Overdue rounds" value={1} icon={<IconClock />} tone="amber" target="Export pump room" />
        <Panel className="col-span-8" title="Today's rounds" subtitle="Route strip shows each checkpoint in order" padding="none">
          <DataTable
            label="Today's rounds"
            flush
            columns={INSPECTION_ROUNDS_COLUMNS.filter((column) => column.id !== 'when' && column.id !== 'findings')}
            rows={INSPECTION_ROUNDS_ROUNDS}
            rowKey={(round) => round.id}
            rowTone={(round) => (round.state === 'overdue' ? 'critical' : undefined)}
          />
        </Panel>
        <Panel className="col-span-4" title="Rounds on time" subtitle="Share completed before the due time, per day">
          <Bars
            label="Share of rounds completed on time per day, against the 95 % target"
            categories={['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']}
            series={[{ id: 'on-time', label: 'On time', values: [96, 100, 94, 88, 97, 95, 92] }]}
            tones={['success', 'success', 'warning', 'critical', 'success', 'success', 'warning']}
            unit="%"
            limit={{ value: 95, label: 'Target', tone: 'neutral' }}
            height={220}
          />
        </Panel>
      </Grid>
    </InspectionRoundsSheet>
  );
}

export default definePage({
  id: 'inspection-rounds',
  title: 'Inspection rounds',
  summary:
    'Operator rounds from plan to sign-off: the round as a card, the route as numbered stops, a field reading typed against its limits, findings and the supervisor view. Every part is shown in several looks.',
  guidance: {
    use: [
      'Show the route in walking order so a failure is found by where it is.',
      'Judge a reading against its limits the moment it is typed.',
      'Ask for a reason when a checkpoint is skipped.',
      'Say when readings are only saved on the device.',
    ],
    avoid: [
      'A bare percentage for a round: say how many of how many.',
      'Hiding skipped checkpoints inside the done count.',
      'Small touch targets on a screen used with gloves.',
      'Signing off a round with unsent readings.',
    ],
  },
  source,
  sections: [
    {
      id: 'rounds',
      title: 'Rounds',
      description: 'A round as a card, a schedule and a route.',
      specimens: [
        {
          id: 'InspectionRoundsCards',
          title: 'Round cards',
          note: 'Pick cards for an operator home screen: each round with its count, route strip and next action.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inspection-rounds/RoundCard.tsx', 'kit/inspection-rounds/ResultStrip.tsx', 'kit/Panel.tsx'],
          Component: InspectionRoundsCards,
        },
        {
          id: 'InspectionRoundsSchedule',
          title: 'Round schedule',
          note: 'Pick the table when a shift has more rounds than fit as cards and they are compared row by row.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/DataTable.tsx', 'kit/StatGroup.tsx', 'kit/inspection-rounds/ResultStrip.tsx', 'kit/inspection-rounds/rounds.ts'],
          Component: InspectionRoundsSchedule,
        },
        {
          id: 'InspectionRoundsRoute',
          title: 'Route progress',
          note: 'Pick the stepper when the round crosses several areas and the operator needs to know where they are on it.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inspection-rounds/RouteStepper.tsx', 'kit/Panel.tsx'],
          Component: InspectionRoundsRoute,
        },
      ],
    },
    {
      id: 'checkpoints',
      title: 'Checkpoints and readings',
      description: 'What the operator does at each stop.',
      specimens: [
        {
          id: 'InspectionRoundsCheckpoints',
          title: 'Checkpoint list',
          note: 'Pick it as the route view: numbered stops with tag, reading, limits and result, each selectable.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/inspection-rounds/CheckpointList.tsx', 'kit/Panel.tsx'],
          Component: InspectionRoundsCheckpoints,
        },
        {
          id: 'InspectionRoundsReading',
          title: 'Reading against limits',
          note: 'Pick it wherever a number is typed in the field: the verdict changes as the value is entered.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/inspection-rounds/ReadingEntry.tsx', 'kit/TagId.tsx'],
          Component: InspectionRoundsReading,
        },
        {
          id: 'InspectionRoundsVerdict',
          title: 'Pass, fail or skip with a reason',
          note: 'Pick it for visual checks: three large choices, and a skip always carries its reason.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx', 'kit/inspection-rounds/rounds.ts'],
          Component: InspectionRoundsVerdict,
        },
        {
          id: 'InspectionRoundsSync',
          title: 'Saved offline',
          note: 'Pick it when the device loses signal on the route: say what is waiting and that nothing is lost.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/IconChip.tsx', 'kit/Panel.tsx'],
          Component: InspectionRoundsSync,
        },
        {
          id: 'InspectionRoundsHistory',
          title: 'Checkpoint history',
          note: 'Pick it beside a reading that looks wrong: the last rounds show whether it is a drift or a one-off.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/TrendLine.tsx', 'kit/Panel.tsx'],
          Component: InspectionRoundsHistory,
        },
      ],
    },
    {
      id: 'findings-and-sign-off',
      title: 'Findings and sign-off',
      description: 'What comes out of a round.',
      specimens: [
        {
          id: 'InspectionRoundsFindings',
          title: 'Findings list',
          note: 'Pick it for the hand-over from operator to maintenance: what was found, where, and how serious.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/ListRow.tsx', 'kit/StatusPill.tsx', 'kit/TagId.tsx'],
          Component: InspectionRoundsFindings,
        },
        {
          id: 'InspectionRoundsSignOff',
          title: 'Round sign-off',
          note: 'Pick it as the last step: the summary, a statement to confirm and one button that sends the round on.',
          origin: 'custom',
          size: 'md',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/inspection-rounds/ResultStrip.tsx', 'kit/Panel.tsx'],
          Component: InspectionRoundsSignOff,
        },
      ],
    },
    {
      id: 'looks',
      title: 'In other looks',
      description: 'The same round as a console table, poster blocks, a route drawing, state tiles, rings, a report and friendly cards.',
      specimens: [
        {
          id: 'InspectionRoundsConsole',
          title: 'Console checkpoint table',
          note: 'Pick it in the control room, where the round is followed from a desk and density matters.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/StatGroup.tsx', 'kit/DataTable.tsx', 'looks/LookScope.tsx'],
          Component: InspectionRoundsConsole,
        },
        {
          id: 'InspectionRoundsPoster',
          title: 'Poster round board',
          note: 'Pick it for the crew room screen: three counts and every round as a strip of blocks.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/inspection-rounds/ResultStrip.tsx', 'looks/LookScope.tsx'],
          Component: InspectionRoundsPoster,
        },
        {
          id: 'InspectionRoundsBlueprint',
          title: 'Blueprint route sheet',
          note: 'Pick it for the printed route sheet kept with the procedure: outlined stops and ruled readings.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inspection-rounds/RouteStepper.tsx', 'kit/inspection-rounds/CheckpointList.tsx', 'kit/inspection-rounds/ReadingEntry.tsx', 'looks/LookScope.tsx'],
          Component: InspectionRoundsBlueprint,
        },
        {
          id: 'InspectionRoundsSignal',
          title: 'Signal round tiles',
          note: 'Pick it for a wall screen: one tile per round, filled with its state.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'looks/LookScope.tsx'],
          Component: InspectionRoundsSignal,
        },
        {
          id: 'InspectionRoundsGlass',
          title: 'Glass completion rings',
          note: 'Pick it for a showpiece overview: completion per area as rings, with the next stops beside them.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/ListRow.tsx', 'looks/LookScope.tsx'],
          Component: InspectionRoundsGlass,
        },
        {
          id: 'InspectionRoundsEditorial',
          title: 'Editorial round report',
          note: 'Pick it for the report sent after the round: a headline that says what was found, then the route.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/SectionHeader.tsx', 'kit/StatGroup.tsx', 'kit/inspection-rounds/CheckpointList.tsx', 'looks/LookScope.tsx'],
          Component: InspectionRoundsEditorial,
        },
        {
          id: 'InspectionRoundsSoft',
          title: 'Soft operator home',
          note: 'Pick it for a handheld app used by many crews: roomy cards, pills and one clear next step.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inspection-rounds/RoundCard.tsx', 'kit/SectionHeader.tsx', 'looks/LookScope.tsx'],
          Component: InspectionRoundsSoft,
        },
      ],
    },
    {
      id: 'in-use',
      title: 'In use',
      description: 'Compositions that can be dropped into a product.',
      specimens: [
        {
          id: 'InspectionRoundsFieldScreen',
          title: 'Tablet round screen',
          note: 'Pick it as the working screen on the route: save a reading or a check and it moves to the next stop.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/inspection-rounds/CheckpointList.tsx', 'kit/inspection-rounds/ReadingEntry.tsx', 'kit/inspection-rounds/ResultStrip.tsx', 'kit/inspection-rounds/rounds.ts'],
          Component: InspectionRoundsFieldScreen,
        },
        {
          id: 'InspectionRoundsSupervisor',
          title: 'Supervisor overview',
          note: 'Pick it for the shift supervisor: compliance, the rounds table and the on-time trend on one screen.',
          origin: 'custom',
          size: 'full',
          bleed: true,
          uses: ['kit/Stat.tsx', 'kit/DataTable.tsx', 'kit/Bars.tsx', 'kit/inspection-rounds/ResultStrip.tsx'],
          Component: InspectionRoundsSupervisor,
        },
      ],
    },
  ],
});
