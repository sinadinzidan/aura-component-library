import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardTitle,
} from '@cognite/aura/components/card';
import { Input } from '@cognite/aura/components/input';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@cognite/aura/components/item';
import { Label } from '@cognite/aura/components/label';
import { Separator } from '@cognite/aura/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBell,
  IconDownload,
  IconFilter,
  IconLayoutGrid,
  IconMinus,
  IconPlus,
  IconSettings,
  IconShare,
  IconTool,
  IconUserPlus,
} from '@cognite/aura/icons';

import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ASSETS, PEOPLE, PLANT_KPIS, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './separator.tsx?raw';

const COMPRESSOR = ASSETS.find((asset) => asset.id === '23-ka-9101') ?? ASSETS[0];
const INGRID = PEOPLE[0];
const PLANNED_ORDERS = WORK_ORDERS.slice(0, 3);

/** A vertical separator fills its row, so cap it at 16px between controls. */
const SHORT = 'data-[orientation=vertical]:h-4';

/** Lets a vertical separator stretch to a row whose height comes from its content. */
const TALL = 'data-[orientation=vertical]:h-auto';

function SeparatorHorizontal() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <p className="text-sm text-base-foreground">Recompressor tripped on high vibration at 13:46.</p>
      <Separator />
      <p className="text-sm text-base-foreground">Bearing inspection is planned for the day shift.</p>
    </div>
  );
}

function SeparatorVertical() {
  return (
    <div className="flex items-center gap-3 text-sm text-base-foreground">
      <span>Nordkapp</span>
      <Separator orientation="vertical" className={SHORT} />
      <span>Gas compression</span>
      <Separator orientation="vertical" className={SHORT} />
      <span>{COMPRESSOR.tag}</span>
    </div>
  );
}

function SeparatorFullHeight() {
  return (
    <div className="flex items-stretch gap-5">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Availability</span>
        <span className="text-xl font-semibold text-base-foreground tabular-nums">
          {PLANT_KPIS.availability.value} %
        </span>
      </div>
      <Separator orientation="vertical" className={TALL} />
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Active alarms</span>
        <span className="text-xl font-semibold text-base-foreground tabular-nums">{PLANT_KPIS.activeAlarms.value}</span>
      </div>
    </div>
  );
}

function SeparatorInset() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3">
        <PersonAvatar name={INGRID.name} colorKey={INGRID.id} sizes="xsm" />
        <span className="text-sm font-medium text-base-foreground">{INGRID.name}</span>
      </div>
      <div className="pl-10">
        <Separator />
      </div>
      <p className="pl-10 text-sm text-medium-foreground">Handed over to the night shift at 19:00.</p>
    </div>
  );
}

function SeparatorWithLabel() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Button variant="secondary" className="w-full">
        Sign in with single sign-on
      </Button>
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or</span>
        <Separator className="flex-1" />
      </div>
      <Button variant="ghost" className="w-full">
        Use an API key
      </Button>
    </div>
  );
}

function SeparatorSectionLabel() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3">
        <h4 className="shrink-0 text-xs font-medium text-muted-foreground">Today</h4>
        <Separator className="flex-1" />
      </div>
      <p className="text-sm text-base-foreground">13:46 · Recompressor tripped</p>
      <div className="flex items-center gap-3">
        <h4 className="shrink-0 text-xs font-medium text-muted-foreground">Yesterday</h4>
        <Separator className="flex-1" />
      </div>
      <p className="text-sm text-base-foreground">17:02 · Separator level deviation cleared</p>
    </div>
  );
}

function SeparatorToolbarGroups() {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Undo">
              <IconArrowBackUp />
            </Button>
          }
        />
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon-sm" aria-label="Redo">
              <IconArrowForwardUp />
            </Button>
          }
        />
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>
      <Separator orientation="vertical" className={SHORT} />
      <Button variant="ghost" size="sm">
        <IconFilter /> Filter
      </Button>
      <Button variant="ghost" size="sm">
        <IconDownload /> Export
      </Button>
    </div>
  );
}

function SeparatorActionGroups() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm">
        <IconShare /> Share
      </Button>
      <Separator orientation="vertical" className={SHORT} />
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          Save draft
        </Button>
        <Button size="sm">Publish</Button>
      </div>
    </div>
  );
}

function SeparatorZoomControls() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon-sm" aria-label="Zoom out">
        <IconMinus />
      </Button>
      <span className="w-10 text-center text-sm text-base-foreground tabular-nums">100%</span>
      <Button variant="ghost" size="icon-sm" aria-label="Zoom in">
        <IconPlus />
      </Button>
      <Separator orientation="vertical" className={SHORT} />
      <Button variant="ghost" size="sm">
        Fit to screen
      </Button>
    </div>
  );
}

function SeparatorFilterBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary">Corrective</Badge>
      <Badge variant="secondary">Priority P1</Badge>
      <Separator orientation="vertical" className={SHORT} />
      <Button variant="ghost" size="sm">
        Clear filters
      </Button>
    </div>
  );
}

function SeparatorCollaborators() {
  return (
    <div className="flex items-center gap-3">
      <AvatarGroup people={PEOPLE} max={3} sizes="xsm" label="People with access" />
      <Separator orientation="vertical" className={SHORT} />
      <Button variant="secondary" size="sm">
        <IconUserPlus /> Invite
      </Button>
    </div>
  );
}

function SeparatorInlineMetadata() {
  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-3">
        <h3 className="text-xl font-semibold text-base-foreground">{COMPRESSOR.name}</h3>
        <StatusBadge status={COMPRESSOR.state} />
      </div>
      <MetadataList
        layout="inline"
        items={[
          { label: 'Tag', value: COMPRESSOR.tag },
          { label: 'Area', value: 'Gas compression' },
          { label: 'Criticality', value: COMPRESSOR.criticality },
          { label: 'Health', value: COMPRESSOR.healthScore },
        ]}
      />
    </div>
  );
}

function SeparatorCardSections() {
  return (
    <Card className="mx-auto w-full max-w-sm self-center">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>{COMPRESSOR.name}</CardTitle>
          <CardDescription>{COMPRESSOR.tag}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <Separator />
      <CardContent>
        <MetadataList
          items={[
            { label: 'Health score', value: COMPRESSOR.healthScore },
            { label: 'Criticality', value: COMPRESSOR.criticality },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function SeparatorCardFooter() {
  return (
    <Card className="mx-auto w-full max-w-sm self-center">
      <CardContent>
        <p className="text-sm text-base-foreground">
          Clean the interstage cooler tube bundle during the planned shutdown window.
        </p>
      </CardContent>
      <Separator />
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Estimated 16 hours</span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button variant="outline" size="sm">
            Open work order
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function SeparatorFormSections() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 self-center">
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-base-foreground">Identity</h4>
        <div>
          <Label htmlFor="separator-form-name">Pipeline name</Label>
          <Input id="separator-form-name" defaultValue="Compressor telemetry" />
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-base-foreground">Schedule</h4>
        <div>
          <Label htmlFor="separator-form-interval">Run every (minutes)</Label>
          <Input id="separator-form-interval" defaultValue="15" inputMode="numeric" />
        </div>
      </div>
    </div>
  );
}

function SeparatorBeforeTotal() {
  const total = PLANNED_ORDERS.reduce((sum, order) => sum + order.estimatedHours, 0);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-2 self-center text-sm">
      {PLANNED_ORDERS.map((order) => (
        <div key={order.id} className="flex items-center justify-between gap-4">
          <span className="min-w-0 truncate text-medium-foreground">{order.title}</span>
          <span className="shrink-0 text-base-foreground tabular-nums">{order.estimatedHours} h</span>
        </div>
      ))}
      <Separator className="my-1" />
      <div className="flex items-center justify-between gap-4 font-semibold text-base-foreground">
        <span>Total planned</span>
        <span className="tabular-nums">{total} h</span>
      </div>
    </div>
  );
}

function SeparatorStatsRow() {
  return (
    <div className="mx-auto flex w-full max-w-md items-stretch justify-between gap-4 self-center">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Availability</span>
        <span className="text-xl font-semibold text-base-foreground tabular-nums">
          {PLANT_KPIS.availability.value} %
        </span>
      </div>
      <Separator orientation="vertical" className={TALL} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Gas export</span>
        <span className="text-xl font-semibold text-base-foreground tabular-nums">
          {PLANT_KPIS.gasExport.value} <span className="text-sm font-medium text-muted-foreground">MSm³/d</span>
        </span>
      </div>
      <Separator orientation="vertical" className={TALL} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Open work orders</span>
        <span className="text-xl font-semibold text-base-foreground tabular-nums">
          {PLANT_KPIS.openWorkOrders.value}
        </span>
      </div>
    </div>
  );
}

function SeparatorListGroups() {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-1 self-center">
      <ItemGroup>
        <Item>
          <ItemMedia>
            <IconLayoutGrid />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Overview</ItemTitle>
          </ItemContent>
        </Item>
        <Item>
          <ItemMedia>
            <IconBell />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Alarms</ItemTitle>
          </ItemContent>
        </Item>
        <Item>
          <ItemMedia>
            <IconTool />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Work orders</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>
      <Separator />
      <ItemGroup>
        <Item>
          <ItemMedia>
            <IconSettings />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Settings</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  );
}

function SeparatorPanelFooter() {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-2 self-center">
      <ItemGroup>
        <Item selected>
          <ItemContent>
            <ItemTitle>Gas compression</ItemTitle>
          </ItemContent>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle>Gas export</ItemTitle>
          </ItemContent>
        </Item>
      </ItemGroup>
      <Separator />
      <ItemGroup>
        <Item>
          <ItemMedia>
            <PersonAvatar name={INGRID.name} colorKey={INGRID.id} sizes="xsm" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{INGRID.name}</ItemTitle>
            <ItemDescription>{INGRID.role}</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    </div>
  );
}

function SeparatorSidePanel() {
  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4 self-center">
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">Asset</h4>
        <MetadataList
          items={[
            { label: 'Tag', value: COMPRESSOR.tag },
            { label: 'Area', value: 'Gas compression' },
          ]}
        />
      </div>
      <Separator />
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-medium text-muted-foreground">Maintenance</h4>
        <MetadataList
          items={[
            { label: 'Last inspected', value: '4 Mar 2026' },
            { label: 'Next overhaul' },
          ]}
        />
      </div>
    </div>
  );
}

function SeparatorSplitPane() {
  return (
    <div className="mx-auto flex w-full max-w-md items-stretch gap-4 self-center">
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">Before</span>
        <span className="text-sm text-base-foreground">High limit 52.0 barg</span>
        <span className="text-sm text-base-foreground">Trip limit 55.0 barg</span>
      </div>
      <Separator orientation="vertical" className={TALL} />
      <div className="flex flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">After</span>
        <span className="text-sm text-base-foreground">High limit 50.0 barg</span>
        <span className="text-sm text-base-foreground">Trip limit 55.0 barg</span>
      </div>
    </div>
  );
}

function SeparatorFooterLinks() {
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>Nordkapp plant</span>
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-3" />
      <span>Data as of 12 Mar, 14:00</span>
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-3" />
      <span>UTC</span>
    </div>
  );
}

export default definePage({
  id: 'separator',
  title: 'Separator',
  summary:
    'A separator is a subtle 1px line between groups that do not belong together. It comes after spacing and headings, not instead of them.',
  docsSlug: 'separator',
  guidance: {
    use: [
      'Between unrelated groups in a toolbar, menu, card or form.',
      'Vertical and 16px tall between buttons or inline metadata.',
      'One line where a change of subject would otherwise be easy to miss.',
    ],
    avoid: [
      'A line between every row or element — spacing and alignment do that job.',
      'Bold or coloured separators; the line never carries meaning.',
      'A separator in place of a heading when the sections need names.',
      'Separators in sparse layouts where whitespace is already enough.',
    ],
  },
  source,
  sections: [
    {
      id: 'orientation',
      title: 'Orientation and labels',
      description: 'Horizontal by default, vertical between things in a row, and the two ways to attach a label.',
      specimens: [
        {
          id: 'SeparatorHorizontal',
          title: 'Horizontal',
          note: 'Two blocks of content on different subjects in the same column.',
          origin: 'aura',
          Component: SeparatorHorizontal,
        },
        {
          id: 'SeparatorVertical',
          title: 'Vertical, 16px',
          note: 'Short pieces of text or controls in a row; cap the height so the line stays quiet.',
          origin: 'aura',
          Component: SeparatorVertical,
        },
        {
          id: 'SeparatorFullHeight',
          title: 'Vertical, full height',
          note: 'Taller blocks side by side; the line stretches to the height of the tallest block.',
          origin: 'aura',
          Component: SeparatorFullHeight,
        },
        {
          id: 'SeparatorInset',
          title: 'Inset',
          note: 'Aligns the line with the text column when rows have leading media.',
          origin: 'aura',
          Component: SeparatorInset,
        },
        {
          id: 'SeparatorWithLabel',
          title: 'With centred label',
          note: 'Two alternatives where the word between them matters, such as "or".',
          origin: 'custom',
          Component: SeparatorWithLabel,
        },
        {
          id: 'SeparatorSectionLabel',
          title: 'With leading label',
          note: 'Day or group dividers in a feed or log, where a full heading would be too heavy.',
          origin: 'custom',
          Component: SeparatorSectionLabel,
        },
      ],
    },
    {
      id: 'toolbars',
      title: 'Toolbars and inline',
      description: 'Vertical separators between groups of controls and inline facts.',
      specimens: [
        {
          id: 'SeparatorToolbarGroups',
          title: 'Toolbar groups',
          note: 'History actions on one side, data actions on the other.',
          origin: 'aura',
          Component: SeparatorToolbarGroups,
        },
        {
          id: 'SeparatorActionGroups',
          title: 'Secondary and primary actions',
          note: 'Keeps a utility action apart from the save and publish pair in a page header.',
          origin: 'aura',
          Component: SeparatorActionGroups,
        },
        {
          id: 'SeparatorZoomControls',
          title: 'Stepper and shortcut',
          note: 'A tight control cluster followed by a related one-off action.',
          origin: 'aura',
          Component: SeparatorZoomControls,
        },
        {
          id: 'SeparatorFilterBar',
          title: 'Filters and reset',
          note: 'Applied filters, then the action that clears them all.',
          origin: 'aura',
          Component: SeparatorFilterBar,
        },
        {
          id: 'SeparatorCollaborators',
          title: 'People and invite',
          note: 'Who is here, then the action that adds someone.',
          origin: 'custom',
          uses: ['display/AvatarGroup.tsx', 'display/PersonAvatar.tsx'],
          Component: SeparatorCollaborators,
        },
        {
          id: 'SeparatorFooterLinks',
          title: 'Footer metadata',
          note: 'Small print at the bottom of a page or chart; the line drops to 12px with the text.',
          origin: 'aura',
          Component: SeparatorFooterLinks,
        },
        {
          id: 'SeparatorInlineMetadata',
          title: 'Metadata under a title',
          note: 'Key facts about a record on one line; separators are placed only between entries.',
          origin: 'custom',
          size: 'md',
          uses: ['display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: SeparatorInlineMetadata,
        },
        {
          id: 'SeparatorStatsRow',
          title: 'Stats row',
          note: 'A few key figures in a header strip, divided at full height.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SeparatorStatsRow,
        },
      ],
    },
    {
      id: 'cards-and-forms',
      title: 'Cards and forms',
      description: 'Horizontal separators inside a container, where they mark a change of role.',
      specimens: [
        {
          id: 'SeparatorCardSections',
          title: 'Card header and body',
          note: 'A header that stays put above content that scrolls or changes.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: SeparatorCardSections,
        },
        {
          id: 'SeparatorCardFooter',
          title: 'Card body and footer',
          note: 'Sets the actions apart from the content they act on.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SeparatorCardFooter,
        },
        {
          id: 'SeparatorFormSections',
          title: 'Form sections',
          note: 'Named groups of fields in a long form; the heading names, the line divides.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SeparatorFormSections,
        },
        {
          id: 'SeparatorBeforeTotal',
          title: 'Before a total',
          note: 'Line items above, their sum below.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SeparatorBeforeTotal,
        },
      ],
    },
    {
      id: 'lists-and-panels',
      title: 'Lists and panels',
      description: 'Between groups of rows and between regions of a panel.',
      specimens: [
        {
          id: 'SeparatorListGroups',
          title: 'List groups',
          note: 'Two sets of rows that need no labels, such as destinations and settings.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SeparatorListGroups,
        },
        {
          id: 'SeparatorPanelFooter',
          title: 'Panel footer',
          note: 'A pinned row, such as the signed-in user, under a list that scrolls.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: SeparatorPanelFooter,
        },
        {
          id: 'SeparatorSidePanel',
          title: 'Property groups',
          note: 'Groups of properties in a details panel, each with a small heading.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: SeparatorSidePanel,
        },
        {
          id: 'SeparatorSplitPane',
          title: 'Side-by-side comparison',
          note: 'Two versions of the same content next to each other.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: SeparatorSplitPane,
        },
      ],
    },
  ],
});
