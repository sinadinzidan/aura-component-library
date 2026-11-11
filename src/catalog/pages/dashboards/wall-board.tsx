import { Switch } from '@cognite/aura/components/switch';
import { IconAlertOctagon, IconAlertTriangle, IconChevronLeft, IconChevronRight, IconCircleCheck } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { childrenOf, type Asset } from '../../data/plant';
import { definePage } from '../../types';

import source from './wall-board.tsx?raw';

type WbFact = { label: string; value: string };

type WbBrief = {
  /** The one figure that says how the area is doing, already formatted. */
  figure: string;
  unit: string;
  caption: string;
  /** Why the area is in this state, in one or two sentences read from across the room. */
  reason: string;
  since: string;
  facts: WbFact[];
};

type WbArea = Asset & WbBrief & { units: Asset[] };

const WB_BRIEFS: Record<string, WbBrief> = {
  'nk-20': {
    figure: '4.61',
    unit: 'MSm³/d',
    caption: 'Inlet gas, plan 4.70',
    reason: 'Both inlet trains in service. Separator level steady at 54 % against a 70 % limit.',
    since: 'Good for 21 hours',
    facts: [
      { label: 'Health', value: '94 / 100' },
      { label: 'Open alarms', value: '0' },
      { label: 'Next job', value: 'Thu 19 March' },
    ],
  },
  'nk-23': {
    figure: '2 / 3',
    unit: 'compressors',
    caption: 'Running, export held at 4.38',
    reason: 'Recompressor tripped on high vibration at 13:46. Bearing inspection in progress, due 20:00.',
    since: 'Watch for 14 minutes',
    facts: [
      { label: 'Health', value: '78 / 100' },
      { label: 'Open alarms', value: '3' },
      { label: 'Next job', value: 'Today 20:00' },
    ],
  },
  'nk-27': {
    figure: '4.38',
    unit: 'MSm³/d',
    caption: 'Gas exported, plan 4.50',
    reason: 'Export on pump A. Pump B is ready on standby; its start test is four days overdue.',
    since: 'Good for 6 days',
    facts: [
      { label: 'Health', value: '96 / 100' },
      { label: 'Open alarms', value: '1' },
      { label: 'Next job', value: 'Sat 14 March' },
    ],
  },
  'nk-40': {
    figure: '1\u00a0240',
    unit: 'm³/h',
    caption: 'Cooling water, need 1\u00a0100',
    reason: 'Running on the spare pump while pump A has its bearing transmitter replaced.',
    since: 'Good for 9 hours',
    facts: [
      { label: 'Health', value: '89 / 100' },
      { label: 'Open alarms', value: '0' },
      { label: 'Next job', value: 'Fri 13 March' },
    ],
  },
};

const WB_AREAS: WbArea[] = childrenOf('nk').flatMap((area) => {
  const brief = WB_BRIEFS[area.id];
  return brief ? [{ ...area, ...brief, units: childrenOf(area.id) }] : [];
});

const WB_HEALTH_TONE: Record<Asset['health'], Tone> = {
  good: 'success',
  watch: 'warning',
  poor: 'critical',
};

const WB_HEALTH_WORD: Record<Asset['health'], string> = {
  good: 'Good',
  watch: 'Watch',
  poor: 'Critical',
};

const WB_STATE_TONE: Record<Asset['state'], Tone | null> = {
  running: null,
  standby: null,
  stopped: null,
  tripped: 'critical',
  maintenance: 'info',
};

const WB_STATE_WORD: Record<Asset['state'], string> = {
  running: 'Running',
  standby: 'Standby',
  stopped: 'Stopped',
  tripped: 'Tripped',
  maintenance: 'Maintenance',
};

/** Seconds an area stays up while the board advances by itself. */
const WB_DWELL_SECONDS = 8;

function WbHealthIcon({ health, className }: { health: Asset['health']; className?: string }) {
  if (health === 'good') return <IconCircleCheck className={className} stroke={2.2} aria-hidden="true" />;
  if (health === 'watch') return <IconAlertTriangle className={className} stroke={2.2} aria-hidden="true" />;
  return <IconAlertOctagon className={className} stroke={2.2} aria-hidden="true" />;
}

/** Paints a block in a tone the way the signal look fills a tile. */
function wbFill(tone: Tone) {
  return {
    className: `kit-tone-${tone}`,
    style: { background: 'var(--t-vivid)', color: 'var(--t-on-vivid)' },
  };
}

function WbHeader({ position, compact = false }: { position: string; compact?: boolean }) {
  return (
    <header className={`flex items-center justify-between gap-6 py-3 text-[var(--kit-text)] ${compact ? 'px-4' : 'px-8'}`}>
      <p className="flex items-baseline gap-4">
        <span className="text-2xl font-extrabold tracking-tight">Nordkapp</span>
        <span className="text-lg font-medium text-[var(--kit-text-3)]">{compact ? position : `Area board · ${position}`}</span>
      </p>
      <p className="flex items-baseline gap-4">
        {compact ? null : <span className="text-lg font-medium text-[var(--kit-text-3)]">Thursday 12 March</span>}
        <span className="text-3xl font-extrabold tracking-tight tabular-nums">14:00</span>
      </p>
    </header>
  );
}

/** One unit of an area as a block: quiet when it runs, filled with its own state when it does not. */
function WbUnitBlock({ unit }: { unit: Asset }) {
  const tone = WB_STATE_TONE[unit.state];
  const fill = tone
    ? wbFill(tone)
    : {
        className: '',
        style: {
          background: 'color-mix(in oklab, currentColor 14%, transparent)',
        },
      };
  return (
    <li className={`flex min-w-0 flex-1 flex-col justify-between gap-1 rounded-md px-4 py-3 ${fill.className}`} style={fill.style}>
      <span className="text-base leading-5 font-semibold">{unit.name}</span>
      <span>
        <span className="block text-2xl leading-7 font-extrabold tracking-tight">{WB_STATE_WORD[unit.state]}</span>
        <span className="block text-sm font-medium whitespace-nowrap tabular-nums opacity-90">{unit.tag}</span>
      </span>
    </li>
  );
}

function WbUnitRow({ area }: { area: WbArea }) {
  return (
    <ul className="flex gap-2" aria-label={`Units in ${area.name}`}>
      {area.units.map((unit) => (
        <WbUnitBlock key={unit.id} unit={unit} />
      ))}
    </ul>
  );
}

function WbFigure({ area }: { area: WbArea }) {
  return (
    <div className="text-right">
      <p className="text-[clamp(5.5rem,13cqw,10.5rem)] leading-[0.85] font-extrabold tracking-tighter whitespace-nowrap tabular-nums">{area.figure}</p>
      <p className="mt-3 text-3xl leading-9 font-bold">{area.unit}</p>
      <p className="text-xl font-medium opacity-90">{area.caption}</p>
    </div>
  );
}

/** The whole screen as one colour field: the area's state as a word, and the figure that explains it. */
function WbField({ area, compact = false }: { area: WbArea; compact?: boolean }) {
  const fill = wbFill(WB_HEALTH_TONE[area.health]);
  return (
    <section
      aria-label={`${area.name}: ${WB_HEALTH_WORD[area.health]}`}
      className={`@container flex flex-1 flex-col justify-between gap-6 px-8 py-7 ${fill.className}`}
      style={fill.style}
    >
      <div className="flex items-baseline justify-between gap-6">
        <h3 className="flex items-baseline gap-4">
          <span className="text-4xl font-extrabold tracking-tight">{area.name}</span>
          <span className="text-xl font-semibold tabular-nums opacity-90">{area.tag}</span>
        </h3>
        <p className="text-xl font-semibold">{area.since}</p>
      </div>

      <div className="flex items-end justify-between gap-8">
        <p className="flex items-center gap-[2cqw]">
          <WbHealthIcon health={area.health} className="size-[clamp(4.5rem,10cqw,8.5rem)] shrink-0" />
          <span className="text-[clamp(6rem,15cqw,12.5rem)] leading-[0.85] font-extrabold tracking-tighter">{WB_HEALTH_WORD[area.health]}</span>
        </p>
        <WbFigure area={area} />
      </div>

      <p className="max-w-5xl text-3xl leading-10 font-semibold text-balance">{area.reason}</p>

      {compact ? null : (
        <div className="flex flex-col gap-2">
          <dl className="flex gap-2">
            {area.facts.map((fact) => (
              <div
                key={fact.label}
                className="flex flex-1 items-baseline justify-between gap-3 rounded-md px-4 py-3"
                style={{
                  background: 'color-mix(in oklab, currentColor 14%, transparent)',
                }}
              >
                <dt className="text-lg font-semibold">{fact.label}</dt>
                <dd className="text-3xl font-extrabold tracking-tight tabular-nums">{fact.value}</dd>
              </div>
            ))}
          </dl>
          <WbUnitRow area={area} />
        </div>
      )}
    </section>
  );
}

type WbDockProps = {
  index: number;
  onSelect: (index: number) => void;
  auto: boolean;
  onAuto: (next: boolean) => void;
};

/** The pager of the board: one filled tile per area, large step buttons and the auto-advance switch. */
function WbDock({ index, onSelect, auto, onAuto }: WbDockProps) {
  const count = WB_AREAS.length;
  const stepClass =
    'flex w-20 shrink-0 items-center justify-center rounded-md bg-[var(--kit-surface)] text-[var(--kit-text)] hover:opacity-80 focus-visible:outline-2 focus-visible:outline-[var(--kit-text)]';
  return (
    <nav aria-label="Areas" className="flex items-stretch gap-2 p-2">
      <button type="button" className={stepClass} aria-label="Previous area" onClick={() => onSelect((index + count - 1) % count)}>
        <IconChevronLeft className="size-10" aria-hidden="true" />
      </button>
      <ol className="grid flex-1 grid-cols-4 gap-2">
        {WB_AREAS.map((area, position) => {
          const fill = wbFill(WB_HEALTH_TONE[area.health]);
          const current = position === index;
          return (
            <li key={area.id}>
              <button
                type="button"
                aria-current={current ? 'true' : undefined}
                onClick={() => onSelect(position)}
                className={`flex h-full w-full items-center gap-3 rounded-md px-4 py-3 text-left transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--kit-text)] ${fill.className} ${current ? '' : 'hover:opacity-85'}`}
                style={{
                  ...fill.style,
                  boxShadow: current ? 'inset 0 0 0 4px var(--kit-text)' : undefined,
                }}
              >
                <WbHealthIcon health={area.health} className="size-9 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-base leading-5 font-semibold">{area.name}</span>
                  <span className="block text-2xl leading-7 font-extrabold tracking-tight">{WB_HEALTH_WORD[area.health]}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button type="button" className={stepClass} aria-label="Next area" onClick={() => onSelect((index + 1) % count)}>
        <IconChevronRight className="size-10" aria-hidden="true" />
      </button>
      <div className="flex w-52 shrink-0 flex-col justify-center gap-1 rounded-md bg-[var(--kit-surface)] px-4 text-[var(--kit-text)]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-base font-semibold">Auto-advance</span>
          <Switch aria-label="Auto-advance" checked={auto} onCheckedChange={(next) => onAuto(next === true)} />
        </div>
        <p className="text-sm text-[var(--kit-text-3)]">{auto ? `One lap, ${WB_DWELL_SECONDS} s per area` : 'Off. Step with the arrows.'}</p>
      </div>
    </nav>
  );
}

/** Board state: the area in focus, and an auto-advance that walks one lap and then switches itself off. */
function useWbBoard(initial: number) {
  const [index, setIndex] = useState(initial);
  const [stepsLeft, setStepsLeft] = useState(0);

  useEffect(() => {
    if (stepsLeft <= 0) return undefined;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % WB_AREAS.length);
      setStepsLeft((current) => current - 1);
    }, WB_DWELL_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [stepsLeft]);

  return {
    index,
    area: WB_AREAS[index] ?? WB_AREAS[0],
    auto: stepsLeft > 0,
    select: (next: number) => setIndex(next),
    setAuto: (next: boolean) => setStepsLeft(next ? WB_AREAS.length : 0),
  };
}

function WallBoardSignature() {
  const board = useWbBoard(1);
  return (
    <LookScope look="signal">
      <Canvas padding="none" className="flex h-[54rem] flex-col">
        <WbHeader position={`${board.index + 1} of ${WB_AREAS.length}`} />
        <WbField area={board.area} />
        <WbDock index={board.index} onSelect={board.select} auto={board.auto} onAuto={board.setAuto} />
      </Canvas>
    </LookScope>
  );
}

function WallBoardStripes() {
  const [focus, setFocus] = useState(1);
  return (
    <LookScope look="signal">
      <Canvas padding="none" className="flex h-[46rem] flex-col">
        <WbHeader position="all areas" />
        <ol className="flex flex-1 gap-2 px-2 pb-2">
          {WB_AREAS.map((area, position) => {
            const fill = wbFill(WB_HEALTH_TONE[area.health]);
            const open = position === focus;
            return (
              <li key={area.id} className={`flex min-w-0 transition-[flex-grow] ${open ? 'flex-[2.2]' : 'flex-1'}`}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setFocus(position)}
                  className={`flex w-full flex-col justify-between gap-4 rounded-md p-6 text-left focus-visible:outline-2 focus-visible:outline-[var(--kit-text)] ${fill.className}`}
                  style={fill.style}
                >
                  <span>
                    <span className="block text-2xl leading-7 font-extrabold tracking-tight">{area.name}</span>
                    <span className="mt-1 block text-base font-semibold tabular-nums opacity-90">{area.tag}</span>
                  </span>
                  <span className="block">
                    <WbHealthIcon health={area.health} className={open ? 'size-24' : 'size-16'} />
                    <span className={`mt-2 block leading-[0.9] font-extrabold tracking-tighter ${open ? 'text-8xl' : 'text-6xl'}`}>
                      {WB_HEALTH_WORD[area.health]}
                    </span>
                    {open ? <span className="mt-4 block text-xl leading-7 font-semibold">{area.reason}</span> : null}
                  </span>
                  <span className="block border-t-2 border-current pt-3">
                    <span className={`block leading-none font-extrabold tracking-tighter whitespace-nowrap tabular-nums ${open ? 'text-7xl' : 'text-5xl'}`}>
                      {area.figure}
                    </span>
                    <span className="mt-1 block text-lg font-bold">{area.unit}</span>
                    <span className="block text-base font-medium opacity-90">{area.caption}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Canvas>
    </LookScope>
  );
}

function WallBoardPortrait() {
  const board = useWbBoard(2);
  const { area } = board;
  const fill = wbFill(WB_HEALTH_TONE[area.health]);
  const count = WB_AREAS.length;
  return (
    <LookScope look="signal" className="mx-auto w-full max-w-md">
      <Canvas padding="none" className="flex h-[58rem] flex-col">
        <header className="flex items-baseline justify-between px-6 py-3 text-[var(--kit-text)]">
          <span className="text-xl font-extrabold tracking-tight">Nordkapp</span>
          <span className="text-2xl font-extrabold tabular-nums">14:00</span>
        </header>
        <section
          aria-label={`${area.name}: ${WB_HEALTH_WORD[area.health]}`}
          className={`flex min-h-0 flex-1 flex-col gap-4 px-6 py-5 ${fill.className}`}
          style={fill.style}
        >
          <h3>
            <span className="block text-3xl leading-9 font-extrabold tracking-tight">{area.name}</span>
            <span className="block text-lg font-semibold opacity-90">{area.since}</span>
          </h3>
          <div>
            <WbHealthIcon health={area.health} className="size-20" />
            <p className="mt-1 text-8xl leading-[0.9] font-extrabold tracking-tighter">{WB_HEALTH_WORD[area.health]}</p>
          </div>
          <div className="border-t-2 border-current pt-4">
            <p className="text-8xl leading-[0.9] font-extrabold tracking-tighter whitespace-nowrap tabular-nums">{area.figure}</p>
            <p className="mt-2 text-2xl font-bold">{area.unit}</p>
            <p className="text-lg font-medium opacity-90">{area.caption}</p>
          </div>
          <p className="text-xl leading-7 font-semibold">{area.reason}</p>
          <ul className="mt-auto flex flex-col gap-2" aria-label={`Units in ${area.name}`}>
            {area.units.map((unit) => (
              <WbUnitBlock key={unit.id} unit={unit} />
            ))}
          </ul>
        </section>
        <nav aria-label="Areas" className="flex items-center gap-2 p-2">
          <button
            type="button"
            aria-label="Previous area"
            className="flex h-14 w-16 items-center justify-center rounded-md bg-[var(--kit-surface)] text-[var(--kit-text)] hover:opacity-80"
            onClick={() => board.select((board.index + count - 1) % count)}
          >
            <IconChevronLeft className="size-8" aria-hidden="true" />
          </button>
          <ol className="flex flex-1 items-center justify-center gap-2" aria-label={`Area ${board.index + 1} of ${count}`}>
            {WB_AREAS.map((entry, position) => (
              <li
                key={entry.id}
                className={`kit-tone-${WB_HEALTH_TONE[entry.health]} h-4 rounded-sm ${position === board.index ? 'w-14' : 'w-7 opacity-50'}`}
                style={{ background: 'var(--t-vivid)' }}
              />
            ))}
          </ol>
          <button
            type="button"
            aria-label="Next area"
            className="flex h-14 w-16 items-center justify-center rounded-md bg-[var(--kit-surface)] text-[var(--kit-text)] hover:opacity-80"
            onClick={() => board.select((board.index + 1) % count)}
          >
            <IconChevronRight className="size-8" aria-hidden="true" />
          </button>
        </nav>
      </Canvas>
    </LookScope>
  );
}

function WallBoardStateField() {
  return (
    <LookScope look="signal" className="w-full">
      <Canvas padding="none" className="flex h-[26rem] flex-col">
        <WbField area={WB_AREAS[0]} compact />
      </Canvas>
    </LookScope>
  );
}

function WallBoardFigure() {
  const fill = wbFill('warning');
  return (
    <LookScope look="signal" className="w-full">
      <Canvas padding="none" className="flex h-[26rem] flex-col">
        <div className={`@container flex flex-1 flex-col justify-between p-6 ${fill.className}`} style={fill.style}>
          <p className="text-2xl font-extrabold tracking-tight">Gas compression</p>
          <WbFigure area={WB_AREAS[1]} />
        </div>
      </Canvas>
    </LookScope>
  );
}

function WallBoardDock() {
  const board = useWbBoard(0);
  return (
    <LookScope look="signal" className="w-full">
      <Canvas padding="none">
        <WbDock index={board.index} onSelect={board.select} auto={board.auto} onAuto={board.setAuto} />
      </Canvas>
    </LookScope>
  );
}

function WallBoardUnits() {
  return (
    <LookScope look="signal" className="w-full">
      <Canvas padding="none" className="flex flex-col gap-2 p-2">
        {WB_AREAS.slice(1, 3).map((area) => {
          const fill = wbFill(WB_HEALTH_TONE[area.health]);
          return (
            <div key={area.id} className={`rounded-md p-4 ${fill.className}`} style={fill.style}>
              <p className="mb-3 text-xl font-extrabold tracking-tight">{area.name}</p>
              <WbUnitRow area={area} />
            </div>
          );
        })}
      </Canvas>
    </LookScope>
  );
}

function WallBoardHeader() {
  const counts: { label: string; value: number; tone: Tone }[] = [
    { label: 'Critical', value: 1, tone: 'critical' },
    { label: 'High', value: 2, tone: 'warning' },
    { label: 'Areas good', value: 3, tone: 'success' },
  ];
  return (
    <LookScope look="signal" className="w-full">
      <Canvas padding="none" className="flex h-full flex-col justify-center">
        <WbHeader position="2 of 4" compact />
        <div className="mx-2 mb-2 flex gap-2">
          {counts.map((count) => {
            const fill = wbFill(count.tone);
            return (
              <div key={count.label} className={`flex flex-1 flex-col rounded-md px-4 py-3 ${fill.className}`} style={fill.style}>
                <span className="text-base font-semibold">{count.label}</span>
                <span className="text-4xl font-extrabold tabular-nums">{count.value}</span>
              </div>
            );
          })}
        </div>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'wall-board',
  title: 'Wall board',
  summary:
    'A screen for the wall of a control room or workshop: one area at a time fills the whole display with its state colour, the state as an enormous word, the figure that explains it, and a pager of the other areas along the bottom.',
  guidance: {
    use: [
      'On a shared display read from five to ten metres, where the question is "is my area all right".',
      'One area per page: the colour of the whole screen is the answer, the word confirms it.',
      'Leave auto-advance off until someone asks for it, and let it stop by itself.',
    ],
    avoid: [
      'Charts, tables and anything that needs a pointer to be understood.',
      'State by colour alone: every filled block carries the word and an icon.',
      'More than a handful of pages; a board nobody waits through is a board nobody reads.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Step through the areas with the arrows or the tiles. Auto-advance is off; switched on it walks one lap and stops.',
      specimens: [
        {
          id: 'WallBoardSignature',
          title: 'Area board',
          note: 'Pick it for a wall display that rotates through areas and must be understood in a glance.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts', 'looks/LookScope.tsx', 'looks/looks.css'],
          Component: WallBoardSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The page that shows every area at once, and the same board on a portrait display by a door.',
      specimens: [
        {
          id: 'WallBoardStripes',
          title: 'All areas',
          note: 'Pick it as the first page of the rotation: four stripes, the one in focus opened up.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'looks/LookScope.tsx'],
          Component: WallBoardStripes,
        },
        {
          id: 'WallBoardPortrait',
          title: 'Portrait display',
          note: 'Pick it for a narrow screen at an entrance, where the same content stacks top to bottom.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'looks/LookScope.tsx'],
          Component: WallBoardPortrait,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The blocks of the board on their own.',
      specimens: [
        {
          id: 'WallBoardStateField',
          title: 'State field',
          note: 'Pick it when one state has to own a whole screen or a whole tile.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts'],
          Component: WallBoardStateField,
        },
        {
          id: 'WallBoardFigure',
          title: 'Giant figure',
          note: 'Pick it for the single number that explains a state, with its unit and reference.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts'],
          Component: WallBoardFigure,
        },
        {
          id: 'WallBoardDock',
          title: 'Area pager',
          note: 'Pick it as the only chrome of a board: where you are, what the other pages say, and the two steps.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts'],
          Component: WallBoardDock,
        },
        {
          id: 'WallBoardUnits',
          title: 'Unit blocks',
          note: 'Pick it under a state to show which unit caused it: only abnormal units change colour.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts'],
          Component: WallBoardUnits,
        },
        {
          id: 'WallBoardHeader',
          title: 'Board header',
          note: 'Pick it as the thin strip that says which board this is and what time it shows.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/tones.ts'],
          Component: WallBoardHeader,
        },
      ],
    },
  ],
});
