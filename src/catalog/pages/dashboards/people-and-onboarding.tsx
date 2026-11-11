import { Button } from '@cognite/aura/components/button';
import {
  SegmentedControl,
  SegmentedControlButton,
  SegmentedControlList,
} from '@cognite/aura/components/segmented-control';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCalendarEvent,
  IconCertificate,
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconMessage,
  IconSchool,
  IconUsers,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { AppFrame, type AppFrameNavItem } from '../../../library/kit/AppFrame';
import { Canvas } from '../../../library/kit/Canvas';
import { Donut } from '../../../library/kit/Donut';
import { Grid } from '../../../library/kit/Grid';
import { IconChip } from '../../../library/kit/IconChip';
import { ListRow } from '../../../library/kit/ListRow';
import { Panel } from '../../../library/kit/Panel';
import { RingGauge } from '../../../library/kit/RingGauge';
import { StatusPill } from '../../../library/kit/StatusPill';
import type { Tone } from '../../../library/kit/tones';
import { LookScope } from '../../../library/looks/LookScope';
import { findPerson } from '../../data/plant';
import { definePage } from '../../types';

import source from './people-and-onboarding.tsx?raw';

type PaoCrew = 'Operations' | 'Maintenance' | 'Contractor';

type PaoFilter = 'all' | PaoCrew;

type PaoPerson = {
  id: string;
  name: string;
  initials: string;
  role: string;
  crew: PaoCrew;
  /** Index into the stages: 0 offer signed … 4 signed off. */
  stage: number;
  /** Days spent in the current stage. */
  day: number;
  /** Steps of the current stage already done. */
  done: number;
  mentorId: string;
  started: string;
  /** What holds the person up, when something does. */
  blocker?: string;
};

const PAO_STAGES: readonly { id: string; label: string; tone: Tone; pace: string; steps: readonly string[] }[] = [
  { id: 'offer', label: 'Offer signed', tone: 'sky', pace: 'About 2 weeks', steps: ['Contract returned', 'Background check', 'Sizes for protective gear', 'Travel booked'] },
  { id: 'induction', label: 'Safety induction', tone: 'purple', pace: '5 days', steps: ['Life-saving rules', 'Permit to work', 'H2S awareness', 'Gas testing', 'Fire and evacuation'] },
  { id: 'access', label: 'Site access', tone: 'amber', pace: 'About 8 days', steps: ['Offshore medical', 'Survival course', 'Access card issued', 'Locker and protective gear'] },
  { id: 'shadowing', label: 'Shadowing', tone: 'teal', pace: '4 weeks', steps: ['Area walkdown', 'Start-up procedure', 'Alarm response', 'Emergency shutdown drill', 'Night rotation', 'Final assessment'] },
  { id: 'signed', label: 'Signed off', tone: 'green', pace: 'On the rota', steps: ['Competence signed by supervisor', 'Added to the shift rota'] },
];

const PAO_PEOPLE: readonly PaoPerson[] = [
  { id: 'sl', name: 'Sigrid Lunde', initials: 'SL', role: 'Process operator', crew: 'Operations', stage: 0, day: 6, done: 3, mentorId: 'lw', started: '6 Mar' },
  { id: 'km', name: 'Karan Mehta', initials: 'KM', role: 'Instrument technician', crew: 'Maintenance', stage: 0, day: 2, done: 1, mentorId: 'jn', started: '10 Mar' },
  { id: 'ed', name: 'Elin Dahl', initials: 'ED', role: 'Lab technician', crew: 'Operations', stage: 0, day: 11, done: 4, mentorId: 'lw', started: '1 Mar' },
  { id: 'ob', name: 'Oskar Berg', initials: 'OB', role: 'Mechanical technician', crew: 'Maintenance', stage: 1, day: 3, done: 3, mentorId: 'tb', started: '24 Feb' },
  { id: 'fr', name: 'Fatima Rahimi', initials: 'FR', role: 'Process engineer', crew: 'Operations', stage: 1, day: 4, done: 5, mentorId: 'ak', started: '23 Feb' },
  { id: 'jv', name: 'Jonas Vik', initials: 'JV', role: 'Scaffolder', crew: 'Contractor', stage: 1, day: 1, done: 1, mentorId: 'ms', started: '2 Mar' },
  { id: 'mh', name: 'Maja Holm', initials: 'MH', role: 'Control room operator', crew: 'Operations', stage: 1, day: 2, done: 2, mentorId: 'ih', started: '26 Feb' },
  { id: 'ha', name: 'Henrik Aas', initials: 'HA', role: 'Electrician', crew: 'Maintenance', stage: 2, day: 12, done: 2, mentorId: 'jn', started: '9 Feb', blocker: 'Medical overdue' },
  { id: 'yt', name: 'Yuki Tanaka', initials: 'YT', role: 'Rotating equipment engineer', crew: 'Maintenance', stage: 2, day: 5, done: 3, mentorId: 'ak', started: '16 Feb' },
  { id: 'ns', name: 'Nora Strand', initials: 'NS', role: 'Control room operator', crew: 'Operations', stage: 3, day: 17, done: 4, mentorId: 'ih', started: '19 Jan' },
  { id: 'es', name: 'Emil Solheim', initials: 'ES', role: 'Mechanical technician', crew: 'Maintenance', stage: 3, day: 9, done: 2, mentorId: 'tb', started: '2 Feb' },
  { id: 'ao', name: 'Amara Okafor', initials: 'AO', role: 'Process operator', crew: 'Operations', stage: 3, day: 24, done: 5, mentorId: 'lw', started: '12 Jan' },
  { id: 'lm', name: 'Lars Moen', initials: 'LM', role: 'Instrument technician', crew: 'Maintenance', stage: 4, day: 3, done: 2, mentorId: 'jn', started: '5 Jan' },
  { id: 'ik', name: 'Ida Kvam', initials: 'IK', role: 'Process operator', crew: 'Operations', stage: 4, day: 8, done: 2, mentorId: 'lw', started: '15 Dec' },
];

const PAO_CREW_TONE: Record<PaoCrew, Tone> = { Operations: 'blue', Maintenance: 'pink', Contractor: 'amber' };

const PAO_INITIAL: Record<string, number> = Object.fromEntries(PAO_PEOPLE.map((person) => [person.id, person.stage]));

const PAO_NAV: AppFrameNavItem[] = [
  { id: 'journey', label: 'Journey', icon: <IconUsers /> },
  { id: 'training', label: 'Training', icon: <IconSchool /> },
  { id: 'certificates', label: 'Certificates', icon: <IconCertificate />, badge: '3' },
  { id: 'calendar', label: 'Calendar', icon: <IconCalendarEvent /> },
];

function paoFind(id: string): PaoPerson {
  return PAO_PEOPLE.find((person) => person.id === id) ?? PAO_PEOPLE[0];
}

/** Steps done in the stage the person is in now; a person who was just moved starts the stage at zero. */
function paoDone(person: PaoPerson, stage: number): number {
  return stage === person.stage ? person.done : 0;
}

function PaoAvatar({ person, size = 'md' }: { person: PaoPerson; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden="true"
      data-tone={PAO_CREW_TONE[person.crew]}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[var(--t-vivid)] font-bold text-[var(--t-on-vivid)] ${size === 'lg' ? 'size-16 text-xl' : 'size-9 text-xs'}`}
    >
      {person.initials}
    </span>
  );
}

type PaoCardProps = {
  person: PaoPerson;
  stage: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onAdvance: (id: string) => void;
};

/** One person on the board: who, how far through the stage, and a way on to the next one. */
function PaoCard({ person, stage, selected, onSelect, onAdvance }: PaoCardProps) {
  const steps = PAO_STAGES[stage].steps.length;
  const done = paoDone(person, stage);
  const next = PAO_STAGES[stage + 1];
  const moved = stage !== person.stage;
  return (
    <li className={`relative rounded-[18px] bg-[var(--kit-surface)] shadow-sm ${selected ? 'ring-[3px] ring-[var(--kit-accent)]' : ''}`}>
      <button
        type="button"
        aria-pressed={selected}
        aria-label={`Open profile of ${person.name}`}
        onClick={() => onSelect(person.id)}
        className="flex w-full cursor-pointer flex-col gap-2.5 rounded-[18px] p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--kit-text)]"
      >
        <span className="flex items-center gap-2.5">
          <PaoAvatar person={person} />
          <span className="min-w-0">
            <span className="block text-sm leading-tight font-bold text-[var(--kit-text)]">{person.name}</span>
            <span className="block text-xs leading-snug text-[var(--kit-text-2)]">{person.role}</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className="flex h-2 flex-1 gap-0.5" aria-hidden="true">
            {Array.from({ length: steps }, (_, index) => (
              <span key={index} className={`flex-1 rounded-full ${index < done ? 'bg-[var(--t-vivid)]' : 'bg-[var(--kit-track)]'}`} />
            ))}
          </span>
          <span className="text-xs font-semibold whitespace-nowrap text-[var(--kit-text-2)] tabular-nums">
            {done} of {steps}
          </span>
        </span>
        <span className="flex min-h-6 items-center pr-9">
          {person.blocker && !moved ? (
            <StatusPill tone="warning" icon={<IconAlertTriangle />}>
              {person.blocker}
            </StatusPill>
          ) : (
            <span className="text-xs text-[var(--kit-text-2)]">{moved ? 'Moved today' : `Day ${person.day}`}</span>
          )}
        </span>
      </button>
      {next ? (
        <button
          type="button"
          aria-label={`Move ${person.name} to ${next.label}`}
          title={`Move to ${next.label}`}
          onClick={() => onAdvance(person.id)}
          className="absolute right-2.5 bottom-2.5 flex size-8 cursor-pointer items-center justify-center rounded-full bg-[var(--t-soft)] text-[var(--t-on-soft)] outline-none hover:bg-[var(--t-vivid)] hover:text-[var(--t-on-vivid)] focus-visible:ring-2 focus-visible:ring-[var(--kit-text)] [&>svg]:size-4"
        >
          <IconArrowRight aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}

type PaoBoardState = { stages: Record<string, number>; selected: string; select: (id: string) => void; advance: (id: string) => void };

/** Where everyone is on the board, who is open, and the move to the next stage. */
function usePaoBoard(initialSelected: string): PaoBoardState {
  const [stages, setStages] = useState(PAO_INITIAL);
  const [selected, setSelected] = useState(initialSelected);
  return {
    stages,
    selected,
    select: setSelected,
    advance: (id) => {
      setStages((current) => ({ ...current, [id]: Math.min(PAO_STAGES.length - 1, (current[id] ?? 0) + 1) }));
      setSelected(id);
    },
  };
}

function PaoColumn({ index, people, board }: { index: number; people: readonly PaoPerson[]; board: PaoBoardState }) {
  const stage = PAO_STAGES[index];
  return (
    <section aria-label={stage.label} data-tone={stage.tone} className="flex min-w-0 flex-col gap-2.5 rounded-[26px] bg-[color-mix(in_oklab,var(--t-soft)_78%,var(--kit-surface))] p-2.5">
      <header className="flex items-start justify-between gap-2 px-2 pt-2">
        <div className="min-w-0">
          <h3 className="text-sm leading-tight font-bold text-[var(--kit-text)]">{stage.label}</h3>
          <p className="mt-0.5 text-xs text-[var(--kit-text-2)]">{stage.pace}</p>
        </div>
        <span className="text-4xl leading-none font-bold text-[var(--t-ink)] tabular-nums">{people.length}</span>
      </header>
      <ul className="flex flex-1 flex-col gap-2">
        {people.map((person) => (
          <PaoCard key={person.id} person={person} stage={index} selected={person.id === board.selected} onSelect={board.select} onAdvance={board.advance} />
        ))}
        {people.length === 0 ? <li className="flex flex-1 items-center justify-center rounded-[18px] border-2 border-dashed border-[var(--t-line)] p-4 text-center text-sm text-[var(--kit-text-2)]">Nobody here with this filter</li> : null}
      </ul>
    </section>
  );
}

function PaoBoard({ board, filter = 'all' }: { board: PaoBoardState; filter?: PaoFilter }) {
  return (
    <div className="grid flex-1 grid-cols-5 gap-3">
      {PAO_STAGES.map((stage, index) => (
        <PaoColumn key={stage.id} index={index} board={board} people={PAO_PEOPLE.filter((person) => board.stages[person.id] === index && (filter === 'all' || person.crew === filter))} />
      ))}
    </div>
  );
}

/** The five stages as a line: done, now and still to come. */
function PaoJourney({ stage }: { stage: number }) {
  return (
    <ol className="flex">
      {PAO_STAGES.map((entry, index) => {
        const state = index < stage ? 'done' : index === stage ? 'now' : 'next';
        return (
          <li key={entry.id} data-tone={entry.tone} className="relative flex flex-1 flex-col items-center gap-2 text-center">
            {index > 0 ? <span className={`absolute top-[18px] right-1/2 h-1 w-full -translate-y-1/2 ${state === 'next' ? 'bg-[var(--kit-track)]' : 'bg-[var(--kit-accent)]'}`} /> : null}
            <span
              className={`relative z-10 flex size-9 items-center justify-center rounded-full text-sm font-bold [&>svg]:size-5 ${
                state === 'done'
                  ? 'bg-[var(--kit-accent)] text-[var(--kit-on-accent)]'
                  : state === 'now'
                    ? 'bg-[var(--kit-surface)] text-[var(--kit-text)] ring-4 ring-[var(--kit-accent)]'
                    : 'bg-[var(--kit-well)] text-[var(--kit-text-2)] ring-2 ring-[var(--kit-track)]'
              }`}
            >
              {state === 'done' ? <IconCheck aria-hidden="true" /> : index + 1}
            </span>
            <span className={`text-xs leading-tight ${state === 'now' ? 'font-bold text-[var(--kit-text)]' : 'text-[var(--kit-text-2)]'}`}>{entry.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function PaoSteps({ stage, done }: { stage: number; done: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {PAO_STAGES[stage].steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full [&>svg]:size-3.5 ${
              index < done ? 'bg-[var(--kit-line-success)] text-[var(--kit-surface)]' : 'ring-2 ring-[var(--kit-track)] ring-inset'
            }`}
          >
            {index < done ? <IconCheck aria-hidden="true" stroke={3} /> : null}
          </span>
          <span className={index < done ? 'text-[var(--kit-text-2)]' : 'font-medium text-[var(--kit-text)]'}>{step}</span>
        </li>
      ))}
    </ul>
  );
}

/** The open profile as a sheet under the board: identity, journey, and what is left in this stage. */
function PaoSheet({ person, stage, onAdvance }: { person: PaoPerson; stage: number; onAdvance: (id: string) => void }) {
  const next = PAO_STAGES[stage + 1];
  const done = paoDone(person, stage);
  const mentor = findPerson(person.mentorId);
  return (
    <Panel className="h-auto">
      <div className="grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <PaoAvatar person={person} size="lg" />
            <div className="min-w-0">
              <h3 className="text-lg leading-tight font-bold text-[var(--kit-text)]">{person.name}</h3>
              <p className="text-sm text-[var(--kit-text-2)]">{person.role}</p>
            </div>
          </div>
          <p className="text-sm text-[var(--kit-text-2)]">
            {person.crew} · started {person.started} · mentor {mentor?.name ?? 'not assigned'}
          </p>
          <div className="flex gap-2">
            {next ? (
              <Button size="sm" onClick={() => onAdvance(person.id)}>
                Move to {next.label.toLowerCase()} <IconArrowRight />
              </Button>
            ) : (
              <StatusPill tone="success" size="lg" icon={<IconCircleCheck />}>
                On the rota
              </StatusPill>
            )}
            <Button variant="outline" size="icon-sm" aria-label={`Message ${person.name}`}>
              <IconMessage />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold text-[var(--kit-text)]">Journey</p>
          <PaoJourney stage={stage} />
        </div>
        <div className="flex flex-col gap-3">
          <p className="flex items-baseline justify-between text-sm font-bold text-[var(--kit-text)]">
            {PAO_STAGES[stage].label}
            <span className="font-medium text-[var(--kit-text-2)] tabular-nums">
              {done} of {PAO_STAGES[stage].steps.length} done
            </span>
          </p>
          <PaoSteps stage={stage} done={done} />
        </div>
      </div>
    </Panel>
  );
}

function PaoFilterSwitch({ filter, onChange }: { filter: PaoFilter; onChange: (filter: PaoFilter) => void }) {
  return (
    <SegmentedControl
      value={filter}
      onValueChange={(next) => {
        if (next === 'all' || next === 'Operations' || next === 'Maintenance' || next === 'Contractor') onChange(next);
      }}
    >
      <SegmentedControlList aria-label="Crew">
        <SegmentedControlButton value="all">Everyone</SegmentedControlButton>
        <SegmentedControlButton value="Operations">Operations</SegmentedControlButton>
        <SegmentedControlButton value="Maintenance">Maintenance</SegmentedControlButton>
        <SegmentedControlButton value="Contractor">Contractors</SegmentedControlButton>
      </SegmentedControlList>
    </SegmentedControl>
  );
}

function PaoCrewKey() {
  return (
    <ul className="flex gap-4 text-sm text-[var(--kit-text-2)]">
      {(['Operations', 'Maintenance', 'Contractor'] as const).map((crew) => (
        <li key={crew} data-tone={PAO_CREW_TONE[crew]} className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[var(--t-vivid)]" />
          {crew}
        </li>
      ))}
    </ul>
  );
}

function PeopleAndOnboardingSignature() {
  const board = usePaoBoard('ns');
  const [filter, setFilter] = useState<PaoFilter>('all');
  const count = (stage: number) => PAO_PEOPLE.filter((person) => board.stages[person.id] === stage).length;
  const person = paoFind(board.selected);
  return (
    <LookScope look="soft">
      <Canvas className="flex min-h-[860px] flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[var(--kit-text-2)]">Nordkapp · onboarding, spring intake</p>
            <h2 className="mt-1 text-4xl leading-tight font-bold tracking-tight text-[var(--kit-text)]">Fourteen people are on their way in</h2>
            <p className="mt-2 text-base leading-relaxed text-[var(--kit-text-2)]">
              <strong className="font-bold text-[var(--kit-text)]">{count(3)}</strong> are shadowing on shift, <strong className="font-bold text-[var(--kit-text)]">{count(4)}</strong> are signed off and on
              the rota, and <strong className="font-bold text-[var(--kit-line-warning)]">1</strong> is held up by a medical. Median time to sign-off is{' '}
              <strong className="font-bold text-[var(--kit-text)]">46 days</strong>.
            </p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-3">
            <PaoFilterSwitch filter={filter} onChange={setFilter} />
            <PaoCrewKey />
          </div>
        </header>
        <PaoBoard board={board} filter={filter} />
        <PaoSheet person={person} stage={board.stages[person.id] ?? person.stage} onAdvance={board.advance} />
      </Canvas>
    </LookScope>
  );
}

const PAO_SKILLS: readonly { label: string; value: number; tone: Tone }[] = [
  { label: 'Safety', value: 100, tone: 'green' },
  { label: 'Process', value: 72, tone: 'teal' },
  { label: 'Control system', value: 64, tone: 'purple' },
  { label: 'Emergency response', value: 40, tone: 'amber' },
];

const PAO_SESSIONS: readonly { id: string; title: string; when: string; with: string; tone: Tone }[] = [
  { id: 's1', title: 'Emergency shutdown drill', when: 'Fri 13 Mar, 09:00', with: 'Simulator room · Liv Wold', tone: 'amber' },
  { id: 's2', title: 'Night rotation, first of four', when: 'Mon 16 Mar, 19:00', with: 'Control room 1 · Ingrid Haugen', tone: 'purple' },
  { id: 's3', title: 'Compressor start-up, observed', when: 'Thu 19 Mar, 10:30', with: 'Control room 1 · Aisha Khan', tone: 'teal' },
  { id: 's4', title: 'Final assessment', when: 'Fri 3 Apr, 13:00', with: 'Liv Wold and Ingrid Haugen', tone: 'green' },
];

function PeopleAndOnboardingProfile() {
  const person = paoFind('ns');
  return (
    <LookScope look="soft">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'People', mark: <IconUsers /> }}
        nav={PAO_NAV}
        current="journey"
        title={person.name}
        subtitle="Control room operator · Operations · shadowing Ingrid Haugen on day shift since 23 February"
        actions={<Button size="sm">Book assessment</Button>}
        tools={
          <StatusPill tone="teal" size="lg" icon={<IconClock />}>
            Day 17 of 28
          </StatusPill>
        }
      >
        <Grid>
          <Panel className="col-span-5" title="Competence" subtitle="Share of each area signed by a mentor" tone="teal">
            <div className="grid flex-1 grid-cols-2 place-items-center gap-x-4 gap-y-6">
              {PAO_SKILLS.map((skill) => (
                <RingGauge key={skill.label} label={skill.label} value={skill.value} size={112} tone={skill.tone} />
              ))}
            </div>
          </Panel>
          <div className="col-span-7 flex flex-col gap-5">
            <Panel className="h-auto" title="Journey" subtitle="Started 19 January, sign-off planned for 3 April">
              <PaoJourney stage={3} />
            </Panel>
            <Panel className="flex-1" title="Shadowing" subtitle="Four of six steps signed" tone="purple">
              <PaoSteps stage={3} done={4} />
            </Panel>
          </div>
          <Panel className="col-span-7" title="Coming up" subtitle="Booked sessions until sign-off">
            <ul className="flex flex-1 flex-col justify-between gap-2">
              {PAO_SESSIONS.map((session) => (
                <ListRow
                  key={session.id}
                  tone={session.tone}
                  leading={
                    <IconChip tone={session.tone} size="sm">
                      <IconCalendarEvent />
                    </IconChip>
                  }
                  title={session.title}
                  meta={session.with}
                  trailing={session.when}
                />
              ))}
            </ul>
          </Panel>
          <Panel className="col-span-5" title="Certificates" subtitle="Six held, one runs out this spring" tone="amber">
            <div className="flex flex-1 items-center">
              <Donut
                label="Certificates by validity"
                segments={[
                  { label: 'Valid over a year', value: 4, tone: 'green' },
                  { label: 'Valid under a year', value: 1, tone: 'teal' },
                  { label: 'Runs out in 60 days', value: 1, tone: 'amber' },
                ]}
                centerCaption="held"
                size={164}
                legend="right"
                className="w-full"
              />
            </div>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

const PAO_COMPETENCES = ['Permit to work', 'Gas testing', 'H2S rescue', 'First aid', 'Crane signals', 'Fire team'];

const PAO_CREWS: readonly { name: string; size: number; cover: readonly number[]; need: readonly number[] }[] = [
  { name: 'Day shift A', size: 9, cover: [9, 6, 4, 5, 3, 4], need: [9, 4, 3, 3, 2, 4] },
  { name: 'Night shift B', size: 8, cover: [8, 5, 2, 4, 2, 3], need: [8, 4, 3, 3, 2, 4] },
  { name: 'Maintenance', size: 12, cover: [11, 9, 4, 6, 6, 2], need: [12, 6, 3, 4, 4, 2] },
  { name: 'Contractors', size: 7, cover: [7, 2, 0, 2, 3, 0], need: [7, 2, 1, 2, 2, 0] },
];

function paoCoverTone(cover: number, need: number): Tone {
  if (cover >= need) return 'success';
  return cover >= need - 1 ? 'warning' : 'critical';
}

/** Crews against the competences each shift must carry: how many hold it, how many are needed. */
function PaoMatrix() {
  return (
    <table className="w-full table-fixed border-separate border-spacing-1.5 text-sm">
      <caption className="sr-only">People per crew who hold each competence, against the number the crew needs</caption>
      <thead>
        <tr>
          <th scope="col" className="w-36 text-left text-xs font-semibold text-[var(--kit-text-2)]">
            Crew
          </th>
          {PAO_COMPETENCES.map((competence) => (
            <th key={competence} scope="col" className="px-1 pb-1 text-center align-bottom text-xs leading-tight font-semibold text-[var(--kit-text-2)]">
              {competence}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {PAO_CREWS.map((crew) => (
          <tr key={crew.name}>
            <th scope="row" className="text-left">
              <span className="block font-bold text-[var(--kit-text)]">{crew.name}</span>
              <span className="block text-xs font-normal text-[var(--kit-text-2)]">{crew.size} people</span>
            </th>
            {crew.cover.map((cover, index) => {
              const need = crew.need[index] ?? 0;
              return (
                <td key={PAO_COMPETENCES[index]} data-tone={paoCoverTone(cover, need)} className="rounded-2xl bg-[var(--t-soft)] px-2 py-3 text-center text-[var(--t-on-soft)]">
                  <span className="block text-xl leading-none font-bold tabular-nums">{cover}</span>
                  <span className="mt-1 block text-xs whitespace-nowrap">{cover >= need ? `needs ${need}` : `short ${need - cover}`}</span>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const PAO_EXPIRING: readonly { id: string; name: string; what: string; when: string; tone: Tone }[] = [
  { id: 'x1', name: 'Henrik Aas', what: 'Offshore medical', when: 'Overdue 4 days', tone: 'critical' },
  { id: 'x2', name: 'Tomás Barros', what: 'H2S rescue', when: 'In 12 days', tone: 'warning' },
  { id: 'x3', name: 'Jonas Nyberg', what: 'Gas testing', when: 'In 26 days', tone: 'warning' },
  { id: 'x4', name: 'Nora Strand', what: 'First aid', when: 'In 58 days', tone: 'info' },
];

function PeopleAndOnboardingReadiness() {
  return (
    <LookScope look="soft">
      <AppFrame
        brand={{ name: 'Nordkapp', detail: 'People', mark: <IconUsers /> }}
        nav={PAO_NAV}
        current="certificates"
        title="Can every shift cover its roles?"
        subtitle="Night shift B is one H2S rescuer short until the two operators in shadowing are signed off."
        tools={
          <StatusPill tone="warning" size="lg" icon={<IconAlertTriangle />}>
            3 gaps
          </StatusPill>
        }
      >
        <Grid>
          <Panel className="col-span-8" title="Cover by crew" subtitle="People holding each competence, against what the crew needs on shift">
            <PaoMatrix />
          </Panel>
          <Panel className="col-span-4" title="Running out" subtitle="Certificates to renew first" tone="amber">
            <ul className="flex flex-1 flex-col justify-between gap-2">
              {PAO_EXPIRING.map((entry) => (
                <ListRow key={entry.id} tone={entry.tone} title={entry.name} meta={entry.what} trailing={<StatusPill tone={entry.tone}>{entry.when}</StatusPill>} />
              ))}
            </ul>
          </Panel>
        </Grid>
      </AppFrame>
    </LookScope>
  );
}

function PeopleAndOnboardingPartSheet() {
  const board = usePaoBoard('ha');
  const person = paoFind(board.selected);
  return (
    <LookScope look="soft">
      <Canvas>
        <PaoSheet person={person} stage={board.stages[person.id] ?? person.stage} onAdvance={board.advance} />
      </Canvas>
    </LookScope>
  );
}

function PeopleAndOnboardingPartColumn() {
  const board = usePaoBoard('yt');
  return (
    <LookScope look="soft">
      <Canvas>
        <PaoColumn index={2} board={board} people={PAO_PEOPLE.filter((person) => board.stages[person.id] === 2)} />
      </Canvas>
    </LookScope>
  );
}

function PeopleAndOnboardingPartCards() {
  const board = usePaoBoard('fr');
  return (
    <LookScope look="soft">
      <Canvas>
        <ul data-tone="purple" className="flex flex-col gap-3">
          {['fr', 'jv'].map((id) => (
            <PaoCard key={id} person={paoFind(id)} stage={board.stages[id] ?? 1} selected={board.selected === id} onSelect={board.select} onAdvance={board.advance} />
          ))}
        </ul>
      </Canvas>
    </LookScope>
  );
}

function PeopleAndOnboardingPartSteps() {
  return (
    <LookScope look="soft">
      <Canvas>
        <Panel title="Safety induction" subtitle="Three of five steps done" tone="purple">
          <PaoSteps stage={1} done={3} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function PeopleAndOnboardingPartJourney() {
  return (
    <LookScope look="soft">
      <Canvas>
        <Panel title="Journey" subtitle="Done, now and still to come">
          <PaoJourney stage={2} />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function PeopleAndOnboardingPartMatrix() {
  return (
    <LookScope look="soft">
      <Canvas>
        <Panel title="Cover by crew" subtitle="Holders against the number needed on shift">
          <PaoMatrix />
        </Panel>
      </Canvas>
    </LookScope>
  );
}

function PeopleAndOnboardingPartFilter() {
  const [filter, setFilter] = useState<PaoFilter>('Maintenance');
  return (
    <LookScope look="soft">
      <Canvas>
        <Panel title="Crew filter" subtitle="Avatars carry the crew colour on every card">
          <div className="flex flex-col items-start gap-4">
            <PaoFilterSwitch filter={filter} onChange={setFilter} />
            <PaoCrewKey />
            <div className="flex -space-x-2">
              {PAO_PEOPLE.filter((person) => filter === 'all' || person.crew === filter).map((person) => (
                <span key={person.id} className="rounded-full ring-2 ring-[var(--kit-surface)]">
                  <PaoAvatar person={person} />
                </span>
              ))}
            </div>
          </div>
        </Panel>
      </Canvas>
    </LookScope>
  );
}

export default definePage({
  id: 'people-and-onboarding',
  title: 'People and onboarding',
  summary:
    'An onboarding journey as a board: five pastel columns from signed offer to signed off, a card per person, and the open profile as a sheet under the board.',
  guidance: {
    use: [
      'When the question is where each person is and who is stuck, not how a number moved.',
      'One colour family per stage and one per crew, so a card can be placed at a glance.',
      'Keep the move to the next stage on the card and in the profile; it is the main action.',
    ],
    avoid: [
      'Boards with more than five or six columns; split the journey or summarise early stages.',
      'Status colour for stages: warning is reserved for the person who is actually held up.',
      'Hiding names behind avatars only; people look for names.',
    ],
  },
  source,
  sections: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'The full board in the soft look. Open a person, move them to the next stage with the arrow, and filter by crew.',
      specimens: [
        {
          id: 'PeopleAndOnboardingSignature',
          title: 'Journey board',
          note: 'Pick it for the weekly onboarding stand-up, where a coordinator walks through who moved and who is stuck.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Canvas.tsx', 'kit/Panel.tsx', 'kit/StatusPill.tsx', 'looks/LookScope.tsx'],
          Component: PeopleAndOnboardingSignature,
        },
      ],
    },
    {
      id: 'variations',
      title: 'Variations',
      description: 'Other screens of the same product: one person in full, and whether each crew can cover its roles.',
      specimens: [
        {
          id: 'PeopleAndOnboardingProfile',
          title: 'Profile',
          note: 'Pick it for the page a mentor and a new hire look at together: competence, the journey, what is booked and which certificates are held.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/RingGauge.tsx', 'kit/Donut.tsx', 'kit/ListRow.tsx', 'kit/IconChip.tsx'],
          Component: PeopleAndOnboardingProfile,
        },
        {
          id: 'PeopleAndOnboardingReadiness',
          title: 'Crew readiness',
          note: 'Pick it for a shift supervisor who has to know that every crew carries the competences its roster requires.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/AppFrame.tsx', 'kit/Panel.tsx', 'kit/ListRow.tsx', 'kit/StatusPill.tsx'],
          Component: PeopleAndOnboardingReadiness,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces of the board on their own.',
      specimens: [
        {
          id: 'PeopleAndOnboardingPartSheet',
          title: 'Profile sheet',
          note: 'Pick it to open a selection under a board without covering it: identity, journey and the steps left.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx', 'kit/StatusPill.tsx'],
          Component: PeopleAndOnboardingPartSheet,
        },
        {
          id: 'PeopleAndOnboardingPartColumn',
          title: 'Stage column',
          note: 'Pick it for one stage of a journey: its name, its usual pace, a count and the people in it.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/StatusPill.tsx'],
          Component: PeopleAndOnboardingPartColumn,
        },
        {
          id: 'PeopleAndOnboardingPartCards',
          title: 'Person cards',
          note: 'Pick them to show a person with progress through the current stage and one action to move on.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          Component: PeopleAndOnboardingPartCards,
        },
        {
          id: 'PeopleAndOnboardingPartSteps',
          title: 'Stage checklist',
          note: 'Pick it to list what a stage consists of, done items first and quieter.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: PeopleAndOnboardingPartSteps,
        },
        {
          id: 'PeopleAndOnboardingPartJourney',
          title: 'Journey line',
          note: 'Pick it to place someone on a fixed path of a few stages.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: PeopleAndOnboardingPartJourney,
        },
        {
          id: 'PeopleAndOnboardingPartFilter',
          title: 'Crew filter',
          note: 'Pick it above a board to narrow it to one crew while the columns stay in place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: PeopleAndOnboardingPartFilter,
        },
        {
          id: 'PeopleAndOnboardingPartMatrix',
          title: 'Cover matrix',
          note: 'Pick it to compare crews against required competences, with the shortfall written in each cell.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          bleed: true,
          uses: ['kit/Panel.tsx'],
          Component: PeopleAndOnboardingPartMatrix,
        },
      ],
    },
  ],
});
