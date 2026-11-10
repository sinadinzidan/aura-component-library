import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { IconPlus, IconTrash } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { FormField } from '../../../library/forms/FormField';
import { DoDont } from '../../../library/foundations/DoDont';
import { formatCount } from '../../../library/foundations/formatters';
import { ConfirmDialog } from '../../../library/overlays/ConfirmDialog';
import { InfoTooltip } from '../../../library/overlays/InfoTooltip';
import { definePage } from '../../types';

import source from './content-and-voice.tsx?raw';

const VERBS = [
  { use: 'Create', when: 'Making a new object from scratch', not: 'Add, New', example: 'Create data set' },
  { use: 'Add', when: 'Taking an existing object into a new context', not: 'Create, Insert', example: 'Add to canvas' },
  { use: 'Remove', when: 'Taking it out of this context; it still exists', not: 'Delete', example: 'Remove from canvas' },
  { use: 'Delete', when: 'Destroying it permanently', not: 'Remove, Erase', example: 'Delete pipeline' },
  { use: 'Save', when: 'Keeping pending changes without closing', not: 'Submit, Apply, OK', example: 'Save changes' },
  { use: 'Discard', when: 'Throwing away unsaved changes', not: 'Cancel, Reset', example: 'Discard changes' },
  { use: 'Cancel', when: 'Stopping the current action or closing a dialog', not: 'Close, No', example: 'Cancel' },
  { use: 'Sign in', when: 'Entering the application', not: 'Log in, Login', example: 'Sign in' },
] as const;

const TERMS = [
  { term: 'data set', not: 'dataset, Data Set', note: 'Two words, lower case in running text' },
  { term: 'time series', not: 'timeseries, tag, trend', note: 'Same form singular and plural' },
  { term: 'work order', not: 'workorder, job, ticket', note: 'ID in monospace: WO-104482' },
  { term: 'asset', not: 'equipment, object, node', note: 'Tag in monospace: 23-KA-9101' },
  { term: 'alarm', not: 'alert, warning, event', note: 'Alert is the UI component, alarm is the plant condition' },
  { term: 'acknowledge', not: 'confirm, accept, ack', note: 'The operator has seen the alarm' },
  { term: 'sign in', not: 'log in, login', note: 'Verb is two words' },
  { term: 'select', not: 'click, tap, press', note: 'Works for pointer, keyboard, touch and voice' },
] as const;

const TONES = [
  { scenario: 'First use', tone: 'Friendly, brief', example: 'No dashboards yet. Create one to follow the assets you care about.' },
  { scenario: 'Routine success', tone: 'Concise, past tense', example: 'Limits saved' },
  { scenario: 'Recoverable error', tone: 'Constructive', example: 'Couldn’t load the trend. Check your connection and try again.' },
  { scenario: 'Destructive action', tone: 'Serious, transparent', example: 'Delete pipeline? All runs and history will be permanently removed.' },
  { scenario: 'Plant emergency', tone: 'Calm, factual', example: 'Recompressor tripped on high vibration at 13:46 UTC.' },
] as const;

const BENCHMARKS = [
  { element: 'Button', target: '2–4 words', max: '6 words' },
  { element: 'Title', target: '3–6 words', max: '40 characters' },
  { element: 'Tooltip', target: '10–20 words', max: '2 sentences' },
  { element: 'Error message', target: '12–18 words', max: '3 sentences' },
  { element: 'Notification', target: '10–15 words', max: '2 sentences' },
] as const;

/** A Do / Don't pair for copy. Each side is free content, usually one or two lines of UI text. */
function VoicePair({
  good,
  bad,
  goodCaption,
  badCaption,
  surface,
}: {
  good: ReactNode;
  bad: ReactNode;
  goodCaption: string;
  badCaption: string;
  surface?: 'muted' | 'outline';
}) {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <DoDont kind="do" caption={goodCaption} surface={surface}>
        {good}
      </DoDont>
      <DoDont kind="dont" caption={badCaption} surface={surface}>
        {bad}
      </DoDont>
    </div>
  );
}

/** A toast-like message block: title and optional description. Static, for showing copy. */
function VoiceMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg bg-popover-background p-3 shadow-sm">
      <p className="text-sm font-medium text-popover-foreground">{title}</p>
      {children ? <p className="mt-1 text-sm text-muted-foreground">{children}</p> : null}
    </div>
  );
}

function VoiceCopy({ children }: { children: ReactNode }) {
  return <p className="text-sm text-base-foreground">{children}</p>;
}

function VoiceGuideSentenceCase() {
  return (
    <VoicePair
      goodCaption="Sentence case everywhere. Only proper nouns and product names take a capital."
      badCaption="Title case and all caps read as shouting and slow scanning."
      good={
        <div className="flex flex-col items-start gap-3">
          <p className="text-base font-semibold text-base-foreground">Create data model</p>
          <Button size="sm">Add time series</Button>
        </div>
      }
      bad={
        <div className="flex flex-col items-start gap-3">
          <p className="text-base font-semibold text-base-foreground">Create Data Model</p>
          <Button size="sm">ADD TIME SERIES</Button>
        </div>
      }
    />
  );
}

function VoiceGuideActionLabels() {
  return (
    <VoicePair
      goodCaption="Verb plus object: the label says what will happen."
      badCaption="Generic labels make people read the whole dialog to know what they agree to."
      good={
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Save changes</Button>
          <Button size="sm" variant="secondary">
            Export data
          </Button>
          <Button size="sm" variant="destructive">
            Delete pipeline
          </Button>
        </div>
      }
      bad={
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Submit</Button>
          <Button size="sm" variant="secondary">
            OK
          </Button>
          <Button size="sm" variant="destructive">
            Yes
          </Button>
        </div>
      }
    />
  );
}

function VoiceGuideVerbs() {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Approved action verbs and the labels they replace</caption>
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-3 font-medium">
            Use
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            When
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Not
          </th>
          <th scope="col" className="py-2 pl-3 font-medium">
            Example
          </th>
        </tr>
      </thead>
      <tbody>
        {VERBS.map((verb) => (
          <tr key={verb.use} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2 pr-3 font-medium whitespace-nowrap text-base-foreground">
              {verb.use}
            </th>
            <td className="px-3 py-2 text-medium-foreground">{verb.when}</td>
            <td className="px-3 py-2 text-muted-foreground">
              <s>{verb.not}</s>
            </td>
            <td className="py-2 pl-3 whitespace-nowrap text-base-foreground">{verb.example}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VoiceGuideButtonLength() {
  return (
    <VoicePair
      goodCaption="Two to four words; six at most."
      badCaption="A sentence in a button. Put the explanation next to it instead."
      good={<Button size="sm">Create work order</Button>}
      bad={
        <div className="w-full">
          <Button size="sm" className="h-auto w-full whitespace-normal">
            Select here to create a new work order for this asset
          </Button>
        </div>
      }
    />
  );
}

function VoiceGuideTitles() {
  return (
    <VoicePair
      goodCaption="Noun phrases that name the place: 3 to 6 words."
      badCaption="Greetings, questions and filler say nothing about the page."
      good={
        <ul className="flex flex-col gap-2 text-base font-semibold text-base-foreground">
          <li>Asset overview</li>
          <li>Pipeline runs</li>
          <li>Alarms, gas compression</li>
        </ul>
      }
      bad={
        <ul className="flex flex-col gap-2 text-base font-semibold text-base-foreground">
          <li>Welcome to your assets</li>
          <li>What ran recently?</li>
          <li>Alarms Page</li>
        </ul>
      }
    />
  );
}

function VoiceGuideErrorMessage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <Alert variant="error">
        <AlertTitle>Couldn’t save limits</AlertTitle>
        <AlertDescription>The connection to Nordkapp was lost. Reconnect and save again.</AlertDescription>
      </Alert>
      <ol className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
        <li>
          <span className="block font-medium text-base-foreground">1. What failed</span>Couldn’t save limits
        </li>
        <li>
          <span className="block font-medium text-base-foreground">2. Why, if known</span>The connection was lost
        </li>
        <li>
          <span className="block font-medium text-base-foreground">3. What to do</span>Reconnect and save again
        </li>
      </ol>
    </div>
  );
}

function VoiceGuideErrorDont() {
  return (
    <VoicePair
      goodCaption="Says what happened, keeps the input, offers a way forward."
      badCaption="A code, blame and a dead end."
      good={<VoiceMessage title="Ingestion failed">Check the extractor configuration and try again.</VoiceMessage>}
      bad={<VoiceMessage title="Error 0x80040154">You entered invalid data. Operation aborted.</VoiceMessage>}
    />
  );
}

function VoiceGuideSuccessMessage() {
  return (
    <VoicePair
      goodCaption="Past tense, specific, brief."
      badCaption="“Successfully” is implied, and the rest is padding."
      good={
        <div className="flex flex-col gap-2">
          <VoiceMessage title="Limits saved" />
          <VoiceMessage title="Work order created">WO-104482 is assigned to Tomás Barros.</VoiceMessage>
        </div>
      }
      bad={<VoiceMessage title="Success">Your changes have been successfully saved to the system.</VoiceMessage>}
    />
  );
}

function VoiceGuideEmptyState() {
  return (
    <div className="w-full">
      <EmptyState type="new-object">
        <EmptyStateIcon />
        <EmptyStateTitle as="h4">No work orders yet</EmptyStateTitle>
        <EmptyStateDescription>Create a work order to plan maintenance for this asset.</EmptyStateDescription>
        <EmptyStateActions>
          <Button size="sm">
            <IconPlus /> Create work order
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  );
}

function VoiceGuideConfirmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <IconTrash /> Open delete dialog
        </Button>
        <p className="text-xs text-muted-foreground">Opens the real dialog.</p>
      </div>
      <dl className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
        <dt className="text-xs text-muted-foreground">Title</dt>
        <dd className="text-base-foreground">Delete pipeline “Nordkapp historian”?</dd>
        <dt className="text-xs text-muted-foreground">Body</dt>
        <dd className="text-base-foreground">All 214 runs and their history will be permanently removed. This can’t be undone.</dd>
        <dt className="text-xs text-muted-foreground">Actions</dt>
        <dd className="text-base-foreground">
          Cancel · Delete pipeline <span className="text-muted-foreground">(never “Are you sure?” with OK)</span>
        </dd>
      </dl>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        destructive
        title="Delete pipeline “Nordkapp historian”?"
        description="All 214 runs and their history will be permanently removed. This can’t be undone."
        confirmLabel="Delete pipeline"
        onConfirm={() => setOpen(false)}
      />
    </div>
  );
}

function VoiceGuideNotifications() {
  return (
    <VoicePair
      goodCaption="Verb-first title, then context and a next step. 10 to 15 words."
      badCaption="A vague title and no way to act on it."
      good={<VoiceMessage title="Extractor disconnected">Check the network on NK-23 and reconnect.</VoiceMessage>}
      bad={<VoiceMessage title="Notification">Something happened with one of your extractors.</VoiceMessage>}
    />
  );
}

function VoiceGuideCriticalTone() {
  return (
    <VoicePair
      goodCaption="What, where, when, and the next step. No adjectives."
      badCaption="Alarmist wording adds stress and no information."
      good={
        <VoiceMessage title="Recompressor tripped on high vibration">
          23-KA-9103 stopped at 13:46 UTC. Inspect the drive-end bearing before restart.
        </VoiceMessage>
      }
      bad={
        <VoiceMessage title="DANGER: catastrophic failure">
          Something has gone terribly wrong with the compressor. Act immediately.
        </VoiceMessage>
      }
    />
  );
}

function VoiceGuideFormLabels() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <FormField label="Time series ID" helper="Use the tag from the source system so readings can be matched.">
        {(control) => <Input {...control} defaultValue="23-PT-92531" />}
      </FormField>
      <FormField label="Email address" helper="Receives a message when the export is ready.">
        {(control) => <Input {...control} type="email" placeholder="name@example.com" />}
      </FormField>
      <p className="text-xs text-muted-foreground">
        Labels are noun phrases without a colon. Helper text starts with a verb and says why the value is needed.
      </p>
    </div>
  );
}

function VoiceGuidePlaceholder() {
  return (
    <VoicePair
      surface="outline"
      goodCaption="A visible label; the placeholder only shows a format."
      badCaption="A placeholder as the label vanishes on the first keystroke."
      good={
        <FormField label="Asset tag">{(control) => <Input {...control} placeholder="23-KA-9101" />}</FormField>
      }
      bad={<Input aria-label="Asset tag" placeholder="Enter the asset tag here" />}
    />
  );
}

function VoiceGuideTooltips() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-center gap-1 text-sm text-base-foreground">
        Time granularity
        <InfoTooltip label="About time granularity">
          Time granularity. Controls how data points are aggregated in the chart.
        </InfoTooltip>
      </div>
      <dl className="flex flex-col gap-2 text-xs">
        <div>
          <dt className="font-medium text-base-foreground">Pattern</dt>
          <dd className="text-muted-foreground">What it is. What it does or why it matters.</dd>
        </div>
        <div>
          <dt className="font-medium text-base-foreground">Rules</dt>
          <dd className="text-muted-foreground">
            Present tense, two sentences at most, no period on a single phrase, never only a repeat of the label.
          </dd>
        </div>
      </dl>
    </div>
  );
}

function VoiceGuideLinkText() {
  const stay = (event: { preventDefault: () => void }) => event.preventDefault();

  return (
    <VoicePair
      goodCaption="The link text names its destination, so it works out of context."
      badCaption="“Click here” assumes a mouse and tells a screen reader nothing."
      good={
        <VoiceCopy>
          Limits follow the alarm philosophy.{' '}
          <a href="#alarm-philosophy" onClick={stay} className="text-link-foreground underline underline-offset-2">
            Read the alarm philosophy
          </a>
        </VoiceCopy>
      }
      bad={
        <VoiceCopy>
          To read the alarm philosophy,{' '}
          <a href="#alarm-philosophy" onClick={stay} className="text-link-foreground underline underline-offset-2">
            click here
          </a>
          .
        </VoiceCopy>
      }
    />
  );
}

function VoiceGuideNumbersInCopy() {
  return (
    <VoicePair
      goodCaption="Numerals for every number, and the noun agrees with the count."
      badCaption="Spelled-out numbers and “(s)” are harder to scan and to translate."
      good={
        <ul className="flex flex-col gap-1 text-sm text-base-foreground tabular-nums">
          <li>{formatCount(6, 'query', 'queries')} running</li>
          <li>{formatCount(1, 'result')}</li>
          <li>{formatCount(3, 'alarm')} acknowledged</li>
        </ul>
      }
      bad={
        <ul className="flex flex-col gap-1 text-sm text-base-foreground">
          <li>Six queries running</li>
          <li>1 result(s)</li>
          <li>Three alarm(s) acknowledged</li>
        </ul>
      }
    />
  );
}

function VoiceGuidePronouns() {
  return (
    <VoicePair
      goodCaption="Speak to the user as “you”. The product does not say “I” or “we”."
      badCaption="“My” and “your” mixed in one view; the app talking about itself."
      good={
        <ul className="flex flex-col gap-1 text-sm text-base-foreground">
          <li>Your dashboards</li>
          <li>You have 3 unacknowledged alarms.</li>
          <li>Couldn’t load the trend.</li>
        </ul>
      }
      bad={
        <ul className="flex flex-col gap-1 text-sm text-base-foreground">
          <li>My dashboards</li>
          <li>Your alarms are waiting for you in my list.</li>
          <li>We’re sorry, we couldn’t load this.</li>
        </ul>
      }
    />
  );
}

function VoiceGuideBlameJargon() {
  return (
    <VoicePair
      goodCaption="Describes the problem and the fix in the user’s words."
      badCaption="Blames the user and exposes internals."
      good={
        <ul className="flex flex-col gap-2 text-sm text-base-foreground">
          <li>Enter a tag in the format 23-KA-9101.</li>
          <li>The session ended. Sign in to continue.</li>
        </ul>
      }
      bad={
        <ul className="flex flex-col gap-2 text-sm text-base-foreground">
          <li>You entered an illegal tag.</li>
          <li>401: token validation failed in auth middleware.</li>
        </ul>
      }
    />
  );
}

function VoiceGuideAbbreviations() {
  return (
    <VoicePair
      goodCaption="Plain words, “and” written out, a comma before the last item."
      badCaption="Latin abbreviations and ampersands do not translate and are skipped by readers."
      good={
        <ul className="flex flex-col gap-2 text-sm text-base-foreground">
          <li>Filter by type, for example pump or valve.</li>
          <li>Assets, time series, and events</li>
          <li>Search and filter</li>
        </ul>
      }
      bad={
        <ul className="flex flex-col gap-2 text-sm text-base-foreground">
          <li>Filter by type, e.g. pump, valve, etc.</li>
          <li>Assets, time series and events</li>
          <li>Search &amp; filter</li>
        </ul>
      }
    />
  );
}

function VoiceGuideTerminology() {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Terminology: one word per concept</caption>
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-3 font-medium">
            Write
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Not
          </th>
          <th scope="col" className="py-2 pl-3 font-medium">
            Note
          </th>
        </tr>
      </thead>
      <tbody>
        {TERMS.map((term) => (
          <tr key={term.term} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2 pr-3 font-medium whitespace-nowrap text-base-foreground">
              {term.term}
            </th>
            <td className="px-3 py-2 text-muted-foreground">
              <s>{term.not}</s>
            </td>
            <td className="py-2 pl-3 text-medium-foreground">{term.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function VoiceGuideToneByScenario() {
  return (
    <dl className="flex w-full flex-col">
      {TONES.map((row) => (
        <div
          key={row.scenario}
          className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3 border-b border-default py-2 last:border-b-0"
        >
          <dt>
            <span className="block text-sm font-medium text-base-foreground">{row.scenario}</span>
            <span className="block text-xs text-muted-foreground">{row.tone}</span>
          </dt>
          <dd className="text-sm text-medium-foreground">{row.example}</dd>
        </div>
      ))}
    </dl>
  );
}

function VoiceGuideBenchmarks() {
  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">Length targets for UI text</caption>
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-3 font-medium">
            Element
          </th>
          <th scope="col" className="px-3 py-2 font-medium">
            Target
          </th>
          <th scope="col" className="py-2 pl-3 font-medium">
            Maximum
          </th>
        </tr>
      </thead>
      <tbody>
        {BENCHMARKS.map((row) => (
          <tr key={row.element} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2 pr-3 font-medium text-base-foreground">
              {row.element}
            </th>
            <td className="px-3 py-2 text-medium-foreground tabular-nums">{row.target}</td>
            <td className="py-2 pl-3 text-medium-foreground tabular-nums">{row.max}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default definePage({
  id: 'content-and-voice',
  title: 'Content and voice',
  summary:
    'The words are part of the interface. Aura copy is purposeful, concise and clear: sentence case, specific verbs, and messages that say what happened and what to do next. The voice stays the same; the tone follows the situation.',
  guidance: {
    use: [
      'Sentence case for everything, and verb plus object for every action.',
      'Error messages in three parts: what failed, why if known, what to do.',
      'One term per concept across the whole product.',
      '“Select”, not “click”, and link text that names its destination.',
    ],
    avoid: [
      'Submit, OK, Yes and Confirm as button labels.',
      'Exclamation marks, all caps, ampersands and Latin abbreviations.',
      'Blame, apology and internal error codes in messages.',
      'Placeholder text used as a label.',
    ],
  },
  source,
  sections: [
    {
      id: 'labels',
      title: 'Labels and titles',
      description: 'The shortest strings carry the most weight.',
      specimens: [
        {
          id: 'VoiceGuideSentenceCase',
          title: 'Sentence case',
          note: 'Every string in the interface: titles, buttons, labels, menu items.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideSentenceCase,
        },
        {
          id: 'VoiceGuideActionLabels',
          title: 'Verb plus object',
          note: 'Any button or menu item that does something.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideActionLabels,
        },
        {
          id: 'VoiceGuideVerbs',
          title: 'Pick the verb',
          note: 'When two verbs seem to fit, this table says which one means what.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: VoiceGuideVerbs,
        },
        {
          id: 'VoiceGuideButtonLength',
          title: 'Button label length',
          note: 'When a label keeps growing, move the explanation out of the button.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideButtonLength,
        },
        {
          id: 'VoiceGuideTitles',
          title: 'Titles',
          note: 'Page, card and dialog titles.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideTitles,
        },
      ],
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'What the product says when something happens.',
      specimens: [
        {
          id: 'VoiceGuideErrorMessage',
          title: 'Anatomy of an error message',
          note: 'Any failure the user can do something about.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: VoiceGuideErrorMessage,
        },
        {
          id: 'VoiceGuideErrorDont',
          title: 'Errors without blame',
          note: 'Check an error message against this pair before it ships.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideErrorDont,
        },
        {
          id: 'VoiceGuideSuccessMessage',
          title: 'Success messages',
          note: 'Toasts and inline confirmations after a user action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideSuccessMessage,
        },
        {
          id: 'VoiceGuideNotifications',
          title: 'Notifications',
          note: 'Messages that arrive without the user asking.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideNotifications,
        },
        {
          id: 'VoiceGuideCriticalTone',
          title: 'Tone in a critical situation',
          note: 'Trips, shutdowns and safety events: the calmer the words, the faster the response.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideCriticalTone,
        },
        {
          id: 'VoiceGuideConfirmDialog',
          title: 'Confirmation dialog',
          note: 'Before anything irreversible: name the object, the consequence and the action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: VoiceGuideConfirmDialog,
        },
        {
          id: 'VoiceGuideEmptyState',
          title: 'Empty state',
          note: 'First use or no data: say what is missing and offer the one next step.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: VoiceGuideEmptyState,
        },
        {
          id: 'VoiceGuideToneByScenario',
          title: 'Tone by situation',
          note: 'The voice is constant; choose the tone by how the user feels at that moment.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: VoiceGuideToneByScenario,
        },
      ],
    },
    {
      id: 'forms-and-help',
      title: 'Forms and help',
      description: 'Labels, hints, tooltips and links.',
      specimens: [
        {
          id: 'VoiceGuideFormLabels',
          title: 'Labels and helper text',
          note: 'Every field: a noun-phrase label, and a helper only when it adds a reason or a rule.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: VoiceGuideFormLabels,
        },
        {
          id: 'VoiceGuidePlaceholder',
          title: 'Placeholder misuse',
          note: 'Placeholders are for standard formats only, never for the label or instructions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'forms/FormField.tsx'],
          Component: VoiceGuidePlaceholder,
        },
        {
          id: 'VoiceGuideTooltips',
          title: 'Tooltips',
          note: 'A term or control that needs one more sentence. Hover or focus the icon.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/InfoTooltip.tsx'],
          Component: VoiceGuideTooltips,
        },
        {
          id: 'VoiceGuideLinkText',
          title: 'Link text',
          note: 'Any inline link, in help text, messages and empty states.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideLinkText,
        },
      ],
    },
    {
      id: 'words',
      title: 'Words',
      description: 'Small choices that add up to one voice.',
      specimens: [
        {
          id: 'VoiceGuideNumbersInCopy',
          title: 'Numbers in copy',
          note: 'Counts in sentences, badges and summaries.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx', 'foundations/formatters.ts'],
          Component: VoiceGuideNumbersInCopy,
        },
        {
          id: 'VoiceGuidePronouns',
          title: 'Pronouns',
          note: 'Whenever copy refers to the user or to the product.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuidePronouns,
        },
        {
          id: 'VoiceGuideBlameJargon',
          title: 'No blame, no jargon',
          note: 'Validation and system messages for people who do not know the implementation.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideBlameJargon,
        },
        {
          id: 'VoiceGuideAbbreviations',
          title: 'Abbreviations and punctuation',
          note: 'Running text, lists and headings that will be translated.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['foundations/DoDont.tsx'],
          Component: VoiceGuideAbbreviations,
        },
        {
          id: 'VoiceGuideTerminology',
          title: 'Terminology',
          note: 'Look a word up here before introducing a synonym.',
          origin: 'aura',
          size: 'lg',
          align: 'stretch',
          Component: VoiceGuideTerminology,
        },
        {
          id: 'VoiceGuideBenchmarks',
          title: 'Length targets',
          note: 'A quick check when a string feels long.',
          origin: 'aura',
          align: 'stretch',
          Component: VoiceGuideBenchmarks,
        },
      ],
    },
  ],
});
