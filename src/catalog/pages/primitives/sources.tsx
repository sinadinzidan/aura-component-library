import { Button } from '@cognite/aura/components/button';
import { InlineCitation, InlineCitationLink } from '@cognite/aura/components/inline-citation';
import { Message, MessageContent, MessageResponse } from '@cognite/aura/components/message';
import { Source, Sources, SourcesTitle } from '@cognite/aura/components/sources';
import {
  IconBinaryTree,
  IconBook,
  IconCalendarEvent,
  IconChartLine,
  IconFileText,
  IconFileTypePdf,
  IconTool,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { SourceList } from '../../../library/ai/SourceList';
import type { SourceItem } from '../../../library/ai/SourceList';
import { definePage } from '../../types';

import source from './sources.tsx?raw';

const DOCS = 'https://docs.cognite.com/cdf';
const FUSION = 'https://fusion.nordkapp.test';

const CDF_SOURCES: readonly SourceItem[] = [
  { id: 'vt', title: '23-VT-92740 · Drive-end vibration', href: `${FUSION}/timeseries/23-VT-92740`, kind: 'timeseries' },
  { id: 'tt', title: '23-TT-92532 · Discharge temperature', href: `${FUSION}/timeseries/23-TT-92532`, kind: 'timeseries' },
  { id: 'asset', title: '23-KA-9103 · Recompressor', href: `${FUSION}/assets/23-KA-9103`, kind: 'asset' },
  { id: 'alarm', title: 'alm-4812 · Tripped on high vibration', href: `${FUSION}/events/alm-4812`, kind: 'event' },
  { id: 'manual', title: 'Recompressor operating manual.pdf', href: `${FUSION}/files/recompressor-operating-manual.pdf`, kind: 'file' },
  { id: 'docs', title: 'Time series aggregation', href: `${DOCS}/dm/dm_concepts/dm_timeseries`, kind: 'web' },
];

function SourcesDefault() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources>
        <Source href={`${DOCS}/integration/guides/extraction/opc_ua`} title="OPC UA extractor" />
        <Source href={`${DOCS}/dm/dm_concepts/dm_timeseries`} title="Time series in data models" />
        <Source href={`${DOCS}/flows`} title="Flows apps" />
      </Sources>
    </div>
  );
}

function SourcesCountTitle() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={<SourcesTitle title="3 sources" />}>
        <Source href={`${DOCS}/integration/guides/extraction/opc_ua`} title="OPC UA extractor" />
        <Source href={`${DOCS}/dm/dm_concepts/dm_timeseries`} title="Time series in data models" />
        <Source href={`${DOCS}/flows`} title="Flows apps" />
      </Sources>
    </div>
  );
}

function SourcesNoTitle() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={false} aria-label="Sources">
        <Source href={`${DOCS}/integration/guides/extraction/opc_ua`} title="OPC UA extractor" />
        <Source href={`${DOCS}/dm/dm_concepts/dm_timeseries`} title="Time series in data models" />
      </Sources>
    </div>
  );
}

function SourcesSingle() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={<SourcesTitle title="Source" />}>
        <Source href={`${FUSION}/files/recompressor-operating-manual.pdf`} title="Recompressor operating manual.pdf" />
      </Sources>
    </div>
  );
}

function SourcesHostnames() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources>
        <Source href="https://docs.cognite.com/cdf/flows" />
        <Source href="https://cognite.com/en/resources" />
        <Source href="https://hub.cognite.com/groups" />
      </Sources>
    </div>
  );
}

function SourcesCollapsible() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources collapsible title={<SourcesTitle title="3 sources" />}>
        <Source href={`${DOCS}/integration/guides/extraction/opc_ua`} title="OPC UA extractor" />
        <Source href={`${DOCS}/dm/dm_concepts/dm_timeseries`} title="Time series in data models" />
        <Source href={`${DOCS}/flows`} title="Flows apps" />
      </Sources>
    </div>
  );
}

function SourcesCollapsibleOpen() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources collapsible defaultOpen title={<SourcesTitle title="3 sources" />}>
        <Source href={`${DOCS}/integration/guides/extraction/opc_ua`} title="OPC UA extractor" />
        <Source href={`${DOCS}/dm/dm_concepts/dm_timeseries`} title="Time series in data models" />
        <Source href={`${DOCS}/flows`} title="Flows apps" />
      </Sources>
    </div>
  );
}

function SourcesControlled() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-medium-foreground">The recompressor tripped on high vibration.</p>
        <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Hide evidence' : 'Show evidence'}
        </Button>
      </div>
      <Sources collapsible open={open} onOpenChange={setOpen} title={<SourcesTitle title="2 sources" />}>
        <Source href={`${FUSION}/events/alm-4812`} title="alm-4812" icon={IconCalendarEvent} />
        <Source href={`${FUSION}/timeseries/23-VT-92740`} title="23-VT-92740" icon={IconChartLine} />
      </Sources>
    </div>
  );
}

function SourcesWithIcons() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources>
        <Source href={`${FUSION}/files/recompressor-operating-manual.pdf`} title="Operating manual" icon={IconFileTypePdf} />
        <Source href={`${FUSION}/files/vibration-procedure.docx`} title="Vibration procedure" icon={IconFileText} />
        <Source href={`${DOCS}/flows`} title="Flows documentation" icon={IconBook} />
      </Sources>
    </div>
  );
}

function SourcesVariants() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={<SourcesTitle title="Colour by kind" />}>
        <Source href={`${DOCS}/flows`} title="Web page" variant="decorative-1" />
        <Source href={`${FUSION}/files/manual.pdf`} title="File" variant="decorative-2" />
        <Source href={`${FUSION}/timeseries/23-VT-92740`} title="Time series" variant="decorative-3" />
        <Source href={`${FUSION}/assets/23-KA-9103`} title="Asset" variant="decorative-4" />
        <Source href={`${FUSION}/events/alm-4812`} title="Event" variant="decorative-5" />
        <Source href={`${FUSION}/workorders/WO-104482`} title="Work order" variant="decorative-6" />
        <Source href={`${FUSION}/models/compression`} title="Data model" variant="decorative-7" />
      </Sources>
    </div>
  );
}

function SourcesLongTitles() {
  return (
    <div className="mx-auto w-full max-w-xs">
      <Sources>
        <Source href={`${FUSION}/files/recompressor-operating-manual.pdf`} icon={IconFileText}>
          <span className="max-w-56 truncate">
            Recompressor 23-KA-9103 operating and maintenance manual, revision 7.pdf
          </span>
        </Source>
        <Source href={`${FUSION}/files/vibration-procedure.pdf`} icon={IconFileText}>
          <span className="max-w-56 truncate">Procedure for vibration monitoring of rotating equipment.pdf</span>
        </Source>
      </Sources>
    </div>
  );
}

function SourcesMany() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={<SourcesTitle title="9 sources" />}>
        <Source href={`${FUSION}/timeseries/23-VT-92740`} title="23-VT-92740" icon={IconChartLine} />
        <Source href={`${FUSION}/timeseries/23-PT-92531`} title="23-PT-92531" icon={IconChartLine} />
        <Source href={`${FUSION}/timeseries/23-PT-92530`} title="23-PT-92530" icon={IconChartLine} />
        <Source href={`${FUSION}/timeseries/23-TT-92532`} title="23-TT-92532" icon={IconChartLine} />
        <Source href={`${FUSION}/timeseries/23-ST-92501`} title="23-ST-92501" icon={IconChartLine} />
        <Source href={`${FUSION}/timeseries/23-FT-92510`} title="23-FT-92510" icon={IconChartLine} />
        <Source href={`${FUSION}/timeseries/23-TT-91141`} title="23-TT-91141" icon={IconChartLine} />
        <Source href={`${FUSION}/assets/23-KA-9103`} title="23-KA-9103" icon={IconBinaryTree} variant="decorative-4" />
        <Source href={`${FUSION}/assets/23-HA-9114`} title="23-HA-9114" icon={IconBinaryTree} variant="decorative-4" />
      </Sources>
    </div>
  );
}

function SourcesSameTab() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={<SourcesTitle title="Open in this app" />}>
        <Source href={`${FUSION}/assets/23-KA-9103`} target="_self" title="23-KA-9103 · Recompressor" icon={IconBinaryTree} />
        <Source href={`${FUSION}/workorders/WO-104482`} target="_self" title="WO-104482" icon={IconTool} />
      </Sources>
    </div>
  );
}

function SourcesCdfFiles() {
  return (
    <div className="mx-auto w-full max-w-md">
      <SourceList
        title="2 documents"
        sources={[
          { id: 'manual', title: 'Recompressor operating manual.pdf', href: `${FUSION}/files/recompressor-operating-manual.pdf`, kind: 'file' },
          { id: 'pid', title: 'P&ID NK-23-0041.pdf', href: `${FUSION}/files/pid-nk-23-0041.pdf`, kind: 'file' },
        ]}
      />
    </div>
  );
}

function SourcesCdfTimeSeries() {
  return (
    <div className="mx-auto w-full max-w-md">
      <SourceList
        title="3 time series"
        sources={[
          { id: 'vt', title: '23-VT-92740', href: `${FUSION}/timeseries/23-VT-92740`, kind: 'timeseries' },
          { id: 'pt', title: '23-PT-92531', href: `${FUSION}/timeseries/23-PT-92531`, kind: 'timeseries' },
          { id: 'tt', title: '23-TT-92532', href: `${FUSION}/timeseries/23-TT-92532`, kind: 'timeseries' },
        ]}
      />
    </div>
  );
}

function SourcesCdfAssets() {
  return (
    <div className="mx-auto w-full max-w-md">
      <SourceList
        title="2 assets"
        sources={[
          { id: 'ka', title: '23-KA-9103 · Recompressor', href: `${FUSION}/assets/23-KA-9103`, kind: 'asset' },
          { id: 'ha', title: '23-HA-9114 · Interstage cooler', href: `${FUSION}/assets/23-HA-9114`, kind: 'asset' },
        ]}
      />
    </div>
  );
}

function SourcesCdfMixed() {
  return (
    <div className="mx-auto w-full max-w-md">
      <SourceList sources={CDF_SOURCES} />
    </div>
  );
}

function SourcesCdfCollapsible() {
  return (
    <div className="mx-auto w-full max-w-md">
      <SourceList sources={CDF_SOURCES} collapsible />
    </div>
  );
}

function SourcesUnderAnswer() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Message isResponse>
        <MessageContent>
          <MessageResponse>
            {'The recompressor **23-KA-9103** tripped at 13:46 on high drive-end vibration: 11.6 mm/s against a trip limit of 11.0 mm/s.'}
          </MessageResponse>
          <SourceList sources={CDF_SOURCES.slice(0, 4)} collapsible defaultOpen />
        </MessageContent>
      </Message>
    </div>
  );
}

function SourcesNumbered() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <p className="text-base leading-6 text-base-foreground">
        Vibration reached 11.6 mm/s{' '}
        <InlineCitation>
          <InlineCitationLink href={`${FUSION}/timeseries/23-VT-92740`} aria-label="Source 1">
            1
          </InlineCitationLink>
        </InlineCitation>{' '}
        and the trip alarm was raised at 13:46{' '}
        <InlineCitation>
          <InlineCitationLink href={`${FUSION}/events/alm-4812`} aria-label="Source 2">
            2
          </InlineCitationLink>
        </InlineCitation>
        .
      </p>
      <Sources>
        <Source href={`${FUSION}/timeseries/23-VT-92740`} title="1 · 23-VT-92740" />
        <Source href={`${FUSION}/events/alm-4812`} title="2 · alm-4812" />
      </Sources>
    </div>
  );
}

function SourcesGroupedByKind() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col">
      <SourceList title="Live data" sources={CDF_SOURCES.slice(0, 3)} />
      <SourceList title="Documents" sources={CDF_SOURCES.slice(4, 6)} />
    </div>
  );
}

function SourcesShowMore() {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? CDF_SOURCES : CDF_SOURCES.slice(0, 3);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-start">
      <SourceList title={`${CDF_SOURCES.length} sources`} sources={visible} />
      <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Show fewer' : `Show ${CDF_SOURCES.length - 3} more`}
      </Button>
    </div>
  );
}

function SourcesNone() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={<SourcesTitle title="No sources" />}>
        <p className="text-sm text-muted-foreground">
          This answer did not use plant data or documents. Check it before you act on it.
        </p>
      </Sources>
    </div>
  );
}

function SourcesDetailed() {
  return (
    <div className="mx-auto w-full max-w-md">
      <Sources title={<SourcesTitle title="2 sources" />}>
        <ul className="flex w-full flex-col gap-3">
          <li className="flex flex-col items-start gap-1">
            <Source href={`${FUSION}/timeseries/23-VT-92740`} title="23-VT-92740" icon={IconChartLine} variant="decorative-3" />
            <p className="text-sm text-muted-foreground">Drive-end vibration, 1-minute values, 12:00 to 14:00.</p>
          </li>
          <li className="flex flex-col items-start gap-1">
            <Source href={`${FUSION}/files/recompressor-operating-manual.pdf`} title="Operating manual.pdf" icon={IconFileText} variant="decorative-2" />
            <p className="text-sm text-muted-foreground">Section 6.3, vibration trip settings, page 48.</p>
          </li>
        </ul>
      </Sources>
    </div>
  );
}

export default definePage({
  id: 'sources',
  title: 'Sources',
  summary:
    'Sources lists what an answer was built from, as links the reader can follow. In an operations assistant that means time series, assets, events and documents as much as web pages.',
  docsSlug: 'sources',
  guidance: {
    use: [
      'Under every answer that states facts about the plant.',
      'Titles the reader recognises: the tag, the file name, the alarm ID.',
      'One decorative colour and icon per kind of source, used consistently.',
      'Collapsed with a count when there are more than a handful.',
    ],
    avoid: [
      'Bare URLs or internal IDs as labels.',
      'Listing sources the answer did not actually use.',
      'Status colours for source chips — they are references, not states.',
      'Leaving the list off silently when an answer has no sources; say so.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'A titled, wrapping row of source links.',
      specimens: [
        {
          id: 'SourcesDefault',
          title: 'Default',
          note: 'A few sources shown outright under a short answer.',
          origin: 'aura',
          size: 'md',
          Component: SourcesDefault,
        },
        {
          id: 'SourcesCountTitle',
          title: 'With count',
          note: 'The title carries the count, which matters most once the list can collapse.',
          origin: 'aura',
          size: 'md',
          Component: SourcesCountTitle,
        },
        {
          id: 'SourcesNoTitle',
          title: 'Without title',
          note: 'Where a surrounding heading already says "Sources", such as a details panel.',
          origin: 'aura',
          size: 'md',
          Component: SourcesNoTitle,
        },
        {
          id: 'SourcesSingle',
          title: 'Single source',
          note: 'One document behind the whole answer; the title drops to the singular.',
          origin: 'aura',
          size: 'md',
          Component: SourcesSingle,
        },
        {
          id: 'SourcesHostnames',
          title: 'Hostname labels',
          note: 'Web results with no usable title fall back to the site they came from.',
          origin: 'aura',
          size: 'md',
          Component: SourcesHostnames,
        },
      ],
    },
    {
      id: 'disclosure',
      title: 'Disclosure',
      description: 'Folding the list behind its title.',
      specimens: [
        {
          id: 'SourcesCollapsible',
          title: 'Collapsed',
          note: 'The resting state in a thread: one line under the answer.',
          origin: 'aura',
          size: 'md',
          Component: SourcesCollapsible,
        },
        {
          id: 'SourcesCollapsibleOpen',
          title: 'Open by default',
          note: 'For the latest answer, or wherever checking the evidence is part of the task.',
          origin: 'aura',
          size: 'md',
          Component: SourcesCollapsibleOpen,
        },
        {
          id: 'SourcesControlled',
          title: 'Controlled',
          note: 'When something else on the screen, such as a link in the text, opens the list.',
          origin: 'aura',
          size: 'md',
          Component: SourcesControlled,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'Icons, colour, long titles and long lists.',
      specimens: [
        {
          id: 'SourcesWithIcons',
          title: 'With icons',
          note: 'An icon per file or source type helps scanning when titles look alike.',
          origin: 'aura',
          size: 'md',
          Component: SourcesWithIcons,
        },
        {
          id: 'SourcesVariants',
          title: 'Decorative variants',
          note: 'Seven decorative colours to tell kinds of source apart; pick one per kind and keep it.',
          origin: 'aura',
          size: 'md',
          Component: SourcesVariants,
        },
        {
          id: 'SourcesLongTitles',
          title: 'Long titles',
          note: 'File names truncate inside a width cap instead of breaking the row.',
          origin: 'aura',
          size: 'md',
          Component: SourcesLongTitles,
        },
        {
          id: 'SourcesMany',
          title: 'Many sources',
          note: 'Short tag labels wrap into rows; past two rows, collapse the list.',
          origin: 'aura',
          size: 'md',
          Component: SourcesMany,
        },
        {
          id: 'SourcesSameTab',
          title: 'Opens in place',
          note: 'Links into the same app stay in the tab; external pages keep the new-tab default.',
          origin: 'aura',
          size: 'md',
          Component: SourcesSameTab,
        },
      ],
    },
    {
      id: 'cdf-sources',
      title: 'CDF sources',
      description: 'SourceList maps each kind of CDF resource to an icon and a colour, and counts for you.',
      specimens: [
        {
          id: 'SourcesCdfFiles',
          title: 'Files',
          note: 'Manuals, procedures and drawings the answer quoted from.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesCdfFiles,
        },
        {
          id: 'SourcesCdfTimeSeries',
          title: 'Time series',
          note: 'The tags whose data produced the numbers in the answer.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesCdfTimeSeries,
        },
        {
          id: 'SourcesCdfAssets',
          title: 'Assets',
          note: 'Equipment the answer is about, labelled with tag and name.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesCdfAssets,
        },
        {
          id: 'SourcesCdfMixed',
          title: 'Mixed kinds',
          note: 'A typical root-cause answer: live data, the asset, the alarm, a manual and a docs page.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesCdfMixed,
        },
        {
          id: 'SourcesCdfCollapsible',
          title: 'Mixed, collapsed',
          note: 'The same list folded behind its count for earlier turns in a thread.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesCdfCollapsible,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Sources next to the answer they support.',
      specimens: [
        {
          id: 'SourcesUnderAnswer',
          title: 'Under an answer',
          note: 'The standard placement: last thing in the assistant message, before the actions.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesUnderAnswer,
        },
        {
          id: 'SourcesNumbered',
          title: 'Numbered to match citations',
          note: 'When the text cites by number, the list repeats the numbers so each claim can be traced.',
          origin: 'custom',
          size: 'md',
          Component: SourcesNumbered,
        },
        {
          id: 'SourcesGroupedByKind',
          title: 'Grouped by kind',
          note: 'Separates live data from documents when the reader trusts them differently.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesGroupedByKind,
        },
        {
          id: 'SourcesShowMore',
          title: 'Show more',
          note: 'Keeps the strongest sources visible and the rest one click away.',
          origin: 'custom',
          size: 'md',
          uses: ['ai/SourceList.tsx'],
          Component: SourcesShowMore,
        },
        {
          id: 'SourcesDetailed',
          title: 'With locations',
          note: 'Says where in each source to look: the time range, the section, the page.',
          origin: 'custom',
          size: 'md',
          Component: SourcesDetailed,
        },
        {
          id: 'SourcesNone',
          title: 'No sources',
          note: 'An ungrounded answer says so plainly, so nobody mistakes it for plant data.',
          origin: 'custom',
          size: 'md',
          Component: SourcesNone,
        },
      ],
    },
  ],
});
