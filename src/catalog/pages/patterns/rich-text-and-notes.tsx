import { AlertButton } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Kbd } from '@cognite/aura/components/kbd';
import { Label } from '@cognite/aura/components/label';
import { Textarea } from '@cognite/aura/components/textarea';
import {
  IconAlertTriangle,
  IconBlockquote,
  IconBold,
  IconCircleCheck,
  IconCode,
  IconItalic,
  IconList,
  IconListNumbers,
  IconNote,
  IconPin,
  IconPlus,
} from '@cognite/aura/icons';
import { useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { CharacterCountTextarea } from '../../../library/forms/CharacterCountTextarea';
import { formatReading } from '../../../library/industrial/status';
import { ShowMore } from '../../../library/overlays/ShowMore';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { Callout } from '../../../library/patterns/content/Callout';
import { GlossaryTerm } from '../../../library/patterns/content/GlossaryTerm';
import { MarkdownPreview } from '../../../library/patterns/content/MarkdownPreview';
import { Prose } from '../../../library/patterns/content/Prose';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { TagList } from '../../../library/primitives/tag/TagList';
import { PEOPLE, SENSORS } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatDateTime, formatTime } from '../../data/series';
import { definePage } from '../../types';

import source from './rich-text-and-notes.tsx?raw';

const RICH_NOTE_OPERATOR = PEOPLE[0];
const RICH_NOTE_ENGINEER = PEOPLE[2];
const RICH_NOTE_TECHNICIAN = PEOPLE[5];
const RICH_NOTE_SUPERVISOR = PEOPLE[4];
const RICH_NOTE_VIBRATION = SENSORS[3];

const RICH_NOTE_MARKDOWN = [
  '# Recompressor restart',
  'Restart **23-KA-9103** only after the drive-end bearing is inspected under `WO-104482`.',
  '',
  '## Before start',
  '- Seal gas differential above 0.5 bar',
  '- Lube oil temperature above 35 °C',
  '',
  '1. Reset the trip at the local panel',
  '2. Start on minimum speed and hold for 10 minutes',
  '',
  '> Stop at once if vibration passes 7.1 mm/s.',
].join('\n');

const RICH_NOTE_STEPS = [
  { id: 's1', action: 'Confirm WO-104482 is signed off and the permit is closed.', expect: 'Permit status reads Closed in the permit system.' },
  { id: 's2', action: 'Open seal gas supply and check the differential pressure.', expect: 'Above 0.5 bar on 23-PDT-92571.' },
  { id: 's3', action: 'Reset the trip at the local panel, then in the control system.', expect: 'Trip lamp off, no active shutdown causes.', hold: true },
  { id: 's4', action: 'Start on minimum speed and hold for 10 minutes.', expect: 'Vibration below 4.5 mm/s and falling.' },
  { id: 's5', action: 'Ramp to 9,800 rpm at 500 rpm per minute.', expect: 'Discharge pressure 46 to 50 barg.' },
] as const;

const RICH_NOTE_CHECKS = [
  { id: 'c1', text: 'Alarm list reviewed with incoming operator' },
  { id: 'c2', text: 'Shelved alarms and reasons handed over' },
  { id: 'c3', text: 'Open permits walked through' },
  { id: 'c4', text: 'Standing instructions acknowledged' },
] as const;

const RICH_NOTE_RELEASES = [
  {
    version: '2.14',
    date: REFERENCE_NOW - 2 * DAY,
    items: [
      { kind: 'New', text: 'Shift log entries can be pinned for the next shift.' },
      { kind: 'Improved', text: 'Alarm list loads 12 months of history twice as fast.' },
      { kind: 'Fixed', text: 'Trend charts no longer drop the last hour after a time zone change.' },
    ],
  },
  {
    version: '2.13',
    date: REFERENCE_NOW - 23 * DAY,
    items: [
      { kind: 'New', text: 'Work orders show linked P&IDs in the detail panel.' },
      { kind: 'Fixed', text: 'CSV export keeps the unit column for every time series.' },
    ],
  },
] as const;

const RICH_NOTE_LOG = [
  {
    id: 'l1',
    person: RICH_NOTE_OPERATOR,
    at: REFERENCE_NOW - 14 * MINUTE,
    text: 'Recompressor tripped on high vibration at 13:46. Train running on two stages, export down to 4.1 MSm³/d.',
    pinned: true,
  },
  {
    id: 'l2',
    person: RICH_NOTE_TECHNICIAN,
    at: REFERENCE_NOW - 3 * HOUR,
    text: 'Cooler outlet transmitter 23-TT-91141 reads 2 °C high against the local gauge. Calibration requested.',
    pinned: false,
  },
  {
    id: 'l3',
    person: RICH_NOTE_SUPERVISOR,
    at: REFERENCE_NOW - 7 * HOUR,
    text: 'Night shift quiet. Export pump B standby test still overdue, planned for Thursday day shift.',
    pinned: false,
  },
] as const;

function RichNoteMarker({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-medium-background text-xs font-medium tabular-nums text-medium-foreground">
      {children}
    </span>
  );
}

function RichNoteByline({ name, when }: { name: string; when: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <PersonAvatar name={name} sizes="xsm" />
      <span className="min-w-0 truncate text-sm font-medium text-base-foreground">{name}</span>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{when}</span>
    </div>
  );
}

function RichNoteFormatted() {
  return (
    <Prose as="article">
      <h2>Recompressor restart</h2>
      <p>
        Restart <strong>23-KA-9103</strong> only after the drive-end bearing is inspected under <code>WO-104482</code>. The trip at 13:46 was
        caused by vibration, not by a process upset.
      </p>
      <h3>Before start</h3>
      <ul>
        <li>Seal gas differential above 0.5 bar</li>
        <li>Lube oil temperature above 35 °C</li>
        <li>
          Anti-surge valve in manual
          <ul>
            <li>Opening at 100%</li>
          </ul>
        </li>
      </ul>
      <h3>Start sequence</h3>
      <ol>
        <li>Reset the trip at the local panel.</li>
        <li>Start on minimum speed and hold for 10 minutes.</li>
        <li>Ramp to 9,800 rpm at 500 rpm per minute.</li>
      </ol>
      <blockquote>Stop at once if drive-end vibration passes 7.1 mm/s.</blockquote>
      <pre>
        <code>{'vibration(23-VT-92740) < 7.1 mm/s\nspeed(23-ST-92701)     >= 7000 rpm'}</code>
      </pre>
    </Prose>
  );
}

function RichNoteInlineFormats() {
  return (
    <Prose>
      <p>
        <strong>Bold</strong> for the one thing not to miss. <em>Italic</em> for a term on first use. <code>23-PT-92531</code> for tags and
        values people copy.
      </p>
      <p>
        Links go to{' '}
        <a href="#procedure" onClick={(event) => event.preventDefault()}>
          the procedure
        </a>
        , and keys look like <Kbd>Ctrl</Kbd> <Kbd>K</Kbd>.
      </p>
    </Prose>
  );
}

function RichNoteQuote() {
  return (
    <figure className="flex w-full max-w-md flex-col gap-3">
      <blockquote className="border-l-2 border-emphasized pl-4 text-base leading-7 text-base-foreground">
        The bearing shows light scoring on the loaded side. Safe to run at reduced speed until the spare arrives; not safe at full load.
      </blockquote>
      <figcaption className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-4 text-xs text-muted-foreground">
        <span className="font-medium text-base-foreground">{RICH_NOTE_ENGINEER.name}</span>
        <span>{RICH_NOTE_ENGINEER.role}</span>
        <span aria-hidden="true">·</span>
        <cite className="not-italic">
          Inspection report, <span className="font-mono">WO-104482</span>
        </cite>
      </figcaption>
    </figure>
  );
}

function RichNoteFootnotes() {
  const [focused, setFocused] = useState<number | null>(null);
  const show = (event: MouseEvent, note: number) => {
    event.preventDefault();
    setFocused(note);
  };
  const notes = [
    'ISO 20816-3, zone boundary B/C for rigid foundations.',
    'Nordkapp alarm philosophy, section 4.2: trip limits sit at least 1.5 times above the high alarm.',
  ];

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Prose>
        <p>
          The high alarm for drive-end vibration is set at 7.1 mm/s
          <sup>
            <a href="#rich-note-fn-1" aria-label="Footnote 1" onClick={(event) => show(event, 1)}>
              1
            </a>
          </sup>{' '}
          and the trip at 11.0 mm/s
          <sup>
            <a href="#rich-note-fn-2" aria-label="Footnote 2" onClick={(event) => show(event, 2)}>
              2
            </a>
          </sup>
          . Both apply to all three compressors in the train.
        </p>
      </Prose>
      <ol aria-label="Footnotes" className="flex list-none flex-col gap-1 border-t border-default pt-3 text-xs text-muted-foreground">
        {notes.map((note, index) => (
          <li
            key={note}
            id={`rich-note-fn-${index + 1}`}
            className={`flex gap-2 rounded-sm px-1 py-0.5 ${focused === index + 1 ? 'bg-medium-background text-base-foreground' : ''}`}
          >
            <span className="tabular-nums">{index + 1}.</span>
            <span>{note}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function RichNoteProseMeasure() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="max-w-[37.5rem]">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-hidden="true">
          <span className="h-px flex-1 bg-emphasized-background" />
          <span className="font-mono">600px reading measure</span>
          <span className="h-px flex-1 bg-emphasized-background" />
        </div>
      </div>
      <Prose size="base">
        <p>
          Text that people read from start to finish stays within 600 pixels, about 75 characters a line, however wide the page is. Past that
          the eye loses its place on the way back to the left edge, and procedures get skimmed instead of read.
        </p>
        <p>
          Only the text column is capped. A table, a trend or a drawing beside it may use the rest of the width; the measure is never widened
          to fill an empty page.
        </p>
      </Prose>
    </div>
  );
}

function RichNoteCard() {
  return (
    <article className="flex w-full max-w-xs flex-col gap-3 rounded-xl border border-default p-4">
      <RichNoteByline name={RICH_NOTE_TECHNICIAN.name} when={formatAgo(REFERENCE_NOW - 3 * HOUR)} />
      <p className="text-sm leading-6 text-base-foreground">
        Cooler outlet transmitter reads 2 °C high against the local gauge. Treat readings above 39 °C as uncertain until it is calibrated.
      </p>
      <TagList label="Linked to" tags={['23-TT-91141', '23-HA-9114']} size="sm" mono />
    </article>
  );
}

function RichNoteAnnotation() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">{RICH_NOTE_VIBRATION.name}</span>
        <span className="text-xl font-semibold tabular-nums text-base-foreground">
          {formatReading(RICH_NOTE_VIBRATION.value, RICH_NOTE_VIBRATION.unit, 1)}
        </span>
      </div>
      <div className="flex gap-2 rounded-lg bg-muted-background p-3">
        <IconNote aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm text-base-foreground">Step up on 10 Mar follows the coupling realignment, not a bearing fault.</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            {RICH_NOTE_ENGINEER.name} · {formatDate(REFERENCE_NOW - 2 * DAY)}
          </p>
        </div>
      </div>
    </div>
  );
}

function RichNoteChecklist() {
  const [done, setDone] = useState<readonly string[]>(['c1', 'c2']);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Handover checklist</h3>
        <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {done.length} of {RICH_NOTE_CHECKS.length} done
        </span>
      </div>
      <CheckboxGroup aria-label="Handover checklist">
        {RICH_NOTE_CHECKS.map((check) => (
          <CheckboxItem key={check.id}>
            <CheckboxItemControl
              checked={done.includes(check.id)}
              onCheckedChange={(checked) => setDone(checked ? [...done, check.id] : done.filter((id) => id !== check.id))}
            />
            <CheckboxItemLabel>{check.text}</CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
    </div>
  );
}

function RichNoteReadMore() {
  return (
    <div className="w-full max-w-md">
      <ShowMore
        moreLabel="Read more"
        lessLabel="Show less"
        summary={
          <p className="leading-6">
            Recompressor tripped on high drive-end vibration at 13:46. Train is running on two stages and export is down to 4.1 MSm³/d.
          </p>
        }
      >
        <p className="leading-6">
          Vibration rose from 6.2 to 11.6 mm/s over four minutes before the trip. No process upset was seen: suction pressure and flow were
          steady. Tomás Barros is on site for a borescope inspection of the drive-end bearing under WO-104482. Do not attempt a restart before
          the inspection is signed off.
        </p>
      </ShowMore>
    </div>
  );
}

function RichNoteGlossary() {
  return (
    <p className="w-full max-w-md text-sm leading-6 text-base-foreground">
      The <GlossaryTerm definition="Piping and instrumentation diagram: the drawing that shows equipment, pipes, valves and instruments.">P&ID</GlossaryTerm>{' '}
      shows the{' '}
      <GlossaryTerm definition="A fast valve that recycles gas to the compressor inlet when flow drops, so the compressor does not surge.">
        anti-surge valve
      </GlossaryTerm>{' '}
      downstream of the cooler. Its position is logged as a{' '}
      <GlossaryTerm definition="A time series whose value holds until the next datapoint, such as a valve state or a setpoint.">step series</GlossaryTerm>
      , so charts draw it as steps instead of a sloped line.
    </p>
  );
}

function RichNoteStandingInstruction() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <article className="flex w-full flex-col gap-3 rounded-xl border border-default p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">SI-2026-014</span>
        <Badge variant="inProgress">Active, 12 days left</Badge>
      </div>
      <h3 className="text-base font-semibold text-base-foreground">Run the 1st stage compressor below 9,900 rpm</h3>
      <p className="max-w-[37.5rem] text-sm leading-6 text-base-foreground">
        Drive-end vibration on 23-KA-9101 is close to its high limit. Keep shaft speed below 9,900 rpm and call the rotating equipment engineer
        if vibration passes 7.0 mm/s.
      </p>
      <PropertyList
        dense
        items={[
          { label: 'Valid', value: <span className="tabular-nums">10 Mar 06:00 to 24 Mar 06:00</span> },
          { label: 'Issued by', value: RICH_NOTE_SUPERVISOR.name },
          { label: 'Acknowledged', value: <span className="tabular-nums">{acknowledged ? 5 : 4} of 6 operators</span> },
        ]}
      />
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" disabled={acknowledged} onClick={() => setAcknowledged(true)}>
          Acknowledge instruction
        </Button>
        {acknowledged ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground" role="status">
            <IconCircleCheck aria-hidden="true" className="size-3.5 text-success-foreground-strong" />
            Acknowledged by you at {formatTime(REFERENCE_NOW)}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function RichNoteOperatorInstruction() {
  return (
    <section aria-label="Restart instruction" className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-base-foreground">Restart the recompressor</h3>
        <p className="text-xs text-muted-foreground">
          <span className="font-mono">23-KA-9103</span> · 5 steps · about 40 minutes
        </p>
      </div>
      <ol className="flex list-none flex-col gap-4">
        {RICH_NOTE_STEPS.map((step, index) => (
          <li key={step.id} className="flex gap-3">
            <RichNoteMarker>{index + 1}</RichNoteMarker>
            <div className="flex min-w-0 flex-col gap-1">
              <p className="text-sm font-medium leading-6 text-base-foreground">{step.action}</p>
              <p className="text-sm text-muted-foreground">Expect: {step.expect}</p>
              {'hold' in step ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-warning-foreground-strong">
                  <IconAlertTriangle aria-hidden="true" className="size-3.5" />
                  Hold point: shift supervisor confirms before the next step.
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RichNoteCalloutInfo() {
  return (
    <Callout tone="info" title="Readings are 10-minute averages">
      Values in this procedure come from the historian, not the live control system. Expect them to trail the panel by a few minutes.
    </Callout>
  );
}

function RichNoteCalloutCaution() {
  return (
    <Callout tone="caution" title="Isolate the seal gas supply first" actions={<AlertButton>Open isolation plan</AlertButton>}>
      Opening the casing drain with seal gas pressurised releases hydrocarbon gas at the drive end.
    </Callout>
  );
}

function RichNoteCalloutPlain() {
  return (
    <Callout title="Applies to all three stages">The same limits and steps hold for 23-KA-9101 and 23-KA-9102.</Callout>
  );
}

function RichNoteCalloutInText() {
  return (
    <div className="flex w-full max-w-[37.5rem] flex-col gap-4">
      <Prose>
        <h3>Reset and start</h3>
        <p>Reset the trip at the local panel, then in the control system. Both resets are needed before the start permissive clears.</p>
      </Prose>
      <Callout tone="critical" title="Do not bypass the vibration trip">
        A bypassed trip during start-up was the cause of the 2019 bearing failure. If the trip will not reset, stop and call the engineer.
      </Callout>
      <Prose>
        <p>Start on minimum speed and hold for 10 minutes while watching drive-end vibration.</p>
      </Prose>
    </div>
  );
}

function RichNoteToolbar() {
  const [text, setText] = useState('Vibration rose from 6.2 to 11.6 mm/s before the trip.');
  const area = useRef<HTMLTextAreaElement>(null);

  const wrap = (before: string, after: string = before) => {
    const element = area.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    setText(`${text.slice(0, start)}${before}${text.slice(start, end) || 'text'}${after}${text.slice(end)}`);
    element?.focus();
  };

  const prefix = (marker: string) => {
    setText(`${text}${text.endsWith('\n') || text === '' ? '' : '\n'}${marker}`);
    area.current?.focus();
  };

  return (
    <div className="flex w-full max-w-md flex-col">
      <Label htmlFor="rich-note-toolbar">Shift log entry</Label>
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-1 pb-1">
        <IconAction label="Bold" onClick={() => wrap('**')}>
          <IconBold />
        </IconAction>
        <IconAction label="Italic" onClick={() => wrap('_')}>
          <IconItalic />
        </IconAction>
        <IconAction label="Code" onClick={() => wrap('`')}>
          <IconCode />
        </IconAction>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-emphasized-background" />
        <IconAction label="Bulleted list" onClick={() => prefix('- ')}>
          <IconList />
        </IconAction>
        <IconAction label="Numbered list" onClick={() => prefix('1. ')}>
          <IconListNumbers />
        </IconAction>
        <IconAction label="Quote" onClick={() => prefix('> ')}>
          <IconBlockquote />
        </IconAction>
      </div>
      <Textarea ref={area} id="rich-note-toolbar" rows={4} value={text} onChange={(event) => setText(event.target.value)} />
      <p className="pt-2 text-xs text-muted-foreground">Buttons insert Markdown. Select text first to wrap it.</p>
    </div>
  );
}

function RichNoteComposer() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-col">
        <Label htmlFor="rich-note-composer">Note on 23-KA-9103</Label>
        <CharacterCountTextarea
          id="rich-note-composer"
          rows={3}
          placeholder="What should the next shift know?"
          value={text}
          onValueChange={setText}
          maxLength={280}
          helper="Visible to everyone with access to Gas compression."
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        {saved ? (
          <span className="mr-auto min-w-0 truncate text-xs text-muted-foreground" role="status">
            Saved: “{saved}”
          </span>
        ) : null}
        <Button variant="ghost" size="sm" disabled={text === ''} onClick={() => setText('')}>
          Discard
        </Button>
        <Button
          size="sm"
          disabled={text.trim() === '' || text.length > 280}
          onClick={() => {
            setSaved(text.trim());
            setText('');
          }}
        >
          Save note
        </Button>
      </div>
    </div>
  );
}

function RichNoteSourcePreview() {
  const [text, setText] = useState(RICH_NOTE_MARKDOWN);

  return (
    <div className="grid w-full gap-6 md:grid-cols-2">
      <div className="flex min-w-0 flex-col">
        <Label htmlFor="rich-note-source">Markdown</Label>
        <div className="font-mono">
          <Textarea id="rich-note-source" rows={14} spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="py-1 text-sm font-medium text-base-foreground">Preview</span>
        <div aria-live="polite">
          <MarkdownPreview source={text} emptyText="Write a note on the left to see it here." />
        </div>
      </div>
    </div>
  );
}

function RichNoteEmpty() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3 text-center">
      <IconNote aria-hidden="true" className="size-5 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">No notes on this asset</p>
        <p className="text-sm text-muted-foreground">Notes carry what the readings cannot: causes, workarounds and what to watch.</p>
      </div>
      <Button variant="secondary" size="sm">
        <IconPlus /> Add note
      </Button>
    </div>
  );
}

function RichNoteReleaseNotes() {
  return (
    <div className="flex w-full flex-col gap-6">
      {RICH_NOTE_RELEASES.map((release) => (
        <section key={release.version} aria-label={`Version ${release.version}`} className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-base font-semibold tabular-nums text-base-foreground">Version {release.version}</h3>
            <span className="text-xs tabular-nums text-muted-foreground">{formatDate(release.date)}</span>
          </div>
          <ul className="flex list-none flex-col gap-2">
            {release.items.map((item) => (
              <li key={item.text} className="grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-2 text-sm">
                <span>
                  <Badge variant="secondary" outline>
                    {item.kind}
                  </Badge>
                </span>
                <span className="text-base-foreground">{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function RichNoteShiftLog() {
  return (
    <ol aria-label="Shift log" className="flex w-full list-none flex-col gap-4">
      {RICH_NOTE_LOG.map((entry) => (
        <li key={entry.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <RichNoteByline name={entry.person.name} when={`${formatTime(entry.at)} · ${formatAgo(entry.at)}`} />
            {entry.pinned ? (
              <Badge variant="secondary">
                <IconPin /> Pinned
              </Badge>
            ) : null}
          </div>
          <p className="max-w-[37.5rem] pl-8 text-sm leading-6 text-base-foreground">{entry.text}</p>
        </li>
      ))}
    </ol>
  );
}

function RichNoteProcedure() {
  return (
    <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="flex min-w-0 max-w-[37.5rem] flex-col gap-4">
        <Prose size="base">
          <h2>Restart after a vibration trip</h2>
          <p>
            This procedure covers a restart of the recompressor after it has tripped on high vibration. It assumes the{' '}
            <GlossaryTerm definition="Piping and instrumentation diagram: the drawing that shows equipment, pipes, valves and instruments.">
              P&ID
            </GlossaryTerm>{' '}
            revision C line-up and a train running on two stages.
          </p>
        </Prose>
        <Callout tone="caution" title="Inspection comes first">
          Do not restart until the drive-end bearing inspection under WO-104482 is signed off by the rotating equipment engineer.
        </Callout>
        <Prose size="base">
          <h3>Steps</h3>
          <ol>
            <li>Confirm the permit is closed and the area is clear.</li>
            <li>
              Open seal gas supply; differential above <code>0.5 bar</code>.
            </li>
            <li>Reset the trip at the local panel, then in the control system.</li>
            <li>Start on minimum speed and hold for 10 minutes.</li>
          </ol>
          <blockquote>If vibration passes 7.1 mm/s at any point, stop and report.</blockquote>
          <p>
            Record the start in the shift log with peak vibration and the time to full speed
            <sup>1</sup>.
          </p>
        </Prose>
        <p className="border-t border-default pt-3 text-xs text-muted-foreground">
          <span className="tabular-nums">1.</span> Peak values feed the bearing condition model; missing entries lower its confidence.
        </p>
      </article>
      <aside aria-label="Document details" className="flex flex-col gap-4">
        <PropertyList
          layout="stacked"
          items={[
            { label: 'Document', value: <span className="font-mono text-xs">NK-OP-23-017</span> },
            { label: 'Revision', value: '4, in review' },
            { label: 'Owner', value: RICH_NOTE_ENGINEER.name },
            { label: 'Last changed', value: formatDateTime(REFERENCE_NOW - 2 * DAY) },
            { label: 'Applies to', value: <TagList label="Applies to" tags={['23-KA-9103']} size="sm" mono /> },
          ]}
        />
      </aside>
    </div>
  );
}

export default definePage({
  id: 'rich-text-and-notes',
  title: 'Rich text and notes',
  summary:
    'Text written by people: procedures, instructions, shift notes and release notes. Semantic HTML styled from tokens, a reading measure of 600px, and callouts only where a reader must not miss something.',
  guidance: {
    use: [
      'Real headings, lists and quotes, so structure survives copy, print and screen readers.',
      'A 600px cap on the text column; tables and drawings may sit outside it.',
      'Numbered steps with the expected result for anything an operator carries out.',
      'An author and a time on every note, and a validity period on every standing instruction.',
    ],
    avoid: [
      'More than one callout per screen of text: the second one teaches people to skip both.',
      'Bold, colour or capitals for emphasis inside instructions; restructure the sentence instead.',
      'Rendering stored text as HTML. Parse it to elements so pasted markup stays text.',
      'Hiding safety-relevant text behind "Read more".',
    ],
  },
  source,
  sections: [
    {
      id: 'formatted',
      title: 'Formatted text',
      description: 'What prose looks like: block elements, inline formats, quotes, footnotes and the reading measure.',
      specimens: [
        {
          id: 'RichNoteFormatted',
          title: 'Formatted note',
          note: 'Any text with structure: headings, nested lists, a quote and code, all from one wrapper around plain HTML.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/Prose.tsx'],
          Component: RichNoteFormatted,
        },
        {
          id: 'RichNoteInlineFormats',
          title: 'Inline formats',
          note: 'The five inline treatments and what each is for; anything else is noise.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/Prose.tsx'],
          Component: RichNoteInlineFormats,
        },
        {
          id: 'RichNoteQuote',
          title: 'Quote with citation',
          note: 'Someone else’s words, such as an inspection finding: who said it and where it is recorded.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: RichNoteQuote,
        },
        {
          id: 'RichNoteFootnotes',
          title: 'Footnotes',
          note: 'Sources and standards that back a number without interrupting the sentence. Select a marker to find its note.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/Prose.tsx'],
          Component: RichNoteFootnotes,
        },
        {
          id: 'RichNoteProseMeasure',
          title: 'Reading measure',
          note: 'On a wide page the text column still stops at 600px; the rest of the row is for companion content.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/content/Prose.tsx'],
          Component: RichNoteProseMeasure,
        },
      ],
    },
    {
      id: 'notes',
      title: 'Notes and instructions',
      description: 'Short texts attached to equipment, values and shifts.',
      specimens: [
        {
          id: 'RichNoteCard',
          title: 'Note card',
          note: 'One note in a list or on an asset page: who, when, the text and what it is linked to.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx', 'primitives/tag/TagList.tsx'],
          Component: RichNoteCard,
        },
        {
          id: 'RichNoteAnnotation',
          title: 'Annotation on a value',
          note: 'When a reading needs context to be read correctly: the note sits directly under the number.',
          origin: 'custom',
          align: 'stretch',
          uses: ['industrial/status.ts'],
          Component: RichNoteAnnotation,
        },
        {
          id: 'RichNoteChecklist',
          title: 'Checklist note',
          note: 'A short routine people tick off, such as a handover; the count shows what is left.',
          origin: 'custom',
          align: 'stretch',
          Component: RichNoteChecklist,
        },
        {
          id: 'RichNoteReadMore',
          title: 'Read more',
          note: 'Long log entries in a list: the first sentences carry the message, the detail opens in place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/ShowMore.tsx'],
          Component: RichNoteReadMore,
        },
        {
          id: 'RichNoteGlossary',
          title: 'Glossary terms in text',
          note: 'Jargon a new reader will not know: the term explains itself on hover and keyboard focus.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/GlossaryTerm.tsx'],
          Component: RichNoteGlossary,
        },
        {
          id: 'RichNoteStandingInstruction',
          title: 'Standing instruction',
          note: 'A temporary operating rule: its validity, who issued it and who has acknowledged it are part of the note.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/PropertyList.tsx'],
          Component: RichNoteStandingInstruction,
        },
        {
          id: 'RichNoteOperatorInstruction',
          title: 'Operator instruction',
          note: 'Steps someone carries out in order: one action each, the expected result, and hold points marked in words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: RichNoteOperatorInstruction,
        },
      ],
    },
    {
      id: 'callouts',
      title: 'Callouts',
      description: 'Asides the reader must not miss, built on Alert and announced as notes.',
      specimens: [
        {
          id: 'RichNoteCalloutInfo',
          title: 'Information callout',
          note: 'Context that changes how the surrounding text should be read, with no risk attached.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/Callout.tsx'],
          Component: RichNoteCalloutInfo,
        },
        {
          id: 'RichNoteCalloutCaution',
          title: 'Caution callout',
          note: 'A step that can hurt people or equipment if done in the wrong order; one action may follow.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/Callout.tsx'],
          Component: RichNoteCalloutCaution,
        },
        {
          id: 'RichNoteCalloutInText',
          title: 'Callout inside a procedure',
          note: 'Placed directly before the step it applies to, inside the reading measure, never collected at the top.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/Callout.tsx', 'patterns/content/Prose.tsx'],
          Component: RichNoteCalloutInText,
        },
        {
          id: 'RichNoteCalloutPlain',
          title: 'Plain note',
          note: 'A neutral aside about scope or applicability that needs no colour.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/Callout.tsx'],
          Component: RichNoteCalloutPlain,
        },
      ],
    },
    {
      id: 'writing',
      title: 'Writing',
      description: 'Entering notes: a plain composer, formatting buttons and Markdown with a live preview.',
      specimens: [
        {
          id: 'RichNoteToolbar',
          title: 'Formatting toolbar',
          note: 'For people who do not know Markdown: buttons insert the markers, the text stays plain and portable.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/IconAction.tsx'],
          Component: RichNoteToolbar,
        },
        {
          id: 'RichNoteComposer',
          title: 'Note composer',
          note: 'Short notes with a soft length limit; the helper says who will see it before it is saved.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/CharacterCountTextarea.tsx'],
          Component: RichNoteComposer,
        },
        {
          id: 'RichNoteSourcePreview',
          title: 'Markdown source and preview',
          note: 'Longer documents written in Markdown: source and result side by side, updated as people type.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/MarkdownPreview.tsx', 'patterns/content/parseMarkdown.ts', 'patterns/content/Prose.tsx'],
          Component: RichNoteSourcePreview,
        },
        {
          id: 'RichNoteEmpty',
          title: 'No notes yet',
          note: 'An empty notes section says what notes are for and offers the first one.',
          origin: 'custom',
          align: 'stretch',
          Component: RichNoteEmpty,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Lists and full documents',
      description: 'Many notes together, and a complete procedure page.',
      specimens: [
        {
          id: 'RichNoteReleaseNotes',
          title: 'Release notes',
          note: 'What changed per version: a labelled kind for each line, newest version first.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: RichNoteReleaseNotes,
        },
        {
          id: 'RichNoteShiftLog',
          title: 'Shift log',
          note: 'Notes in time order with author and clock time; pinned entries carry over to the next shift.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: RichNoteShiftLog,
        },
        {
          id: 'RichNoteProcedure',
          title: 'Procedure document',
          note: 'A full operating procedure: prose in the reading measure, one caution, steps, a footnote and document facts beside it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/content/Prose.tsx',
            'patterns/content/Callout.tsx',
            'patterns/content/GlossaryTerm.tsx',
            'primitives/tag/TagList.tsx',
            'patterns/structure/PropertyList.tsx',
          ],
          Component: RichNoteProcedure,
        },
      ],
    },
  ],
});
