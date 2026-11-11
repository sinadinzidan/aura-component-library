import { Button } from '@cognite/aura/components/button';
import { IconCircleCheck, IconSignature } from '@cognite/aura/icons';
import { useState } from 'react';

import { Canvas } from '../../../library/kit/Canvas';
import { LogTimeline, type LogEntry } from '../../../library/kit/shift-handover/LogTimeline';
import { Masthead, type MastheadSection } from '../../../library/kit/shift-handover/Masthead';
import { StatusPill } from '../../../library/kit/StatusPill';
import { TagId } from '../../../library/kit/TagId';
import type { Tone } from '../../../library/kit/tones';
import { TrendLine } from '../../../library/kit/TrendLine';
import { LookScope } from '../../../library/looks/LookScope';
import { PLANT_KPIS } from '../../data/plant';
import { makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './shift-handover.tsx?raw';

type ShSection = 'safety' | 'production' | 'maintenance';

type ShEntry = LogEntry & { group: ShSection };

const SH_LOG: ShEntry[] = [
  {
    id: 'trip',
    group: 'production',
    time: '13:46',
    section: 'Gas compression',
    state: 'Open',
    tone: 'critical',
    headline: 'Recompressor tripped on high vibration',
    body: 'Drive-end vibration reached 11.6 mm/s against an 11.0 trip. The machine is isolated and stays down until the bearing inspection is closed. Export is held on two stages.',
    tags: ['23-KA-9103', 'WO-104482'],
    by: 'IH',
    needsAck: true,
  },
  {
    id: 'permit',
    group: 'safety',
    time: '14:20',
    section: 'Permits',
    state: 'Live overnight',
    tone: 'warning',
    headline: 'Cold work permit on the recompressor runs until 20:00',
    body: 'Tomás Barros holds the permit. Isolation 23-ISO-044 is locked and tagged; do not reset the trip or line up seal gas before he hands the permit back.',
    tags: ['PTW-2291', '23-ISO-044'],
    by: 'LW',
    needsAck: true,
  },
  {
    id: 'temp',
    group: 'production',
    time: '13:22',
    section: 'Gas compression',
    state: 'Watch',
    tone: 'warning',
    headline: '1st stage discharge temperature sits 1 °C over its alarm',
    body: 'It rose after the load moved to two stages. Keep anti-surge recycle at 8 % and call the rotating engineer if it passes 150 °C.',
    tags: ['23-TT-92532'],
    by: 'IH',
    needsAck: true,
  },
  {
    id: 'detector',
    group: 'safety',
    time: '11:05',
    section: 'Fire and gas',
    state: 'Inhibited',
    tone: 'warning',
    headline: 'Four gas detectors in compression are still inhibited',
    body: 'The function test stopped at the trip. Detectors GD-2311 to GD-2314 are inhibited with a fire watch posted; the test resumes at 07:00.',
    tags: ['GD-2311', 'GD-2314'],
    by: 'JN',
    needsAck: true,
  },
  {
    id: 'signal',
    group: 'maintenance',
    time: '05:00',
    section: 'Cooling water',
    state: 'Shelved',
    tone: 'info',
    headline: 'Bearing temperature signal lost on the cooling water pump',
    body: 'The alarm is shelved until the transmitter is swapped on Friday. Read the local gauge on every round: last reading 61 °C.',
    tags: ['40-TT-40015', 'WO-104479'],
    by: 'JN',
    needsAck: true,
  },
  {
    id: 'stroke',
    group: 'maintenance',
    time: '09:10',
    section: 'Inlet and separation',
    state: 'Closed',
    tone: 'success',
    headline: 'Partial stroke test passed on the inlet shutdown valve',
    body: 'The valve moved 15 % in 2.1 seconds and returned. Nothing to follow up.',
    tags: ['20-XV-1105'],
    by: 'TB',
  },
  {
    id: 'pump',
    group: 'production',
    time: '07:42',
    section: 'Gas export',
    state: 'For information',
    tone: 'neutral',
    headline: 'Export pump B standby start test is four days overdue',
    body: 'It needs a quiet hour and a second operator. Planned for the night shift if export stays steady after 23:00.',
    tags: ['27-PA-2001B', 'WO-104458'],
    by: 'IH',
    needsAck: true,
  },
];

const SH_SECTION_LABEL: Record<ShSection, string> = {
  safety: 'Safety',
  production: 'Production',
  maintenance: 'Maintenance',
};

const SH_MUST_READ = SH_LOG.filter((entry) => entry.needsAck);

function shSections(): MastheadSection[] {
  const groups: ShSection[] = ['safety', 'production', 'maintenance'];
  return [
    { id: 'all', label: 'Whole log', count: SH_LOG.length },
    ...groups.map((group) => ({
      id: group,
      label: SH_SECTION_LABEL[group],
      count: SH_LOG.filter((entry) => entry.group === group).length,
    })),
  ];
}

/** Acknowledgements and the signature of the incoming shift. */
function useShSignOff(initial: readonly string[] = ['trip', 'permit']) {
  const [acknowledged, setAcknowledged] = useState<string[]>([...initial]);
  const [signed, setSigned] = useState(false);
  const left = SH_MUST_READ.filter((entry) => !acknowledged.includes(entry.id));
  return {
    acknowledged,
    signed,
    left,
    done: SH_MUST_READ.length - left.length,
    total: SH_MUST_READ.length,
    toggle: (id: string, checked: boolean) => {
      setSigned(false);
      setAcknowledged((current) => (checked ? [...current.filter((item) => item !== id), id] : current.filter((item) => item !== id)));
    },
    sign: () => setSigned(true),
  };
}

type ShSignOffState = ReturnType<typeof useShSignOff>;

function ShRuleHeading({ children, detail }: { children: string; detail?: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-t-2 border-(--kit-rule-strong) pt-2">
      <h3 className="text-base font-semibold whitespace-nowrap">{children}</h3>
      {detail ? <span className="text-sm whitespace-nowrap text-(--kit-text-2) tabular-nums">{detail}</span> : null}
    </div>
  );
}

function ShSignOff({ signOff }: { signOff: ShSignOffState }) {
  const complete = signOff.left.length === 0;
  return (
    <section aria-label="Sign-off" className="flex flex-col gap-4">
      <ShRuleHeading detail="Liv Wold, night shift">Sign-off</ShRuleHeading>
      <p className="flex items-baseline gap-3">
        <span className="text-8xl leading-none font-medium tracking-tighter tabular-nums">{signOff.done}</span>
        <span className="text-xl text-(--kit-text-2) tabular-nums">of {signOff.total} items acknowledged</span>
      </p>
      <div
        role="progressbar"
        aria-label="Items acknowledged"
        aria-valuemin={0}
        aria-valuemax={signOff.total}
        aria-valuenow={signOff.done}
        className="flex gap-1"
        data-tone={complete ? 'success' : 'accent'}
      >
        {SH_MUST_READ.map((entry) => (
          <span key={entry.id} className={`h-2.5 flex-1 ${signOff.acknowledged.includes(entry.id) ? 'bg-(--kit-text)' : 'bg-(--kit-track)'}`} />
        ))}
      </div>
      {signOff.signed ? (
        <p className="flex items-center gap-2 text-base font-medium" data-tone="success">
          <IconCircleCheck aria-hidden="true" className="size-5 text-(--t-ink)" /> Signed by Liv Wold at 18:52. The night shift has the plant.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div>
            <Button disabled={!complete} onClick={signOff.sign}>
              <IconSignature /> Sign and take the shift
            </Button>
          </div>
          <p className="text-sm text-(--kit-text-2)">
            {complete
              ? 'Everything is read. Signing records the time and your name.'
              : `Signing opens when the last ${signOff.left.length === 1 ? 'item is' : `${signOff.left.length} items are`} ticked in the log.`}
          </p>
        </div>
      )}
      {signOff.left.length > 0 ? (
        <ul className="border-t border-(--kit-rule)">
          {signOff.left.map((entry) => (
            <li key={entry.id} data-tone={entry.tone} className="flex items-baseline gap-3 border-b border-(--kit-rule) py-2.5 text-sm">
              <span className="w-11 shrink-0 font-medium tabular-nums">{entry.time}</span>
              <span className="min-w-0 flex-1">{entry.headline}</span>
              <span className="shrink-0 font-semibold text-(--t-ink)">{entry.state}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

const SH_FIGURES: {
  label: string;
  value: string;
  unit: string;
  note: string;
  tone: Tone;
}[] = [
  {
    label: 'Gas export',
    value: PLANT_KPIS.gasExport.value.toFixed(2),
    unit: 'MSm³/d',
    note: '0.12 under plan',
    tone: 'warning',
  },
  {
    label: 'Availability',
    value: PLANT_KPIS.availability.value.toFixed(1),
    unit: '%',
    note: 'target 97.5',
    tone: 'warning',
  },
  {
    label: 'Flaring',
    value: PLANT_KPIS.flaring.value.toFixed(1),
    unit: 'kSm³/d',
    note: 'limit 15.0',
    tone: 'success',
  },
  {
    label: 'Open alarms',
    value: '5',
    unit: '',
    note: '1 critical',
    tone: 'critical',
  },
];

function ShFigures() {
  return (
    <section aria-label="Plant at handover" className="flex flex-col gap-1">
      <ShRuleHeading detail="18:45">Plant at handover</ShRuleHeading>
      <dl>
        {SH_FIGURES.map((figure) => (
          <div key={figure.label} data-tone={figure.tone} className="flex items-baseline gap-3 border-b border-(--kit-rule) py-2.5">
            <dt className="flex-1 text-base">{figure.label}</dt>
            <dd className="text-right">
              <span className="text-3xl leading-none font-medium tracking-tight tabular-nums">{figure.value}</span>
              {figure.unit ? <span className="ml-1 text-sm text-(--kit-text-2)">{figure.unit}</span> : null}
              <span className="block text-sm font-medium text-(--t-ink)">{figure.note}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const SH_ORDERS = [
  'Keep anti-surge recycle on the 1st stage at 8 % until the recompressor is back.',
  'No hot work in gas compression while detectors GD-2311 to GD-2314 are inhibited.',
  'Call the rotating engineer on duty, Aisha Khan, before any restart attempt.',
];

function ShStandingOrders() {
  return (
    <section aria-label="Standing orders" className="flex flex-col gap-1">
      <ShRuleHeading detail="From the shift supervisor">Standing orders</ShRuleHeading>
      <ol>
        {SH_ORDERS.map((order, index) => (
          <li key={order} className="flex gap-4 border-b border-(--kit-rule) py-3">
            <span className="text-3xl leading-none font-medium text-(--kit-text-2) tabular-nums">{index + 1}</span>
            <span className="text-base leading-snug">{order}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const SH_EXPORT = makeValues({
  seed: 61,
  points: 13,
  base: 4.44,
  amplitude: 0.05,
  noise: 0.02,
  drift: -0.02,
  decimals: 2,
});

const SH_EXPORT_SHIFT = [...SH_EXPORT.slice(0, 8), 4.21, 4.26, 4.33, 4.36, 4.38];

const SH_SHIFT_HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function ShShiftChart({ height = 240, plain = false }: { height?: number; plain?: boolean }) {
  return (
    <TrendLine
      label="Gas export during the day shift against the plan"
      series={[
        {
          id: 'export',
          label: 'Gas export',
          values: SH_EXPORT_SHIFT,
          tone: 'accent',
        },
      ]}
      labels={SH_SHIFT_HOURS}
      unit="MSm³/d"
      decimals={2}
      limits={[{ value: 4.5, label: 'Plan', tone: 'warning' }]}
      yDomain={[4.1, 4.6]}
      height={height}
      highlightLast
      notes={
        plain ? undefined : (
          <>
            <p>
              <span className="font-semibold">13:46.</span> Recompressor trips; export falls to 4.21 within the hour.
            </p>
            <p>
              <span className="font-semibold">15:00.</span> Load rebalanced over two stages, recycle at 8 %.
            </p>
            <p>
              <span className="font-semibold">18:00.</span> Steady at 4.38, 0.12 under plan.
            </p>
          </>
        )
      }
    />
  );
}

const SH_CREW = [
  ['Liv Wold', 'Shift supervisor'],
  ['Magnus Solberg', 'Control room'],
  ['Tomás Barros', 'Mechanical, until 20:00'],
  ['Aisha Khan', 'Rotating engineer, on call'],
];

function ShOnShift() {
  return (
    <section aria-label="On shift tonight" className="flex flex-col gap-1">
      <ShRuleHeading detail="Tonight">On shift</ShRuleHeading>
      <ul>
        {SH_CREW.map(([name, role]) => (
          <li key={name} className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-(--kit-rule) py-3">
            <span className="text-base font-medium whitespace-nowrap">{name}</span>
            <span className="text-sm whitespace-nowrap text-(--kit-text-2)">{role}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ShiftHandoverSignature() {
  const signOff = useShSignOff();
  const [section, setSection] = useState('all');
  const entries = SH_LOG.filter((entry) => section === 'all' || entry.group === section);

  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-8">
        <Masthead
          name="The Nordkapp Handover"
          date="Thursday 12 March 2026"
          edition="Day shift to night shift"
          issue="No. 142 · handover at 18:45"
          sections={shSections()}
          current={section}
          onSection={setSection}
          tools={
            signOff.signed ? (
              <StatusPill tone="success" icon={<IconCircleCheck />}>
                Signed
              </StatusPill>
            ) : (
              <span className="text-(--kit-text-2) tabular-nums">
                {signOff.done} of {signOff.total} acknowledged
              </span>
            )
          }
        />
        <div className="grid grid-cols-12 gap-x-10">
          <div className="col-span-7 flex flex-col gap-8 border-r border-(--kit-rule) pr-10">
            <div>
              <p className="text-sm font-semibold">Outgoing · day shift · Ingrid Haugen</p>
              <h2 className="mt-2 text-5xl leading-[1.02] font-medium tracking-tighter">Recompressor is down; export holds at 4.38 on two stages.</h2>
              <p className="mt-4 max-w-prose text-lg leading-relaxed text-(--kit-text-2)">
                Twelve hours, seven log entries. One trip, one live permit and four inhibited detectors go with you into the night. Everything marked with a
                tick box must be read before you sign.
              </p>
            </div>
            <LogTimeline label="Day shift log, newest matters first" entries={entries} acknowledged={signOff.acknowledged} onAcknowledge={signOff.toggle} />
          </div>
          <div className="col-span-5 flex flex-col gap-10">
            <p className="text-sm font-semibold">Incoming · night shift · Liv Wold</p>
            <ShSignOff signOff={signOff} />
            <ShStandingOrders />
            <ShFigures />
            <section aria-label="Export through the day shift" className="flex flex-col gap-4">
              <ShRuleHeading detail="MSm³/d, 06:00 to 18:00">Export through the shift</ShRuleHeading>
              <ShShiftChart height={200} plain />
            </section>
            <ShOnShift />
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverBrief() {
  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-8">
        <Masthead name="Night shift brief" date="Thursday 12 March 2026" edition="Signed handover, for the 19:00 toolbox talk" issue="No. 142 · signed 18:52" />
        <div className="grid grid-cols-12 gap-x-10 gap-y-8">
          <div className="col-span-4 flex flex-col gap-3">
            <p className="text-sm font-semibold">The shift in one figure</p>
            <p className="text-[7.5rem] leading-[0.85] font-medium tracking-tighter tabular-nums">4.38</p>
            <p className="text-lg text-(--kit-text-2)">million Sm³ a day at handover, 0.12 under plan and holding on two compression stages.</p>
            <p className="flex items-center gap-2 pt-2 text-sm font-medium" data-tone="success">
              <IconCircleCheck aria-hidden="true" className="size-5 text-(--t-ink)" /> Six of six items acknowledged by Liv Wold
            </p>
          </div>
          <div className="col-span-8 border-l border-(--kit-rule) pl-10">
            <ShRuleHeading detail="06:00 to 18:00">Export through the day shift</ShRuleHeading>
            <div className="pt-4">
              <ShShiftChart />
            </div>
          </div>
          <div className="col-span-4">
            <ShStandingOrders />
          </div>
          <div className="col-span-4 border-l border-(--kit-rule) pl-10">
            <ShOnShift />
          </div>
          <div className="col-span-4 border-l border-(--kit-rule) pl-10">
            <ShFigures />
          </div>
        </div>
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverPhone() {
  const signOff = useShSignOff(['trip']);
  return (
    <LookScope look="editorial" className="mx-auto w-full max-w-[400px]">
      <div className="overflow-hidden rounded-[2.5rem] border-8 border-(--kit-rule-strong) bg-(--kit-canvas-bg) text-(--kit-text)">
        <div className="flex flex-col gap-5 px-5 pt-5 pb-6">
          <Masthead name="The Nordkapp Handover" date="Thu 12 March · day to night" edition="" issue="" size="compact" />
          <div className="sticky top-0 flex items-center gap-3">
            <span className="text-5xl leading-none font-medium tracking-tighter tabular-nums">{signOff.done}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-(--kit-text-2) tabular-nums">of {signOff.total} acknowledged</p>
              <div
                className="mt-1.5 flex gap-1"
                role="progressbar"
                aria-label="Items acknowledged"
                aria-valuemin={0}
                aria-valuemax={signOff.total}
                aria-valuenow={signOff.done}
              >
                {SH_MUST_READ.map((entry) => (
                  <span key={entry.id} className={`h-2 flex-1 ${signOff.acknowledged.includes(entry.id) ? 'bg-(--kit-text)' : 'bg-(--kit-track)'}`} />
                ))}
              </div>
            </div>
          </div>
          <LogTimeline
            label="Items to acknowledge"
            entries={SH_MUST_READ.slice(0, 5)}
            acknowledged={signOff.acknowledged}
            onAcknowledge={signOff.toggle}
            ackLabel="Read"
            density="compact"
          />
          <Button disabled={signOff.left.length > 0} onClick={signOff.sign} className="w-full">
            <IconSignature /> {signOff.signed ? 'Signed 18:52' : 'Sign and take the shift'}
          </Button>
          {signOff.left.length > 0 ? (
            <p className="text-center text-sm text-(--kit-text-2) tabular-nums">{signOff.left.length} left to read before signing</p>
          ) : null}
        </div>
      </div>
    </LookScope>
  );
}

function ShiftHandoverMasthead() {
  const [section, setSection] = useState('safety');
  return (
    <LookScope look="editorial">
      <Canvas>
        <Masthead
          name="The Nordkapp Handover"
          date="Thursday 12 March 2026"
          edition="Day shift to night shift"
          issue="No. 142"
          sections={shSections()}
          current={section}
          onSection={setSection}
        />
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverLog() {
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  return (
    <LookScope look="editorial">
      <Canvas>
        <LogTimeline
          label="Two log entries"
          entries={SH_LOG.filter((entry) => entry.id === 'temp' || entry.id === 'stroke')}
          acknowledged={acknowledged}
          onAcknowledge={(id, checked) => setAcknowledged((current) => (checked ? [...current, id] : current.filter((item) => item !== id)))}
        />
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverSignOff() {
  const signOff = useShSignOff(['trip', 'permit', 'temp', 'detector', 'signal']);
  return (
    <LookScope look="editorial">
      <Canvas>
        <ShSignOff signOff={signOff} />
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverStandingOrders() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <ShStandingOrders />
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverFigures() {
  return (
    <LookScope look="editorial">
      <Canvas>
        <ShFigures />
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverChart() {
  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-4">
        <ShRuleHeading detail="06:00 to 18:00">Export through the day shift</ShRuleHeading>
        <ShShiftChart height={220} />
      </Canvas>
    </LookScope>
  );
}

function ShiftHandoverCompactLog() {
  return (
    <LookScope look="editorial">
      <Canvas className="flex flex-col gap-4">
        <ShRuleHeading detail="Read only">Earlier today</ShRuleHeading>
        <LogTimeline
          label="Earlier entries"
          entries={SH_LOG.filter((entry) => !entry.needsAck || entry.id === 'pump' || entry.id === 'signal')}
          density="compact"
        />
        <p className="text-sm text-(--kit-text-2)">
          Tags: <TagId>20-XV-1105</TagId> · <TagId>27-PA-2001B</TagId> · <TagId>40-TT-40015</TagId>
        </p>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'shift-handover',
  title: 'Shift handover',
  summary:
    'What the next shift must know, set like a newspaper: the outgoing log as a typographic timeline on the left, the incoming sign-off on the right, and tick boxes that drive the sign-off.',
  guidance: {
    use: [
      'When the screen is read once, carefully, by one person taking responsibility.',
      'Put the tick box on the log entry itself, so reading and acknowledging are one act.',
      'Keep signing disabled until everything is ticked, and say how many items are left.',
    ],
    avoid: [
      'Cards and KPI tiles; a handover is prose with a few figures, not a control panel.',
      'Greying out acknowledged entries — they must stay readable through the night.',
      'Burying standing orders below the fold; they sit beside the sign-off.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The handover in the editorial look: outgoing on the left, incoming on the right.',
      specimens: [
        {
          id: 'ShiftHandoverSignature',
          title: 'Handover paper',
          note: 'Pick it for the handover desk: tick the entries, watch the sign-off count, then sign.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/shift-handover/LogTimeline.tsx', 'kit/shift-handover/Masthead.tsx', 'kit/Canvas.tsx', 'looks/LookScope.tsx'],
          Component: ShiftHandoverSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Other screens',
      description: 'The signed brief for the toolbox talk, and the log on a phone.',
      specimens: [
        {
          id: 'ShiftHandoverBrief',
          title: 'Signed brief',
          note: 'Pick it after sign-off, on the meeting room screen or on paper: one figure, the shift’s chart, the orders.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/shift-handover/Masthead.tsx', 'kit/TrendLine.tsx'],
          Component: ShiftHandoverBrief,
        },
        {
          id: 'ShiftHandoverPhone',
          title: 'On a phone',
          note: 'Pick it for the supervisor reading the handover on the walk in.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/shift-handover/LogTimeline.tsx', 'kit/shift-handover/Masthead.tsx'],
          Component: ShiftHandoverPhone,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the paper on their own.',
      specimens: [
        {
          id: 'ShiftHandoverMasthead',
          title: 'Masthead',
          note: 'Use it as the chrome of any report that is read rather than operated.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['kit/shift-handover/Masthead.tsx'],
          Component: ShiftHandoverMasthead,
        },
        {
          id: 'ShiftHandoverLog',
          title: 'Log entries',
          note: 'Use the full entry when the body text matters; add the tick box where reading must be proven.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/shift-handover/LogTimeline.tsx'],
          Component: ShiftHandoverLog,
        },
        {
          id: 'ShiftHandoverStandingOrders',
          title: 'Standing orders',
          note: 'Use a numbered list for instructions that hold for the whole shift.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: ShiftHandoverStandingOrders,
        },
        {
          id: 'ShiftHandoverSignOff',
          title: 'Sign-off',
          note: 'Use it wherever a count of acknowledged items gates one action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ShiftHandoverSignOff,
        },
        {
          id: 'ShiftHandoverFigures',
          title: 'Plant figures',
          note: 'Use a ruled list of figures instead of tiles in a report.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ShiftHandoverFigures,
        },
        {
          id: 'ShiftHandoverChart',
          title: 'Annotated shift chart',
          note: 'Use it to tell what happened during the shift, with the times written beside the line.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['kit/TrendLine.tsx'],
          Component: ShiftHandoverChart,
        },
        {
          id: 'ShiftHandoverCompactLog',
          title: 'Compact log',
          note: 'Use the compact density in a side column or on a phone.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['kit/shift-handover/LogTimeline.tsx'],
          Component: ShiftHandoverCompactLog,
        },
      ],
    },
  ],
});
