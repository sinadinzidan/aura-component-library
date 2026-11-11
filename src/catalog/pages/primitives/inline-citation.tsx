import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationGroup,
  InlineCitationLink,
  InlineCitationQuote,
  InlineCitationSource,
  InlineCitationText,
} from '@cognite/aura/components/inline-citation';
import { Message, MessageContent } from '@cognite/aura/components/message';
import { Source, Sources } from '@cognite/aura/components/sources';
import { IconBinaryTree, IconCalendarEvent, IconChartLine, IconFileText, IconWorld } from '@cognite/aura/icons';

import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { definePage } from '../../types';

import source from './inline-citation.tsx?raw';

const DOCS = 'https://docs.cognite.com/cdf';
const FUSION = 'https://fusion.nordkapp.test';
const VIBRATION_URL = `${FUSION}/timeseries/23-VT-92740`;
const ALARM_URL = `${FUSION}/events/alm-4812`;
const MANUAL_URL = `${FUSION}/files/recompressor-operating-manual.pdf`;
const WORK_ORDER_URL = `${FUSION}/workorders/WO-104482`;

const PROSE = 'text-base leading-7 text-base-foreground';

function InlineCitationHostname() {
  return (
    <InlineCitation>
      <InlineCitationLink href={`${DOCS}/flows`} target="_blank" />
    </InlineCitation>
  );
}

function InlineCitationNamed() {
  return (
    <InlineCitation>
      <InlineCitationLink href={MANUAL_URL} target="_blank">
        Operating manual
      </InlineCitationLink>
    </InlineCitation>
  );
}

function InlineCitationNumbered() {
  return (
    <InlineCitation>
      <InlineCitationLink href={VIBRATION_URL} target="_blank" aria-label="Source 1: 23-VT-92740">
        1
      </InlineCitationLink>
    </InlineCitation>
  );
}

function InlineCitationWithIcon() {
  return (
    <InlineCitation>
      <InlineCitationLink href={VIBRATION_URL} target="_blank" icon={IconChartLine}>
        23-VT-92740
      </InlineCitationLink>
    </InlineCitation>
  );
}

function InlineCitationVariants() {
  return (
    <InlineCitationGroup>
      <InlineCitationLink href={`${DOCS}/flows`} variant="decorative-1" icon={IconWorld}>
        Web page
      </InlineCitationLink>
      <InlineCitationLink href={MANUAL_URL} variant="decorative-2" icon={IconFileText}>
        File
      </InlineCitationLink>
      <InlineCitationLink href={VIBRATION_URL} variant="decorative-3" icon={IconChartLine}>
        Time series
      </InlineCitationLink>
      <InlineCitationLink href={`${FUSION}/assets/23-KA-9103`} variant="decorative-4" icon={IconBinaryTree}>
        Asset
      </InlineCitationLink>
      <InlineCitationLink href={ALARM_URL} variant="decorative-5" icon={IconCalendarEvent}>
        Event
      </InlineCitationLink>
      <InlineCitationLink href={WORK_ORDER_URL} variant="decorative-6">
        Work order
      </InlineCitationLink>
      <InlineCitationLink href={`${FUSION}/models/compression`} variant="decorative-7">
        Data model
      </InlineCitationLink>
    </InlineCitationGroup>
  );
}

function InlineCitationGroupRow() {
  return (
    <InlineCitationGroup>
      <InlineCitationLink href={VIBRATION_URL} icon={IconChartLine} variant="decorative-3">
        23-VT-92740
      </InlineCitationLink>
      <InlineCitationLink href={ALARM_URL} icon={IconCalendarEvent} variant="decorative-5">
        alm-4812
      </InlineCitationLink>
      <InlineCitationLink href={MANUAL_URL} icon={IconFileText} variant="decorative-2">
        Operating manual
      </InlineCitationLink>
    </InlineCitationGroup>
  );
}

function InlineCitationCardSingle() {
  return (
    <InlineCitation>
      <InlineCitationCard>
        <InlineCitationCardTrigger sources={[`${DOCS}/dm/dm_concepts/dm_timeseries`]} />
        <InlineCitationCardBody>
          <div className="p-4">
            <InlineCitationSource
              title="Time series in data models"
              url="docs.cognite.com/cdf/dm/dm_concepts/dm_timeseries"
              description="How time series are stored, aggregated and linked to assets in Cognite Data Fusion."
            />
          </div>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  );
}

function InlineCitationCardMultiple() {
  return (
    <InlineCitation>
      <InlineCitationCard>
        <InlineCitationCardTrigger sources={[VIBRATION_URL, ALARM_URL, MANUAL_URL]} />
        <InlineCitationCardBody>
          <div className="flex flex-col gap-4 p-4">
            <InlineCitationSource title="23-VT-92740 · Drive-end vibration" description="Peak 11.6 mm/s at 13:46." />
            <InlineCitationSource title="alm-4812" description="Recompressor tripped on high vibration." />
            <InlineCitationSource title="Recompressor operating manual.pdf" description="Section 6.3, vibration trip settings." />
          </div>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  );
}

function InlineCitationCardWithQuote() {
  return (
    <InlineCitation>
      <InlineCitationCard>
        <InlineCitationCardTrigger sources={[MANUAL_URL]} icon={IconFileText} />
        <InlineCitationCardBody>
          <div className="flex flex-col gap-3 p-4">
            <InlineCitationSource title="Recompressor operating manual.pdf" url="Section 6.3, page 48" />
            <InlineCitationQuote>
              The machine trips when drive-end vibration exceeds 11.0 mm/s for more than 2 seconds.
            </InlineCitationQuote>
          </div>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  );
}

function InlineCitationCardWithIcon() {
  return (
    <InlineCitation>
      <InlineCitationCard>
        <InlineCitationCardTrigger sources={[`${DOCS}/flows`, `${DOCS}/dm`]} icon={IconWorld} />
        <InlineCitationCardBody>
          <div className="flex flex-col gap-4 p-4">
            <InlineCitationSource title="Flows apps" url="docs.cognite.com/cdf/flows" />
            <InlineCitationSource title="Data modeling" url="docs.cognite.com/cdf/dm" />
          </div>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  );
}

function InlineCitationCardLiveValue() {
  return (
    <InlineCitation>
      <InlineCitationCard>
        <InlineCitationCardTrigger sources={[VIBRATION_URL]} icon={IconChartLine} />
        <InlineCitationCardBody>
          <div className="flex flex-col gap-3 p-4">
            <InlineCitationSource title="23-VT-92740" description="Drive-end vibration, recompressor 23-KA-9103" />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Value at trip</dt>
                <dd className="font-medium text-base-foreground tabular-nums">11.6 mm/s</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Trip limit</dt>
                <dd className="font-medium text-base-foreground tabular-nums">11.0 mm/s</dd>
              </div>
            </dl>
          </div>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  );
}

function InlineCitationHighlightedText() {
  return (
    <p className={PROSE}>
      <InlineCitation>
        <InlineCitationText>The trip limit is 11.0 mm/s</InlineCitationText>
        <InlineCitationCard>
          <InlineCitationCardTrigger sources={[MANUAL_URL]} />
          <InlineCitationCardBody>
            <div className="p-4">
              <InlineCitationSource title="Recompressor operating manual.pdf" url="Section 6.3, page 48" />
            </div>
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    </p>
  );
}

function InlineCitationInSentence() {
  return (
    <p className={`${PROSE} mx-auto max-w-md`}>
      The recompressor tripped at 13:46 on high drive-end vibration{' '}
      <InlineCitation>
        <InlineCitationLink href={ALARM_URL} target="_blank" icon={IconCalendarEvent} variant="decorative-5">
          alm-4812
        </InlineCitationLink>
      </InlineCitation>
      .
    </p>
  );
}

function InlineCitationParagraphNamed() {
  return (
    <p className={`${PROSE} mx-auto max-w-xl`}>
      Vibration on the recompressor rose from 6.2 to 11.6 mm/s over 40 minutes{' '}
      <InlineCitation>
        <InlineCitationLink href={VIBRATION_URL} target="_blank" icon={IconChartLine} variant="decorative-3">
          23-VT-92740
        </InlineCitationLink>
      </InlineCitation>{' '}
      and passed the trip limit of 11.0 mm/s{' '}
      <InlineCitation>
        <InlineCitationLink href={MANUAL_URL} target="_blank" icon={IconFileText} variant="decorative-2">
          Operating manual
        </InlineCitationLink>
      </InlineCitation>
      . A bearing inspection is already in progress{' '}
      <InlineCitation>
        <InlineCitationLink href={WORK_ORDER_URL} target="_blank" variant="decorative-6">
          WO-104482
        </InlineCitationLink>
      </InlineCitation>
      .
    </p>
  );
}

function InlineCitationParagraphNumbered() {
  return (
    <p className={`${PROSE} mx-auto max-w-xl`}>
      Vibration on the recompressor rose from 6.2 to 11.6 mm/s over 40 minutes{' '}
      <InlineCitation>
        <InlineCitationLink href={VIBRATION_URL} target="_blank" aria-label="Source 1: 23-VT-92740">
          1
        </InlineCitationLink>
      </InlineCitation>{' '}
      and passed the trip limit of 11.0 mm/s{' '}
      <InlineCitation>
        <InlineCitationLink href={MANUAL_URL} target="_blank" aria-label="Source 2: Operating manual">
          2
        </InlineCitationLink>
      </InlineCitation>
      . A bearing inspection is already in progress{' '}
      <InlineCitation>
        <InlineCitationLink href={WORK_ORDER_URL} target="_blank" aria-label="Source 3: WO-104482">
          3
        </InlineCitationLink>
      </InlineCitation>
      .
    </p>
  );
}

function InlineCitationAdjacent() {
  return (
    <p className={`${PROSE} mx-auto max-w-md`}>
      Both the alarm and the trend point to the drive-end bearing{' '}
      <InlineCitation>
        <InlineCitationLink href={ALARM_URL} target="_blank" aria-label="Source 1: alm-4812">
          1
        </InlineCitationLink>
        <InlineCitationLink href={VIBRATION_URL} target="_blank" aria-label="Source 2: 23-VT-92740">
          2
        </InlineCitationLink>
      </InlineCitation>
      .
    </p>
  );
}

function InlineCitationCombinedCard() {
  return (
    <p className={`${PROSE} mx-auto max-w-md`}>
      Both the alarm and the trend point to the drive-end bearing
      <InlineCitation>
        <InlineCitationCard>
          <InlineCitationCardTrigger sources={[ALARM_URL, VIBRATION_URL]} />
          <InlineCitationCardBody>
            <div className="flex flex-col gap-4 p-4">
              <InlineCitationSource title="alm-4812" description="Recompressor tripped on high vibration, 13:46." />
              <InlineCitationSource title="23-VT-92740" description="Drive-end vibration, peak 11.6 mm/s." />
            </div>
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
      .
    </p>
  );
}

function InlineCitationInList() {
  return (
    <ul className={`${PROSE} mx-auto max-w-md list-disc pl-5`}>
      <li>
        Drive-end vibration 11.6 mm/s{' '}
        <InlineCitation>
          <InlineCitationLink href={VIBRATION_URL} target="_blank" icon={IconChartLine} variant="decorative-3">
            23-VT-92740
          </InlineCitationLink>
        </InlineCitation>
      </li>
      <li>
        1st stage discharge temperature 146.3 °C{' '}
        <InlineCitation>
          <InlineCitationLink href={`${FUSION}/timeseries/23-TT-92532`} target="_blank" icon={IconChartLine} variant="decorative-3">
            23-TT-92532
          </InlineCitationLink>
        </InlineCitation>
      </li>
      <li>
        Cooler outlet temperature 40.8 °C{' '}
        <InlineCitation>
          <InlineCitationLink href={`${FUSION}/timeseries/23-TT-91141`} target="_blank" icon={IconChartLine} variant="decorative-3">
            23-TT-91141
          </InlineCitationLink>
        </InlineCitation>
      </li>
    </ul>
  );
}

function InlineCitationInTable() {
  return (
    <Table label="Measurements and their sources" className="mx-auto max-w-md">
      <TableHeader>
        <TableRow>
          <TableHead>Measurement</TableHead>
          <TableHead numeric>Value</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Drive-end vibration</TableCell>
          <TableCell numeric>11.6 mm/s</TableCell>
          <TableCell>
            <InlineCitationLink href={VIBRATION_URL} target="_blank" variant="decorative-3">
              23-VT-92740
            </InlineCitationLink>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Discharge pressure</TableCell>
          <TableCell numeric>48.6 barg</TableCell>
          <TableCell>
            <InlineCitationLink href={`${FUSION}/timeseries/23-PT-92531`} target="_blank" variant="decorative-3">
              23-PT-92531
            </InlineCitationLink>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

function InlineCitationInMessage() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <p className={PROSE}>
            The recompressor tripped at 13:46{' '}
            <InlineCitation>
              <InlineCitationLink href={ALARM_URL} target="_blank" icon={IconCalendarEvent} variant="decorative-5">
                alm-4812
              </InlineCitationLink>
            </InlineCitation>
            . Vibration had been climbing for 40 minutes before the trip{' '}
            <InlineCitation>
              <InlineCitationLink href={VIBRATION_URL} target="_blank" icon={IconChartLine} variant="decorative-3">
                23-VT-92740
              </InlineCitationLink>
            </InlineCitation>
            , which points to a developing bearing fault rather than a process upset.
          </p>
        </MessageContent>
      </Message>
    </div>
  );
}

function InlineCitationWithSourceList() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <p className={PROSE}>
        Vibration reached 11.6 mm/s{' '}
        <InlineCitation>
          <InlineCitationLink href={VIBRATION_URL} target="_blank" aria-label="Source 1: 23-VT-92740">
            1
          </InlineCitationLink>
        </InlineCitation>
        , above the 11.0 mm/s trip limit{' '}
        <InlineCitation>
          <InlineCitationLink href={MANUAL_URL} target="_blank" aria-label="Source 2: Operating manual">
            2
          </InlineCitationLink>
        </InlineCitation>
        .
      </p>
      <Sources>
        <Source href={VIBRATION_URL} title="1 · 23-VT-92740" />
        <Source href={MANUAL_URL} title="2 · Operating manual.pdf" />
      </Sources>
    </div>
  );
}

function InlineCitationBesideValue() {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">Drive-end vibration at trip</p>
      <p className="flex items-center gap-2 text-2xl font-semibold text-base-foreground tabular-nums">
        11.6 mm/s
        <InlineCitation>
          <InlineCitationLink href={VIBRATION_URL} target="_blank" icon={IconChartLine} variant="decorative-3">
            23-VT-92740
          </InlineCitationLink>
        </InlineCitation>
      </p>
    </div>
  );
}

function InlineCitationInAlert() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Alert variant="warning">
        <AlertTitle>Vibration is close to the limit on 23-KA-9101</AlertTitle>
        <AlertDescription>
          <span className="inline-flex flex-wrap items-center gap-1">
            Drive-end vibration is 6.8 mm/s against a 7.1 mm/s limit
            <InlineCitationLink href={`${FUSION}/timeseries/23-VT-92540`} target="_blank" variant="decorative-3">
              23-VT-92540
            </InlineCitationLink>
          </span>
        </AlertDescription>
      </Alert>
    </div>
  );
}

function InlineCitationUnverified() {
  return (
    <p className={`${PROSE} mx-auto max-w-md`}>
      The trip limit is 11.0 mm/s{' '}
      <InlineCitation>
        <InlineCitationLink href={MANUAL_URL} target="_blank" icon={IconFileText} variant="decorative-2">
          Operating manual
        </InlineCitationLink>
      </InlineCitation>
      . The bearing was last replaced about two years ago{' '}
      <span className="text-sm text-muted-foreground">(no source found)</span>.
    </p>
  );
}

export default definePage({
  id: 'inline-citation',
  title: 'Inline citation',
  summary:
    'An inline citation ties one claim in running text to the source behind it. It sits right after the claim as a small chip — a link, or a hover card with the details.',
  docsSlug: 'inline-citation',
  guidance: {
    use: [
      'Directly after the claim it supports, before the full stop.',
      'Named chips (a tag, a file name) when there are a few sources; numbers when there are many.',
      'A hover card when the reader benefits from seeing the quote or value without leaving.',
      'The same colour and icon per kind of source as in the Sources list.',
    ],
    avoid: [
      'Citing a whole paragraph with one chip at the end when the claims come from different places.',
      'Numbered chips with no matching numbered list below.',
      'Details that only exist on hover when the answer will be read on a touch screen.',
      'Implying a source for a claim that has none; mark it as unsourced instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'link',
      title: 'Link chip',
      description: 'The simplest citation: a chip that opens the source.',
      specimens: [
        {
          id: 'InlineCitationHostname',
          title: 'Hostname',
          note: 'Web sources with no better label fall back to the site name.',
          origin: 'aura',
          Component: InlineCitationHostname,
        },
        {
          id: 'InlineCitationNamed',
          title: 'Named',
          note: 'A few sources the reader knows by name: a manual, a tag, a work order.',
          origin: 'aura',
          Component: InlineCitationNamed,
        },
        {
          id: 'InlineCitationNumbered',
          title: 'Numbered',
          note: 'Dense text with many citations; pair it with a numbered source list.',
          origin: 'aura',
          Component: InlineCitationNumbered,
        },
        {
          id: 'InlineCitationWithIcon',
          title: 'With icon',
          note: 'The icon says what kind of thing is cited before the label is read.',
          origin: 'aura',
          Component: InlineCitationWithIcon,
        },
        {
          id: 'InlineCitationVariants',
          title: 'Decorative variants',
          note: 'One colour per kind of source, the same mapping as the Sources list.',
          origin: 'aura',
          size: 'md',
          Component: InlineCitationVariants,
        },
        {
          id: 'InlineCitationGroupRow',
          title: 'Group',
          note: 'Several citations for one statement, laid out as a wrapping row.',
          origin: 'aura',
          size: 'md',
          Component: InlineCitationGroupRow,
        },
      ],
    },
    {
      id: 'hover-card',
      title: 'Hover card',
      description: 'A chip that previews its sources on hover or focus. Hover the chips to see the cards.',
      specimens: [
        {
          id: 'InlineCitationCardSingle',
          title: 'Single source',
          note: 'Shows title, address and a short description without leaving the answer.',
          origin: 'aura',
          Component: InlineCitationCardSingle,
        },
        {
          id: 'InlineCitationCardMultiple',
          title: 'Multiple sources',
          note: 'One chip for a claim with several sources; the chip counts the extras.',
          origin: 'aura',
          Component: InlineCitationCardMultiple,
        },
        {
          id: 'InlineCitationCardWithQuote',
          title: 'With quote',
          note: 'When the exact wording matters, such as a limit quoted from a manual.',
          origin: 'aura',
          Component: InlineCitationCardWithQuote,
        },
        {
          id: 'InlineCitationCardWithIcon',
          title: 'Trigger with icon',
          note: 'Marks the kind of source on the chip itself.',
          origin: 'aura',
          Component: InlineCitationCardWithIcon,
        },
        {
          id: 'InlineCitationCardLiveValue',
          title: 'Data point details',
          note: 'For a cited time series, the card shows the value and the limit it was compared with.',
          origin: 'custom',
          Component: InlineCitationCardLiveValue,
        },
        {
          id: 'InlineCitationHighlightedText',
          title: 'Highlighted claim',
          note: 'The cited words highlight when the chip is hovered, showing exactly what the source covers.',
          origin: 'aura',
          size: 'md',
          Component: InlineCitationHighlightedText,
        },
      ],
    },
    {
      id: 'in-text',
      title: 'In running text',
      description: 'Placement inside sentences, paragraphs, lists and tables.',
      specimens: [
        {
          id: 'InlineCitationInSentence',
          title: 'End of a sentence',
          note: 'One claim, one source: the chip goes after the claim and before the full stop.',
          origin: 'aura',
          size: 'md',
          Component: InlineCitationInSentence,
        },
        {
          id: 'InlineCitationParagraphNamed',
          title: 'Paragraph, named',
          note: 'Each claim carries its own named chip; best when the names mean something to the reader.',
          origin: 'aura',
          size: 'lg',
          Component: InlineCitationParagraphNamed,
        },
        {
          id: 'InlineCitationParagraphNumbered',
          title: 'Paragraph, numbered',
          note: 'The same paragraph with numbers: lighter on the eye, but needs a list to resolve them.',
          origin: 'aura',
          size: 'lg',
          Component: InlineCitationParagraphNumbered,
        },
        {
          id: 'InlineCitationAdjacent',
          title: 'Adjacent citations',
          note: 'Two sources for one claim sit side by side with a 4px gap.',
          origin: 'aura',
          size: 'md',
          Component: InlineCitationAdjacent,
        },
        {
          id: 'InlineCitationCombinedCard',
          title: 'Combined into one chip',
          note: 'The same two sources behind a single hover chip, when the text is already busy.',
          origin: 'aura',
          size: 'md',
          Component: InlineCitationCombinedCard,
        },
        {
          id: 'InlineCitationInList',
          title: 'In a list',
          note: 'A list of findings where every item has its own source.',
          origin: 'aura',
          size: 'md',
          Component: InlineCitationInList,
        },
        {
          id: 'InlineCitationInTable',
          title: 'In a table',
          note: 'Values in a table get a source column rather than chips inside the number cells.',
          origin: 'custom',
          size: 'md',
          uses: ['primitives/table/Table.tsx'],
          Component: InlineCitationInTable,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Citations as part of a larger answer.',
      specimens: [
        {
          id: 'InlineCitationInMessage',
          title: 'In an assistant message',
          note: 'The usual home: claims in an answer, each traceable to plant data.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: InlineCitationInMessage,
        },
        {
          id: 'InlineCitationWithSourceList',
          title: 'With a numbered source list',
          note: 'Numbers in the text resolve in the list underneath.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: InlineCitationWithSourceList,
        },
        {
          id: 'InlineCitationBesideValue',
          title: 'Beside a value',
          note: 'A headline number in a summary names the time series it came from.',
          origin: 'custom',
          Component: InlineCitationBesideValue,
        },
        {
          id: 'InlineCitationInAlert',
          title: 'In an alert',
          note: 'A generated warning shows the reading it is based on.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: InlineCitationInAlert,
        },
        {
          id: 'InlineCitationUnverified',
          title: 'Unsourced claim',
          note: 'A claim without a source is marked as such, in muted text, never given a chip.',
          origin: 'custom',
          size: 'md',
          Component: InlineCitationUnverified,
        },
      ],
    },
  ],
});
