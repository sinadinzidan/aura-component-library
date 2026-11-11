import { Button } from '@cognite/aura/components/button';
import {
  IconAlertTriangle,
  IconArrowBackUp,
  IconCheck,
  IconCircleCheck,
  IconClipboardCheck,
  IconCloudOff,
  IconCloudUpload,
  IconFlag,
  IconMap,
  IconMapPin,
  IconMinus,
  IconPlayerSkipForward,
  IconPlus,
  IconRoute,
  IconScan,
  IconUser,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { Donut } from '../../../library/kit/Donut';
import { IconChip } from '../../../library/kit/IconChip';
import { Meter } from '../../../library/kit/Meter';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import { formatNumber, type Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { definePage } from '../../types';

import source from './field-operator.tsx?raw';

type FoResult = 'ok' | 'flag' | 'skip';

type FoReading = {
  value: number;
  unit: string;
  low: number;
  high: number;
  max: number;
  decimals: number;
};

type FoTask = {
  id: string;
  tag: string;
  title: string;
  where: string;
  instruction: string;
  expected: string;
  reading?: FoReading;
  minutes: number;
};

const FO_TASKS: FoTask[] = [
  {
    id: 't1',
    tag: '23-KA-9101',
    title: 'Lube oil level, 1st stage compressor',
    where: 'Compressor hall, level 1',
    instruction: 'Read the sight glass on the reservoir with the pump running.',
    expected: 'Between the two marks',
    minutes: 3,
  },
  {
    id: 't2',
    tag: '23-VT-92540',
    title: 'Drive-end vibration, 1st stage compressor',
    where: 'Compressor hall, level 1',
    instruction: 'Hold the probe on the marked pad for ten seconds and enter the steady value.',
    expected: 'Below 7.1 mm/s',
    reading: {
      value: 6.8,
      unit: 'mm/s',
      low: 0,
      high: 7.1,
      max: 15,
      decimals: 1,
    },
    minutes: 4,
  },
  {
    id: 't3',
    tag: '23-PT-92531',
    title: 'Discharge pressure, local gauge',
    where: 'Compressor hall, level 1',
    instruction: 'Compare the local gauge with the transmitter reading on the tablet.',
    expected: '40 to 52 barg',
    reading: {
      value: 48.6,
      unit: 'barg',
      low: 40,
      high: 52,
      max: 60,
      decimals: 1,
    },
    minutes: 2,
  },
  {
    id: 't4',
    tag: '23-HA-9114',
    title: 'Interstage cooler, tube leaks',
    where: 'Cooler deck, north side',
    instruction: 'Walk both headers and check the drip trays for condensate.',
    expected: 'Dry trays, no frost',
    minutes: 5,
  },
  {
    id: 't5',
    tag: '23-TT-91141',
    title: 'Cooler outlet temperature',
    where: 'Cooler deck, north side',
    instruction: 'Read the local thermometer in the outlet pocket and enter the value.',
    expected: '20 to 40 °C',
    reading: {
      value: 38.9,
      unit: '°C',
      low: 20,
      high: 40,
      max: 60,
      decimals: 1,
    },
    minutes: 3,
  },
  {
    id: 't6',
    tag: '23-KA-9102',
    title: 'Seal gas panel, 2nd stage compressor',
    where: 'Compressor hall, level 2',
    instruction: 'Check that the differential pressure indicator is in the green band.',
    expected: 'Green band',
    minutes: 3,
  },
  {
    id: 't7',
    tag: '23-KA-9103',
    title: 'Recompressor isolation tags',
    where: 'Compressor hall, level 2',
    instruction: 'Confirm all four isolation tags from permit 2291 are still in place.',
    expected: '4 tags, seals intact',
    minutes: 4,
  },
  {
    id: 't8',
    tag: '23-GT-9001',
    title: 'Turbine enclosure, fire and gas detectors',
    where: 'Turbine enclosure',
    instruction: 'Check the status lamp on each of the three detectors by the door.',
    expected: '3 green lamps',
    minutes: 4,
  },
  {
    id: 't9',
    tag: '27-IT-20013',
    title: 'Motor current, export pump A',
    where: 'Export pump house',
    instruction: 'Read the ammeter on the local control station.',
    expected: '40 to 95 A',
    reading: {
      value: 86.2,
      unit: 'A',
      low: 40,
      high: 95,
      max: 120,
      decimals: 1,
    },
    minutes: 3,
  },
  {
    id: 't10',
    tag: '40-PA-4001',
    title: 'Cooling water pump barrier',
    where: 'Utility area',
    instruction: 'Check that the barrier and the permit board are in place around the pump.',
    expected: 'Barrier closed, permit displayed',
    minutes: 4,
  },
];

const FO_START: Record<string, FoResult> = {
  t1: 'ok',
  t2: 'flag',
  t3: 'ok',
  t4: 'ok',
};

const FO_RESULT_TONE: Record<FoResult, Tone> = {
  ok: 'success',
  flag: 'warning',
  skip: 'neutral',
};

const FO_RESULT_LABEL: Record<FoResult, string> = {
  ok: 'OK',
  flag: 'Flagged',
  skip: 'Skipped',
};

const FO_STACK_TONES: Tone[] = ['teal', 'amber'];

function foLowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function foCount(results: Record<string, FoResult>, result: FoResult): number {
  return FO_TASKS.filter((task) => results[task.id] === result).length;
}

/** The round both devices share: answers so far, the checkpoint that is up, and the three moves. */
function useFoRound(start: Record<string, FoResult>) {
  const [results, setResults] = useState(start);
  const [order, setOrder] = useState<string[]>(Object.keys(start));
  const current = FO_TASKS.find((task) => !(task.id in results));
  const done = FO_TASKS.length - FO_TASKS.filter((task) => !(task.id in results)).length;
  return {
    results,
    current,
    done,
    upcoming: FO_TASKS.filter((task) => !(task.id in results)).slice(1),
    minutesLeft: FO_TASKS.filter((task) => !(task.id in results)).reduce((sum, task) => sum + task.minutes, 0),
    answer: (result: FoResult) => {
      if (!current) return;
      setResults((before) => ({ ...before, [current.id]: result }));
      setOrder((before) => [...before, current.id]);
    },
    undo: () => {
      const last = order[order.length - 1];
      if (!last) return;
      setOrder((before) => before.slice(0, -1));
      setResults((before) => Object.fromEntries(Object.entries(before).filter(([id]) => id !== last)));
    },
    canUndo: order.length > 0,
  };
}

type FoRound = ReturnType<typeof useFoRound>;

/** A drawn device around a screen, so a mobile layout can be judged at its real width. */
function FoDevice({ kind, label, children, className = '' }: { kind: 'phone' | 'tablet'; label: string; children: ReactNode; className?: string }) {
  const phone = kind === 'phone';
  return (
    <figure className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <div
        className={`relative flex min-h-0 flex-1 flex-col bg-[var(--mountain-900)] shadow-[0_30px_60px_-30px_var(--effect-shadow-xl)] ${phone ? 'rounded-[2.75rem] p-2.5' : 'rounded-[2.25rem] p-3.5'}`}
      >
        <span
          aria-hidden="true"
          className={`absolute left-1/2 -translate-x-1/2 rounded-full bg-[var(--mountain-700)] ${phone ? 'top-4 z-10 h-5 w-24 bg-[var(--mountain-900)]' : 'top-1.5 size-1.5'}`}
        />
        <div className={`flex min-h-0 flex-1 flex-col overflow-hidden bg-base-background ${phone ? 'rounded-[2.2rem]' : 'rounded-[1.5rem]'}`}>{children}</div>
      </div>
      <figcaption className="text-center text-sm font-medium text-medium-foreground">{label}</figcaption>
    </figure>
  );
}

function FoStatusBar({ phone = false, queued }: { phone?: boolean; queued: number }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-sm font-semibold text-base-foreground ${phone ? 'px-6 pt-3.5 pb-1' : 'px-6 py-3'}`}>
      <span className="tabular-nums">14:00</span>
      {phone ? null : <span className="text-medium-foreground">Round B-12 · Gas compression · Day shift</span>}
      <span className="flex items-center gap-1.5 text-medium-foreground">
        <IconCloudOff className="size-4" aria-hidden="true" />
        {phone ? queued : `Offline · ${queued} queued`}
      </span>
    </div>
  );
}

const FO_DOCK = [
  { id: 'round', label: 'Round', icon: <IconRoute aria-hidden="true" /> },
  { id: 'map', label: 'Map', icon: <IconMap aria-hidden="true" /> },
  { id: 'scan', label: 'Scan', icon: <IconScan aria-hidden="true" /> },
  { id: 'findings', label: 'Findings', icon: <IconFlag aria-hidden="true" /> },
  { id: 'me', label: 'Me', icon: <IconUser aria-hidden="true" /> },
];

/** Thumb-reach navigation along the bottom of a handheld screen. */
function FoDock({ current = 'round', findings = 0, labels = true }: { current?: string; findings?: number; labels?: boolean }) {
  return (
    <nav aria-label="Sections" className="flex justify-center px-3 pt-1 pb-3">
      <ul className="flex items-center gap-1 rounded-full bg-muted-background p-1.5">
        {FO_DOCK.map((item) => {
          const active = item.id === current;
          return (
            <li key={item.id}>
              <button
                type="button"
                aria-current={active ? 'page' : undefined}
                aria-label={labels ? undefined : item.label}
                className={`relative flex items-center gap-2 rounded-full py-2.5 text-sm font-semibold [&>svg]:size-5 ${labels ? 'px-3.5' : 'px-3'} ${active ? 'bg-primary-background text-primary-foreground' : 'text-medium-foreground hover:text-base-foreground'}`}
              >
                {item.icon}
                {labels || active ? <span>{item.label}</span> : null}
                {item.id === 'findings' && findings > 0 ? (
                  <span
                    className={`flex size-5 items-center justify-center rounded-full bg-warning-foreground text-xs font-bold text-warning-background ${labels ? '' : 'absolute -top-1.5 -right-1'}`}
                  >
                    {findings}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Today's round as one ring: how far, how it went, how long is left. */
function FoProgress({ round, size = 212 }: { round: FoRound; size?: number }) {
  const flagged = foCount(round.results, 'flag');
  return (
    <div className="@container flex flex-1 flex-col items-center justify-between gap-5">
      <div className="self-stretch">
        <p className="text-lg font-bold text-base-foreground">Today&apos;s round</p>
        <p className="text-sm text-medium-foreground">Gas compression · 10 checkpoints</p>
      </div>
      <div className="hidden @[13.5rem]:block">
        <RingGauge label="Checkpoints done" value={round.done} max={FO_TASKS.length} unit={`of ${FO_TASKS.length}`} size={size} tone="purple" hideLabel />
      </div>
      <div className="@[13.5rem]:hidden">
        <RingGauge label="Checkpoints done" value={round.done} max={FO_TASKS.length} unit={`of ${FO_TASKS.length}`} size={164} tone="purple" hideLabel />
      </div>
      <dl className="grid w-full grid-cols-3 gap-1.5 text-center">
        <div className="rounded-2xl bg-base-background px-1 py-2.5">
          <dd className="text-2xl font-bold text-base-foreground tabular-nums">{foCount(round.results, 'ok')}</dd>
          <dt className="text-xs font-medium text-medium-foreground">OK</dt>
        </div>
        <div className="rounded-2xl bg-base-background px-1 py-2.5">
          <dd className={`text-2xl font-bold tabular-nums ${flagged > 0 ? 'text-warning-foreground-strong' : 'text-base-foreground'}`}>{flagged}</dd>
          <dt className="text-xs font-medium text-medium-foreground">Flagged</dt>
        </div>
        <div className="rounded-2xl bg-base-background px-1 py-2.5">
          <dd className="text-2xl font-bold text-base-foreground tabular-nums">{round.minutesLeft}</dd>
          <dt className="text-xs font-medium whitespace-nowrap text-medium-foreground">min left</dt>
        </div>
      </dl>
    </div>
  );
}

function FoReadingMeter({ reading, label }: { reading: FoReading; label: string }) {
  const out = reading.value > reading.high || reading.value < reading.low;
  const close = !out && reading.value > reading.high - (reading.high - reading.low) * 0.12;
  return (
    <Meter
      label={label}
      value={reading.value}
      max={reading.max}
      unit={reading.unit}
      decimals={reading.decimals}
      high={reading.high}
      low={reading.low > 0 ? reading.low : undefined}
      target={{ value: reading.high, label: 'Limit' }}
      tone={out ? 'critical' : close ? 'warning' : 'success'}
    />
  );
}

function FoAnswers({ round }: { round: FoRound }) {
  return (
    <div className="grid grid-cols-2 gap-2 @[21rem]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <Button size="lg" className="col-span-2 @[21rem]:col-span-1" onClick={() => round.answer('ok')}>
        <IconCheck /> Looks right
      </Button>
      <Button size="lg" variant="outline" onClick={() => round.answer('flag')}>
        <IconFlag /> Flag it
      </Button>
      <Button size="lg" variant="ghost" onClick={() => round.answer('skip')}>
        <IconPlayerSkipForward /> Skip
      </Button>
    </div>
  );
}

/** The checkpoint that is up, on top of the ones that follow. Answering it deals the next card. */
function FoTaskStack({ round, compact = false }: { round: FoRound; compact?: boolean }) {
  const task = round.current;
  if (!task) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[1.75rem] bg-success-background p-6 text-center">
        <IconCircleCheck className="size-14 text-success-foreground" aria-hidden="true" />
        <p className="text-2xl font-bold text-success-foreground">Round complete</p>
        <p className="max-w-xs text-sm text-success-foreground">
          {foCount(round.results, 'ok')} looked right, {foCount(round.results, 'flag')} flagged, {foCount(round.results, 'skip')} skipped. Answers upload when
          the tablet is back on the network.
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="lg">
            <IconCloudUpload /> Submit round
          </Button>
          <Button size="lg" variant="outline" onClick={round.undo}>
            <IconArrowBackUp /> Undo last
          </Button>
        </div>
      </div>
    );
  }
  const position = FO_TASKS.findIndex((candidate) => candidate.id === task.id) + 1;
  return (
    <div className="@container flex min-h-0 flex-1 flex-col">
      <article
        key={task.id}
        className="relative z-20 flex flex-1 flex-col gap-3.5 rounded-[1.75rem] bg-base-background p-5 shadow-[0_18px_40px_-22px_var(--effect-shadow-xl),0_1px_2px_var(--effect-shadow-md)] ring-1 ring-[var(--kit-rule)]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary-background px-3 py-1 text-sm font-bold text-primary-foreground tabular-nums">
            {position} of {FO_TASKS.length}
          </span>
          <TagId variant="chip">{task.tag}</TagId>
        </div>
        <div>
          <h3 className={`font-bold text-balance text-base-foreground ${compact ? 'text-xl leading-6' : 'text-2xl leading-8'}`}>{task.title}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-medium-foreground">
            <IconMapPin className="size-4 shrink-0" aria-hidden="true" />
            {task.where} · about {task.minutes} min
          </p>
        </div>
        <p className="text-base leading-6 text-base-foreground">{task.instruction}</p>
        {compact && task.reading ? null : (
          <p className="flex items-center gap-2.5 rounded-2xl bg-muted-background px-4 py-3 text-sm text-base-foreground">
            <IconClipboardCheck className="size-5 shrink-0 text-medium-foreground" aria-hidden="true" />
            <span>
              <span className="block text-xs font-medium text-medium-foreground">Expected</span>
              <span className="font-semibold">{task.expected}</span>
            </span>
          </p>
        )}
        {task.reading ? (
          <FoReadingMeter reading={task.reading} label={compact ? `Expected ${foLowerFirst(task.expected)}` : 'Last reading, yesterday'} />
        ) : null}
        <div className="mt-auto">
          <FoAnswers round={round} />
        </div>
      </article>
      {round.upcoming.slice(0, compact ? 1 : 2).map((next, index) => (
        <div
          key={next.id}
          aria-hidden="true"
          className={`kit-tone-${FO_STACK_TONES[index] ?? 'teal'} relative -mt-5 items-end justify-between gap-3 rounded-b-[1.75rem] px-5 pt-8 pb-3 text-sm font-semibold ${index === 0 ? 'z-10 mx-4 flex' : 'mx-9 hidden @[21rem]:flex'}`}
          style={{ background: 'var(--t-soft)', color: 'var(--t-on-soft)' }}
        >
          <span className="min-w-0">
            Then: {next.tag}
            {compact ? null : <span className="hidden @[21rem]:inline"> · {next.where}</span>}
          </span>
          <span className="shrink-0 tabular-nums">{next.minutes} min</span>
        </div>
      ))}
    </div>
  );
}

function FoUndo({ round }: { round: FoRound }) {
  return (
    <Button variant="ghost" size="sm" disabled={!round.canUndo} onClick={round.undo}>
      <IconArrowBackUp /> Undo last answer
    </Button>
  );
}

function FoTabletRound({ round }: { round: FoRound }) {
  return (
    <>
      <FoStatusBar queued={round.done} />
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4 px-5 pb-1">
        <Panel tone="purple">
          <FoProgress round={round} />
        </Panel>
        <div className="flex min-h-0 flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-base-foreground">Next up</p>
            <FoUndo round={round} />
          </div>
          <FoTaskStack round={round} />
        </div>
      </div>
      <FoDock findings={foCount(round.results, 'flag')} />
    </>
  );
}

function FoPhoneRound({ round }: { round: FoRound }) {
  return (
    <>
      <FoStatusBar phone queued={round.done} />
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-3.5 pt-5">
        <div
          className="kit-tone-purple flex items-center gap-4 rounded-[1.5rem] px-4 py-3"
          style={{
            background: 'color-mix(in oklab, var(--t-soft) 72%, var(--kit-surface))',
          }}
        >
          <RingGauge label="Checkpoints done" value={round.done} max={FO_TASKS.length} unit={`of ${FO_TASKS.length}`} size={84} tone="purple" hideLabel />
          <div className="min-w-0">
            <p className="text-base font-bold text-base-foreground">Round B-12</p>
            <p className="text-sm text-medium-foreground">{round.current ? `${round.minutesLeft} min left` : 'All checkpoints answered'}</p>
            {foCount(round.results, 'flag') > 0 ? (
              <StatusPill tone="warning" icon={<IconFlag />} className="mt-1.5">
                {foCount(round.results, 'flag')} flagged
              </StatusPill>
            ) : null}
          </div>
        </div>
        <FoTaskStack round={round} compact />
      </div>
      <FoDock findings={foCount(round.results, 'flag')} labels={false} />
    </>
  );
}

function FieldOperatorSignature() {
  const round = useFoRound(FO_START);
  return (
    <LookScope look="soft">
      <Canvas className="flex h-[52rem] items-stretch gap-6">
        <FoDevice kind="tablet" label="Tablet, landscape" className="flex-1">
          <FoTabletRound round={round} />
        </FoDevice>
        <FoDevice kind="phone" label="Phone, same round" className="w-[19.5rem] shrink-0">
          <FoPhoneRound round={round} />
        </FoDevice>
      </Canvas>
    </LookScope>
  );
}

function FieldOperatorSummary() {
  const round = useFoRound({
    t1: 'ok',
    t2: 'flag',
    t3: 'ok',
    t4: 'ok',
    t5: 'flag',
    t6: 'ok',
    t7: 'ok',
    t8: 'ok',
    t9: 'ok',
    t10: 'skip',
  });
  const [submitted, setSubmitted] = useState(false);
  return (
    <LookScope look="soft">
      <Canvas className="flex h-[53rem] items-stretch justify-center">
        <FoDevice kind="tablet" label="Tablet, round summary" className="w-full max-w-5xl">
          <FoStatusBar queued={submitted ? 0 : 10} />
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-4 px-5 pb-1">
            <div className="flex min-h-0 flex-col gap-4">
              <Panel tone="green" title="Round B-12 answered" subtitle="Gas compression · 38 min · 1.9 km walked">
                <div className="flex flex-1 items-center">
                  <Donut
                    label="Answers by result"
                    centerCaption="answers"
                    size={150}
                    className="w-full"
                    segments={[
                      {
                        label: 'Looked right',
                        value: foCount(round.results, 'ok'),
                        tone: 'success',
                      },
                      {
                        label: 'Flagged',
                        value: foCount(round.results, 'flag'),
                        tone: 'warning',
                      },
                      {
                        label: 'Skipped',
                        value: foCount(round.results, 'skip'),
                        tone: 'neutral',
                      },
                    ]}
                  />
                </div>
              </Panel>
              <div
                className={`flex items-center gap-3 rounded-[1.75rem] p-4 ${submitted ? 'bg-success-background text-success-foreground' : 'bg-muted-background text-base-foreground'}`}
              >
                {submitted ? (
                  <IconCircleCheck className="size-8 shrink-0" aria-hidden="true" />
                ) : (
                  <IconCloudOff className="size-8 shrink-0 text-medium-foreground" aria-hidden="true" />
                )}
                <p className="min-w-0 flex-1 text-sm">
                  <span className="block text-base font-bold">{submitted ? 'Round submitted' : 'Offline, 10 answers queued'}</span>
                  {submitted ? 'Two notifications raised for the flagged checkpoints.' : 'Submit now; answers upload at the next access point.'}
                </p>
                <Button size="lg" variant={submitted ? 'outline' : 'default'} onClick={() => setSubmitted((before) => !before)}>
                  {submitted ? 'Reopen' : 'Submit round'}
                </Button>
              </div>
            </div>
            <Panel title="Checkpoints" subtitle="In walking order" padding="tight">
              <ol className="flex flex-1 flex-col justify-between gap-1">
                {FO_TASKS.map((task, index) => {
                  const result = round.results[task.id] ?? 'skip';
                  return (
                    <li key={task.id} className={`flex items-center gap-3 rounded-2xl px-3 py-1.5 ${result === 'flag' ? 'bg-warning-background' : ''}`}>
                      <span className="w-5 text-sm font-bold text-medium-foreground tabular-nums">{index + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-base-foreground">{task.title}</span>
                        <span className="block text-xs text-medium-foreground">
                          {task.tag} ·{' '}
                          {task.reading
                            ? `${formatNumber(task.reading.value, task.reading.decimals)} ${task.reading.unit} · expected ${foLowerFirst(task.expected)}`
                            : task.expected}
                        </span>
                      </span>
                      <StatusPill
                        tone={FO_RESULT_TONE[result]}
                        icon={result === 'ok' ? <IconCheck /> : result === 'flag' ? <IconFlag /> : <IconPlayerSkipForward />}
                      >
                        {FO_RESULT_LABEL[result]}
                      </StatusPill>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          </div>
          <FoDock current="findings" findings={foCount(round.results, 'flag')} />
        </FoDevice>
      </Canvas>
    </LookScope>
  );
}

const FO_SEVERITIES = ['Observe', 'Fix this week', 'Stop and call'];

/** A numeric entry with large steps, judged against its limits while it is entered. */
function FoReadingEntry({ task }: { task: FoTask & { reading: FoReading } }) {
  const [value, setValue] = useState(task.reading.value);
  const step = task.reading.decimals > 0 ? 0.1 : 1;
  const out = value > task.reading.high || value < task.reading.low;
  const change = (direction: 1 | -1) =>
    setValue((before) => Number(Math.min(task.reading.max, Math.max(0, before + direction * step)).toFixed(task.reading.decimals)));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Button size="icon-lg" variant="outline" aria-label={`Lower by ${step} ${task.reading.unit}`} onClick={() => change(-1)}>
          <IconMinus />
        </Button>
        <p className="text-center">
          <span className="block text-6xl leading-none font-bold tracking-tight text-base-foreground tabular-nums">
            {formatNumber(value, task.reading.decimals)}
          </span>
          <span className="mt-1 block text-base font-medium text-medium-foreground">{task.reading.unit}</span>
        </p>
        <Button size="icon-lg" variant="outline" aria-label={`Raise by ${step} ${task.reading.unit}`} onClick={() => change(1)}>
          <IconPlus />
        </Button>
      </div>
      <FoReadingMeter reading={{ ...task.reading, value }} label={`Expected ${foLowerFirst(task.expected)}`} />
      <StatusPill size="lg" tone={out ? 'critical' : 'success'} icon={out ? <IconAlertTriangle /> : <IconCircleCheck />} className="self-center">
        {out ? 'Outside limits, flag it' : 'Within limits'}
      </StatusPill>
    </div>
  );
}

function foWithReading(task: FoTask | undefined): (FoTask & { reading: FoReading }) | null {
  return task?.reading ? { ...task, reading: task.reading } : null;
}

const FO_VIBRATION = foWithReading(FO_TASKS[1]);

const FO_QUEUE = [
  {
    id: 'q1',
    title: 'Lube oil level',
    detail: 'Looked right · 13:22',
    state: 'Sent',
  },
  {
    id: 'q2',
    title: 'Drive-end vibration',
    detail: '6.8 mm/s · flagged · 13:27',
    state: 'Sent',
  },
  {
    id: 'q3',
    title: 'Discharge pressure',
    detail: '48.6 barg · 13:31',
    state: 'Queued',
  },
  {
    id: 'q4',
    title: 'Interstage cooler',
    detail: 'Looked right · 13:38',
    state: 'Queued',
  },
  {
    id: 'q5',
    title: 'Photo, drip tray',
    detail: '2.4 MB · 13:39',
    state: 'Queued',
  },
];

function FieldOperatorPhones() {
  const [severity, setSeverity] = useState('Fix this week');
  const [online, setOnline] = useState(false);
  return (
    <LookScope look="soft">
      <Canvas className="grid h-[48rem] grid-cols-3 justify-items-center gap-6">
        <FoDevice kind="phone" label="Enter a reading" className="w-full max-w-[20.5rem]">
          <FoStatusBar phone queued={4} />
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pt-6">
            <div>
              <TagId variant="chip">23-VT-92540</TagId>
              <h3 className="mt-2 text-xl leading-6 font-bold text-base-foreground">Drive-end vibration, 1st stage compressor</h3>
              <p className="mt-1 text-sm text-medium-foreground">Hold the probe on the marked pad for ten seconds.</p>
            </div>
            <div
              className="kit-tone-purple rounded-[1.75rem] p-4"
              style={{
                background: 'color-mix(in oklab, var(--t-soft) 72%, var(--kit-surface))',
              }}
            >
              {FO_VIBRATION ? <FoReadingEntry task={FO_VIBRATION} /> : null}
            </div>
            <Button size="lg" className="mt-auto w-full">
              <IconCheck /> Save reading
            </Button>
          </div>
          <FoDock labels={false} />
        </FoDevice>

        <FoDevice kind="phone" label="Flag a finding" className="w-full max-w-[20.5rem]">
          <FoStatusBar phone queued={5} />
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pt-6">
            <div className="flex items-center gap-3">
              <IconChip tone="warning" size="lg">
                <IconFlag />
              </IconChip>
              <div>
                <h3 className="text-xl leading-6 font-bold text-base-foreground">Flag a finding</h3>
                <p className="text-sm text-medium-foreground">
                  Cooler outlet temperature <span className="block font-medium tabular-nums">23-TT-91141</span>
                </p>
              </div>
            </div>
            <div className="rounded-[1.75rem] bg-warning-background p-4 text-warning-foreground">
              <p className="text-4xl font-bold tabular-nums">38.9 °C</p>
              <p className="text-sm font-medium">1.1 °C under the 40 °C limit and rising since 09:00</p>
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-bold text-base-foreground">How urgent is it?</legend>
              <div className="flex flex-col gap-2">
                {FO_SEVERITIES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={severity === option}
                    onClick={() => setSeverity(option)}
                    className={`flex items-center justify-between rounded-full px-4 py-3 text-base font-semibold ${severity === option ? 'bg-primary-background text-primary-foreground' : 'bg-muted-background text-base-foreground'}`}
                  >
                    {option}
                    {severity === option ? <IconCheck className="size-5" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </fieldset>
            <p className="rounded-2xl bg-muted-background px-4 py-3 text-sm text-base-foreground">Fins on the north bank look fouled. Photo attached.</p>
            <Button size="lg" className="mt-auto w-full">
              Raise notification
            </Button>
          </div>
          <FoDock current="findings" findings={2} labels={false} />
        </FoDevice>

        <FoDevice kind="phone" label="Sync queue" className="w-full max-w-[20.5rem]">
          <FoStatusBar phone queued={online ? 0 : 3} />
          <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pt-6">
            <div
              className={`flex items-center gap-3 rounded-[1.75rem] p-4 ${online ? 'bg-success-background text-success-foreground' : 'bg-info-background text-info-foreground'}`}
            >
              {online ? <IconCircleCheck className="size-9 shrink-0" aria-hidden="true" /> : <IconCloudOff className="size-9 shrink-0" aria-hidden="true" />}
              <p className="text-sm font-medium">
                <span className="block text-xl font-bold">{online ? 'All sent' : '3 waiting to send'}</span>
                {online ? 'Synced at the pump house access point.' : 'No coverage in the compressor hall.'}
              </p>
            </div>
            <ul className="flex flex-col gap-2">
              {FO_QUEUE.map((item) => {
                const sent = online || item.state === 'Sent';
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-2xl bg-muted-background px-4 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-base-foreground">{item.title}</span>
                      <span className="block text-xs text-medium-foreground">{item.detail}</span>
                    </span>
                    <StatusPill tone={sent ? 'success' : 'info'}>{sent ? 'Sent' : 'Queued'}</StatusPill>
                  </li>
                );
              })}
            </ul>
            <Button size="lg" variant="outline" className="mt-auto w-full" onClick={() => setOnline((before) => !before)}>
              <IconCloudUpload /> {online ? 'Go offline again' : 'Try to send now'}
            </Button>
          </div>
          <FoDock current="me" labels={false} />
        </FoDevice>
      </Canvas>
    </LookScope>
  );
}

function FieldOperatorProgress() {
  const round = useFoRound(FO_START);
  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[31rem] flex-col">
        <Panel tone="purple" className="flex-1">
          <FoProgress round={round} size={200} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function FieldOperatorTaskStack() {
  const round = useFoRound({ t1: 'ok' });
  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[50rem] flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-base-foreground">Next up</p>
          <FoUndo round={round} />
        </div>
        <FoTaskStack round={round} />
      </Canvas>
    </LookScope>
  );
}

function FieldOperatorReadingEntry() {
  const task = foWithReading(FO_TASKS[4]);
  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[31rem] flex-col">
        <Panel tone="amber" className="flex-1" title="Cooler outlet temperature" subtitle="23-TT-91141 · enter the local reading">
          {task ? <FoReadingEntry task={task} /> : null}
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function FieldOperatorDock() {
  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-full flex-wrap items-center justify-center gap-6">
        <div className="rounded-[1.75rem] bg-base-background px-3 pt-2">
          <FoDock findings={1} />
        </div>
        <div className="rounded-[1.75rem] bg-base-background px-3 pt-2">
          <FoDock current="findings" findings={2} labels={false} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function FieldOperatorComplete() {
  const round = useFoRound({
    t1: 'ok',
    t2: 'flag',
    t3: 'ok',
    t4: 'ok',
    t5: 'ok',
    t6: 'ok',
    t7: 'ok',
    t8: 'ok',
    t9: 'ok',
    t10: 'skip',
  });
  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[31rem] flex-col">
        <FoTaskStack round={round} />
      </Canvas>
    </LookScope>
  );
}

function FieldOperatorPhoneFrame() {
  const round = useFoRound({
    t1: 'ok',
    t2: 'flag',
    t3: 'ok',
    t4: 'ok',
    t5: 'flag',
    t6: 'ok',
  });
  return (
    <LookScope look="soft" className="w-full">
      <Canvas className="flex h-[50rem] justify-center">
        <FoDevice kind="phone" label="Phone frame" className="w-full max-w-[20.5rem]">
          <FoPhoneRound round={round} />
        </FoDevice>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'field-operator',
  title: 'Field operator',
  summary:
    'An inspection round on handheld devices: the round as one large progress ring, the next checkpoint as the top card of a stack with three large answers, shown on a tablet and a phone that share the same round.',
  guidance: {
    use: [
      'For work done standing up, with gloves on, one item at a time.',
      'One card, one decision: answer it and the next card is dealt.',
      'Say what is expected on the card, so a reading is judged where it is taken.',
    ],
    avoid: [
      'Tables, hover states and small targets; everything is a thumb-sized pill.',
      'Hiding the offline state: say how many answers are queued and when they will send.',
      'A separate layout per device; the phone is the tablet with the ring folded into the header.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Answer the top card with Looks right, Flag it or Skip: the ring fills, the next card is dealt, and both devices follow. Undo steps back.',
      specimens: [
        {
          id: 'FieldOperatorSignature',
          title: 'Round on tablet and phone',
          note: 'Pick it for rounds, checklists and inspections carried out in the field on shared or personal devices.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: FieldOperatorSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'What the operator sees at the end of the round, and three phone screens along the way.',
      specimens: [
        {
          id: 'FieldOperatorSummary',
          title: 'Round summary',
          note: 'Pick it as the last screen of a round: every answer in walking order and one button to submit.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Donut.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: FieldOperatorSummary,
        },
        {
          id: 'FieldOperatorPhones',
          title: 'Reading, finding and sync',
          note: 'Pick these for the three moments that need their own screen on a phone: entering a value, flagging, and sending.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/StatusPill.tsx', 'kit/IconChip.tsx', 'kit/TagId.tsx', 'looks/LookScope.tsx'],
          Component: FieldOperatorPhones,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The cards and the chrome of the handheld screens on their own.',
      specimens: [
        {
          id: 'FieldOperatorTaskStack',
          title: 'Task card stack',
          note: 'Pick it to keep attention on one task while showing that more follow.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Meter.tsx', 'kit/TagId.tsx'],
          Component: FieldOperatorTaskStack,
        },
        {
          id: 'FieldOperatorPhoneFrame',
          title: 'Phone screen',
          note: 'Pick the frame to review a handheld layout at its real width.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/RingGauge.tsx', 'kit/StatusPill.tsx'],
          Component: FieldOperatorPhoneFrame,
        },
        {
          id: 'FieldOperatorProgress',
          title: 'Round progress',
          note: 'Pick it when progress through a fixed list is the main thing to know.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/RingGauge.tsx'],
          Component: FieldOperatorProgress,
        },
        {
          id: 'FieldOperatorReadingEntry',
          title: 'Reading entry',
          note: 'Pick it for a value typed with gloves on: two large steps and a verdict against the limits.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/Meter.tsx', 'kit/StatusPill.tsx'],
          Component: FieldOperatorReadingEntry,
        },
        {
          id: 'FieldOperatorComplete',
          title: 'Round complete',
          note: 'Pick it as the end state of a card stack: the result in words and the one thing left to do.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx'],
          Component: FieldOperatorComplete,
        },
        {
          id: 'FieldOperatorDock',
          title: 'Bottom dock',
          note: 'Pick it as the navigation of a handheld screen: with labels on a tablet, icons only on a phone.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx'],
          Component: FieldOperatorDock,
        },
      ],
    },
  ],
});
