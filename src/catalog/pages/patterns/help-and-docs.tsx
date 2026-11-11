import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@cognite/aura/components/accordion';
import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { CodeBlock, CodeBlockCopyButton } from '@cognite/aura/components/code-block';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { ItemGroup } from '@cognite/aura/components/item';
import { Label } from '@cognite/aura/components/label';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverHeaderContent,
  PopoverSlot,
  PopoverTitle,
  PopoverTrigger,
} from '@cognite/aura/components/popover';
import { Search } from '@cognite/aura/components/search';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconAlertTriangle,
  IconApi,
  IconArrowRight,
  IconBook,
  IconChartLine,
  IconCircleCheck,
  IconClock,
  IconDatabase,
  IconExternalLink,
  IconFileText,
  IconHelp,
  IconKeyboard,
  IconLifebuoy,
  IconPlugConnected,
  IconRocket,
  IconServer,
  IconThumbDown,
  IconThumbUp,
  IconTimeline,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { MetadataList } from '../../../library/display/MetadataList';
import { FormField } from '../../../library/forms/FormField';
import { UnitNumberInput } from '../../../library/forms/UnitNumberInput';
import { InfoTooltip } from '../../../library/overlays/InfoTooltip';
import { EntityCard } from '../../../library/patterns/collections/EntityCard';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import type { ShortcutGroup } from '../../../library/patterns/content/filterShortcuts';
import { GlossaryTerm } from '../../../library/patterns/content/GlossaryTerm';
import { Prose } from '../../../library/patterns/content/Prose';
import { ShortcutSheet } from '../../../library/patterns/content/ShortcutSheet';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { Step } from '../../../library/primitives/stepper/Step';
import { Stepper } from '../../../library/primitives/stepper/Stepper';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './help-and-docs.tsx?raw';

const HELP_DOC_LINK =
  'inline-flex items-center gap-1 rounded-sm text-sm font-medium text-link-foreground outline-none hover:text-link-foreground-hover hover:underline focus-visible:shadow-focus-ring [&>svg]:size-3.5';

const helpDocStay = (event: MouseEvent) => event.preventDefault();

const HELP_DOC_TOPICS = [
  { id: 'ack', title: 'Acknowledge and shelve alarms', detail: 'Alarms · 3 min read', Icon: IconFileText },
  { id: 'trend', title: 'Compare time series in a trend', detail: 'Charts · 4 min read', Icon: IconChartLine },
  { id: 'upload', title: 'Upload and link engineering documents', detail: 'Files · 5 min read', Icon: IconFileText },
  { id: 'wo', title: 'Create a work order from an alarm', detail: 'Maintenance · 2 min read', Icon: IconFileText },
  { id: 'quality', title: 'What uncertain and bad quality mean', detail: 'Time series · 3 min read', Icon: IconTimeline },
  { id: 'export', title: 'Export datapoints to CSV', detail: 'Time series · 2 min read', Icon: IconTimeline },
] as const;

const HELP_DOC_FAQ = [
  {
    id: 'delay',
    question: 'Why is the latest value a few minutes old?',
    answer:
      'Values come from the plant historian through an extractor that sends a batch every minute. The time under each reading says when it was measured, not when you opened the page.',
  },
  {
    id: 'shelve',
    question: 'What is the difference between acknowledging and shelving an alarm?',
    answer:
      'Acknowledging says you have seen it; the alarm stays in the list until it clears. Shelving hides it for a set time and needs a reason, which the next shift can read.',
  },
  {
    id: 'access',
    question: 'Why can I see an asset but not its documents?',
    answer:
      'Access follows data sets. Assets and their files can sit in different data sets. Ask the owner of Engineering documents for read access.',
  },
  {
    id: 'units',
    question: 'Can I change the units?',
    answer: 'Units follow the source system. Charts can convert pressure and temperature for display under View, Units; stored values do not change.',
  },
] as const;

const HELP_DOC_SHORTCUTS: readonly ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { id: 'palette', label: 'Open command palette', keys: ['mod', 'K'] },
      { id: 'search', label: 'Search this page', keys: ['/'] },
      { id: 'help', label: 'Show keyboard shortcuts', keys: ['?'] },
      { id: 'close', label: 'Close panel or dialog', keys: ['esc'] },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { id: 'alarms', label: 'Go to alarms', keys: ['G', 'A'], mode: 'sequence' },
      { id: 'orders', label: 'Go to work orders', keys: ['G', 'W'], mode: 'sequence' },
      { id: 'next', label: 'Next row', keys: ['down'] },
      { id: 'previous', label: 'Previous row', keys: ['up'] },
    ],
  },
  {
    title: 'Alarms',
    shortcuts: [
      { id: 'ack', label: 'Acknowledge selected alarm', keys: ['A'] },
      { id: 'shelve', label: 'Shelve selected alarm', keys: ['shift', 'S'] },
      { id: 'trend', label: 'Open trend for alarm', keys: ['T'] },
    ],
  },
  {
    title: 'Charts',
    shortcuts: [
      { id: 'zoom-in', label: 'Zoom in', keys: ['+'] },
      { id: 'zoom-out', label: 'Zoom out', keys: ['-'] },
      { id: 'pan', label: 'Pan back and forward', keys: ['left'] },
      { id: 'reset', label: 'Reset time range', keys: ['mod', '0'] },
    ],
  },
];

const HELP_DOC_GLOSSARY = [
  { term: 'Asset', definition: 'A piece of equipment or a location in the plant hierarchy, such as a compressor or an area.' },
  { term: 'Data set', definition: 'A container that groups data from one source and decides who can read and write it.' },
  { term: 'External ID', definition: 'The identifier a record has in its source system. Stable across re-imports.' },
  { term: 'Extractor', definition: 'A service that reads from a source system and writes into the platform.' },
  { term: 'Time series', definition: 'Timestamped values from one sensor or calculation, addressed by its tag.' },
  { term: 'Transformation', definition: 'A scheduled query that reshapes raw data into the data model.' },
] as const;

const HELP_DOC_STATUS = [
  { id: 'api', name: 'API', state: 'ok', detail: 'Operational' },
  { id: 'ingestion', name: 'Datapoint ingestion', state: 'degraded', detail: 'Delayed up to 5 minutes since 13:20 UTC' },
  { id: 'files', name: 'Files and documents', state: 'ok', detail: 'Operational' },
  { id: 'functions', name: 'Functions', state: 'planned', detail: 'Maintenance planned 14 Mar, 02:00 to 03:00 UTC' },
] as const;

const HELP_DOC_STATUS_BADGE = {
  ok: { label: 'Operational', variant: 'success', Icon: IconCircleCheck },
  degraded: { label: 'Degraded', variant: 'warning', Icon: IconAlertTriangle },
  planned: { label: 'Maintenance', variant: 'inProgress', Icon: IconClock },
} as const;

const HELP_DOC_CHANGES = [
  { id: 'c1', date: REFERENCE_NOW - 2 * DAY, title: 'Pin shift log entries for the next shift', kind: 'New' },
  { id: 'c2', date: REFERENCE_NOW - 2 * DAY, title: 'Alarm history loads twice as fast', kind: 'Improved' },
  { id: 'c3', date: REFERENCE_NOW - 9 * DAY, title: 'Linked P&IDs in the work order panel', kind: 'New' },
  { id: 'c4', date: REFERENCE_NOW - 23 * DAY, title: 'CSV export keeps the unit column', kind: 'Fixed' },
] as const;

const HELP_DOC_CURL = [
  'curl "https://api.nordkapp.example.test/v1/projects/nordkapp/timeseries/data/latest" \\',
  '  -H "Authorization: Bearer $TOKEN" \\',
  '  -H "Content-Type: application/json" \\',
  '  -d \'{ "items": [{ "externalId": "23-PT-92531", "before": "now" }] }\'',
].join('\n');

const HELP_DOC_FLOW = [
  { id: 'source', title: 'Source system', text: 'The historian records 23-PT-92531 every second.', Icon: IconServer },
  { id: 'extractor', title: 'Extractor', text: 'Reads new values each minute and sends them as a batch.', Icon: IconPlugConnected },
  { id: 'dataset', title: 'Data set', text: 'Stores the time series and decides who can read it.', Icon: IconDatabase },
  { id: 'app', title: 'This app', text: 'Shows the latest value, its limits and its trend.', Icon: IconChartLine },
] as const;

const HELP_DOC_GUIDE = [
  { id: 'g1', title: 'Connect a source system', time: '10 min', done: true },
  { id: 'g2', title: 'Map tags to the asset hierarchy', time: '15 min', done: true },
  { id: 'g3', title: 'Set operating limits', time: '5 min', done: false },
  { id: 'g4', title: 'Invite the control room team', time: '2 min', done: false },
] as const;

function HelpDocLinkRow({ title, detail, external = false }: { title: string; detail: string; external?: boolean }) {
  return (
    <li className="flex items-baseline justify-between gap-4 border-b border-default py-2 last:border-b-0">
      <a href="#docs" className={HELP_DOC_LINK} onClick={helpDocStay}>
        {title}
        {external ? <IconExternalLink aria-label="Opens in a new tab" /> : <IconArrowRight aria-hidden="true" />}
      </a>
      <span className="shrink-0 text-xs text-muted-foreground">{detail}</span>
    </li>
  );
}

function HelpDocInlineHelpText() {
  const [limit, setLimit] = useState<number | null>(7.1);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <FormField
        label={
          <span className="inline-flex items-center gap-1">
            High alarm limit
            <InfoTooltip label="About the high alarm limit">Raises a high-severity alarm. The trip limit is set separately by the safety system.</InfoTooltip>
          </span>
        }
        helper={
          <>
            ISO 20816-3 puts the boundary for this machine class at 7.1 mm/s.{' '}
            <a href="#limits" className={HELP_DOC_LINK} onClick={helpDocStay}>
              How limits are chosen
            </a>
          </>
        }
      >
        {(control) => <UnitNumberInput {...control} unit="mm/s" value={limit} onValueChange={setLimit} min={0} max={15} step={0.1} />}
      </FormField>
    </div>
  );
}

function HelpDocLearnMoreRows() {
  return (
    <div className="flex w-full flex-col gap-2">
      <SectionHeader title="Learn more" size="sm" as="h3" />
      <ul className="flex list-none flex-col">
        <HelpDocLinkRow title="Alarm severities and what they trigger" detail="3 min read" />
        <HelpDocLinkRow title="Shelving rules at Nordkapp" detail="2 min read" />
        <HelpDocLinkRow title="Alarm management standard" detail="ISA 18.2" external />
      </ul>
    </div>
  );
}

function HelpDocContextualPopover() {
  return (
    <div className="flex items-center gap-1 text-sm text-base-foreground">
      Health score
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Explain health score">
              <IconHelp />
            </Button>
          }
        />
        <PopoverContent className="w-72">
          <PopoverHeader>
            <PopoverHeaderContent>
              <PopoverTitle>Health score</PopoverTitle>
              <PopoverClose />
            </PopoverHeaderContent>
            <PopoverDescription>
              A number from 0 to 100 that combines vibration, temperature and run hours over the last 30 days. Below 70 the asset is put on watch.
            </PopoverDescription>
          </PopoverHeader>
          <PopoverSlot>
            <a href="#health" className={HELP_DOC_LINK} onClick={helpDocStay}>
              How the score is calculated <IconArrowRight aria-hidden="true" />
            </a>
          </PopoverSlot>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function HelpDocInfoTooltip() {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="flex items-center gap-1 text-sm text-base-foreground">
        MTBF
        <InfoTooltip label="About MTBF">Mean time between failures: run hours divided by the number of trips this year.</InfoTooltip>
      </span>
      <p className="max-w-56 text-center text-sm text-muted-foreground">
        Or define the term where it is read:{' '}
        <GlossaryTerm definition="Mean time between failures: run hours divided by the number of trips this year.">MTBF</GlossaryTerm> is 412 h.
      </p>
    </div>
  );
}

function HelpDocHelpMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <IconHelp /> Help
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <IconBook /> Documentation
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconKeyboard /> Keyboard shortcuts
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconRocket /> What is new
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <IconLifebuoy /> Contact support
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HelpDocPanel() {
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();
  const topics = HELP_DOC_TOPICS.filter((topic) => `${topic.title} ${topic.detail}`.toLowerCase().includes(needle));

  return (
    <div className="h-[30rem] w-full">
      <SidePanel
        title="Help"
        description={opened ? `Opened: ${opened}` : 'Answers for the alarms page'}
        onClose={() => undefined}
        closeLabel="Close help"
        flush
        toolbar={
          <div className="px-4 pb-3">
            <Search
              aria-label="Search help"
              placeholder="Search help"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onClear={() => setQuery('')}
            />
          </div>
        }
        footer={
          <Button variant="ghost" size="sm">
            <IconLifebuoy /> Contact support
          </Button>
        }
      >
        {topics.length > 0 ? (
          <div className="flex flex-col gap-1 px-2 pb-2">
            <p className="px-2 pt-2 text-xs font-medium text-muted-foreground">{needle === '' ? 'Popular topics' : `${topics.length} results`}</p>
            <ItemGroup aria-label="Help topics">
              {topics.map((topic) => (
                <EntityRow
                  key={topic.id}
                  leading={<topic.Icon />}
                  title={topic.title}
                  description={topic.detail}
                  onOpen={() => setOpened(topic.title)}
                />
              ))}
            </ItemGroup>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            <p className="text-sm font-medium text-base-foreground">No help articles match “{query.trim()}”</p>
            <p className="text-sm text-muted-foreground">Try the name of the page you are on, or ask support.</p>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

function HelpDocFaq() {
  return (
    <Accordion collapsible defaultValue="delay" className="w-full">
      {HELP_DOC_FAQ.map((entry) => (
        <AccordionItem key={entry.id} value={entry.id}>
          <AccordionTrigger>{entry.question}</AccordionTrigger>
          <AccordionContent>{entry.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function HelpDocGlossaryList() {
  return (
    <dl className="flex w-full flex-col">
      {HELP_DOC_GLOSSARY.map((entry) => (
        <div key={entry.term} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 border-b border-default py-2 text-sm last:border-b-0">
          <dt className="font-medium text-base-foreground">{entry.term}</dt>
          <dd className="text-muted-foreground">{entry.definition}</dd>
        </div>
      ))}
    </dl>
  );
}

function HelpDocEmptySearch() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">No help articles match “antisurge map”</p>
        <p className="text-sm text-muted-foreground">Check the spelling, try fewer words, or start from one of these.</p>
      </div>
      <ul className="flex list-none flex-col">
        <HelpDocLinkRow title="Anti-surge control overview" detail="Closest match" />
        <HelpDocLinkRow title="Compare time series in a trend" detail="Popular" />
        <HelpDocLinkRow title="Browse all topics" detail="42 articles" />
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm">
          <IconLifebuoy /> Ask support
        </Button>
        <span className="text-xs text-muted-foreground">Your search is attached, so you do not have to repeat it.</span>
      </div>
    </div>
  );
}

function HelpDocShortcutSheet() {
  const [query, setQuery] = useState('');

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full max-w-xs">
        <Search
          aria-label="Search shortcuts"
          placeholder="Search shortcuts"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
        />
      </div>
      <ShortcutSheet groups={HELP_DOC_SHORTCUTS} query={query} platform="other" columns={2} />
    </div>
  );
}

function HelpDocShortcutInline() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ShortcutSheet groups={HELP_DOC_SHORTCUTS.slice(2, 3)} platform="other" />
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        Press <ShortcutHint keys={['?']} platform="other" /> for all shortcuts.
      </p>
    </div>
  );
}

function HelpDocApiSnippet() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            <span className="font-mono">POST</span>
          </Badge>
          <code className="min-w-0 break-all font-mono text-sm text-base-foreground">/v1/projects/{'{project}'}/timeseries/data/latest</code>
        </div>
        <p className="max-w-[37.5rem] text-sm text-muted-foreground">
          Returns the newest datapoint for each time series, at or before a given time. Needs read access to the data set.
        </p>
      </div>
      <Table label="Request body fields">
        <TableHeader>
          <TableRow>
            <TableHead>Field</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell rowHeader mono className="align-top">
              externalId
            </TableCell>
            <TableCell muted wrap="nowrap" className="align-top">
              <span className="text-xs">string, required</span>
            </TableCell>
            <TableCell className="align-top">The tag of the time series, for example 23-PT-92531.</TableCell>
          </TableRow>
          <TableRow>
            <TableCell rowHeader mono className="align-top">
              before
            </TableCell>
            <TableCell muted wrap="nowrap" className="align-top">
              <span className="text-xs">string, optional</span>
            </TableCell>
            <TableCell className="align-top">Latest time to look at. Defaults to now.</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <CodeBlock code={HELP_DOC_CURL} language="bash">
        <Tooltip>
          <TooltipTrigger render={<CodeBlockCopyButton aria-label="Copy request" />} />
          <TooltipContent>Copy request</TooltipContent>
        </Tooltip>
      </CodeBlock>
    </div>
  );
}

function HelpDocArticleFeedback() {
  const [answer, setAnswer] = useState<'yes' | 'no' | null>(null);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <p className="text-sm font-medium text-base-foreground">Was this article helpful?</p>
      {answer === null ? (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAnswer('yes')}>
            <IconThumbUp /> Yes
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnswer('no')}>
            <IconThumbDown /> No
          </Button>
        </div>
      ) : answer === 'yes' ? (
        <p className="text-sm text-muted-foreground" role="status">
          Thanks. That tells us to keep it as it is.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <Label htmlFor="help-doc-feedback">What was missing?</Label>
          <Textarea id="help-doc-feedback" rows={2} placeholder="One sentence is enough" />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAnswer('yes')}>
              Send feedback
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setAnswer(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function HelpDocHowItWorks() {
  return (
    <div className="flex w-full flex-col gap-4">
      <h3 className="text-base font-semibold text-base-foreground">How a reading gets here</h3>
      <ol aria-label="How a reading travels from the sensor to this app, in four steps" className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HELP_DOC_FLOW.map((step, index) => (
          <li key={step.id} className="relative flex flex-col gap-3 rounded-xl bg-muted-background p-4">
            <div className="flex items-center justify-between">
              <span className="flex size-9 items-center justify-center rounded-lg bg-base-background text-medium-foreground">
                <step.Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="text-2xl font-semibold tabular-nums text-muted-foreground">{index + 1}</span>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-base-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </div>
            {index < HELP_DOC_FLOW.length - 1 ? (
              <IconArrowRight
                aria-hidden="true"
                className="absolute -right-4 top-1/2 z-10 hidden size-4 -translate-y-1/2 translate-x-0 text-muted-foreground lg:block"
              />
            ) : null}
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">End to end this takes about one minute, which is why the latest value is never quite live.</p>
    </div>
  );
}

function HelpDocCardGrid() {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-3">
      <EntityCard
        title="Get started"
        description="Connect a source and see your first trend"
        icon={<IconRocket />}
        footerNote="6 guides · 30 min"
        footerActions={
          <Button variant="secondary" size="sm">
            Open guides
          </Button>
        }
      />
      <EntityCard
        title="Working with alarms"
        description="Severities, shelving and handover"
        icon={<IconBook />}
        footerNote="9 articles"
        footerActions={
          <Button variant="secondary" size="sm">
            Read articles
          </Button>
        }
      />
      <EntityCard
        title="API reference"
        description="Endpoints, SDKs and examples"
        icon={<IconApi />}
        footerNote="For developers"
        footerActions={
          <Button variant="secondary" size="sm">
            Open reference <IconExternalLink />
          </Button>
        }
      />
    </div>
  );
}

function HelpDocGettingStarted() {
  const remaining = HELP_DOC_GUIDE.filter((step) => !step.done).length;

  return (
    <div className="flex w-full flex-col gap-4">
      <SectionHeader title="Getting started" description={`${remaining} of ${HELP_DOC_GUIDE.length} steps left, about 7 minutes`} size="sm" as="h3" />
      <Stepper label="Getting started" orientation="vertical" size="sm" current={HELP_DOC_GUIDE.findIndex((step) => !step.done)}>
        {HELP_DOC_GUIDE.map((step) => (
          <Step key={step.id} label={step.title} meta={step.time} />
        ))}
      </Stepper>
      <Button variant="secondary" size="sm" className="self-start">
        Continue with step 3
      </Button>
    </div>
  );
}

function HelpDocChangelog() {
  return (
    <div className="flex w-full flex-col gap-2">
      <SectionHeader
        title="What is new"
        size="sm"
        as="h3"
        actions={
          <a href="#changelog" className={HELP_DOC_LINK} onClick={helpDocStay}>
            Full changelog <IconArrowRight aria-hidden="true" />
          </a>
        }
      />
      <ul className="flex list-none flex-col">
        {HELP_DOC_CHANGES.map((change) => (
          <li key={change.id} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-default py-2 text-sm last:border-b-0">
            <span className="text-xs tabular-nums text-muted-foreground">{formatDate(change.date)}</span>
            <span className="text-base-foreground">{change.title}</span>
            <Badge variant="secondary" outline>
              {change.kind}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HelpDocArticleHeader() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Alarms</span>
        <h3 className="text-2xl font-semibold tracking-tight text-base-foreground">Acknowledge and shelve alarms</h3>
        <MetadataList
          layout="inline"
          items={[
            { label: 'Reading time', value: '3 min' },
            { label: 'Updated', value: formatDate(REFERENCE_NOW - 9 * DAY) },
            { label: 'Applies to', value: 'Control room operators' },
          ]}
        />
      </div>
      <Prose size="base">
        <p>
          Acknowledging tells the team you have seen an alarm. Shelving hides it for a set time while the cause is being worked on. Both leave a
          trace in the alarm history, and neither clears the alarm.
        </p>
      </Prose>
    </div>
  );
}

function HelpDocOnThisPage() {
  const [current, setCurrent] = useState('shelve');
  const headings = [
    { id: 'ack', label: 'Acknowledge an alarm' },
    { id: 'shelve', label: 'Shelve an alarm' },
    { id: 'reasons', label: 'Shelving reasons' },
    { id: 'handover', label: 'What the next shift sees' },
  ];

  return (
    <nav aria-label="On this page" className="flex w-full max-w-56 flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">On this page</span>
      <ul className="flex list-none flex-col border-l border-default">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              aria-current={heading.id === current ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault();
                setCurrent(heading.id);
              }}
              className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-muted-foreground outline-none hover:text-base-foreground focus-visible:shadow-focus-ring aria-[current=location]:border-base-foreground aria-[current=location]:font-medium aria-[current=location]:text-base-foreground"
            >
              {heading.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function HelpDocSupportCard() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-medium-background text-medium-foreground">
          <IconLifebuoy aria-hidden="true" className="size-5" />
        </span>
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-base-foreground">Contact support</h3>
          <p className="text-xs text-muted-foreground">Weekdays 07:00 to 17:00 CET</p>
        </div>
      </div>
      <MetadataList
        items={[
          { label: 'Production down', value: 'Within 30 min' },
          { label: 'Other requests', value: 'Within 1 working day' },
        ]}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate font-mono text-xs text-base-foreground">support@nordkapp.example.test</span>
        <CopyButton variant="ghost" size="icon-sm" text="support@nordkapp.example.test" label="Copy support email" iconOnly />
      </div>
      <Button variant="secondary" className="w-full">
        Open a support request
      </Button>
    </div>
  );
}

function HelpDocStatusSummary() {
  const healthy = HELP_DOC_STATUS.filter((service) => service.state === 'ok').length;

  return (
    <div className="flex w-full flex-col gap-3">
      <SectionHeader
        title="Service status"
        description={`${healthy} of ${HELP_DOC_STATUS.length} services operational · Updated ${formatAgo(REFERENCE_NOW - 2 * MINUTE)}`}
        size="sm"
        as="h3"
        actions={
          <a href="#status" className={HELP_DOC_LINK} onClick={helpDocStay}>
            Status page <IconExternalLink aria-label="Opens in a new tab" />
          </a>
        }
      />
      <ul aria-label="Services" className="flex list-none flex-col">
        {HELP_DOC_STATUS.map((service) => {
          const badge = HELP_DOC_STATUS_BADGE[service.state];
          return (
            <li key={service.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-default py-2 last:border-b-0">
              <div className="flex min-w-0 flex-col">
                <span className="text-sm font-medium text-base-foreground">{service.name}</span>
                {service.state === 'ok' ? null : <span className="text-xs tabular-nums text-muted-foreground">{service.detail}</span>}
              </div>
              <Badge variant={badge.variant}>
                <badge.Icon /> {badge.label}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function HelpDocIncidentNotice() {
  return (
    <Alert variant="warning">
      <AlertTitle>Datapoints are arriving up to 5 minutes late</AlertTitle>
      <AlertDescription>
        Ingestion has been degraded since {formatDateTime(REFERENCE_NOW - 40 * MINUTE)} UTC. Latest values and alarms may trail the control system.
        Nothing is lost.
      </AlertDescription>
      <AlertActions>
        <AlertButton>View status page</AlertButton>
      </AlertActions>
    </Alert>
  );
}

function HelpDocSupportRequest() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex w-full flex-col items-start gap-2">
        <p className="flex items-center gap-2 text-sm font-medium text-base-foreground" role="status">
          <IconCircleCheck aria-hidden="true" className="size-4 text-success-foreground-strong" />
          Request <span className="font-mono">SUP-20418</span> sent
        </p>
        <p className="text-sm text-muted-foreground">We reply by email within one working day.</p>
        <Button variant="ghost" size="sm" onClick={() => setSent(false)}>
          Write another request
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <FormField label="What happened?" helper="Say what you expected and what you saw instead.">
        {(control) => <Textarea {...control} rows={3} placeholder="The trend for 23-PT-92531 stops at 13:20" />}
      </FormField>
      <div className="flex flex-col gap-2 rounded-lg bg-muted-background p-3">
        <span className="text-xs font-medium text-muted-foreground">Sent with your request</span>
        <MetadataList
          items={[
            { label: 'Page', value: 'Alarms, Gas compression' },
            { label: 'Project', value: <span className="font-mono text-xs">nordkapp</span> },
            { label: 'App version', value: <span className="tabular-nums">2.14.0</span> },
            { label: 'Time', value: <span className="tabular-nums">{formatDateTime(REFERENCE_NOW)} UTC</span> },
          ]}
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={() => setSent(true)}>Send request</Button>
      </div>
    </div>
  );
}

function HelpDocHelpCenter() {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const topics = HELP_DOC_TOPICS.filter((topic) => `${topic.title} ${topic.detail}`.toLowerCase().includes(needle));
  const degraded = HELP_DOC_STATUS.find((service) => service.state === 'degraded');

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h3 className="text-2xl font-semibold tracking-tight text-base-foreground">How can we help?</h3>
        <div className="w-full max-w-lg">
          <Search
            aria-label="Search help centre"
            placeholder="Search articles, shortcuts and API reference"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => setQuery('')}
          />
        </div>
        {degraded ? (
          <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="warning">
              <IconAlertTriangle /> Degraded
            </Badge>
            {degraded.name}: {degraded.detail.toLowerCase()}.
            <a href="#status" className={HELP_DOC_LINK} onClick={helpDocStay}>
              Status page
            </a>
          </p>
        ) : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <SectionHeader title={needle === '' ? 'Popular topics' : 'Results'} count={topics.length} size="sm" as="h4" />
          {topics.length > 0 ? (
            <ItemGroup aria-label="Help topics">
              {topics.map((topic) => (
                <EntityRow key={topic.id} leading={<topic.Icon />} title={topic.title} description={topic.detail} onOpen={() => undefined} />
              ))}
            </ItemGroup>
          ) : (
            <p className="py-4 text-sm text-muted-foreground">No help articles match “{query.trim()}”. Try fewer words, or contact support.</p>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-2">
            <SectionHeader title="Shortcuts" size="sm" as="h4" />
            <ShortcutSheet groups={HELP_DOC_SHORTCUTS.slice(0, 1)} platform="other" />
          </div>
          <div className="flex flex-col gap-2">
            <SectionHeader title="Still stuck?" size="sm" as="h4" />
            <p className="text-sm text-muted-foreground">Support answers within one working day, and within 30 minutes when production is down.</p>
            <Button variant="secondary" size="sm" className="self-start">
              <IconLifebuoy /> Open a support request
            </Button>
          </div>
        </div>
      </div>
      <p className="border-t border-default pt-3 text-xs tabular-nums text-muted-foreground">
        Documentation for version 2.14 · Last updated {formatAgo(REFERENCE_NOW - 26 * HOUR)}
      </p>
    </div>
  );
}

export default definePage({
  id: 'help-and-docs',
  title: 'Help and docs',
  summary:
    'Help where the question arises: a hint beside the field, a panel beside the page, a reference people can search, and a clear way to reach a person when none of that answers it.',
  guidance: {
    use: [
      'The shortest help that answers the question: helper text first, then a tooltip, then a link out.',
      'Help scoped to the page people are on, with search across everything behind it.',
      'A way to reach support from every empty help result, with the context attached.',
      'Service status in words next to the symptom people are seeing.',
    ],
    avoid: [
      'Help text that repeats the label or explains what is already visible.',
      'Essential instructions inside a tooltip; if people need it to proceed, show it.',
      'A video or tour as the only explanation; write the steps so they can be scanned and searched.',
      'Sending people to a generic docs home page from a specific question.',
    ],
  },
  source,
  sections: [
    {
      id: 'inline',
      title: 'Help in context',
      description: 'Explanations that sit next to the thing they explain.',
      specimens: [
        {
          id: 'HelpDocInlineHelpText',
          title: 'Inline help text',
          note: 'A field whose value needs a reason: a hint on the label, the rule under the control, and a link for the rest.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'forms/UnitNumberInput.tsx', 'overlays/InfoTooltip.tsx'],
          Component: HelpDocInlineHelpText,
        },
        {
          id: 'HelpDocLearnMoreRows',
          title: 'Learn more links',
          note: 'At the end of a panel or settings section: two or three specific articles, external ones marked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: HelpDocLearnMoreRows,
        },
        {
          id: 'HelpDocContextualPopover',
          title: 'Contextual help popover',
          note: 'A concept that needs a paragraph and a link, opened on demand from a help button beside the term.',
          origin: 'custom',
          Component: HelpDocContextualPopover,
        },
        {
          id: 'HelpDocInfoTooltip',
          title: 'Tooltip and inline definition',
          note: 'One sentence is enough: an info button on a label, or a self-explaining term inside a sentence.',
          origin: 'custom',
          uses: ['overlays/InfoTooltip.tsx', 'patterns/content/GlossaryTerm.tsx'],
          Component: HelpDocInfoTooltip,
        },
        {
          id: 'HelpDocHelpMenu',
          title: 'Help menu',
          note: 'The one place in the topbar that leads to docs, shortcuts, news and support.',
          origin: 'custom',
          Component: HelpDocHelpMenu,
        },
      ],
    },
    {
      id: 'answers',
      title: 'Finding answers',
      description: 'Search, popular topics, questions and terms.',
      specimens: [
        {
          id: 'HelpDocPanel',
          title: 'Help panel',
          note: 'Beside the page people are stuck on: search on top, topics for this page under it. Type to filter.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/structure/SidePanel.tsx', 'patterns/collections/EntityRow.tsx'],
          Component: HelpDocPanel,
        },
        {
          id: 'HelpDocFaq',
          title: 'FAQ accordion',
          note: 'A handful of questions people really ask, in their words; one answer open at a time.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          Component: HelpDocFaq,
        },
        {
          id: 'HelpDocGlossaryList',
          title: 'Glossary list',
          note: 'The vocabulary of the product in one place, alphabetical, one sentence per term.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: HelpDocGlossaryList,
        },
        {
          id: 'HelpDocEmptySearch',
          title: 'No help results',
          note: 'A search that found nothing still helps: the closest articles and a route to a person.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: HelpDocEmptySearch,
        },
      ],
    },
    {
      id: 'reference',
      title: 'Reference',
      description: 'Material people look things up in: shortcuts, the API and how the system works.',
      specimens: [
        {
          id: 'HelpDocShortcutSheet',
          title: 'Keyboard shortcuts sheet',
          note: 'The full list in a dialog or help page, grouped by area and searchable by what the shortcut does.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/ShortcutSheet.tsx', 'patterns/content/filterShortcuts.ts', 'actions/ShortcutHint.tsx'],
          Component: HelpDocShortcutSheet,
        },
        {
          id: 'HelpDocShortcutInline',
          title: 'Shortcuts for one page',
          note: 'In a help panel: only the shortcuts that work here, and the key that opens the rest.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/ShortcutSheet.tsx', 'actions/ShortcutHint.tsx'],
          Component: HelpDocShortcutInline,
        },
        {
          id: 'HelpDocApiSnippet',
          title: 'API reference snippet',
          note: 'One endpoint for developers: method and path, the fields, and a request they can copy and run.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['primitives/table/Table.tsx'],
          Component: HelpDocApiSnippet,
        },
        {
          id: 'HelpDocArticleFeedback',
          title: 'Article feedback',
          note: 'At the end of every article: one question, and a follow-up only when the answer is no.',
          origin: 'custom',
          align: 'stretch',
          Component: HelpDocArticleFeedback,
        },
        {
          id: 'HelpDocHowItWorks',
          title: 'How it works diagram',
          note: 'Explains a flow without a video: numbered steps in reading order that can be scanned, searched and translated.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: HelpDocHowItWorks,
        },
      ],
    },
    {
      id: 'guides',
      title: 'Guides and articles',
      description: 'Entry points into the documentation and the parts of an article.',
      specimens: [
        {
          id: 'HelpDocCardGrid',
          title: 'Docs card grid',
          note: 'The front of a help centre: three or four doors by what people want to do, not by product area.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx'],
          Component: HelpDocCardGrid,
        },
        {
          id: 'HelpDocGettingStarted',
          title: 'Getting-started guide',
          note: 'A short path for new projects: steps with time estimates, progress kept, one button to continue.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx', 'primitives/stepper/Stepper.tsx', 'primitives/stepper/Step.tsx'],
          Component: HelpDocGettingStarted,
        },
        {
          id: 'HelpDocChangelog',
          title: 'Changelog list',
          note: 'What changed recently, newest first, each line labelled by kind, with a link to the full history.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: HelpDocChangelog,
        },
        {
          id: 'HelpDocArticleHeader',
          title: 'Article header',
          note: 'The top of a help article: category, title, how long it takes, how fresh it is and who it is for.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/MetadataList.tsx', 'patterns/content/Prose.tsx'],
          Component: HelpDocArticleHeader,
        },
        {
          id: 'HelpDocOnThisPage',
          title: 'On this page',
          note: 'Beside a long article: its headings as links, with the current section marked.',
          origin: 'custom',
          align: 'stretch',
          Component: HelpDocOnThisPage,
        },
      ],
    },
    {
      id: 'support',
      title: 'Support and status',
      description: 'Reaching a person, and knowing whether the problem is on the service side.',
      specimens: [
        {
          id: 'HelpDocSupportCard',
          title: 'Support contact card',
          note: 'When self-help ends: opening hours, response times by urgency, an address to copy and one button.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/MetadataList.tsx', 'actions/CopyButton.tsx'],
          Component: HelpDocSupportCard,
        },
        {
          id: 'HelpDocStatusSummary',
          title: 'Status page summary',
          note: 'Service health inside the app: each service with a labelled state, detail only where something is off.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: HelpDocStatusSummary,
        },
        {
          id: 'HelpDocIncidentNotice',
          title: 'Incident notice',
          note: 'On the pages an incident affects: what people will notice, since when, and that nothing is lost.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: HelpDocIncidentNotice,
        },
        {
          id: 'HelpDocSupportRequest',
          title: 'Support request',
          note: 'One question to answer; page, project, version and time are attached and shown, so nobody has to type them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'display/MetadataList.tsx'],
          Component: HelpDocSupportRequest,
        },
        {
          id: 'HelpDocHelpCenter',
          title: 'Help centre',
          note: 'The whole page: search, the current incident, popular topics, shortcuts and the route to support.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/collections/EntityRow.tsx',
            'patterns/content/ShortcutSheet.tsx',
            'patterns/structure/SectionHeader.tsx',
          ],
          Component: HelpDocHelpCenter,
        },
      ],
    },
  ],
});
