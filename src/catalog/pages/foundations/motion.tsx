import { Button } from '@cognite/aura/components/button';
import { Loader } from '@cognite/aura/components/loader';
import { Shimmer } from '@cognite/aura/components/shimmer';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Switch } from '@cognite/aura/components/switch';
import { IconBell, IconChevronDown, IconPlus, IconRefresh, IconSettings, IconX } from '@cognite/aura/icons';
import { useEffect, useRef, useState } from 'react';

import { DoDont } from '../../../library/foundations/DoDont';
import { DURATIONS, EASINGS, findEasing, formatMs, STAGGER_MS, staggerDelay } from '../../../library/foundations/motion';
import { Replay } from '../../../library/foundations/Replay';
import { useSimulatedWait } from '../../../library/foundations/useSimulatedWait';
import { formatReading } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { usePrefersReducedMotion } from '../../../library/three/usePrefersReducedMotion';
import { ALARMS, findAsset, WORK_ORDERS } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './motion.tsx?raw';

const ENTRANCE = findEasing('entrance').className;
const EXIT = findEasing('exit').className;
const STANDARD = findEasing('standard').className;

const EASING_DEMO_MS = 800;

const STAGGER_ROWS = ALARMS.slice(0, 5);

const READINGS = [111.1, 98.7, 104.4, 117.8, 101.1] as const;

const ANCHORS = [
  {
    name: 'Flow',
    meaning: 'Elements arrive and leave with direction. Nothing jumps or teleports.',
    test: 'Can I follow the motion with my eyes without losing my place?',
  },
  {
    name: 'Calm',
    meaning: 'Motion never competes with the data. Nothing overshoots, drags or bounces.',
    test: 'Does this still feel good after 8 hours of use?',
  },
  {
    name: 'Tactile',
    meaning: 'Buttons snap, panels slide from the edge they belong to.',
    test: 'Can I tell what is interactive by how it moves?',
  },
] as const;

/** A dot that travels the full track once per run. `motion` carries the duration and easing. */
function MotionTrack({ run, motion, label, detail }: { run: number; motion: string; label: string; detail: string }) {
  return (
    <div className="grid grid-cols-[5rem_minmax(0,1fr)_4.5rem] items-center gap-3">
      <p className="text-sm text-base-foreground">{label}</p>
      <div className="h-3 overflow-hidden rounded-full bg-muted-background">
        <div
          className={`flex justify-end ${
            run > 0 ? `fill-mode-both motion-safe:animate-in motion-safe:slide-in-from-left-[100%] ${motion}` : ''
          }`}
        >
          <span className="size-3 rounded-full bg-primary-background" />
        </div>
      </div>
      <p className="text-right font-mono text-xs text-muted-foreground tabular-nums">{detail}</p>
    </div>
  );
}

function MotionAlarmRow({ message, tag, className = '' }: { message: string; tag: string; className?: string }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg bg-muted-background px-3 py-2 ${className}`}>
      <p className="min-w-0 truncate text-sm text-base-foreground">{message}</p>
      <p className="shrink-0 font-mono text-xs text-muted-foreground">{tag}</p>
    </div>
  );
}

function MotionGuideDurations() {
  return (
    <Replay caption="Same distance, same easing. Only the duration changes.">
      {(run) => (
        <div className="flex flex-col gap-3">
          {DURATIONS.map((band) => (
            <MotionTrack
              key={band.id}
              run={run}
              label={band.name}
              detail={formatMs(band.ms)}
              motion={`${band.className} ${STANDARD}`}
            />
          ))}
        </div>
      )}
    </Replay>
  );
}

function MotionGuideEasings() {
  return (
    <Replay caption={`Slowed to ${formatMs(EASING_DEMO_MS)} so the curves can be told apart.`}>
      {(run) => (
        <div className="flex flex-col gap-3">
          {EASINGS.map((easing) => (
            <MotionTrack
              key={easing.id}
              run={run}
              label={easing.name}
              detail={easing.id}
              motion={`duration-[800ms] ${easing.className}`}
            />
          ))}
        </div>
      )}
    </Replay>
  );
}

function MotionGuideReference() {
  return (
    <div className="grid w-full grid-cols-1 gap-x-10 gap-y-6 lg:grid-cols-2">
      <Table>
        <TableCaption side="top">Duration bands</TableCaption>
        <TableBody>
          {DURATIONS.map((band) => (
            <TableRow key={band.id}>
              <TableCell rowHeader wrap="nowrap">
                {band.name}
              </TableCell>
              <TableCell numeric>{formatMs(band.ms)}</TableCell>
              <TableCell mono muted>
                {band.className}
              </TableCell>
              <TableCell muted>
                <span className="text-xs">{band.use}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Table>
        <TableCaption side="top">Easing curves</TableCaption>
        <TableBody>
          {EASINGS.map((easing) => (
            <TableRow key={easing.id}>
              <TableCell rowHeader wrap="nowrap">
                {easing.name}
              </TableCell>
              <TableCell mono muted>
                {easing.curve}
              </TableCell>
              <TableCell muted>
                <span className="text-xs">{easing.use}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MotionGuideExitFaster() {
  const [open, setOpen] = useState(false);
  const alarm = ALARMS[1];

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide alarm details' : 'Show alarm details'}
        </Button>
        <p className="text-xs text-muted-foreground tabular-nums">
          {open ? 'Entered in 200 ms, entrance easing' : 'Leaves in 150 ms, exit easing'}
        </p>
      </div>
      <div className="h-28">
        <div
          aria-hidden={!open}
          className={`rounded-xl bg-popover-background p-4 shadow-default motion-safe:transition-[opacity,transform] ${
            open
              ? `translate-y-0 opacity-100 duration-200 ${ENTRANCE}`
              : `pointer-events-none -translate-y-1 opacity-0 duration-150 ${EXIT}`
          }`}
        >
          <p className="text-sm font-medium text-popover-foreground">{alarm.message}</p>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {alarm.value} against a limit of {alarm.limit}, raised {formatAgo(alarm.raisedAt)}.
          </p>
        </div>
      </div>
    </div>
  );
}

function MotionGuideElementVsPage() {
  return (
    <Replay playLabel="Play page entrance" replayLabel="Replay page entrance">
      {(run) => (
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground">Element level, under 200 ms</p>
            <Switch defaultChecked label="Notify on alarm" />
            <p className="text-xs text-muted-foreground">A small change over a short distance. Try the switch.</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium text-muted-foreground">Page level, 400 ms</p>
            <div
              className={`flex flex-col gap-2 ${
                run > 0
                  ? `fill-mode-both duration-[400ms] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 ${ENTRANCE}`
                  : ''
              }`}
            >
              <div className="rounded-lg bg-muted-background p-3">
                <p className="text-xs text-muted-foreground">Availability</p>
                <p className="text-xl font-semibold text-base-foreground tabular-nums">{formatReading(96.4, '%', 1)}</p>
              </div>
              <div className="h-10 rounded-lg bg-muted-background" />
            </div>
          </div>
        </div>
      )}
    </Replay>
  );
}

function MotionGuideExpandCollapse() {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-xs">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-base-foreground outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring"
      >
        Operating limits
        <IconChevronDown
          aria-hidden="true"
          className={`size-4 motion-safe:transition-transform motion-safe:duration-200 ${STANDARD} ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        aria-hidden={!open}
        className={`grid motion-safe:transition-[grid-template-rows] motion-safe:duration-200 ${STANDARD} ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <dl className="grid grid-cols-2 gap-y-1 px-2 pt-2 text-sm">
            <dt className="text-muted-foreground">High limit</dt>
            <dd className="text-right text-base-foreground tabular-nums">{formatReading(52, 'barg', 1)}</dd>
            <dt className="text-muted-foreground">Low limit</dt>
            <dd className="text-right text-base-foreground tabular-nums">{formatReading(40, 'barg', 1)}</dd>
            <dt className="text-muted-foreground">Trip limit</dt>
            <dd className="text-right text-base-foreground tabular-nums">{formatReading(55, 'barg', 1)}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

function MotionGuideHoverPress() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <button
        type="button"
        className="flex items-center justify-between gap-3 rounded-lg bg-card-background px-3 py-2 text-left outline-none hover:bg-card-background-hover focus-visible:shadow-focus-ring active:bg-medium-background-hover motion-safe:transition-[background-color,transform] motion-safe:duration-100 motion-safe:active:scale-[0.98]"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-card-foreground">1st stage compressor</span>
          <span className="block font-mono text-xs text-muted-foreground">23-KA-9101</span>
        </span>
        <StatusIndicator tone="success" label="Running" size="sm" />
      </button>
      <p className="text-xs text-muted-foreground">
        Hover shifts the surface in 100 ms; press goes one step deeper and settles on release.
      </p>
    </div>
  );
}

function MotionGuideNumberChange() {
  const [index, setIndex] = useState(0);
  const value = READINGS[index % READINGS.length];

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted-background p-3">
          <p className="text-xs text-muted-foreground">tabular-nums</p>
          <p className="text-xl font-semibold text-base-foreground tabular-nums">{value.toFixed(1)}</p>
        </div>
        <div className="rounded-lg bg-muted-background p-3">
          <p className="text-xs text-muted-foreground">proportional-nums</p>
          <p className="text-xl font-semibold text-base-foreground proportional-nums">{value.toFixed(1)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setIndex(index + 1)}>
          <IconRefresh /> Update reading
        </Button>
        <p className="text-xs text-muted-foreground">Swap the digits; do not animate them.</p>
      </div>
    </div>
  );
}

function MotionGuideListAddRemove() {
  const [rows, setRows] = useState(() => ALARMS.slice(1, 3).map((alarm) => alarm.id));
  const [fresh, setFresh] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const next = ALARMS.find((alarm) => !rows.includes(alarm.id));

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  const remove = (id: string) => {
    if (leaving !== null) return;
    setLeaving(id);
    timer.current = window.setTimeout(() => {
      setRows((current) => current.filter((row) => row !== id));
      setLeaving(null);
    }, 150);
  };

  const add = () => {
    if (!next) return;
    setRows([next.id, ...rows]);
    setFresh(next.id);
  };

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ul className="flex min-h-40 flex-col gap-2">
        {rows.map((id) => {
          const alarm = ALARMS.find((candidate) => candidate.id === id);
          if (!alarm) return null;
          const motion =
            id === leaving
              ? `fill-mode-forwards duration-150 motion-safe:animate-out motion-safe:fade-out ${EXIT}`
              : id === fresh
                ? `duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 ${ENTRANCE}`
                : '';
          return (
            <li key={id} className={`flex items-center gap-2 ${motion}`}>
              <MotionAlarmRow message={alarm.message} tag={alarm.sensorTag} className="min-w-0 flex-1" />
              <Button variant="ghost" size="icon-sm" aria-label={`Clear ${alarm.message}`} onClick={() => remove(id)}>
                <IconX />
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" disabled={!next} onClick={add}>
          <IconPlus /> Add alarm
        </Button>
        <p className="text-xs text-muted-foreground">
          {next ? 'New rows enter in 200 ms; cleared rows leave in 150 ms.' : 'All alarms are listed. Clear one to add again.'}
        </p>
      </div>
    </div>
  );
}

function MotionGuideStagger() {
  return (
    <Replay caption={`${STAGGER_MS} ms between rows on the way in. Exits leave together.`}>
      {(run) => (
        <ul className="flex flex-col gap-2">
          {STAGGER_ROWS.map((alarm, index) => (
            <li
              key={alarm.id}
              style={run > 0 ? { animationDelay: `${staggerDelay(index)}ms` } : undefined}
              className={
                run > 0
                  ? `fill-mode-both duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 ${ENTRANCE}`
                  : ''
              }
            >
              <MotionAlarmRow message={alarm.message} tag={alarm.sensorTag} />
            </li>
          ))}
        </ul>
      )}
    </Replay>
  );
}

function MotionGuideSkeletonSwap() {
  const wait = useSimulatedWait(1400);
  const order = WORK_ORDERS[0];
  const asset = findAsset(order.assetId);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex h-20 flex-col justify-center gap-2 rounded-xl border border-default p-4">
        {wait.phase === 'waiting' ? (
          <div className="flex flex-col gap-2" role="status" aria-label="Loading work order">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ) : wait.phase === 'done' ? (
          <div className={`duration-200 motion-safe:animate-in motion-safe:fade-in ${ENTRANCE}`}>
            <p className="text-sm leading-4 font-medium text-base-foreground">{order.title}</p>
            <p className="mt-2 text-xs leading-3 text-muted-foreground">
              <span className="font-mono">{order.id}</span> · {asset?.name}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No work order loaded.</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" disabled={wait.phase === 'waiting'} onClick={wait.start}>
          {wait.phase === 'done' ? 'Load again' : 'Load work order'}
        </Button>
        <p className="text-xs text-muted-foreground">The placeholder has the size of the content, so nothing shifts.</p>
      </div>
    </div>
  );
}

function MotionGuideDropdownAnatomy() {
  const [open, setOpen] = useState(false);
  const items = ['Acknowledge alarm', 'Shelve for 8 hours', 'Create work order', 'Open trend'];

  return (
    <div className="flex w-full max-w-md gap-6">
      <div className="flex h-52 w-48 shrink-0 flex-col gap-1">
        <Button variant="outline" aria-expanded={open} onClick={() => setOpen(!open)}>
          Alarm actions <IconChevronDown />
        </Button>
        <ul
          aria-hidden={!open}
          className={`flex origin-top flex-col rounded-xl bg-popover-background p-1 shadow-default motion-safe:transition-[opacity,transform] ${
            open
              ? `scale-100 opacity-100 duration-200 ${ENTRANCE}`
              : `pointer-events-none scale-95 opacity-0 duration-150 ${EXIT}`
          }`}
        >
          {items.map((item, index) => (
            <li
              key={item}
              style={{ transitionDelay: open ? `${staggerDelay(index)}ms` : '0ms' }}
              className={`rounded-md px-2 py-1.5 text-sm text-popover-foreground motion-safe:transition-opacity motion-safe:duration-150 ${
                open ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
      <ol className="flex min-w-0 flex-col gap-2 text-xs text-muted-foreground">
        <li>
          <span className="font-medium text-base-foreground">Open.</span> The panel scales in from its trigger in 200 ms
          with entrance easing.
        </li>
        <li>
          <span className="font-medium text-base-foreground">Items.</span> Each fades in {STAGGER_MS} ms after the one
          above.
        </li>
        <li>
          <span className="font-medium text-base-foreground">Close.</span> Panel and items leave together in 150 ms,
          with no stagger.
        </li>
      </ol>
    </div>
  );
}

function MotionGuideLoadingChoice() {
  const wait = useSimulatedWait(2000);
  const waiting = wait.phase === 'waiting';

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Loader: compact wait</p>
          <div className="flex h-16 items-center gap-2 text-sm text-base-foreground">
            {waiting ? (
              <>
                <Loader size={16} aria-label="Saving setpoint" /> Saving setpoint…
              </>
            ) : wait.phase === 'done' ? (
              'Setpoint saved'
            ) : (
              'Setpoint not saved yet'
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Skeleton: layout is known</p>
          <div className="flex h-16 flex-col justify-center gap-2">
            {waiting ? (
              <div className="flex flex-col gap-2" role="status" aria-label="Loading reading">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-32" />
              </div>
            ) : (
              <>
                <p className="text-xs leading-3 text-muted-foreground">Discharge pressure</p>
                <p className="text-xl leading-6 font-semibold text-base-foreground tabular-nums">
                  {wait.phase === 'done' ? formatReading(48.6, 'barg', 1) : formatReading(null)}
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground">Shimmer: work in progress</p>
          <div className="flex h-16 items-center text-sm text-base-foreground">
            {waiting ? (
              <Shimmer>Analysing 24 hours of vibration data</Shimmer>
            ) : wait.phase === 'done' ? (
              'Analysis ready: no anomalies in 24 hours'
            ) : (
              'No analysis started'
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" disabled={waiting} onClick={wait.start}>
          {wait.phase === 'done' ? 'Run again' : 'Start a 2 second wait'}
        </Button>
        <p className="text-xs text-muted-foreground">
          All three move only while there is something to wait for, then stop.
        </p>
      </div>
    </div>
  );
}

function MotionGuideLivePulse() {
  const [acknowledged, setAcknowledged] = useState(false);
  const alarm = ALARMS[0];

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col gap-1 rounded-lg bg-muted-background p-3">
        <StatusIndicator
          tone="critical"
          shape="diamond"
          label={acknowledged ? 'Acknowledged' : 'Active'}
          detail={formatAgo(alarm.raisedAt)}
          pulse={!acknowledged}
        />
        <p className="text-sm text-base-foreground">{alarm.message}</p>
      </div>
      <Button variant="secondary" size="sm" className="self-start" onClick={() => setAcknowledged(!acknowledged)}>
        <IconBell /> {acknowledged ? 'Raise alarm again' : 'Acknowledge alarm'}
      </Button>
      <p className="text-xs text-muted-foreground">
        The only loop allowed: one small mark, only while a person still has to act.
      </p>
    </div>
  );
}

function MotionGuideReducedSideBySide() {
  return (
    <Replay caption="Both panels are forced here so you can compare them on any device.">
      {(run) => (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">No preference</p>
            <div className="h-24 overflow-hidden rounded-lg bg-muted-background p-2">
              <div
                className={`rounded-lg bg-popover-background p-3 shadow-sm ${
                  run > 0 ? `fill-mode-both animate-in duration-300 fade-in slide-in-from-bottom-8 ${ENTRANCE}` : ''
                }`}
              >
                <p className="text-sm font-medium text-popover-foreground">Work order created</p>
                <p className="text-xs text-muted-foreground">Slides up and fades in, 300 ms.</p>
              </div>
            </div>
            <p className="font-mono text-xs text-muted-foreground">motion-safe:slide-in-from-bottom-8</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">Reduced motion</p>
            <div className="h-24 overflow-hidden rounded-lg bg-muted-background p-2">
              <div
                className={`rounded-lg bg-popover-background p-3 shadow-sm ${
                  run > 0 ? 'fill-mode-both animate-in duration-150 fade-in' : ''
                }`}
              >
                <p className="text-sm font-medium text-popover-foreground">Work order created</p>
                <p className="text-xs text-muted-foreground">Fades in place, 150 ms.</p>
              </div>
            </div>
            <p className="font-mono text-xs text-muted-foreground">motion-reduce:fade-in</p>
          </div>
        </div>
      )}
    </Replay>
  );
}

function MotionGuideRespectsSetting() {
  const reduced = usePrefersReducedMotion();

  return (
    <Replay caption="This one follows your system setting.">
      {(run) => (
        <div className="flex flex-col gap-3">
          <StatusIndicator
            tone="info"
            shape={reduced ? 'ring' : 'dot'}
            label={reduced ? 'Reduced motion is on' : 'Reduced motion is off'}
            detail="prefers-reduced-motion"
          />
          <div className="h-20 overflow-hidden rounded-lg bg-muted-background p-2">
            <div
              className={`rounded-lg bg-popover-background p-3 shadow-sm ${
                run > 0
                  ? `fill-mode-both animate-in fade-in motion-safe:duration-300 motion-safe:slide-in-from-bottom-8 motion-reduce:duration-150 ${ENTRANCE}`
                  : ''
              }`}
            >
              <p className="text-sm font-medium text-popover-foreground">Alarm shelved for 8 hours</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Movement is prefixed with <span className="font-mono text-base-foreground">motion-safe:</span>; the fade
            stays, so the change is still noticed.
          </p>
        </div>
      )}
    </Replay>
  );
}

function MotionGuideNoBounce() {
  return (
    <Replay>
      {(run) => (
        <div className="grid grid-cols-2 gap-4">
          <DoDont kind="do" caption="Entrance easing decelerates and settles.">
            <div className="flex h-16 items-end justify-center overflow-hidden">
              <div
                className={`rounded-lg bg-popover-background px-3 py-2 text-sm text-popover-foreground shadow-sm ${
                  run > 0
                    ? `fill-mode-both duration-300 motion-safe:animate-in motion-safe:slide-in-from-bottom-8 ${ENTRANCE}`
                    : ''
                }`}
              >
                Changes saved
              </div>
            </div>
          </DoDont>
          <DoDont kind="dont" caption="An overshoot draws the eye to the animation, not the message.">
            <div className="flex h-16 items-end justify-center overflow-hidden">
              <div
                className={`rounded-lg bg-popover-background px-3 py-2 text-sm text-popover-foreground shadow-sm ${
                  run > 0
                    ? 'fill-mode-both duration-500 ease-[cubic-bezier(0.34,1.8,0.64,1)] motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:slide-in-from-bottom-8'
                    : ''
                }`}
              >
                Changes saved
              </div>
            </div>
          </DoDont>
        </div>
      )}
    </Replay>
  );
}

function MotionGuideNoDecorativeLoops() {
  return (
    <Replay caption="The loop is cut to three turns here. In a product it would never stop.">
      {(run) => (
        <div className="grid grid-cols-2 gap-4">
          <DoDont kind="do" caption="Still until something happens.">
            <p className="flex items-center gap-2 text-sm text-base-foreground">
              <IconSettings className="size-4 text-muted-foreground" aria-hidden="true" /> Extractor running
            </p>
          </DoDont>
          <DoDont kind="dont" caption="Decoration that moves all shift long competes with real alarms.">
            <p className="flex items-center gap-2 text-sm text-base-foreground">
              <IconSettings
                aria-hidden="true"
                className={`size-4 text-muted-foreground ${run > 0 ? 'repeat-[3] motion-safe:animate-spin' : ''}`}
              />
              Extractor running
            </p>
          </DoDont>
        </div>
      )}
    </Replay>
  );
}

function MotionGuideStaggerDrag() {
  return (
    <Replay>
      {(run) => (
        <div className="grid grid-cols-2 gap-4">
          <DoDont kind="do" caption={`${STAGGER_MS} ms apart: reads as one gesture.`}>
            <ul className="flex flex-col gap-1.5">
              {STAGGER_ROWS.map((alarm, index) => (
                <li
                  key={alarm.id}
                  style={run > 0 ? { animationDelay: `${staggerDelay(index)}ms` } : undefined}
                  className={`h-4 rounded-sm bg-medium-background ${
                    run > 0 ? `fill-mode-both duration-200 motion-safe:animate-in motion-safe:fade-in ${ENTRANCE}` : ''
                  }`}
                />
              ))}
            </ul>
          </DoDont>
          <DoDont kind="dont" caption="200 ms apart: the last row arrives a second late.">
            <ul className="flex flex-col gap-1.5">
              {STAGGER_ROWS.map((alarm, index) => (
                <li
                  key={alarm.id}
                  style={run > 0 ? { animationDelay: `${staggerDelay(index, 200)}ms` } : undefined}
                  className={`h-4 rounded-sm bg-medium-background ${
                    run > 0 ? `fill-mode-both duration-200 motion-safe:animate-in motion-safe:fade-in ${ENTRANCE}` : ''
                  }`}
                />
              ))}
            </ul>
          </DoDont>
        </div>
      )}
    </Replay>
  );
}

function MotionGuideAnchors() {
  return (
    <dl className="flex w-full flex-col gap-4">
      {ANCHORS.map((anchor) => (
        <div key={anchor.name} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-3">
          <dt className="text-sm font-medium text-base-foreground">{anchor.name}</dt>
          <dd>
            <p className="text-sm text-medium-foreground">{anchor.meaning}</p>
            <p className="mt-1 text-xs text-muted-foreground">Test: {anchor.test}</p>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default definePage({
  id: 'motion',
  title: 'Motion',
  summary:
    'Motion in Aura is productive: fast, quiet and tied to a cause. It shows where something came from, confirms an input, or covers a wait, and then it stops. Every demo here runs once, when you ask for it.',
  guidance: {
    use: [
      'Short durations for small changes, longer ones only for page-level entrances.',
      'Entrance easing in, exit easing out, and exits a little quicker than entrances.',
      'Two or three named properties per transition, usually opacity and position.',
      'The motion-safe prefix on anything that moves, so reduced motion is respected.',
    ],
    avoid: [
      'Bounce, overshoot and elastic easing.',
      'Decorative loops; only a live alarm may pulse, and only until it is acknowledged.',
      'Animating numbers digit by digit or letting them change width.',
      'Stagger on exits, or stagger long enough to be noticed as a wait.',
    ],
  },
  source,
  sections: [
    {
      id: 'timing',
      title: 'Durations and easing',
      description: 'Aura ships no motion tokens, so these Tailwind utilities are the reference values.',
      specimens: [
        {
          id: 'MotionGuideDurations',
          title: 'Durations',
          note: 'Pick the band by how far and how much moves: the smaller the change, the shorter.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/Replay.tsx', 'foundations/motion.ts'],
          Component: MotionGuideDurations,
        },
        {
          id: 'MotionGuideEasings',
          title: 'Easing curves',
          note: 'Standard between two states, entrance for arriving, exit for leaving, sine for fades.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/Replay.tsx', 'foundations/motion.ts'],
          Component: MotionGuideEasings,
        },
        {
          id: 'MotionGuideReference',
          title: 'Reference values',
          note: 'Copy the utility rather than inventing a duration or a curve per component.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['foundations/motion.ts', 'primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: MotionGuideReference,
        },
        {
          id: 'MotionGuideExitFaster',
          title: 'Enter and exit of an overlay',
          note: 'Once the user has acted, the overlay leaves faster than it arrived.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/motion.ts'],
          Component: MotionGuideExitFaster,
        },
        {
          id: 'MotionGuideElementVsPage',
          title: 'Element level and page level',
          note: 'A switch is done in under 200 ms; a whole view may take 400 ms to arrive.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/Replay.tsx', 'foundations/motion.ts'],
          Component: MotionGuideElementVsPage,
        },
      ],
    },
    {
      id: 'components',
      title: 'Component motion',
      description: 'The transitions that come up in almost every screen.',
      specimens: [
        {
          id: 'MotionGuideExpandCollapse',
          title: 'Expand and collapse',
          note: 'Height and chevron move together with standard easing; Accordion and Collapsible ship this.',
          origin: 'custom',
          align: 'stretch',
          uses: ['foundations/motion.ts'],
          Component: MotionGuideExpandCollapse,
        },
        {
          id: 'MotionGuideHoverPress',
          title: 'Hover and press feedback',
          note: 'Feedback on a custom interactive surface: immediate, and gone on release.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: MotionGuideHoverPress,
        },
        {
          id: 'MotionGuideNumberChange',
          title: 'Number change without jitter',
          note: 'Live values swap in place with tabular figures, so the layout never twitches.',
          origin: 'aura',
          align: 'stretch',
          Component: MotionGuideNumberChange,
        },
        {
          id: 'MotionGuideListAddRemove',
          title: 'List item add and remove',
          note: 'A new row slides in from where it was created; a cleared row only fades.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/motion.ts'],
          Component: MotionGuideListAddRemove,
        },
        {
          id: 'MotionGuideStagger',
          title: 'Staggered entrance',
          note: 'A group of similar rows revealed together, such as a list after a page change.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/Replay.tsx', 'foundations/motion.ts'],
          Component: MotionGuideStagger,
        },
        {
          id: 'MotionGuideSkeletonSwap',
          title: 'Skeleton to content',
          note: 'Content replaces a placeholder of the same size with a short fade and no movement.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/useSimulatedWait.ts', 'foundations/motion.ts'],
          Component: MotionGuideSkeletonSwap,
        },
        {
          id: 'MotionGuideDropdownAnatomy',
          title: 'Anatomy of a menu transition',
          note: 'How role, timing, easing and stagger combine in one open and close.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/motion.ts'],
          Component: MotionGuideDropdownAnatomy,
        },
      ],
    },
    {
      id: 'waiting',
      title: 'Waiting and live status',
      description: 'The only motion that may repeat, and only while there is a reason.',
      specimens: [
        {
          id: 'MotionGuideLoadingChoice',
          title: 'Loader, skeleton or shimmer',
          note: 'Loader for a compact wait, skeleton when the layout is known, shimmer for work that is being generated.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['foundations/useSimulatedWait.ts'],
          Component: MotionGuideLoadingChoice,
        },
        {
          id: 'MotionGuideLivePulse',
          title: 'Pulse for a live alarm',
          note: 'An unacknowledged alarm may pulse; it stops the moment someone takes it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: MotionGuideLivePulse,
        },
      ],
    },
    {
      id: 'reduced-motion',
      title: 'Reduced motion',
      description: 'Remove movement, keep the change visible.',
      specimens: [
        {
          id: 'MotionGuideReducedSideBySide',
          title: 'With and without movement',
          note: 'The reduced version drops position and scale and keeps a short fade.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/Replay.tsx', 'foundations/motion.ts'],
          Component: MotionGuideReducedSideBySide,
        },
        {
          id: 'MotionGuideRespectsSetting',
          title: 'Following the system setting',
          note: 'The real pattern: one element, two prefixes, no JavaScript.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/Replay.tsx', 'three/usePrefersReducedMotion.ts', 'industrial/StatusIndicator.tsx'],
          Component: MotionGuideRespectsSetting,
        },
      ],
    },
    {
      id: 'do-and-dont',
      title: 'Do and don’t',
      description: 'Calm is part of the character: most motion is quiet and fast.',
      specimens: [
        {
          id: 'MotionGuideNoBounce',
          title: 'Settle, never bounce',
          note: 'Easing never overshoots, however playful the feature.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'foundations/Replay.tsx', 'foundations/motion.ts'],
          Component: MotionGuideNoBounce,
        },
        {
          id: 'MotionGuideNoDecorativeLoops',
          title: 'No decorative loops',
          note: 'An icon that spins to look alive is noise in a room where movement means alarm.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'foundations/Replay.tsx'],
          Component: MotionGuideNoDecorativeLoops,
        },
        {
          id: 'MotionGuideStaggerDrag',
          title: 'Stagger sparingly',
          note: 'Stagger is a hint of sequence, not a show; keep the whole group under a quarter of a second.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'foundations/Replay.tsx', 'foundations/motion.ts'],
          Component: MotionGuideStaggerDrag,
        },
        {
          id: 'MotionGuideAnchors',
          title: 'Three tests for any animation',
          note: 'Run a new transition past flow, calm and tactile before it ships.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: MotionGuideAnchors,
        },
      ],
    },
  ],
});
