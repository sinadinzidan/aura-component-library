import { Button } from '@cognite/aura/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardHeaderEnd, CardTitle } from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Search } from '@cognite/aura/components/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconChevronLeft, IconChevronRight, IconNotebook, IconPlus } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { HandoverCard } from '../../../library/industrial/workflows/HandoverCard';
import { LogCategoryBadge } from '../../../library/industrial/workflows/LogCategoryBadge';
import { LogEntry } from '../../../library/industrial/workflows/LogEntry';
import type { LogLink } from '../../../library/industrial/workflows/LogEntry';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { SignOffSigner } from '../../../library/industrial/workflows/SignOffBlock';
import { logCategoryLabel } from '../../../library/industrial/workflows/workflow';
import type { LogCategory } from '../../../library/industrial/workflows/workflow';
import { PLANT_KPIS } from '../../data/plant';
import { definePage } from '../../types';

import source from './shift-logs.tsx?raw';

const CATEGORIES: readonly LogCategory[] = ['operations', 'safety', 'maintenance', 'environment'];

function isLogCategory(value: unknown): value is LogCategory {
  return CATEGORIES.some((category) => category === value);
}

type Entry = {
  id: string;
  shift: 'night' | 'early';
  time: string;
  author: string;
  category: LogCategory;
  text: string;
  links?: readonly LogLink[];
  pinned?: boolean;
  acknowledgedBy?: string;
};

/** The log of 12 March, early shift, and the tail of the night shift before it. */
const ENTRIES: readonly Entry[] = [
  { id: 'e1', shift: 'night', time: '02:15', author: 'Erik Moen', category: 'operations', text: 'Pigging of the export line completed. Pig received at 01:58, no debris.' },
  { id: 'e2', shift: 'night', time: '04:40', author: 'Erik Moen', category: 'maintenance', text: 'Cooling water pump handed to maintenance, isolated and tagged.', links: [{ kind: 'asset', label: '40-PA-4001' }] },
  { id: 'e3', shift: 'early', time: '06:05', author: 'Liv Wold', category: 'safety', text: 'Hot work is suspended in area NK-23 until the recompressor is back in service. No exceptions without the shift supervisor’s signature.', pinned: true, acknowledgedBy: 'Ingrid Haugen' },
  { id: 'e4', shift: 'early', time: '07:30', author: 'Ingrid Haugen', category: 'operations', text: 'Export pump A running at 412 m³/h. Pump B on standby; its standby start test is 4 days overdue.', links: [{ kind: 'work-order', label: 'WO-104458' }] },
  { id: 'e5', shift: 'early', time: '09:12', author: 'Jonas Nyberg', category: 'maintenance', text: 'Bearing temperature transmitter confirmed failed, open circuit. Alarm shelved; replacement is planned for tomorrow.', links: [{ kind: 'asset', label: '40-PA-4001' }, { kind: 'alarm', label: 'ALM-4803' }, { kind: 'work-order', label: 'WO-104479' }] },
  { id: 'e6', shift: 'early', time: '11:40', author: 'Ingrid Haugen', category: 'environment', text: 'Flaring at 12.4 kSm³/d, within permit. One 6-minute flare at 11:32 during a separator level upset.' },
  { id: 'e7', shift: 'early', time: '13:22', author: 'Ingrid Haugen', category: 'operations', text: 'Discharge temperature high on the 1st stage compressor, 146.3 °C. Reduced load by 3 %; back to 141.2 °C.', links: [{ kind: 'asset', label: '23-KA-9101' }, { kind: 'alarm', label: 'ALM-4811' }] },
  { id: 'e8', shift: 'early', time: '13:46', author: 'Ingrid Haugen', category: 'operations', text: 'Recompressor tripped on high vibration, 11.6 mm/s. Unit isolated; Tomás Barros is inspecting the drive-end bearing.', links: [{ kind: 'asset', label: '23-KA-9103' }, { kind: 'alarm', label: 'ALM-4812' }, { kind: 'work-order', label: 'WO-104482' }] },
];

const EARLY = ENTRIES.filter((entry) => entry.shift === 'early');
const NIGHT = ENTRIES.filter((entry) => entry.shift === 'night');
const TRIP_ENTRY = ENTRIES[7];
const STANDING_ENTRY = ENTRIES[2];

const SHIFTS = {
  night: { name: 'Night shift', period: '11 Mar 22:00 – 12 Mar 06:00', supervisor: 'Nora Berg' },
  early: { name: 'Early shift', period: '12 Mar 06:00 – 14:00', supervisor: 'Liv Wold' },
  late: { name: 'Late shift', period: '12 Mar 14:00 – 22:00', supervisor: 'Henrik Dahl' },
} as const;

const CREW: readonly { name: string; role: string; station: string; lead?: boolean }[] = [
  { name: 'Liv Wold', role: 'Shift supervisor', station: 'Control room', lead: true },
  { name: 'Ingrid Haugen', role: 'Control room operator', station: 'Control room' },
  { name: 'Tomás Barros', role: 'Mechanical technician', station: 'Area NK-23' },
  { name: 'Jonas Nyberg', role: 'Instrument technician', station: 'Area NK-40' },
  { name: 'Aisha Khan', role: 'Rotating equipment engineer', station: 'On call' },
];

const OUTGOING = { name: 'Liv Wold', shift: 'Early shift' };
const INCOMING = { name: 'Henrik Dahl', shift: 'Late shift' };

type OpenItem = { id: string; text: string; link: string; since: string; owner: string; carried: number };

const OPEN_ITEMS: readonly OpenItem[] = [
  { id: 'o1', text: 'Recompressor isolated after vibration trip; bearing inspection in progress', link: 'WO-104482', since: 'Today 13:46', owner: 'Tomás Barros', carried: 0 },
  { id: 'o2', text: 'Hot work suspended in area NK-23', link: 'Standing instruction', since: 'Today 06:05', owner: 'Shift supervisor', carried: 0 },
  { id: 'o3', text: 'Bearing temperature alarm shelved until transmitter is replaced', link: 'WO-104479', since: 'Today 09:12', owner: 'Jonas Nyberg', carried: 0 },
  { id: 'o4', text: 'Standby start test of export pump B overdue', link: 'WO-104458', since: '8 Mar', owner: 'Not assigned', carried: 12 },
];

const CHECKLIST: readonly { id: string; label: string; detail: string }[] = [
  { id: 'alarms', label: 'Active and shelved alarms reviewed', detail: '4 open, 1 shelved' },
  { id: 'permits', label: 'Open work permits walked through', detail: '3 permits, 1 suspended' },
  { id: 'isolations', label: 'Isolations and overrides confirmed', detail: '23-KA-9103 isolated, interlock I-2304 bypassed' },
  { id: 'instructions', label: 'Standing instructions read', detail: '1 standing instruction' },
  { id: 'targets', label: 'Production targets for the shift agreed', detail: 'Gas export 4.50 MSm³/d' },
];

const COMMENTS: readonly { id: string; author: string; time: string; text: string }[] = [
  { id: 'c1', author: 'Tomás Barros', time: '13:58', text: 'Bearing housing is hot to the touch and the oil sight glass is dark. Pulling the drive-end cover now.' },
  { id: 'c2', author: 'Aisha Khan', time: '14:06', text: 'Keep the oil sample. I want it sent for particle analysis before we close the work order.' },
];

const HANDOVER_SIGNERS: readonly SignOffSigner[] = [
  { id: 'out', role: 'Outgoing shift supervisor', name: 'Liv Wold', state: 'signed', at: '12 Mar, 13:55' },
  { id: 'in', role: 'Incoming shift supervisor', name: 'Henrik Dahl', state: 'pending' },
];

function entryFor(entry: Entry, footer?: ReactNode) {
  return (
    <LogEntry time={entry.time} author={entry.author} category={entry.category} links={entry.links} pinned={entry.pinned} acknowledgedBy={entry.acknowledgedBy} footer={footer}>
      {entry.text}
    </LogEntry>
  );
}

/** A list of entries under a sticky-style shift heading. */
function ShiftGroup({ shift, entries }: { shift: keyof typeof SHIFTS; entries: readonly Entry[] }) {
  return (
    <section className="flex flex-col gap-4">
      <h4 className="flex items-baseline justify-between gap-4 border-b border-default pb-2">
        <span className="text-sm font-medium text-base-foreground">{SHIFTS[shift].name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {SHIFTS[shift].period} · {entries.length} entries
        </span>
      </h4>
      {entries.map((entry) => (
        <div key={entry.id}>{entryFor(entry)}</div>
      ))}
    </section>
  );
}

function OpenItemList({ items }: { items: readonly OpenItem[] }) {
  return (
    <ul aria-label="Open items" className="flex w-full flex-col divide-y divide-default">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm text-base-foreground">{item.text}</span>
            <span className="text-xs text-muted-foreground">
              <span className={item.link.startsWith('WO-') ? 'font-mono' : undefined}>{item.link}</span> · {item.owner} · since {item.since}
            </span>
          </div>
          {item.carried > 0 ? (
            <StatusIndicator size="sm" tone="warning" shape="square" label={`Carried ${item.carried} shifts`} />
          ) : (
            <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">New this shift</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function ShiftLogCategories() {
  return (
    <div className="flex flex-col items-start gap-3">
      {CATEGORIES.map((category) => (
        <LogCategoryBadge key={category} category={category} />
      ))}
    </div>
  );
}

function ShiftLogCategoryCounts() {
  return (
    <ul aria-label="Entries by category, early shift" className="flex w-full max-w-56 flex-col gap-3">
      {CATEGORIES.map((category) => (
        <li key={category} className="flex items-center justify-between gap-4">
          <LogCategoryBadge category={category} />
          <ValueReadout size="xs" value={EARLY.filter((entry) => entry.category === category).length} />
        </li>
      ))}
    </ul>
  );
}

function ShiftLogCompactRows() {
  return (
    <ul aria-label="Latest entries" className="flex w-full max-w-xs flex-col gap-2">
      {EARLY.slice(-4).map((entry) => (
        <li key={entry.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline gap-2">
          <time className="text-xs text-muted-foreground tabular-nums">{entry.time}</time>
          <span className="truncate text-sm text-base-foreground">{entry.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ShiftLogEntry() {
  return <div className="w-full max-w-lg">{entryFor(ENTRIES[5])}</div>;
}

function ShiftLogEntryLinked() {
  return <div className="w-full max-w-lg">{entryFor(TRIP_ENTRY)}</div>;
}

function ShiftLogPinned() {
  return <div className="w-full max-w-lg rounded-xl bg-muted-background p-4">{entryFor({ ...STANDING_ENTRY, acknowledgedBy: undefined })}</div>;
}

function ShiftLogAcknowledged() {
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {entryFor(
        { ...STANDING_ENTRY, acknowledgedBy: acknowledged ? 'Ingrid Haugen and Henrik Dahl' : 'Ingrid Haugen' },
        acknowledged ? null : (
          <div className="flex items-center gap-3">
            <Button size="sm" variant="secondary" onClick={() => setAcknowledged(true)}>
              Acknowledge instruction
            </Button>
            <span className="text-xs text-muted-foreground">Late shift has not read this yet.</span>
          </div>
        )
      )}
    </div>
  );
}

function ShiftLogThread() {
  const [comments, setComments] = useState(COMMENTS);
  const [draft, setDraft] = useState('');
  const send = () => {
    if (draft.trim() === '') return;
    setComments((current) => [...current, { id: `c${current.length + 1}`, author: 'Liv Wold', time: '14:10', text: draft.trim() }]);
    setDraft('');
  };
  return (
    <div className="w-full max-w-lg">
      {entryFor(
        { ...TRIP_ENTRY, links: [{ kind: 'work-order', label: 'WO-104482' }] },
        <div className="flex flex-col gap-3 border-l-2 border-default pl-3">
          <span className="text-xs text-muted-foreground tabular-nums">{comments.length} comments</span>
          <ul aria-label="Comments" className="flex flex-col gap-3">
            {comments.map((comment) => (
              <li key={comment.id} className="flex items-start gap-2">
                <PersonAvatar name={comment.author} sizes="xxsm" />
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs text-muted-foreground">
                    <span className="font-medium text-base-foreground">{comment.author}</span> · <time className="tabular-nums">{comment.time}</time>
                  </span>
                  <span className="text-sm text-base-foreground">{comment.text}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Add a comment"
              placeholder="Add a comment"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => (event.key === 'Enter' ? send() : undefined)}
            />
            <Button variant="secondary" disabled={draft.trim() === ''} onClick={send}>
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShiftLogComposer() {
  const id = useId();
  const [category, setCategory] = useState<LogCategory>('operations');
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<readonly Entry[]>([]);
  const items = CATEGORIES.map((value) => ({ value, label: logCategoryLabel(value) }));
  const add = () => {
    setSaved((current) => [...current, { id: `n${current.length}`, shift: 'early', time: '14:00', author: 'Liv Wold', category, text: text.trim() }]);
    setText('');
  };
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex flex-col">
        <Label htmlFor={`${id}-text`}>New log entry</Label>
        <Textarea
          id={`${id}-text`}
          rows={3}
          placeholder="What happened, what you did, and what the next shift needs to know"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex w-44 flex-col">
          <Label htmlFor={`${id}-category`}>Category</Label>
          <Select items={items} value={category} onValueChange={(value) => (isLogCategory(value) ? setCategory(value) : undefined)}>
            <SelectTrigger id={`${id}-category`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost">
            <IconPlus /> Link asset
          </Button>
          <Button disabled={text.trim() === ''} onClick={add}>
            Add entry
          </Button>
        </div>
      </div>
      {saved.length > 0 ? (
        <div className="flex flex-col gap-4 border-t border-default pt-4">
          {saved.map((entry) => (
            <div key={entry.id}>{entryFor(entry)}</div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Entries are signed with your name and the time, and cannot be edited after handover.</p>
      )}
    </div>
  );
}

function ShiftLogSummaryHeader() {
  return (
    <div className="flex w-full flex-wrap items-start justify-between gap-x-8 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="text-xl font-semibold text-base-foreground">{SHIFTS.early.name}</h3>
        <p className="text-sm text-muted-foreground tabular-nums">Nordkapp plant · {SHIFTS.early.period}</p>
        <div className="flex items-center gap-2 pt-1">
          <PersonAvatar name={SHIFTS.early.supervisor} sizes="xsm" />
          <span className="text-sm text-base-foreground">{SHIFTS.early.supervisor}</span>
          <span className="text-sm text-muted-foreground">· Shift supervisor · crew of {CREW.length}</span>
        </div>
      </div>
      <dl className="flex gap-8">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Entries</dt>
          <dd>
            <ValueReadout value={EARLY.length} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Open items</dt>
          <dd>
            <ValueReadout value={OPEN_ITEMS.length} />
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-muted-foreground">Handover in</dt>
          <dd>
            <ValueReadout value={0} unit="min" />
          </dd>
        </div>
      </dl>
      <StatusIndicator variant="badge" tone="info" label="Handover due" />
    </div>
  );
}

function ShiftLogFilterBar() {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState<readonly LogCategory[]>(['operations']);
  const needle = query.trim().toLowerCase();
  const results = EARLY.filter((entry) => (active.length === 0 || active.includes(entry.category)) && (needle === '' || entry.text.toLowerCase().includes(needle) || entry.author.toLowerCase().includes(needle)));
  const toggle = (category: LogCategory) => setActive((current) => (current.includes(category) ? current.filter((entry) => entry !== category) : [...current, category]));
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <Search aria-label="Search the log" placeholder="Search text or author" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} />
        </div>
        <div role="group" aria-label="Filter by category" className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((category) => (
            <Button key={category} size="sm" variant={active.includes(category) ? 'secondary' : 'ghost'} aria-pressed={active.includes(category)} onClick={() => toggle(category)}>
              {logCategoryLabel(category)}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {results.length} of {EARLY.length} entries
        </span>
      </div>
      {results.length === 0 ? (
        <div className="flex items-center gap-3 border-t border-default pt-3">
          <p className="text-sm text-muted-foreground">No entries match. Try another word or clear the filters.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setActive([]);
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <ul aria-label="Matching entries" className="flex flex-col divide-y divide-default border-t border-default">
          {results.map((entry) => (
            <li key={entry.id} className="grid grid-cols-[2.5rem_7rem_minmax(0,1fr)_8rem] items-center gap-3 py-2">
              <time className="text-xs text-muted-foreground tabular-nums">{entry.time}</time>
              <LogCategoryBadge category={entry.category} />
              <span className="truncate text-sm text-base-foreground">{entry.text}</span>
              <span className="truncate text-right text-xs text-muted-foreground">{entry.author}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShiftLogFeed() {
  return (
    <div className="flex h-96 w-full flex-col gap-6 overflow-y-auto pr-2" tabIndex={0} role="region" aria-label="Shift log feed">
      <ShiftGroup shift="early" entries={[...EARLY].reverse().slice(0, 4)} />
      <ShiftGroup shift="night" entries={[...NIGHT].reverse()} />
    </div>
  );
}

function ShiftLogCrewRoster() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-base-foreground">Early shift crew</span>
        <span className="text-xs text-muted-foreground tabular-nums">{CREW.length} on shift</span>
      </div>
      <ul className="flex flex-col gap-3">
        {CREW.map((person) => (
          <li key={person.name} className="flex items-center gap-2">
            <PersonAvatar name={person.name} sizes="xsm" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">
                {person.name}
                {person.lead ? <span className="text-muted-foreground"> · Lead</span> : null}
              </span>
              <span className="truncate text-xs text-muted-foreground">{person.role}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{person.station}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShiftLogShiftPicker() {
  const order = ['night', 'early', 'late'] as const;
  const [index, setIndex] = useState(1);
  const shift = SHIFTS[order[index]];
  return (
    <div className="flex w-full max-w-lg items-center justify-between gap-4">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Previous shift" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              <IconChevronLeft />
            </Button>
          }
        />
        <TooltipContent>Previous shift</TooltipContent>
      </Tooltip>
      <div className="flex min-w-0 flex-col items-center gap-0.5 text-center" aria-live="polite">
        <span className="text-sm font-medium text-base-foreground">
          {shift.name}
          {index === 1 ? <span className="font-normal text-muted-foreground"> · current</span> : null}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">{shift.period}</span>
        <span className="text-xs text-muted-foreground">Supervisor {shift.supervisor}</span>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" aria-label="Next shift" disabled={index === order.length - 1} onClick={() => setIndex(index + 1)}>
              <IconChevronRight />
            </Button>
          }
        />
        <TooltipContent>Next shift</TooltipContent>
      </Tooltip>
    </div>
  );
}

function ShiftLogEmpty() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
      <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted-background text-muted-foreground">
        <IconNotebook aria-hidden className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">No entries on the late shift yet</p>
        <p className="text-sm text-muted-foreground">The shift started at 14:00. Log what happens as it happens, so the handover writes itself.</p>
      </div>
      <Button size="sm">
        <IconPlus /> Add entry
      </Button>
    </div>
  );
}

function ShiftLogHandoverCard() {
  return (
    <HandoverCard className="w-full max-w-lg" outgoing={OUTGOING} incoming={INCOMING} state="awaiting">
      <div className="flex flex-col gap-2">
        <p className="text-sm text-base-foreground">
          Plant is running with the recompressor isolated after a vibration trip at 13:46. Gas export is 3 % below target while the 1st stage runs at reduced load.
        </p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-base-foreground">
          <li>Do not restart the recompressor before the bearing inspection is closed.</li>
          <li>Hot work stays suspended in area NK-23.</li>
          <li>Watch 1st stage discharge temperature; reduce load above 145 °C.</li>
        </ul>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">Signed by Liv Wold at 13:55</span>
        <Button size="sm">Accept handover</Button>
      </div>
    </HandoverCard>
  );
}

function ShiftLogHandoverAccepted() {
  return (
    <HandoverCard className="w-full max-w-lg" outgoing={{ name: 'Nora Berg', shift: 'Night shift' }} incoming={OUTGOING} state="accepted" acceptedAt="12 Mar, 06:02">
      <p className="text-sm text-base-foreground">Quiet night. Export line pigged, cooling water pump handed to maintenance. No open safety items.</p>
      <SignOffBlock
        label="Handover sign-off, night to early shift"
        signers={[
          { id: 'out', role: 'Outgoing shift supervisor', name: 'Nora Berg', state: 'signed', at: '12 Mar, 05:56' },
          { id: 'in', role: 'Incoming shift supervisor', name: 'Liv Wold', state: 'signed', at: '12 Mar, 06:02' },
        ]}
      />
    </HandoverCard>
  );
}

function ShiftLogChecklist() {
  const [done, setDone] = useState<readonly string[]>(['alarms', 'permits', 'isolations']);
  const toggle = (id: string, checked: boolean) => setDone((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)));
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Handover checklist</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {done.length} of {CHECKLIST.length} done
        </span>
      </div>
      <CheckboxGroup aria-label="Handover checklist">
        {CHECKLIST.map((item) => (
          <CheckboxItem key={item.id}>
            <CheckboxItemControl checked={done.includes(item.id)} onCheckedChange={(checked) => toggle(item.id, checked)} />
            <CheckboxItemLabel>{item.label}</CheckboxItemLabel>
            <CheckboxItemDescription>{item.detail}</CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
      <p className="text-xs text-muted-foreground">
        {done.length === CHECKLIST.length ? 'All points covered. The handover can be accepted.' : 'Go through every point together before the incoming shift accepts.'}
      </p>
    </div>
  );
}

function ShiftLogOpenItems() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Open items carried over</span>
        <span className="text-xs text-muted-foreground tabular-nums">{OPEN_ITEMS.length} open · 1 carried from earlier shifts</span>
      </div>
      <OpenItemList items={OPEN_ITEMS} />
    </div>
  );
}

function ShiftLogDailyReport() {
  const figures = [
    { label: 'Gas export', kpi: PLANT_KPIS.gasExport, decimals: 2 },
    { label: 'Availability', kpi: PLANT_KPIS.availability, decimals: 1 },
    { label: 'Flaring', kpi: PLANT_KPIS.flaring, decimals: 1 },
  ];
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Daily report, 12 March 2026</CardTitle>
          <CardDescription>Nordkapp plant · three shifts · prepared by Liv Wold</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <StatusIndicator variant="badge" tone="neutral" label="Draft" />
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <dl className="grid w-full grid-cols-3 gap-4">
          {figures.map((figure) => (
            <div key={figure.label} className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{figure.label}</dt>
              <dd>
                <ValueReadout value={figure.kpi.value} unit={figure.kpi.unit} decimals={figure.decimals} />
              </dd>
              <dd className="text-xs text-muted-foreground tabular-nums">
                Target {figure.kpi.target} {figure.kpi.unit}
              </dd>
            </div>
          ))}
        </dl>
        <div className="grid w-full grid-cols-1 gap-x-8 gap-y-4 border-t border-default pt-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Main events</span>
            <ul className="flex flex-col gap-2">
              {[ENTRIES[7], ENTRIES[6], ENTRIES[4]].map((entry) => (
                <li key={entry.id} className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-2">
                  <time className="pt-0.5 text-xs text-muted-foreground tabular-nums">{entry.time}</time>
                  <span className="text-sm text-base-foreground">{entry.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Entries by category</span>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((category) => (
                <li key={category} className="flex items-center justify-between gap-4">
                  <LogCategoryBadge category={category} />
                  <ValueReadout size="xs" value={ENTRIES.filter((entry) => entry.category === category).length} />
                </li>
              ))}
            </ul>
            <p className="pt-2 text-xs text-muted-foreground">No recordable incidents. {PLANT_KPIS.daysSinceIncident.value} days since the last one.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ShiftLogSignOff() {
  const [signers, setSigners] = useState(HANDOVER_SIGNERS);
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <span className="text-sm font-medium text-base-foreground">Handover sign-off</span>
      <SignOffBlock
        label="Handover sign-off, early to late shift"
        signers={signers}
        currentSignerId="in"
        signLabel="Accept"
        onSign={(id) => setSigners((current) => current.map((signer) => (signer.id === id ? { ...signer, state: 'signed', at: '12 Mar, 14:02' } : signer)))}
      />
      <p className="text-xs text-muted-foreground">Accepting transfers responsibility for the plant to the late shift.</p>
    </div>
  );
}

function ShiftLogHandoverScreen() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-base-foreground">Handover, early to late shift</h3>
            <p className="text-sm text-muted-foreground tabular-nums">Nordkapp plant · 12 Mar 14:00</p>
          </div>
          <StatusIndicator variant="badge" tone="info" label="Awaiting acceptance" />
        </div>
        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-medium text-muted-foreground">Standing instruction</h4>
          <div className="rounded-xl bg-muted-background p-4">{entryFor(STANDING_ENTRY)}</div>
        </section>
        <section className="flex flex-col gap-2">
          <h4 className="text-xs font-medium text-muted-foreground">Open items, {OPEN_ITEMS.length}</h4>
          <OpenItemList items={OPEN_ITEMS} />
        </section>
        <section className="flex flex-col gap-4">
          <h4 className="text-xs font-medium text-muted-foreground">Last entries</h4>
          {[...EARLY].reverse().slice(0, 2).map((entry) => (
            <div key={entry.id}>{entryFor(entry)}</div>
          ))}
        </section>
      </div>
      <Card className="self-start">
        <CardHeader>
          <CardHeaderCenter>
            <CardTitle>Sign-off</CardTitle>
            <CardDescription>Both supervisors sign before responsibility transfers.</CardDescription>
          </CardHeaderCenter>
        </CardHeader>
        <CardContent>
          <ul className="flex w-full flex-col gap-2">
            {CHECKLIST.map((item, index) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-base-foreground">{item.label}</span>
                <span className={`shrink-0 text-xs ${index < 3 ? 'text-muted-foreground' : 'font-medium text-warning-foreground-strong'}`}>{index < 3 ? 'Done' : 'To do'}</span>
              </li>
            ))}
          </ul>
          <div className="w-full border-t border-default pt-4">
            <SignOffBlock label="Handover sign-off" signers={HANDOVER_SIGNERS} />
          </div>
          <div className="flex w-full flex-col gap-2">
            <Button className="w-full" disabled>
              Accept handover
            </Button>
            <p className="text-xs text-muted-foreground">Complete the 2 remaining checklist points to accept.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default definePage({
  id: 'shift-logs',
  title: 'Shift logs',
  summary:
    'The running record of a shift and the handover that closes it: timed entries with an author and a category, standing instructions that persist, open items that carry over, and a sign-off that transfers responsibility.',
  guidance: {
    use: [
      'Lead every entry with the time, then who and what kind; the text is the content.',
      'Link an entry to the asset, alarm or work order it concerns instead of retyping tags.',
      'Keep standing instructions pinned until someone withdraws them, and record who has read them.',
      'Show how long an open item has been carried, so old ones do not hide among new ones.',
    ],
    avoid: [
      'Status colours for categories — a safety entry is a kind of entry, not an alarm.',
      'Editable entries after handover; add a comment instead.',
      'An accept button that works before the checklist is complete, or with no reason when disabled.',
      'A handover note that only says "nothing to report" without the open items beside it.',
    ],
  },
  source,
  sections: [
    {
      id: 'entries',
      title: 'Entries',
      description: 'One log entry and what can hang on it: a category, links, a pin, an acknowledgement, comments.',
      specimens: [
        {
          id: 'ShiftLogCategories',
          title: 'Category badges',
          note: 'Pick one of four categories per entry; each has its own icon and a decorative colour, never a status colour.',
          origin: 'custom',
          uses: ['industrial/workflows/LogCategoryBadge.tsx'],
          Component: ShiftLogCategories,
        },
        {
          id: 'ShiftLogCategoryCounts',
          title: 'Entries by category',
          note: 'Pick it as a small summary beside a feed: how many entries of each kind this shift.',
          origin: 'custom',
          uses: ['industrial/workflows/LogCategoryBadge.tsx', 'industrial/ValueReadout.tsx'],
          align: 'stretch',
          Component: ShiftLogCategoryCounts,
        },
        {
          id: 'ShiftLogCompactRows',
          title: 'Compact rows',
          note: 'Pick it in a dashboard tile: time and one truncated line, linking to the full entry.',
          origin: 'custom',
          align: 'stretch',
          Component: ShiftLogCompactRows,
        },
        {
          id: 'ShiftLogEntry',
          title: 'Log entry',
          note: 'Pick it as the default entry: time, author, category and text.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogEntry,
        },
        {
          id: 'ShiftLogEntryLinked',
          title: 'Entry with links',
          note: 'Pick it when the entry concerns something in the plant: the asset, alarm and work order sit under the text.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogEntryLinked,
        },
        {
          id: 'ShiftLogPinned',
          title: 'Pinned standing instruction',
          note: 'Pick it for an instruction that outlives the shift: marked, on a quiet surface, kept at the top of the log.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogPinned,
        },
        {
          id: 'ShiftLogAcknowledged',
          title: 'Acknowledgement by incoming shift',
          note: 'Pick it when reading must be recorded: who has acknowledged, and a button for those who have not. Click to try.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogAcknowledged,
        },
        {
          id: 'ShiftLogThread',
          title: 'Comment thread',
          note: 'Pick it for follow-up on an entry: comments are added beneath, the entry itself stays as written.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx', 'display/PersonAvatar.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogThread,
        },
        {
          id: 'ShiftLogComposer',
          title: 'New entry composer',
          note: 'Pick it at the top of the log: text first, then category and links. Type and add an entry to try.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogComposer,
        },
      ],
    },
    {
      id: 'feed',
      title: 'Feed and tools',
      description: 'The log as a whole: its header, the filter bar, the feed grouped by shift, and who is on shift.',
      specimens: [
        {
          id: 'ShiftLogSummaryHeader',
          title: 'Shift summary header',
          note: 'Pick it above the feed: which shift, when, who leads it, and the counts that matter at handover.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ShiftLogSummaryHeader,
        },
        {
          id: 'ShiftLogFilterBar',
          title: 'Search and filter bar',
          note: 'Pick it to find an entry: free text plus category toggles, with the result count. Type or toggle to try.',
          origin: 'custom',
          uses: ['industrial/workflows/LogCategoryBadge.tsx', 'industrial/workflows/workflow.ts'],
          size: 'full',
          align: 'stretch',
          Component: ShiftLogFilterBar,
        },
        {
          id: 'ShiftLogFeed',
          title: 'Feed grouped by shift',
          note: 'Pick it as the main log view: newest first, with a heading where one shift ends and the previous begins.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: ShiftLogFeed,
        },
        {
          id: 'ShiftLogCrewRoster',
          title: 'Crew roster',
          note: 'Pick it beside the feed: who is on shift, in which role, and where they are.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          align: 'stretch',
          Component: ShiftLogCrewRoster,
        },
        {
          id: 'ShiftLogShiftPicker',
          title: 'Shift picker',
          note: 'Pick it to step between shifts: one shift at a time, with its period and supervisor.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ShiftLogShiftPicker,
        },
        {
          id: 'ShiftLogEmpty',
          title: 'Empty shift',
          note: 'Pick it at the start of a shift: say that nothing is logged yet and offer the first entry.',
          origin: 'custom',
          size: 'md',
          Component: ShiftLogEmpty,
        },
      ],
    },
    {
      id: 'handover',
      title: 'Handover',
      description: 'The note from the outgoing to the incoming shift, the checklist they walk through, and what carries over.',
      specimens: [
        {
          id: 'ShiftLogHandoverCard',
          title: 'Handover note',
          note: 'Pick it for the note itself: outgoing to incoming, the state of the plant, what to watch, and accept.',
          origin: 'custom',
          uses: ['industrial/workflows/HandoverCard.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogHandoverCard,
        },
        {
          id: 'ShiftLogHandoverAccepted',
          title: 'Accepted handover',
          note: 'Pick it in the history: the same card once both supervisors have signed, with the times.',
          origin: 'custom',
          uses: ['industrial/workflows/HandoverCard.tsx', 'industrial/workflows/SignOffBlock.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogHandoverAccepted,
        },
        {
          id: 'ShiftLogChecklist',
          title: 'Handover checklist',
          note: 'Pick it for the points both shifts go through together; each carries the figure it refers to. Tick to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ShiftLogChecklist,
        },
        {
          id: 'ShiftLogOpenItems',
          title: 'Open items carried over',
          note: 'Pick it to show what the next shift inherits, and flag items that have been carried for many shifts.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: ShiftLogOpenItems,
        },
      ],
    },
    {
      id: 'reports',
      title: 'Reports and full handover',
      description: 'The day rolled up into a report, the sign-off on its own, and the whole handover screen.',
      specimens: [
        {
          id: 'ShiftLogDailyReport',
          title: 'Daily report block',
          note: 'Pick it to roll three shifts into one page: production figures, the main events and counts by category.',
          origin: 'custom',
          uses: ['industrial/workflows/LogCategoryBadge.tsx', 'industrial/ValueReadout.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'lg',
          align: 'stretch',
          Component: ShiftLogDailyReport,
        },
        {
          id: 'ShiftLogSignOff',
          title: 'Handover sign-off',
          note: 'Pick it where responsibility transfers: who has signed, and the accept button on your own row. Click to try.',
          origin: 'custom',
          uses: ['industrial/workflows/SignOffBlock.tsx'],
          align: 'stretch',
          Component: ShiftLogSignOff,
        },
        {
          id: 'ShiftLogHandoverScreen',
          title: 'Handover screen',
          note: 'Pick it as the page both supervisors look at together: instruction, open items and last entries left, checklist and sign-off right.',
          origin: 'custom',
          uses: ['industrial/workflows/LogEntry.tsx', 'industrial/workflows/SignOffBlock.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: ShiftLogHandoverScreen,
        },
      ],
    },
  ],
});
