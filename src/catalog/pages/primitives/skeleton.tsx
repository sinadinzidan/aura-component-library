import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconFilter, IconPlus } from '@cognite/aura/icons';
import { useState } from 'react';

import { SkeletonCard } from '../../../library/feedback/SkeletonCard';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { SkeletonTable } from '../../../library/feedback/SkeletonTable';
import { SkeletonText } from '../../../library/feedback/SkeletonText';
import { ALARMS, PEOPLE, SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './skeleton.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const OPERATOR = PEOPLE[0];
const COMPRESSOR_SENSORS = SENSORS.slice(0, 4);
const CHART_BAR_HEIGHTS = ['h-12', 'h-20', 'h-16', 'h-24', 'h-28', 'h-20', 'h-14', 'h-24', 'h-16', 'h-10'] as const;
const DETAIL_FIELDS = ['Tag', 'Type', 'Criticality', 'Parent'] as const;

function SkeletonLine() {
  return (
    <div role="status" aria-label="Loading" className="w-full max-w-xs">
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

function SkeletonParagraph() {
  return (
    <div className="w-full max-w-xs">
      <SkeletonText lines={3} label="Loading description" />
    </div>
  );
}

function SkeletonCircle() {
  return (
    <div role="status" aria-label="Loading avatar" className="size-10 overflow-hidden rounded-full">
      <Skeleton className="size-full" />
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div role="status" aria-label="Loading preview" className="w-full max-w-xs">
      <Skeleton className="h-28 w-full" />
    </div>
  );
}

function SkeletonHeading() {
  return (
    <div role="status" aria-label="Loading heading" className="flex w-full max-w-xs flex-col gap-2">
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}

function SkeletonControl() {
  return (
    <div role="status" aria-label="Loading actions" className="flex items-center gap-2">
      <Skeleton className="h-9 w-40" />
      <Skeleton className="h-9 w-24" />
    </div>
  );
}

function SkeletonAvatarRow() {
  return (
    <div role="status" aria-label="Loading person" className="flex w-full max-w-xs items-center gap-3">
      <div className="size-10 shrink-0 overflow-hidden rounded-full">
        <Skeleton className="size-full" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function SkeletonKeyValue() {
  return (
    <div role="status" aria-label="Loading details" className="w-full max-w-xs">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {DETAIL_FIELDS.map((field, index) => (
          <div key={field} className="contents">
            <dt className="text-muted-foreground">{field}</dt>
            <dd>
              <Skeleton className={`h-4 ${index % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SkeletonListCompact() {
  return (
    <div className="w-full max-w-xs">
      <SkeletonList rows={5} media={false} description={false} label="Loading options" />
    </div>
  );
}

function SkeletonListRows() {
  return (
    <div className="w-full max-w-md">
      <SkeletonList rows={4} label="Loading people" />
    </div>
  );
}

function SkeletonListTrailing() {
  return (
    <div className="w-full max-w-md">
      <SkeletonList rows={4} media={false} trailing label="Loading alarms" />
    </div>
  );
}

function SkeletonTableRows() {
  return <SkeletonTable rows={4} columns={['Tag', 'Name', 'Value', 'Quality', 'Updated']} label="Loading sensors" />;
}

function SkeletonCardPreset() {
  return (
    <div className="w-full max-w-xs">
      <SkeletonCard lines={2} actions label="Loading work order" />
    </div>
  );
}

function SkeletonMediaCard() {
  return (
    <div className="w-full max-w-xs">
      <SkeletonCard media lines={1} label="Loading dashboard preview" />
    </div>
  );
}

function SkeletonKpiTile() {
  return (
    <div role="status" aria-label="Loading availability" className="flex w-full max-w-xs flex-col gap-3 rounded-xl border border-default p-4">
      <span className="text-xs text-muted-foreground">Availability</span>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div role="status" aria-label="Loading chart" className="flex w-full flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-24" />
      </div>
      <div className="flex h-32 items-end gap-3 border-b border-default">
        {CHART_BAR_HEIGHTS.map((height, index) => (
          <Skeleton key={index} className={`${height} flex-1`} />
        ))}
      </div>
      <div className="flex justify-between gap-4">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  );
}

function SkeletonForm() {
  return (
    <div role="status" aria-label="Loading form" className="flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

function SkeletonToContent() {
  const [state, setState] = useState<'loading' | 'ready'>('loading');

  const reload = () => {
    setState('loading');
    void wait(1600).then(() => setState('ready'));
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {state === 'loading' ? (
        <div role="status" aria-label="Loading operator" className="flex h-10 items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-full">
            <Skeleton className="size-full" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      ) : (
        <div className="flex h-10 items-center gap-3">
          <Avatar>
            <AvatarFallback>{OPERATOR.initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col">
            <span className="text-sm font-medium text-base-foreground">{OPERATOR.name}</span>
            <span className="text-xs text-muted-foreground">{OPERATOR.role}</span>
          </div>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={state === 'loading' ? () => setState('ready') : reload}
      >
        {state === 'loading' ? 'Show content' : 'Load again'}
      </Button>
    </div>
  );
}

function SkeletonPartial() {
  return (
    <div role="status" aria-label="Loading sensor values" className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-default p-4">
      <h4 className="text-sm font-medium text-base-foreground">1st stage compressor</h4>
      <dl className="grid grid-cols-2 gap-4">
        {COMPRESSOR_SENSORS.map((sensor) => (
          <div key={sensor.id} className="flex flex-col gap-2">
            <dt className="truncate text-xs text-muted-foreground">{sensor.name}</dt>
            <dd>
              <Skeleton className="h-6 w-20" />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SkeletonLoadingMore() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ul className="flex flex-col gap-4">
        {ALARMS.slice(0, 2).map((alarm) => (
          <li key={alarm.id} className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{alarm.message}</span>
              <span className="text-xs text-muted-foreground">{alarm.sensorTag}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{alarm.value}</span>
          </li>
        ))}
      </ul>
      <SkeletonList rows={2} media={false} trailing label="Loading more alarms" />
    </div>
  );
}

function SkeletonOnMuted() {
  return (
    <div className="w-full max-w-sm rounded-xl bg-base-background p-4">
      <SkeletonList rows={3} label="Loading people" />
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div role="status" aria-label="Loading dashboard" className="flex w-full flex-col gap-4">
      <div className="grid grid-cols-3 gap-4">
        {['Availability', 'Gas export', 'Active alarms'].map((title) => (
          <div key={title} className="flex flex-col gap-3 rounded-xl border border-default p-4">
            <span className="text-xs text-muted-foreground">{title}</span>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-4 rounded-xl border border-default p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-base-foreground">Discharge pressure, last 24 hours</span>
          <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

function SkeletonTablePage() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-xl font-semibold text-base-foreground">Work orders</h4>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <IconFilter /> Filter
          </Button>
          <Button size="sm">
            <IconPlus /> Create work order
          </Button>
        </div>
      </div>
      <SkeletonTable rows={5} columns={['Work order', 'Title', 'Priority', 'Due']} label="Loading work orders" />
    </div>
  );
}

function SkeletonSidePanel() {
  return (
    <div role="status" aria-label="Loading asset details" className="flex w-full max-w-xs flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-default pt-4 text-sm">
        {DETAIL_FIELDS.map((field, index) => (
          <div key={field} className="contents">
            <dt className="text-muted-foreground">{field}</dt>
            <dd>
              <Skeleton className={`h-4 ${index % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SkeletonProfile() {
  return (
    <div role="status" aria-label="Loading profile" className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-center gap-4">
        <div className="size-14 shrink-0 overflow-hidden rounded-full">
          <Skeleton className="size-full" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-7 w-20 shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-4 border-t border-default pt-4">
        {['Shift', 'Site', 'Open work orders'].map((label) => (
          <div key={label} className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">{label}</span>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonFeed() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">Activity</h4>
        <Badge variant="secondary">Today</Badge>
      </div>
      <div role="status" aria-label="Loading activity" className="flex flex-col gap-4">
        {['w-full', 'w-4/5', 'w-2/3'].map((width) => (
          <div key={width} className="flex items-start gap-3">
            <div className="size-8 shrink-0 overflow-hidden rounded-full">
              <Skeleton className="size-full" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className={`h-4 ${width}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default definePage({
  id: 'skeleton',
  title: 'Skeleton',
  summary:
    'Skeletons stand in for content whose layout is known while the data loads. They make the wait feel shorter and keep the page from jumping when content arrives.',
  docsSlug: 'skeleton',
  guidance: {
    use: [
      'Cards, lists, tables and detail panels whose shape is predictable.',
      'Shapes that mirror the real layout: same heights, same rows, same gaps.',
      'Real labels and headers when they are already known; skeleton only what is loading.',
      'role="status" and an aria-label on the loading region.',
    ],
    avoid: [
      'Skeletons for waits under about 300 ms; show nothing.',
      'Skeletons when the result shape is unknown; use a loader.',
      'Swapping pieces in one by one; replace the whole placeholder at once.',
      'Extra animation or colour on top of the built-in pulse.',
    ],
  },
  source,
  sections: [
    {
      id: 'shapes',
      title: 'Shapes',
      description: 'The building blocks. Size each one to the content it stands in for.',
      specimens: [
        {
          id: 'SkeletonLine',
          title: 'Line',
          note: 'A single line of text such as a title or a value.',
          origin: 'aura',
          Component: SkeletonLine,
        },
        {
          id: 'SkeletonParagraph',
          title: 'Paragraph',
          note: 'Body text: full lines with a shorter last line.',
          origin: 'custom',
          uses: ['feedback/SkeletonText.tsx'],
          Component: SkeletonParagraph,
        },
        {
          id: 'SkeletonCircle',
          title: 'Circle',
          note: 'An avatar or round icon; clip the skeleton with a rounded wrapper.',
          origin: 'aura',
          Component: SkeletonCircle,
        },
        {
          id: 'SkeletonBlock',
          title: 'Block',
          note: 'An image, chart or preview with a fixed height.',
          origin: 'aura',
          Component: SkeletonBlock,
        },
        {
          id: 'SkeletonHeading',
          title: 'Heading',
          note: 'A page or panel title with its subtitle.',
          origin: 'aura',
          Component: SkeletonHeading,
        },
        {
          id: 'SkeletonControl',
          title: 'Controls',
          note: 'Controls that depend on the data, such as a filter and an action, at control height.',
          origin: 'aura',
          Component: SkeletonControl,
        },
      ],
    },
    {
      id: 'rows',
      title: 'Rows',
      description: 'Repeating content: people, list items, key-value pairs and table rows.',
      specimens: [
        {
          id: 'SkeletonAvatarRow',
          title: 'Avatar row',
          note: 'One person or entity with a name and a secondary line.',
          origin: 'aura',
          Component: SkeletonAvatarRow,
        },
        {
          id: 'SkeletonKeyValue',
          title: 'Key-value pairs',
          note: 'The labels are known up front; only the values load.',
          origin: 'aura',
          Component: SkeletonKeyValue,
        },
        {
          id: 'SkeletonListCompact',
          title: 'Compact list',
          note: 'Single-line rows such as menu options or navigation items.',
          origin: 'custom',
          uses: ['feedback/SkeletonList.tsx'],
          Component: SkeletonListCompact,
        },
        {
          id: 'SkeletonListRows',
          title: 'List with media',
          note: 'A list of people or assets: avatar, title and description per row.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SkeletonList.tsx'],
          Component: SkeletonListRows,
        },
        {
          id: 'SkeletonListTrailing',
          title: 'List with trailing value',
          note: 'Rows that end in a badge, value or timestamp.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SkeletonList.tsx'],
          Component: SkeletonListTrailing,
        },
        {
          id: 'SkeletonTableRows',
          title: 'Table rows',
          note: 'A table whose columns are known: real headers, placeholder cells, one row per page-size row.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['feedback/SkeletonTable.tsx'],
          Component: SkeletonTableRows,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Blocks',
      description: 'Whole components outlined with several skeletons.',
      specimens: [
        {
          id: 'SkeletonCardPreset',
          title: 'Card',
          note: 'A content card with a title, two lines and footer actions.',
          origin: 'custom',
          uses: ['feedback/SkeletonCard.tsx'],
          Component: SkeletonCardPreset,
        },
        {
          id: 'SkeletonMediaCard',
          title: 'Media card',
          note: 'A card that leads with a preview image or thumbnail.',
          origin: 'custom',
          uses: ['feedback/SkeletonCard.tsx'],
          Component: SkeletonMediaCard,
        },
        {
          id: 'SkeletonKpiTile',
          title: 'KPI tile',
          note: 'The label is static, so it shows at once; value and trend load.',
          origin: 'custom',
          Component: SkeletonKpiTile,
        },
        {
          id: 'SkeletonChart',
          title: 'Chart',
          note: 'A chart card: title, range control, plot area and axis labels keep their place.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: SkeletonChart,
        },
        {
          id: 'SkeletonForm',
          title: 'Form',
          note: 'An edit form that needs the saved values before it can be shown.',
          origin: 'custom',
          Component: SkeletonForm,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'How skeletons hand over to content, and how they sit next to content that is already there.',
      specimens: [
        {
          id: 'SkeletonToContent',
          title: 'Skeleton to content',
          note: 'Same height and positions before and after, so nothing moves on arrival. Click to try.',
          origin: 'custom',
          size: 'md',
          Component: SkeletonToContent,
        },
        {
          id: 'SkeletonPartial',
          title: 'Partial',
          note: 'Titles and labels are known; skeleton only the values that are still loading.',
          origin: 'custom',
          size: 'md',
          Component: SkeletonPartial,
        },
        {
          id: 'SkeletonLoadingMore',
          title: 'Loading more',
          note: 'The next page of a list appears as placeholder rows under the loaded ones.',
          origin: 'custom',
          size: 'md',
          uses: ['feedback/SkeletonList.tsx'],
          Component: SkeletonLoadingMore,
        },
        {
          id: 'SkeletonOnMuted',
          title: 'On a muted page',
          note: 'Keep skeletons on a base-coloured card when the page behind is grey, so they stay visible.',
          origin: 'custom',
          size: 'md',
          surface: 'muted',
          uses: ['feedback/SkeletonList.tsx'],
          Component: SkeletonOnMuted,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Whole views while they load. Static chrome renders at once; data regions wait.',
      specimens: [
        {
          id: 'SkeletonDashboard',
          title: 'Dashboard',
          note: 'KPI tiles and a chart keep their titles and footprint while values load.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: SkeletonDashboard,
        },
        {
          id: 'SkeletonTablePage',
          title: 'List page',
          note: 'The header and primary action work straight away; only the table waits.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['feedback/SkeletonTable.tsx'],
          Component: SkeletonTablePage,
        },
        {
          id: 'SkeletonSidePanel',
          title: 'Detail panel',
          note: 'A side panel opened for one asset: heading, badges and properties.',
          origin: 'custom',
          Component: SkeletonSidePanel,
        },
        {
          id: 'SkeletonProfile',
          title: 'Profile',
          note: 'A person or asset header with an avatar, an action and three facts.',
          origin: 'custom',
          size: 'md',
          Component: SkeletonProfile,
        },
        {
          id: 'SkeletonFeed',
          title: 'Activity feed',
          note: 'Comments or events: avatar, author line and a message of varying length.',
          origin: 'custom',
          size: 'md',
          Component: SkeletonFeed,
        },
      ],
    },
  ],
});
