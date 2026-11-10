import { ChartContainer, ChartTooltip, ChartTooltipContent, chartSeriesColor } from '@cognite/aura/chart';
import type { ChartConfig } from '@cognite/aura/chart';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import { IconArrowRight, IconUserPlus } from '@cognite/aura/icons';
import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { DashboardFrame } from '../../../library/dashboards/DashboardFrame';
import { DashboardCell, DashboardGrid } from '../../../library/dashboards/DashboardGrid';
import { DashboardPanel } from '../../../library/dashboards/DashboardPanel';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ExpiryBadge } from '../../../library/patterns/people/ExpiryBadge';
import { SetupChecklist } from '../../../library/patterns/states/SetupChecklist';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { KanbanCard } from '../../../library/patterns/workflows/KanbanCard';
import { KanbanColumn } from '../../../library/patterns/workflows/KanbanColumn';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { DAY, REFERENCE_NOW, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './people-and-onboarding.tsx?raw';

type PeopleStage = 'invited' | 'setup' | 'trained' | 'certified';

type PeopleCrew = 'a' | 'b' | 'm';

type PeopleCertificate = { id: string; name: string; expiresAt: number | null };

type PeoplePerson = {
  id: string;
  reference: string;
  name: string;
  role: string;
  crew: PeopleCrew;
  stage: PeopleStage;
  /** Training modules finished, 0 to 5. */
  modules: number;
  /** Who shows them the ropes on the crew. */
  buddy: string;
  certificates: readonly PeopleCertificate[];
};

const PEOPLE_STAGES: readonly { id: PeopleStage; title: string; empty: string }[] = [
  { id: 'invited', title: 'Invited', empty: 'Nobody is waiting on an invitation.' },
  { id: 'setup', title: 'Set up', empty: 'Nobody is setting up right now.' },
  { id: 'trained', title: 'Trained', empty: 'Nobody is waiting for certification.' },
  { id: 'certified', title: 'Certified', empty: 'Nobody on this crew is certified yet.' },
];

const PEOPLE_CREWS: Record<PeopleCrew, { name: string; pattern: string }> = {
  a: { name: 'Crew A', pattern: 'Day shift, 06:00 to 14:00' },
  b: { name: 'Crew B', pattern: 'Night shift, 22:00 to 06:00' },
  m: { name: 'Maintenance', pattern: 'Day work, 07:00 to 15:00' },
};

const PEOPLE_CREW_FILTERS = [
  { value: 'all', label: 'All crews' },
  { value: 'a', label: 'Crew A' },
  { value: 'b', label: 'Crew B' },
  { value: 'm', label: 'Maintenance' },
] as const;

const PEOPLE_MODULES = [
  { id: 'sign-in', title: 'Sign in and set up the tablet', description: 'Single sign-on, offline storage and the Nordkapp site.' },
  { id: 'practice', title: 'Complete a practice round', description: 'Six checkpoints in the training area with a buddy.' },
  { id: 'deviation', title: 'Record a reading and a deviation', description: 'One reading outside its limits, with a photo and a note.' },
  { id: 'alarms', title: 'Read alarms and work orders', description: 'Find the open alarms and the work order on one compressor.' },
  { id: 'quiz', title: 'Pass the site safety quiz', description: 'Twelve questions, ten correct to pass.' },
] as const;

const PEOPLE_GSK: PeopleCertificate = { id: 'gsk', name: 'Offshore safety and emergency', expiresAt: REFERENCE_NOW + 410 * DAY };

const PEOPLE_H2S: PeopleCertificate = { id: 'h2s', name: 'H2S awareness', expiresAt: REFERENCE_NOW + 9 * DAY };

const PEOPLE_HOT_WORK: PeopleCertificate = { id: 'hot-work', name: 'Hot work permit holder', expiresAt: REFERENCE_NOW - 12 * DAY };

const PEOPLE_FSE: PeopleCertificate = { id: 'fse', name: 'Electrical safety', expiresAt: REFERENCE_NOW + 96 * DAY };

const PEOPLE_INDUCTION: PeopleCertificate = { id: 'induction', name: 'Nordkapp site induction', expiresAt: null };

const PEOPLE_ROSTER: readonly PeoplePerson[] = [
  { id: 'ya', reference: 'NK-0461', name: 'Yusuf Aydin', role: 'Field operator', crew: 'b', stage: 'invited', modules: 0, buddy: 'Liv Wold', certificates: [PEOPLE_GSK] },
  { id: 'ht', reference: 'NK-0460', name: 'Henrik Tveit', role: 'Electrician', crew: 'm', stage: 'invited', modules: 0, buddy: 'Magnus Solberg', certificates: [PEOPLE_GSK, PEOPLE_FSE] },
  { id: 'sd', reference: 'NK-0457', name: 'Sana Dahl', role: 'Field operator', crew: 'a', stage: 'setup', modules: 1, buddy: 'Ingrid Haugen', certificates: [PEOPLE_GSK, PEOPLE_H2S] },
  { id: 'eb', reference: 'NK-0455', name: 'Eirik Berg', role: 'Field operator', crew: 'b', stage: 'setup', modules: 3, buddy: 'Liv Wold', certificates: [PEOPLE_GSK, PEOPLE_INDUCTION] },
  { id: 'tb', reference: 'NK-0449', name: 'Tomás Barros', role: 'Mechanical technician', crew: 'm', stage: 'setup', modules: 2, buddy: 'Magnus Solberg', certificates: [PEOPLE_GSK, PEOPLE_HOT_WORK, PEOPLE_INDUCTION] },
  { id: 'mn', reference: 'NK-0446', name: 'Maja Nilsen', role: 'Control room operator', crew: 'a', stage: 'trained', modules: 5, buddy: 'Ingrid Haugen', certificates: [PEOPLE_GSK, PEOPLE_H2S, PEOPLE_INDUCTION] },
  { id: 'jn', reference: 'NK-0441', name: 'Jonas Nyberg', role: 'Instrument technician', crew: 'm', stage: 'trained', modules: 5, buddy: 'Magnus Solberg', certificates: [PEOPLE_GSK, PEOPLE_FSE, PEOPLE_INDUCTION] },
  { id: 'ol', reference: 'NK-0438', name: 'Oskar Lind', role: 'Process engineer', crew: 'a', stage: 'trained', modules: 5, buddy: 'Aisha Khan', certificates: [PEOPLE_GSK, PEOPLE_INDUCTION] },
  { id: 'ih', reference: 'NK-0412', name: 'Ingrid Haugen', role: 'Control room operator', crew: 'a', stage: 'certified', modules: 5, buddy: 'Liv Wold', certificates: [PEOPLE_GSK, PEOPLE_INDUCTION] },
  { id: 'lw', reference: 'NK-0407', name: 'Liv Wold', role: 'Shift supervisor', crew: 'b', stage: 'certified', modules: 5, buddy: 'Aisha Khan', certificates: [PEOPLE_GSK, PEOPLE_H2S, PEOPLE_INDUCTION] },
  { id: 'ms', reference: 'NK-0403', name: 'Magnus Solberg', role: 'Maintenance planner', crew: 'm', stage: 'certified', modules: 5, buddy: 'Liv Wold', certificates: [PEOPLE_GSK, PEOPLE_INDUCTION] },
];

const PEOPLE_ADOPTION: Record<string, { active: number; invited: number; certified: number; days: number; seed: number }> = {
  all: { active: 38, invited: 46, certified: 19, days: 16, seed: 81 },
  a: { active: 16, invited: 18, certified: 9, days: 13, seed: 82 },
  b: { active: 12, invited: 15, certified: 6, days: 19, seed: 83 },
  m: { active: 10, invited: 13, certified: 4, days: 17, seed: 84 },
};

const PEOPLE_CHART_CONFIG = {
  active: { label: 'Weekly active users', color: chartSeriesColor(1) },
} satisfies ChartConfig;

const PEOPLE_STAGE_ORDER: readonly PeopleStage[] = ['invited', 'setup', 'trained', 'certified'];

function peopleStageTitle(stage: PeopleStage): string {
  return PEOPLE_STAGES.find((entry) => entry.id === stage)?.title ?? stage;
}

function peopleNextStage(stage: PeopleStage): PeopleStage | null {
  return PEOPLE_STAGE_ORDER[PEOPLE_STAGE_ORDER.indexOf(stage) + 1] ?? null;
}

function isPeopleCrew(value: unknown): value is PeopleCrew {
  return value === 'a' || value === 'b' || value === 'm';
}

/** Twelve weeks that end on the current figure, so the chart and the text always agree. */
function peopleWeekly(crew: string) {
  const figures = PEOPLE_ADOPTION[crew] ?? PEOPLE_ADOPTION.all;
  const start = Math.round(figures.active * 0.35);
  const values = makeValues({ seed: figures.seed, points: 12, base: start, drift: figures.active - start, noise: figures.active * 0.03, decimals: 0 });
  return values.map((value, index) => ({ week: `W${index + 1}`, active: index === 11 ? figures.active : Math.min(value, figures.active) }));
}

function PeopleCrewFilter({ crew, onCrewChange }: { crew: string; onCrewChange: (crew: string) => void }) {
  return (
    <SegmentedControl value={crew} onValueChange={(value) => onCrewChange(String(value))}>
      <SegmentedControlList size="small" aria-label="Crew">
        {PEOPLE_CREW_FILTERS.map((option) => (
          <SegmentedControlButton key={option.value} value={option.value}>
            {option.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}

/** One wide strip: three figures in plain text beside the weekly trend they come from. */
function PeopleAdoptionPanel({ crew }: { crew: string }) {
  const figures = PEOPLE_ADOPTION[crew] ?? PEOPLE_ADOPTION.all;
  const scope = isPeopleCrew(crew) ? PEOPLE_CREWS[crew].name : 'All crews';
  const share = Math.round((figures.active / figures.invited) * 100);
  const top = Math.ceil(figures.active / 10) * 10;
  const stats = [
    { label: 'Weekly active users', value: String(figures.active), detail: `${share}% of the ${figures.invited} people invited` },
    { label: 'Certified', value: `${figures.certified} of ${figures.invited}`, detail: 'Signed off for rounds on their own' },
    { label: 'Invitation to certified', value: `${figures.days} days`, detail: 'Median over the last 12 weeks' },
  ];

  return (
    <DashboardPanel
      title="Adoption"
      description={`${scope} · people who opened the app at least once in the week`}
      footnote={`Weekly active users grew from ${Math.round(figures.active * 0.35)} to ${figures.active} over 12 weeks.`}
    >
      <div className="@container w-full">
        <div className="flex w-full flex-col gap-x-8 gap-y-4 @3xl:flex-row @3xl:items-center">
        <dl className="grid shrink-0 grid-cols-1 gap-x-8 gap-y-3 @md:grid-cols-3 @3xl:w-3/5">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="text-2xl font-semibold tabular-nums text-base-foreground">{stat.value}</dd>
              <dd className="text-xs text-muted-foreground">{stat.detail}</dd>
            </div>
          ))}
        </dl>
        <div className="h-28 min-w-0 flex-1">
          <ChartContainer
            config={PEOPLE_CHART_CONFIG}
            className="aspect-auto h-full w-full"
            aria-label={`Weekly active users for ${scope} over 12 weeks, rising to ${figures.active}`}
          >
            <AreaChart data={peopleWeekly(crew)} margin={{ top: 8, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} interval={0} ticks={['W1', 'W4', 'W8', 'W12']} />
              <YAxis domain={[0, top]} ticks={[0, top / 2, top]} tickLine={false} axisLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="active"
                type="monotone"
                stroke="var(--color-active)"
                fill="var(--color-active)"
                fillOpacity={0.12}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

type PeopleLaneProps = {
  stage: PeopleStage;
  people: readonly PeoplePerson[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function PeopleLane({ stage, people, selectedId, onSelect }: PeopleLaneProps) {
  const entry = PEOPLE_STAGES.find((candidate) => candidate.id === stage) ?? PEOPLE_STAGES[0];
  const inLane = people.filter((person) => person.stage === stage);
  return (
    <KanbanColumn
      title={entry.title}
      count={inLane.length}
      empty={<p className="px-1 py-3 text-xs text-muted-foreground">{entry.empty}</p>}
    >
      {inLane.map((person) => (
        <KanbanCard
          key={person.id}
          reference={person.reference}
          title={person.name}
          description={person.role}
          progress={Math.round((person.modules / PEOPLE_MODULES.length) * 100)}
          meta={PEOPLE_CREWS[person.crew].name}
          assignee={{ id: person.id, name: person.name }}
          selected={person.id === selectedId}
          onOpen={() => onSelect(person.id)}
        />
      ))}
    </KanbanColumn>
  );
}

type PeopleBoardProps = Omit<PeopleLaneProps, 'stage'>;

/** The dominant element: four lanes, one card per person, left to right as onboarding moves on. */
function PeopleBoard({ people, selectedId, onSelect }: PeopleBoardProps) {
  return (
    <section aria-label="Onboarding board" className="grid w-full grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {PEOPLE_STAGES.map((stage) => (
        <PeopleLane key={stage.id} stage={stage.id} people={people} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </section>
  );
}

function PeopleCertificates({ certificates }: { certificates: readonly PeopleCertificate[] }) {
  return (
    <section aria-label="Certifications" className="flex w-full flex-col gap-2">
      <h3 className="text-base font-medium text-base-foreground">Certifications</h3>
      <ul className="flex flex-col">
        {certificates.map((certificate) => (
          <li key={certificate.id} className="flex flex-col gap-1.5 border-t border-default py-3 first:border-t-0 first:pt-0">
            <span className="text-sm text-base-foreground">{certificate.name}</span>
            <ExpiryBadge expiresAt={certificate.expiresAt} now={REFERENCE_NOW} soonWithinDays={30} showDetail />
          </li>
        ))}
      </ul>
    </section>
  );
}

type PeopleCrewAssignmentProps = { person: PeoplePerson; onCrewChange: (crew: PeopleCrew) => void };

function PeopleCrewAssignment({ person, onCrewChange }: PeopleCrewAssignmentProps) {
  return (
    <section aria-label="Crew assignment" className="flex w-full flex-col gap-2">
      <h3 className="text-base font-medium text-base-foreground">Crew assignment</h3>
      <SegmentedControl
        value={person.crew}
        onValueChange={(value) => {
          if (isPeopleCrew(value)) onCrewChange(value);
        }}
      >
        <SegmentedControlList size="small" aria-label={`Crew for ${person.name}`}>
          <SegmentedControlButton value="a">Crew A</SegmentedControlButton>
          <SegmentedControlButton value="b">Crew B</SegmentedControlButton>
          <SegmentedControlButton value="m">Maint.</SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      <p className="text-sm text-medium-foreground">{PEOPLE_CREWS[person.crew].pattern}</p>
      <p className="text-xs text-muted-foreground">Buddy on the crew: {person.buddy}</p>
    </section>
  );
}

type PeopleSheetProps = {
  person: PeoplePerson;
  onClose?: () => void;
  onCompleteModule: () => void;
  onCrewChange: (crew: PeopleCrew) => void;
  onAdvance: () => void;
};

/** The side sheet for one person: where they are, what is left, what expires and who they work with. */
function PeopleSheet({ person, onClose, onCompleteModule, onCrewChange, onAdvance }: PeopleSheetProps) {
  const next = peopleNextStage(person.stage);
  const trainingLeft = PEOPLE_MODULES.length - person.modules;
  const blocked = next === 'trained' && trainingLeft > 0;
  return (
    <SidePanel
      title={person.name}
      description={person.role}
      leading={<PersonAvatar name={person.name} colorKey={person.id} />}
      status={<Badge variant="secondary">{peopleStageTitle(person.stage)}</Badge>}
      onClose={onClose}
      closeLabel="Close person"
      footer={
        next === null ? (
          <p className="w-full text-sm text-muted-foreground">Onboarding is complete.</p>
        ) : (
          <div className="flex w-full flex-col items-stretch gap-2">
            {blocked ? (
              <p className="text-xs text-muted-foreground">
                {trainingLeft} training {trainingLeft === 1 ? 'module' : 'modules'} left before this person counts as trained.
              </p>
            ) : null}
            <Button size="sm" disabled={blocked} onClick={onAdvance}>
              Move to {peopleStageTitle(next).toLowerCase()} <IconArrowRight />
            </Button>
          </div>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <SetupChecklist
          title="Training"
          steps={PEOPLE_MODULES.map((module, index) => ({
            id: module.id,
            title: module.title,
            description: module.description,
            done: index < person.modules,
            actionLabel: 'Mark as completed',
          }))}
          onStepAction={onCompleteModule}
          complete={<p className="text-sm text-medium-foreground">All five modules are completed.</p>}
        />
        <PeopleCertificates certificates={person.certificates} />
        <PeopleCrewAssignment person={person} onCrewChange={onCrewChange} />
      </div>
    </SidePanel>
  );
}

function usePeopleBoard(initialSelectedId: string | null) {
  const [people, setPeople] = useState<readonly PeoplePerson[]>(PEOPLE_ROSTER);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [crew, setCrew] = useState('all');
  const update = (id: string, change: (person: PeoplePerson) => PeoplePerson) =>
    setPeople((current) => current.map((person) => (person.id === id ? change(person) : person)));

  return {
    crew,
    setCrew,
    selectedId,
    setSelectedId,
    visible: people.filter((person) => crew === 'all' || person.crew === crew),
    selected: people.find((person) => person.id === selectedId) ?? null,
    completeModule: (id: string) =>
      update(id, (person) => ({ ...person, modules: Math.min(person.modules + 1, PEOPLE_MODULES.length) })),
    changeCrew: (id: string, next: PeopleCrew) => update(id, (person) => ({ ...person, crew: next })),
    advance: (id: string) => update(id, (person) => ({ ...person, stage: peopleNextStage(person.stage) ?? person.stage })),
  };
}

/**
 * Archetype: kanban lanes under one wide strip, with a side sheet.
 * Dominant element: the four-lane onboarding board, one card per person.
 * Interaction: selecting a card opens that person's sheet (training checklist, certifications,
 * crew); completing a module, moving a stage or changing crew updates the card on the board; the
 * crew filter narrows the board and the adoption strip together.
 */
function PeopleDashboard() {
  const board = usePeopleBoard('eb');
  const selected = board.selected;

  return (
    <DashboardFrame
      title="People and onboarding"
      subtitle="Nordkapp field app roll-out · week 11, 2026"
      status={<Badge variant="secondary">{board.visible.length} people on the board</Badge>}
      actions={
        <Button size="sm">
          <IconUserPlus /> Invite people
        </Button>
      }
      toolbar={
        <>
          <span className="text-sm text-muted-foreground">Show</span>
          <PeopleCrewFilter crew={board.crew} onCrewChange={board.setCrew} />
        </>
      }
    >
      <DashboardGrid>
        <DashboardCell span={selected ? 8 : 12}>
          <div className="flex flex-col gap-4">
            <PeopleAdoptionPanel crew={board.crew} />
            <PeopleBoard people={board.visible} selectedId={board.selectedId} onSelect={board.setSelectedId} />
          </div>
        </DashboardCell>
        {selected ? (
          <DashboardCell span={4}>
            <PeopleSheet
              person={selected}
              onClose={() => board.setSelectedId(null)}
              onCompleteModule={() => board.completeModule(selected.id)}
              onCrewChange={(crew) => board.changeCrew(selected.id, crew)}
              onAdvance={() => board.advance(selected.id)}
            />
          </DashboardCell>
        ) : null}
      </DashboardGrid>
    </DashboardFrame>
  );
}

function PeopleOnboardDashSignature() {
  return (
    <ThemeScope preset="pink-soft" className="w-full">
      <PeopleDashboard />
    </ThemeScope>
  );
}

function PeopleOnboardDashAura() {
  return (
    <ThemeScope preset="aura" className="w-full">
      <PeopleDashboard />
    </ThemeScope>
  );
}

function PeopleOnboardDashField() {
  return (
    <ThemeScope preset="field" className="w-full">
      <PeopleDashboard />
    </ThemeScope>
  );
}

function PeopleOnboardDashAuraDark() {
  return (
    <ThemeScope preset="aura-dark" className="w-full">
      <PeopleDashboard />
    </ThemeScope>
  );
}

function PeopleOnboardDashAdoption() {
  const [crew, setCrew] = useState('a');
  return (
    <div className="flex w-full flex-col gap-3">
      <PeopleCrewFilter crew={crew} onCrewChange={setCrew} />
      <PeopleAdoptionPanel crew={crew} />
    </div>
  );
}

function PeopleOnboardDashBoard() {
  const board = usePeopleBoard(null);
  return <PeopleBoard people={board.visible} selectedId={board.selectedId} onSelect={board.setSelectedId} />;
}

function PeopleOnboardDashSheet() {
  const board = usePeopleBoard('sd');
  const person = board.selected ?? PEOPLE_ROSTER[2];
  return (
    <div className="w-full max-w-sm">
      <PeopleSheet
        person={person}
        onCompleteModule={() => board.completeModule(person.id)}
        onCrewChange={(crew) => board.changeCrew(person.id, crew)}
        onAdvance={() => board.advance(person.id)}
      />
    </div>
  );
}

function PeopleOnboardDashLane() {
  const [selectedId, setSelectedId] = useState<string | null>('tb');
  return (
    <div className="w-full max-w-xs">
      <PeopleLane stage="setup" people={PEOPLE_ROSTER} selectedId={selectedId} onSelect={setSelectedId} />
    </div>
  );
}

function PeopleOnboardDashCertificates() {
  return (
    <div className="w-full max-w-xs">
      <PeopleCertificates certificates={[PEOPLE_GSK, PEOPLE_H2S, PEOPLE_HOT_WORK, PEOPLE_INDUCTION]} />
    </div>
  );
}

function PeopleOnboardDashCrew() {
  const [person, setPerson] = useState(PEOPLE_ROSTER[3]);
  return (
    <div className="w-full max-w-xs">
      <PeopleCrewAssignment person={person} onCrewChange={(crew) => setPerson((current) => ({ ...current, crew }))} />
    </div>
  );
}

export default definePage({
  id: 'people-and-onboarding',
  title: 'People and onboarding',
  summary:
    'How a roll-out is going, person by person: one strip for adoption, then a board where everyone moves from invited to certified, and a sheet per person with training, certifications and crew.',
  guidance: {
    use: [
      'For the person who runs a roll-out and follows up people one at a time.',
      'When onboarding has a few clear stages and a handful of people in each.',
      'Keep the adoption figures in plain text; the chart only shows the direction.',
      'Let the sheet answer what is left: modules, expiring certificates, crew.',
    ],
    avoid: [
      'Ranking people or crews against each other; this is follow-up, not a league table.',
      'More than four or five lanes, or lanes with dozens of cards; filter by crew instead.',
      'Colour for the stage; the lane already says it.',
      'Moving a person on while training is unfinished without saying why it is blocked.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Shown in the Pink soft theme. Select a person to open their sheet, or narrow the board to one crew.',
      specimens: [
        {
          id: 'PeopleOnboardDashSignature',
          title: 'People and onboarding',
          note: 'Pick it for a roll-out, training or certification programme followed person by person.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'dashboards/DashboardFrame.tsx',
            'dashboards/DashboardGrid.tsx',
            'dashboards/DashboardPanel.tsx',
            'patterns/workflows/KanbanColumn.tsx',
            'patterns/workflows/KanbanCard.tsx',
            'patterns/structure/SidePanel.tsx',
            'patterns/states/SetupChecklist.tsx',
            'patterns/people/ExpiryBadge.tsx',
            'display/PersonAvatar.tsx',
            'themes/ThemeScope.tsx',
          ],
          Component: PeopleOnboardDashSignature,
        },
      ],
    },
    {
      id: 'themes',
      title: 'In other themes',
      description: 'The same dashboard, unchanged, in three more presets.',
      specimens: [
        {
          id: 'PeopleOnboardDashAura',
          title: 'Aura',
          note: 'Pick it when the people view is one page of a product in the default theme.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PeopleOnboardDashAura,
        },
        {
          id: 'PeopleOnboardDashField',
          title: 'Field',
          note: 'Pick it when supervisors follow up their crew on a tablet on site.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PeopleOnboardDashField,
        },
        {
          id: 'PeopleOnboardDashAuraDark',
          title: 'Aura dark',
          note: 'Pick it for control rooms and night shifts where the rest of the product is dark.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['themes/ThemeScope.tsx', 'themes/themes.css'],
          Component: PeopleOnboardDashAuraDark,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Panels',
      description: 'Each part on its own, ready to drop into another dashboard.',
      specimens: [
        {
          id: 'PeopleOnboardDashAdoption',
          title: 'Adoption strip',
          note: 'Pick it as the one wide strip above a board: three figures and the trend behind them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['dashboards/DashboardPanel.tsx'],
          Component: PeopleOnboardDashAdoption,
        },
        {
          id: 'PeopleOnboardDashBoard',
          title: 'Onboarding board',
          note: 'Pick it when people, not tasks, move through a few stages.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/KanbanCard.tsx'],
          Component: PeopleOnboardDashBoard,
        },
        {
          id: 'PeopleOnboardDashSheet',
          title: 'Person sheet',
          note: 'Pick it beside the board for everything about one person and the one action that moves them on.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/states/SetupChecklist.tsx', 'patterns/people/ExpiryBadge.tsx', 'display/PersonAvatar.tsx'],
          Component: PeopleOnboardDashSheet,
        },
        {
          id: 'PeopleOnboardDashLane',
          title: 'Single lane',
          note: 'Pick it to show one stage on its own, for example the people still setting up.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/KanbanColumn.tsx', 'patterns/workflows/KanbanCard.tsx'],
          Component: PeopleOnboardDashLane,
        },
        {
          id: 'PeopleOnboardDashCertificates',
          title: 'Certifications',
          note: 'Pick it wherever a person is shown and a certificate may be about to expire.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/ExpiryBadge.tsx'],
          Component: PeopleOnboardDashCertificates,
        },
        {
          id: 'PeopleOnboardDashCrew',
          title: 'Crew assignment',
          note: 'Pick it to move a person between a few crews and show the shift pattern that follows.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PeopleOnboardDashCrew,
        },
      ],
    },
  ],
});
