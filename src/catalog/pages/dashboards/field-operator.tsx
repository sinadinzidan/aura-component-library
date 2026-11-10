import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Progress } from '@cognite/aura/components/progress';
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCircleCheck,
  IconCloudOff,
  IconMinus,
  IconPlayerSkipForward,
  IconPlus,
  IconRefresh,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { CheckpointRow } from '../../../library/industrial/workflows/CheckpointRow';
import type { CheckpointResult } from '../../../library/industrial/workflows/CheckpointRow';
import { isWithinLimits } from '../../../library/industrial/workflows/workflow';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { definePage } from '../../types';

import source from './field-operator.tsx?raw';

type FieldOpReadingSpec = { unit: string; low: number; high: number; decimals: number; step: number; last: string };

type FieldOpCheckpoint = {
  id: string;
  name: string;
  tag: string;
  /** Where to stand and what to look at. */
  instruction: string;
  reading?: FieldOpReadingSpec;
  /** Position on the route map, in the map's own 320 by 170 grid. */
  x: number;
  y: number;
};

type FieldOpAnswer = Exclude<CheckpointResult, 'pending'>;

type FieldOpResults = Readonly<Record<string, FieldOpAnswer>>;

type FieldOpReadings = Readonly<Record<string, string>>;

const FIELD_OP_CHECKPOINTS: readonly FieldOpCheckpoint[] = [
  { id: 'lube', name: 'Lube oil pressure', tag: '23-KA-9101', instruction: '1st stage compressor. Read the local gauge on the lube oil skid.', reading: { unit: 'barg', low: 1.8, high: 2.6, decimals: 1, step: 0.1, last: '2.3 barg on the night round' }, x: 36, y: 66 },
  { id: 'bearing', name: 'Bearing temperature', tag: '23-KA-9101', instruction: '1st stage compressor. Measure the drive-end bearing housing with the handheld probe.', reading: { unit: '°C', low: 40, high: 85, decimals: 0, step: 1, last: '76 °C on the night round' }, x: 100, y: 66 },
  { id: 'flanges', name: 'Cooler flanges', tag: '23-HA-9114', instruction: 'Interstage cooler. Look for leaks or frost at the inlet and outlet flanges.', x: 164, y: 66 },
  { id: 'isolation', name: 'Isolation tag', tag: '23-KA-9103', instruction: 'Recompressor. Confirm the lock and tag from WO-104482 are in place.', x: 164, y: 122 },
  { id: 'seal', name: 'Seal pot level', tag: '27-PA-2001A', instruction: 'Export pump A. Read the level in the seal pot sight glass.', reading: { unit: '%', low: 40, high: 80, decimals: 0, step: 5, last: '65 % on the night round' }, x: 290, y: 58 },
  { id: 'barrier', name: 'Area barrier', tag: '40-PA-4001', instruction: 'Cooling water pump. Check the barrier and sign around the pump under maintenance.', x: 290, y: 118 },
];

const FIELD_OP_AREAS = [
  { id: 'nk-23', label: 'NK-23 Gas compression', x: 4, y: 12, width: 190, height: 146, labelAt: 'top' },
  { id: 'nk-27', label: 'NK-27 Export', x: 202, y: 12, width: 114, height: 68, labelAt: 'top' },
  { id: 'nk-40', label: 'NK-40 Cooling', x: 202, y: 88, width: 114, height: 70, labelAt: 'bottom' },
] as const;

const FIELD_OP_ANSWERS: readonly { id: FieldOpAnswer; label: string; variant: 'default' | 'destructive' | 'secondary' }[] = [
  { id: 'pass', label: 'Pass', variant: 'default' },
  { id: 'fail', label: 'Fail', variant: 'destructive' },
  { id: 'skip', label: 'Skip', variant: 'secondary' },
];

const FIELD_OP_SEED_RESULTS: FieldOpResults = { lube: 'pass' };

const FIELD_OP_SEED_READINGS: FieldOpReadings = { lube: '2.2', bearing: '78' };

function fieldOpNumber(text: string | undefined): number | null {
  if (text === undefined || text.trim() === '') return null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function fieldOpLimits(spec: FieldOpReadingSpec): string {
  return `${spec.low.toFixed(spec.decimals)} to ${spec.high.toFixed(spec.decimals)} ${spec.unit}`;
}

function fieldOpResult(results: FieldOpResults, id: string): CheckpointResult {
  return results[id] ?? 'pending';
}

type FieldOpDeviceProps = { label: string; children: ReactNode };

/** A tablet in portrait, drawn from tokens: fixed aspect, thick bezel, content that scrolls inside. */
function FieldOpDevice({ label, children }: FieldOpDeviceProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex aspect-[3/5] min-w-72 max-w-md flex-1 flex-col overflow-hidden rounded-3xl border-8 border-emphasized bg-base-background"
    >
      {children}
    </div>
  );
}

function FieldOpOfflineBar({ saved }: { saved: number }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 bg-medium-background px-4 py-2 text-xs text-medium-foreground">
      <span className="font-medium">Nordkapp</span>
      <span className="flex items-center gap-1.5">
        <IconCloudOff aria-hidden="true" className="size-4 shrink-0" />
        Offline · {saved} {saved === 1 ? 'result' : 'results'} saved on this tablet
      </span>
    </div>
  );
}

type FieldOpProgressProps = { title: string; position: number; total: number; done: number };

function FieldOpProgressHeader({ title, position, total, done }: FieldOpProgressProps) {
  return (
    <header className="flex w-full shrink-0 flex-col gap-2 px-4 pb-3 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-base font-semibold text-base-foreground">{title}</h4>
        <span className="shrink-0 text-sm tabular-nums text-medium-foreground">
          {position > total ? 'Summary' : `Checkpoint ${position} of ${total}`}
        </span>
      </div>
      <Progress value={done} max={total} aria-label={`${title} progress`} aria-valuetext={`${done} of ${total} checkpoints recorded`} />
      <span className="text-xs tabular-nums text-muted-foreground">
        {done} of {total} recorded
      </span>
    </header>
  );
}

type FieldOpReadingEntryProps = {
  checkpoint: FieldOpCheckpoint;
  spec: FieldOpReadingSpec;
  text: string;
  onChange: (text: string) => void;
};

/** A number, its unit and plus and minus keys big enough for gloves, judged against the limits as it is typed. */
function FieldOpReadingEntry({ checkpoint, spec, text, onChange }: FieldOpReadingEntryProps) {
  const value = fieldOpNumber(text);
  const within = value === null ? null : isWithinLimits(value, spec.low, spec.high);
  const nudge = (direction: 1 | -1) => {
    const from = value ?? spec.low;
    onChange((from + direction * spec.step).toFixed(spec.decimals));
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-medium text-base-foreground">Reading in {spec.unit}</span>
        <span className="text-xs text-muted-foreground">Last: {spec.last}</span>
      </div>
      <div className="flex w-full items-center gap-2">
        <Button variant="outline" size="icon-lg" className="size-12 shrink-0" aria-label={`Lower reading by ${spec.step} ${spec.unit}`} onClick={() => nudge(-1)}>
          <IconMinus />
        </Button>
        <Input
          className="h-12 min-w-0 flex-1 text-center"
          aria-label={`${checkpoint.name} reading in ${spec.unit}`}
          inputMode="decimal"
          placeholder="No reading"
          value={text}
          onChange={(event) => onChange(event.target.value)}
        />
        <Button variant="outline" size="icon-lg" className="size-12 shrink-0" aria-label={`Raise reading by ${spec.step} ${spec.unit}`} onClick={() => nudge(1)}>
          <IconPlus />
        </Button>
      </div>
      <p aria-live="polite" className="flex items-start gap-1.5 text-sm">
        {within === null ? (
          <span className="text-muted-foreground">Limits {fieldOpLimits(spec)}</span>
        ) : within ? (
          <>
            <IconCircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-medium-foreground" />
            <span className="text-medium-foreground">Within limits {fieldOpLimits(spec)}</span>
          </>
        ) : (
          <>
            <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning-foreground-strong" />
            <span className="font-medium text-warning-foreground-strong">
              Outside limits {fieldOpLimits(spec)}. Measure again or record a fail.
            </span>
          </>
        )}
      </p>
    </div>
  );
}

type FieldOpResultButtonsProps = { name: string; result: CheckpointResult; onResult: (answer: FieldOpAnswer) => void };

function FieldOpResultButtons({ name, result, onResult }: FieldOpResultButtonsProps) {
  return (
    <div role="group" aria-label={`Result for ${name}`} className="grid w-full grid-cols-3 gap-2">
      {FIELD_OP_ANSWERS.map((answer) => (
        <Button
          key={answer.id}
          variant={result === answer.id ? answer.variant : 'outline'}
          size="lg"
          className="h-12 w-full"
          aria-pressed={result === answer.id}
          onClick={() => onResult(answer.id)}
        >
          {answer.id === 'pass' ? <IconCheck /> : null}
          {answer.id === 'fail' ? <IconX /> : null}
          {answer.id === 'skip' ? <IconPlayerSkipForward /> : null}
          {answer.label}
        </Button>
      ))}
    </div>
  );
}

type FieldOpCheckpointCardProps = {
  checkpoint: FieldOpCheckpoint;
  position: number;
  result: CheckpointResult;
  text: string;
  onReading: (text: string) => void;
  onResult: (answer: FieldOpAnswer) => void;
};

/** One checkpoint at a time: where, what to do, the reading, then one of three answers. */
function FieldOpCheckpointCard({ checkpoint, position, result, text, onReading, onResult }: FieldOpCheckpointCardProps) {
  return (
    <article aria-label={`Checkpoint ${position}, ${checkpoint.name}`} className="flex w-full flex-col gap-4 rounded-2xl bg-card-background p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-medium-background text-base font-semibold tabular-nums text-base-foreground">
          {position}
        </span>
        <div className="min-w-0">
          <h5 className="text-xl font-semibold text-base-foreground">{checkpoint.name}</h5>
          <p className="font-mono text-sm text-muted-foreground">{checkpoint.tag}</p>
        </div>
      </div>
      <p className="text-sm text-medium-foreground">{checkpoint.instruction}</p>
      {checkpoint.reading ? (
        <FieldOpReadingEntry checkpoint={checkpoint} spec={checkpoint.reading} text={text} onChange={onReading} />
      ) : null}
      <FieldOpResultButtons name={checkpoint.name} result={result} onResult={onResult} />
      {result === 'fail' ? (
        <p className="text-sm text-medium-foreground">A deviation is raised on {checkpoint.tag} when the round is submitted.</p>
      ) : null}
    </article>
  );
}

type FieldOpActionBarProps = {
  previousLabel: string;
  nextLabel: string;
  onPrevious?: () => void;
  onNext: () => void;
  /** Why Previous cannot be used, shown instead of a disabled button with no reason. */
  hint?: string;
};

/** The bar that stays at the bottom of the screen: back on the left, the way forward on the right. */
function FieldOpActionBar({ previousLabel, nextLabel, onPrevious, onNext, hint }: FieldOpActionBarProps) {
  return (
    <footer className="flex w-full shrink-0 flex-col gap-2 border-t border-default bg-base-background p-3">
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="grid w-full grid-cols-2 gap-2">
        <Button variant="outline" size="lg" className="h-12 w-full" disabled={!onPrevious} onClick={onPrevious}>
          <IconChevronLeft /> {previousLabel}
        </Button>
        <Button size="lg" className="h-12 w-full" onClick={onNext}>
          {nextLabel} <IconChevronRight />
        </Button>
      </div>
    </footer>
  );
}

type FieldOpSummaryProps = { results: FieldOpResults; readings: FieldOpReadings; submitted: boolean };

function FieldOpSummary({ results, readings, submitted }: FieldOpSummaryProps) {
  const count = (answer: CheckpointResult) =>
    FIELD_OP_CHECKPOINTS.filter((checkpoint) => fieldOpResult(results, checkpoint.id) === answer).length;
  const figures = [
    { label: 'Pass', value: count('pass') },
    { label: 'Fail', value: count('fail') },
    { label: 'Skipped', value: count('skip') },
    { label: 'Not checked', value: count('pending') },
  ];

  return (
    <section aria-label="Round summary" className="flex w-full flex-col gap-3 rounded-2xl bg-card-background p-4">
      <h5 className="text-xl font-semibold text-base-foreground">Round summary</h5>
      <dl className="grid grid-cols-4 gap-2">
        {figures.map((figure) => (
          <div key={figure.label} className="min-w-0">
            <dd className="text-2xl font-semibold tabular-nums text-base-foreground">{figure.value}</dd>
            <dt className="text-xs text-muted-foreground">{figure.label}</dt>
          </div>
        ))}
      </dl>
      <ol className="flex w-full flex-col">
        {FIELD_OP_CHECKPOINTS.map((checkpoint, index) => {
          const value = fieldOpNumber(readings[checkpoint.id]);
          return (
            <li key={checkpoint.id} className="border-t border-default">
              <CheckpointRow
                index={index + 1}
                name={checkpoint.name}
                tag={checkpoint.tag}
                result={fieldOpResult(results, checkpoint.id)}
                note={
                  checkpoint.reading && value !== null
                    ? `${value.toFixed(checkpoint.reading.decimals)} ${checkpoint.reading.unit}, ${
                        isWithinLimits(value, checkpoint.reading.low, checkpoint.reading.high) ? 'within' : 'outside'
                      } ${fieldOpLimits(checkpoint.reading)}`
                    : undefined
                }
              />
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="flex items-start gap-1.5 text-sm text-medium-foreground">
        {submitted ? <IconCircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" /> : <IconCloudOff aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
        {submitted
          ? 'Round submitted. It is queued on this tablet and syncs when you are back online.'
          : 'Saved on this tablet. Submit to queue the round for sync.'}
      </p>
    </section>
  );
}

function FieldOpRouteMap({ index, results }: { index: number; results: FieldOpResults }) {
  const route = FIELD_OP_CHECKPOINTS.map((checkpoint) => `${checkpoint.x},${checkpoint.y}`).join(' ');
  const current = FIELD_OP_CHECKPOINTS[index];
  return (
    <svg
      viewBox="0 0 320 170"
      role="img"
      aria-label={`Route map of the morning round: six stops across gas compression, export and cooling water. ${current ? `You are at stop ${index + 1}, ${current.name}.` : 'All stops visited.'}`}
      className="h-auto w-full"
    >
      {FIELD_OP_AREAS.map((area) => (
        <g key={area.id}>
          <rect x={area.x} y={area.y} width={area.width} height={area.height} rx="8" className="fill-muted-background stroke-emphasized" strokeWidth="1" />
          <text x={area.x + 8} y={area.labelAt === 'top' ? area.y + 18 : area.y + area.height - 8} className="fill-muted-foreground text-xs">
            {area.label}
          </text>
        </g>
      ))}
      <polyline points={route} fill="none" strokeWidth="2" strokeDasharray="5 4" className="stroke-muted-foreground" />
      {FIELD_OP_CHECKPOINTS.map((checkpoint, position) => {
        const here = position === index;
        const recorded = fieldOpResult(results, checkpoint.id) !== 'pending';
        return (
          <g key={checkpoint.id}>
            {here ? <circle cx={checkpoint.x} cy={checkpoint.y} r="17" fill="none" strokeWidth="2" className="stroke-base-foreground" /> : null}
            <circle
              cx={checkpoint.x}
              cy={checkpoint.y}
              r="12"
              strokeWidth="1.5"
              className={here ? 'fill-base-foreground stroke-base-foreground' : recorded ? 'fill-medium-background stroke-emphasized' : 'fill-base-background stroke-emphasized'}
            />
            <text
              x={checkpoint.x}
              y={checkpoint.y + 4}
              textAnchor="middle"
              className={`text-xs font-semibold tabular-nums ${here ? 'fill-base-background' : 'fill-base-foreground'}`}
            >
              {position + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const FIELD_OP_RESULT_WORD: Record<CheckpointResult, string> = { pass: 'Pass', fail: 'Fail', skip: 'Skipped', pending: 'Not checked' };

const FIELD_OP_MARKER: Record<CheckpointResult, string> = {
  pass: 'bg-success-background text-success-foreground',
  fail: 'bg-critical-background text-critical-foreground',
  skip: 'border border-dashed border-emphasized text-muted-foreground',
  pending: 'border border-emphasized text-muted-foreground',
};

type FieldOpRouteRowProps = {
  checkpoint: FieldOpCheckpoint;
  position: number;
  result: CheckpointResult;
  here: boolean;
  onOpen: () => void;
};

/** One stop in the task list. The whole row is the touch target and opens that checkpoint. */
function FieldOpRouteRow({ checkpoint, position, result, here, onOpen }: FieldOpRouteRowProps) {
  return (
    <button
      type="button"
      aria-current={here ? 'step' : undefined}
      aria-label={`Open checkpoint ${position}, ${checkpoint.name}, ${FIELD_OP_RESULT_WORD[result]}`}
      className={`flex min-h-14 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left outline-none hover:bg-muted-background focus-visible:shadow-focus-ring ${
        here ? 'bg-medium-background' : ''
      }`}
      onClick={onOpen}
    >
      <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${FIELD_OP_MARKER[result]}`}>
        {result === 'pass' ? <IconCheck aria-hidden="true" className="size-4" /> : null}
        {result === 'fail' ? <IconX aria-hidden="true" className="size-4" /> : null}
        {result === 'skip' ? <IconMinus aria-hidden="true" className="size-4" /> : null}
        {result === 'pending' ? position : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-base-foreground">{checkpoint.name}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {checkpoint.tag}
          {here ? <span className="font-sans"> · you are here</span> : null}
        </span>
      </span>
      <span className={`shrink-0 text-xs ${result === 'fail' ? 'font-medium text-critical-foreground-strong' : 'text-medium-foreground'}`}>
        {FIELD_OP_RESULT_WORD[result]}
      </span>
      <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

type FieldOpRouteScreenProps = { index: number; results: FieldOpResults; onOpen: (index: number) => void };

/** The second screen: where the round goes and how far it is, with a way to jump to any stop. */
function FieldOpRouteScreen({ index, results, onOpen }: FieldOpRouteScreenProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="text-base font-semibold text-base-foreground">Route</h4>
        <span className="text-sm text-medium-foreground">6 stops · about 35 min</span>
      </div>
      <FieldOpRouteMap index={index} results={results} />
      <ol aria-label="Checkpoints on the route" className="flex w-full flex-col">
        {FIELD_OP_CHECKPOINTS.map((checkpoint, position) => (
          <li key={checkpoint.id}>
            <FieldOpRouteRow
              checkpoint={checkpoint}
              position={position + 1}
              result={fieldOpResult(results, checkpoint.id)}
              here={position === index}
              onOpen={() => onOpen(position)}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

function useFieldOpRound(initialIndex: number, initialResults: FieldOpResults, initialReadings: FieldOpReadings) {
  const [index, setIndex] = useState(initialIndex);
  const [results, setResults] = useState<FieldOpResults>(initialResults);
  const [readings, setReadings] = useState<FieldOpReadings>(initialReadings);
  const [submitted, setSubmitted] = useState(false);
  const total = FIELD_OP_CHECKPOINTS.length;

  return {
    index,
    results,
    readings,
    submitted,
    total,
    done: Object.keys(results).length,
    open: (next: number) => setIndex(Math.max(0, Math.min(next, total))),
    setResult: (id: string, answer: FieldOpAnswer) => {
      setSubmitted(false);
      setResults((current) => ({ ...current, [id]: answer }));
    },
    setReading: (id: string, text: string) => setReadings((current) => ({ ...current, [id]: text })),
    submit: () => setSubmitted(true),
    restart: () => {
      setIndex(0);
      setResults({});
      setReadings({});
      setSubmitted(false);
    },
  };
}

type FieldOpRound = ReturnType<typeof useFieldOpRound>;

/** The round screen: offline bar, progress, one checkpoint or the summary, and the sticky action bar. */
function FieldOpRoundScreen({ round }: { round: FieldOpRound }) {
  const checkpoint = FIELD_OP_CHECKPOINTS[round.index];
  const last = round.index === round.total - 1;

  return (
    <>
      <FieldOpOfflineBar saved={round.done} />
      <FieldOpProgressHeader title="Morning round" position={round.index + 1} total={round.total} done={round.done} />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-3">
        {checkpoint ? (
          <FieldOpCheckpointCard
            checkpoint={checkpoint}
            position={round.index + 1}
            result={fieldOpResult(round.results, checkpoint.id)}
            text={round.readings[checkpoint.id] ?? ''}
            onReading={(text) => round.setReading(checkpoint.id, text)}
            onResult={(answer) => round.setResult(checkpoint.id, answer)}
          />
        ) : (
          <FieldOpSummary results={round.results} readings={round.readings} submitted={round.submitted} />
        )}
      </div>
      {checkpoint ? (
        <FieldOpActionBar
          previousLabel="Previous"
          nextLabel={last ? 'Finish' : 'Next'}
          onPrevious={round.index > 0 ? () => round.open(round.index - 1) : undefined}
          onNext={() => round.open(round.index + 1)}
          hint={round.index === 0 ? 'This is the first checkpoint, so there is no previous one.' : undefined}
        />
      ) : (
        <FieldOpActionBar
          previousLabel="Review"
          nextLabel={round.submitted ? 'Submitted' : 'Submit round'}
          onPrevious={() => round.open(round.total - 1)}
          onNext={round.submit}
        />
      )}
    </>
  );
}

/**
 * Archetype: a tablet task flow in a device frame — not a wide dashboard.
 * Dominant element: the round screen with one large checkpoint card at a time.
 * Interaction: stepping. Previous and Next move through the checkpoints, a reading is typed or
 * nudged and judged against its limits, Pass, Fail or Skip records the answer, and the last step
 * is a summary to submit; the second tablet shows the route and jumps to any stop.
 */
function FieldOpDashboard() {
  const round = useFieldOpRound(1, FIELD_OP_SEED_RESULTS, FIELD_OP_SEED_READINGS);

  return (
    <DashboardFrame
      title="Field operator"
      subtitle="Morning round · gas compression and export · Tomás Barros, Crew A"
      status={<StatusIndicator tone="neutral" shape="ring" label="Offline" detail={`${round.done} of ${round.total} recorded`} />}
      actions={
        <Button variant="outline" className="h-11" onClick={round.restart}>
          <IconRefresh /> Restart round
        </Button>
      }
    >
      <div className="flex w-full flex-wrap items-start justify-center gap-6 rounded-xl bg-muted-background p-6">
        <FieldOpDevice label="Tablet, round in progress">
          <FieldOpRoundScreen round={round} />
        </FieldOpDevice>
        <FieldOpDevice label="Tablet, route and task list">
          <FieldOpOfflineBar saved={round.done} />
          <FieldOpRouteScreen index={round.index} results={round.results} onOpen={round.open} />
        </FieldOpDevice>
      </div>
    </DashboardFrame>
  );
}

function FieldOperatorDashSignature() {
  return (
    <ThemeScope preset="field" className="w-full">
      <FieldOpDashboard />
    </ThemeScope>
  );
}

function FieldOperatorDashFieldNight() {
  return (
    <ThemeScope preset="field-night" className="w-full">
      <FieldOpDashboard />
    </ThemeScope>
  );
}

function FieldOperatorDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <FieldOpDashboard />
    </ThemeScope>
  );
}

function FieldOperatorDashAccessible() {
  return (
    <ThemeScope preset="accessible" className="w-full">
      <FieldOpDashboard />
    </ThemeScope>
  );
}

function FieldOperatorDashRound() {
  const round = useFieldOpRound(4, { lube: 'pass', bearing: 'pass', flanges: 'pass', isolation: 'pass' }, { lube: '2.2', bearing: '78', seal: '35' });
  return (
    <FieldOpDevice label="Tablet, reading outside its limits">
      <FieldOpRoundScreen round={round} />
    </FieldOpDevice>
  );
}

function FieldOperatorDashRoute() {
  const round = useFieldOpRound(3, { lube: 'pass', bearing: 'fail', flanges: 'skip' }, {});
  return (
    <FieldOpDevice label="Tablet, route and task list">
      <FieldOpOfflineBar saved={round.done} />
      <FieldOpRouteScreen index={round.index} results={round.results} onOpen={round.open} />
    </FieldOpDevice>
  );
}

function FieldOperatorDashSummary() {
  const round = useFieldOpRound(
    6,
    { lube: 'pass', bearing: 'fail', flanges: 'pass', isolation: 'pass', seal: 'pass', barrier: 'skip' },
    { lube: '2.2', bearing: '91', seal: '60' }
  );
  return (
    <FieldOpDevice label="Tablet, round summary">
      <FieldOpRoundScreen round={round} />
    </FieldOpDevice>
  );
}

function FieldOperatorDashCheckpoint() {
  const [result, setResult] = useState<CheckpointResult>('pending');
  return (
    <div className="w-full max-w-md">
      <FieldOpCheckpointCard
        checkpoint={FIELD_OP_CHECKPOINTS[3]}
        position={4}
        result={result}
        text=""
        onReading={() => undefined}
        onResult={setResult}
      />
    </div>
  );
}

function FieldOperatorDashReading() {
  const [text, setText] = useState('91');
  const checkpoint = FIELD_OP_CHECKPOINTS[1];
  return (
    <div className="w-full max-w-xs">
      {checkpoint.reading ? <FieldOpReadingEntry checkpoint={checkpoint} spec={checkpoint.reading} text={text} onChange={setText} /> : null}
    </div>
  );
}

function FieldOperatorDashProgress() {
  return (
    <div className="flex w-full max-w-xs flex-col overflow-hidden rounded-2xl border border-default">
      <FieldOpOfflineBar saved={3} />
      <FieldOpProgressHeader title="Morning round" position={4} total={6} done={3} />
    </div>
  );
}

function FieldOperatorDashActions() {
  const [result, setResult] = useState<CheckpointResult>('fail');
  const [step, setStep] = useState(2);
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <FieldOpResultButtons name="Cooler flanges" result={result} onResult={setResult} />
      <div className="overflow-hidden rounded-2xl border border-default">
        <FieldOpActionBar
          previousLabel="Previous"
          nextLabel="Next"
          onPrevious={step > 1 ? () => setStep(step - 1) : undefined}
          onNext={() => setStep(Math.min(step + 1, 6))}
          hint={`Checkpoint ${step} of 6`}
        />
      </div>
    </div>
  );
}

export default definePage({
  id: 'field-operator',
  title: 'Field operator',
  summary:
    'A round done on a tablet with gloves on: one checkpoint at a time, a reading judged against its limits as it is entered, three large answers, and a summary to submit when the tablet is back online.',
  guidance: {
    use: [
      'For rounds, inspections and checklists done standing up, outdoors or with gloves.',
      'One decision per screen, with the action bar always at the bottom.',
      'Every control at least 44 px tall, with a text label, and nothing that needs hover.',
      'Say that work is saved on the device before people ask.',
    ],
    avoid: [
      'A wide dashboard squeezed onto a tablet; show one task and the way to the next.',
      'Swipe-only navigation; Previous and Next are buttons.',
      'Judging a reading only after the round is submitted.',
      'Blocking the round on a missing answer; let it be skipped and show it in the summary.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Field theme, as two tablets: the round in progress and its route. Step through with Previous and Next.',
      specimens: [
        {
          id: 'FieldOperatorDashSignature',
          title: 'Field operator',
          note: 'Pick it for operator rounds and inspections carried out on a tablet or phone on site.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'industrial/workflows/CheckpointRow.tsx',
            'industrial/workflows/workflow.ts',
            'industrial/StatusIndicator.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: FieldOperatorDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same two tablets, unchanged, in three more presets.',
      specimens: [
        {
          id: 'FieldOperatorDashFieldNight',
          title: 'Field night',
          note: 'Pick it for night rounds, where a bright screen ruins night vision.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: FieldOperatorDashFieldNight,
        },
        {
          id: 'FieldOperatorDashAura',
          title: 'Aura',
          note: 'Pick it when the round is used indoors on the same devices as the rest of the product.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: FieldOperatorDashAura,
        },
        {
          id: 'FieldOperatorDashAccessible',
          title: 'Accessible',
          note: 'Pick it for maximum legibility: high contrast and extra space.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: FieldOperatorDashAccessible,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Screens and parts',
      description: 'Each screen and part on its own, ready to drop into another field flow.',
      specimens: [
        {
          id: 'FieldOperatorDashRound',
          title: 'Reading outside limits',
          note: 'Pick it to show how a checkpoint reads when the value entered breaks a limit.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          uses: ['industrial/workflows/workflow.ts'],
          Component: FieldOperatorDashRound,
        },
        {
          id: 'FieldOperatorDashRoute',
          title: 'Route and task list',
          note: 'Pick it as the overview screen of a round: the map, the stops and a way to jump to one.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          uses: ['industrial/workflows/CheckpointRow.tsx'],
          Component: FieldOperatorDashRoute,
        },
        {
          id: 'FieldOperatorDashSummary',
          title: 'Summary screen',
          note: 'Pick it as the last step: counts, every checkpoint with its result, and one submit.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          uses: ['industrial/workflows/CheckpointRow.tsx'],
          Component: FieldOperatorDashSummary,
        },
        {
          id: 'FieldOperatorDashCheckpoint',
          title: 'Checkpoint without a reading',
          note: 'Pick it for a visual check: the instruction and the three answers are enough.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          Component: FieldOperatorDashCheckpoint,
        },
        {
          id: 'FieldOperatorDashReading',
          title: 'Reading entry',
          note: 'Pick it wherever a number is typed in the field and must be judged at once.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['industrial/workflows/workflow.ts'],
          Component: FieldOperatorDashReading,
        },
        {
          id: 'FieldOperatorDashProgress',
          title: 'Progress header',
          note: 'Pick it at the top of a step-by-step task, with the offline state above it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: FieldOperatorDashProgress,
        },
        {
          id: 'FieldOperatorDashActions',
          title: 'Answers and action bar',
          note: 'Pick them together: three large answers in the content, Previous and Next pinned below.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: FieldOperatorDashActions,
        },
      ],
    },
  ],
});
