import { Badge } from '@cognite/aura/components/badge';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbEllipsisButton,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbPageButton,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { Topbar, TopbarBreadcrumbs, TopbarIcon, TopbarLeft } from '@cognite/aura/components/topbar';
import {
  IconBuildingFactory2,
  IconChevronDown,
  IconChevronRight,
  IconEngine,
  IconGauge,
  IconHierarchy,
  IconHome,
  IconLock,
  IconPlus,
  IconShare,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import { CollapsingBreadcrumb } from '../../../library/navigation/CollapsingBreadcrumb';
import type { BreadcrumbTrailItem } from '../../../library/navigation/CollapsingBreadcrumb';
import { ASSETS, childrenOf, findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './breadcrumb.tsx?raw';

/** Keeps the catalog on this page. In an app, drop it and let the router follow the link. */
const stay = (event: MouseEvent) => event.preventDefault();

const SENSOR_TRAIL: readonly BreadcrumbTrailItem[] = [
  { id: 'nk', label: 'Nordkapp plant' },
  { id: 'nk-23', label: 'Gas compression' },
  { id: '23-ka-9101', label: '1st stage compressor' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'pt-92531', label: 'Discharge pressure' },
];

function BreadcrumbBasic() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets" onClick={stay}>
            Assets
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk-23" onClick={stay}>
            Gas compression
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Recompressor</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbParentOnly() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/work-orders" onClick={stay}>
            Work orders
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>WO-104482</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbFullTrail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk" onClick={stay}>
            Nordkapp plant
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk-23" onClick={stay}>
            Gas compression
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/23-ka-9101" onClick={stay}>
            1st stage compressor
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Discharge pressure</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbChevronSeparator() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/data-sets" onClick={stay}>
            Data sets
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <IconChevronRight className="text-muted-foreground" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="/data-sets/historian" onClick={stay}>
            Historian
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <IconChevronRight className="text-muted-foreground" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Time series</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbRouterButtons() {
  const [visited, setVisited] = useState('Pipelines');

  return (
    <div className="flex flex-col items-center gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<button type="button" />} onClick={() => setVisited('Integrations')}>
              Integrations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink render={<button type="button" />} onClick={() => setVisited('Pipelines')}>
              Pipelines
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Historian sync</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="text-xs text-muted-foreground">Last navigation request: {visited}</p>
    </div>
  );
}

function BreadcrumbLeadingIcon() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" onClick={stay}>
            <IconHome className="size-4" /> Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboards" onClick={stay}>
            Dashboards
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Flaring</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbIconPerLevel() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk" onClick={stay}>
            <IconBuildingFactory2 className="size-4" /> Nordkapp
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk-23" onClick={stay}>
            <IconHierarchy className="size-4" /> Gas compression
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/23-ka-9101" onClick={stay}>
            <IconEngine className="size-4" /> 23-KA-9101
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <IconGauge className="size-4" /> 23-PT-92531
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbIconOnlyRoot() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Tooltip>
            <TooltipTrigger
              render={
                <BreadcrumbLink href="/" aria-label="Home" onClick={stay}>
                  <IconHome className="size-4" />
                </BreadcrumbLink>
              }
            />
            <TooltipContent>Home</TooltipContent>
          </Tooltip>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/alarms" onClick={stay}>
            Alarms
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>ALM-4812</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbTruncatedLabel() {
  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem>
          <BreadcrumbLink href="/work-orders" onClick={stay}>
            Work orders
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem className="min-w-0">
          <Tooltip>
            <TooltipTrigger
              render={
                <BreadcrumbPage>
                  <span className="block max-w-44 truncate">Inspect recompressor drive-end bearing</span>
                </BreadcrumbPage>
              }
            />
            <TooltipContent>Inspect recompressor drive-end bearing</TooltipContent>
          </Tooltip>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbWithTag() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets" onClick={stay}>
            Assets
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            Recompressor
            <span className="font-mono text-xs font-normal text-muted-foreground">23-KA-9103</span>
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbWithStatus() {
  return (
    <div className="flex items-center gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/assets/nk-23" onClick={stay}>
              Gas compression
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Recompressor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Badge variant="error" dot>
        Tripped
      </Badge>
    </div>
  );
}

function BreadcrumbStaticEllipsis() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk" onClick={stay}>
            Nordkapp plant
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbEllipsis />
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/23-ka-9101/sensors" onClick={stay}>
            Sensors
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Discharge pressure</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbOverflowMenu() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk" onClick={stay}>
            Nordkapp plant
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbEllipsis>
          <DropdownMenu>
            <DropdownMenuTrigger render={<BreadcrumbEllipsisButton aria-label="Show hidden pages" />} />
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Gas compression</DropdownMenuItem>
              <DropdownMenuItem>1st stage compressor</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbEllipsis>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/23-ka-9101/sensors" onClick={stay}>
            Sensors
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Discharge pressure</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbCollapsing() {
  const [depth, setDepth] = useState(SENSOR_TRAIL.length);
  const trail = SENSOR_TRAIL.slice(0, depth);

  return (
    <div className="flex flex-col items-center gap-3">
      <CollapsingBreadcrumb
        items={trail}
        onNavigate={(item) => setDepth(SENSOR_TRAIL.findIndex((entry) => entry.id === item.id) + 1)}
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={depth === SENSOR_TRAIL.length}
        onClick={() => setDepth(SENSOR_TRAIL.length)}
      >
        Back to the deepest page
      </Button>
    </div>
  );
}

function BreadcrumbCollapsingLongLabels() {
  return (
    <CollapsingBreadcrumb
      maxVisible={3}
      maxLabelLength={18}
      items={[
        { id: 'docs', label: 'Documents' },
        { id: 'nk-23', label: 'Gas compression' },
        { id: 'vendor', label: 'Vendor documentation and data sheets' },
        { id: 'file', label: '23-KA-9101 compressor performance curves rev C' },
      ]}
      onNavigate={() => undefined}
    />
  );
}

function BreadcrumbPageActions() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboards" onClick={stay}>
            Dashboards
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <BreadcrumbPageButton>
                  Compression overview <IconChevronDown className="size-4 text-muted-foreground" />
                </BreadcrumbPageButton>
              }
            />
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem>Move to folder</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete dashboard</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbSiblingSwitcher() {
  const areas = childrenOf('nk');
  const [areaId, setAreaId] = useState('nk-23');
  const area = findAsset(areaId);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/assets/nk" onClick={stay}>
            Nordkapp plant
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <BreadcrumbLink render={<button type="button" />} aria-label={`${area?.name}, switch area`}>
                  {area?.name} <IconChevronDown className="size-4" />
                </BreadcrumbLink>
              }
            />
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={areaId} onValueChange={setAreaId}>
                {areas.map((entry) => (
                  <DropdownMenuRadioItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Equipment</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbLoadingCurrent() {
  return (
    <Breadcrumb aria-busy="true">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/work-orders" onClick={stay}>
            Work orders
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage aria-label="Loading work order">
            <Skeleton className="h-4 w-36" />
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbNoAccess() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/data-sets" onClick={stay}>
            Data sets
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <Tooltip>
            <TooltipTrigger
              render={
                <span
                  tabIndex={0}
                  className="inline-flex h-7 items-center gap-2 rounded-md px-1.5 text-sm text-muted-foreground"
                >
                  <IconLock className="size-4" /> Restricted
                </span>
              }
            />
            <TooltipContent>You do not have access to this data set. Ask its owner to share it.</TooltipContent>
          </Tooltip>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Flow report</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbInTopbar() {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-default">
      <Topbar>
        <TopbarLeft>
          <TopbarIcon>
            <IconBuildingFactory2 />
          </TopbarIcon>
          <TopbarBreadcrumbs>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/" onClick={stay}>
                  Asset health
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/assets/nk-23" onClick={stay}>
                  Gas compression
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>1st stage compressor</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </TopbarBreadcrumbs>
        </TopbarLeft>
      </Topbar>
      <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">Page content</div>
    </div>
  );
}

function BreadcrumbPageHeader() {
  return (
    <div className="flex w-full flex-col gap-2">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/assets/nk" onClick={stay}>
              Nordkapp plant
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/assets/nk-23" onClick={stay}>
              Gas compression
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>1st stage compressor</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1.5">
        <div>
          <h4 className="text-xl font-semibold text-base-foreground">1st stage compressor</h4>
          <p className="text-sm text-muted-foreground">23-KA-9101 · Criticality A · Running</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost">
            <IconShare /> Share
          </Button>
          <Button>
            <IconPlus /> Create work order
          </Button>
        </div>
      </div>
    </div>
  );
}

function BreadcrumbDrillDown() {
  const [assetId, setAssetId] = useState('nk-23');
  const trail: BreadcrumbTrailItem[] = [];
  for (let asset = findAsset(assetId); asset; asset = findAsset(asset.parentId ?? '')) {
    trail.unshift({ id: asset.id, label: asset.name });
  }
  const children = ASSETS.filter((asset) => asset.parentId === assetId);

  return (
    <div className="flex w-full flex-col gap-3">
      <CollapsingBreadcrumb items={trail} onNavigate={(item) => setAssetId(item.id)} />
      {children.length === 0 ? (
        <p className="px-1.5 text-sm text-muted-foreground">
          {findAsset(assetId)?.tag} has no child assets. Use the breadcrumb to go back up.
        </p>
      ) : (
        <ul className="flex flex-col">
          {children.map((child) => (
            <li key={child.id}>
              <Button variant="ghost" className="w-full justify-between" onClick={() => setAssetId(child.id)}>
                <span className="flex items-center gap-3">
                  <span className="w-24 text-left font-mono text-xs text-muted-foreground">{child.tag}</span>
                  {child.name}
                </span>
                <IconChevronRight />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BreadcrumbSidePanel() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-xl bg-muted-background p-4">
      <CollapsingBreadcrumb
        maxVisible={3}
        items={[
          { id: 'nk', label: 'Nordkapp' },
          { id: 'nk-23', label: 'Gas compression' },
          { id: '23-ka-9101', label: '23-KA-9101' },
          { id: 'sensors', label: 'Sensors' },
          { id: 'pt-92531', label: '23-PT-92531' },
        ]}
        onNavigate={() => undefined}
      />
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 px-1.5 text-sm">
        <dt className="text-muted-foreground">Value</dt>
        <dd className="text-right tabular-nums text-base-foreground">48.6 barg</dd>
        <dt className="text-muted-foreground">High limit</dt>
        <dd className="text-right tabular-nums text-base-foreground">52.0 barg</dd>
        <dt className="text-muted-foreground">Quality</dt>
        <dd className="text-right text-base-foreground">Good</dd>
      </dl>
    </div>
  );
}

export default definePage({
  id: 'breadcrumb',
  title: 'Breadcrumb',
  summary:
    'Shows where the current page sits in the product hierarchy and lets people step back up it. Location-based, not history-based: it reflects structure, not the route the user took.',
  docsSlug: 'breadcrumbs',
  guidance: {
    use: [
      'On pages two or more levels deep, with links to every ancestor.',
      'Labels that match the titles of the pages they lead to.',
      'An overflow menu for the middle of a deep trail: keep the first item and the last two.',
      'A tooltip with the full text on any label that is truncated.',
    ],
    avoid: [
      'Making the current page a link.',
      'Pairing a breadcrumb with a back button, or showing two trails on one page.',
      'Wrapping labels onto a second line.',
      'A breadcrumb in a flat product, or for switching between pages at the same level.',
    ],
  },
  source,
  sections: [
    {
      id: 'trail',
      title: 'Trail',
      description: 'Links for ancestors, plain text for the current page, a separator between each.',
      specimens: [
        {
          id: 'BreadcrumbBasic',
          title: 'Three levels',
          note: 'The usual case: section, parent, current page.',
          origin: 'aura',
          Component: BreadcrumbBasic,
        },
        {
          id: 'BreadcrumbParentOnly',
          title: 'Parent and page',
          note: 'A detail page opened from a list; one step back is all there is.',
          origin: 'aura',
          Component: BreadcrumbParentOnly,
        },
        {
          id: 'BreadcrumbChevronSeparator',
          title: 'Chevron separator',
          note: 'Trails that read as drill-down steps, or where a slash clashes with tags such as 23/KA.',
          origin: 'aura',
          Component: BreadcrumbChevronSeparator,
        },
        {
          id: 'BreadcrumbRouterButtons',
          title: 'In-app navigation',
          note: 'Ancestors handled by the host or a client router rather than a URL. Click one to try.',
          origin: 'aura',
          Component: BreadcrumbRouterButtons,
        },
        {
          id: 'BreadcrumbFullTrail',
          title: 'Four levels in full',
          note: 'Deep hierarchies where every level is a useful place to return to and space allows.',
          origin: 'aura',
          size: 'lg',
          Component: BreadcrumbFullTrail,
        },
      ],
    },
    {
      id: 'content',
      title: 'Label content',
      description: 'Icons, identifiers and long names inside the items.',
      specimens: [
        {
          id: 'BreadcrumbLeadingIcon',
          title: 'Icon on the root',
          note: 'Marks where the trail starts when the root is the app home.',
          origin: 'aura',
          Component: BreadcrumbLeadingIcon,
        },
        {
          id: 'BreadcrumbIconOnlyRoot',
          title: 'Icon-only root',
          note: 'Saves a label when home is obvious; needs an accessible name and a tooltip.',
          origin: 'aura',
          Component: BreadcrumbIconOnlyRoot,
        },
        {
          id: 'BreadcrumbWithTag',
          title: 'Name with identifier',
          note: 'Objects people know by tag as much as by name.',
          origin: 'custom',
          Component: BreadcrumbWithTag,
        },
        {
          id: 'BreadcrumbIconPerLevel',
          title: 'Icon per level',
          note: 'Levels of different types — site, area, equipment, sensor. All items or none.',
          origin: 'aura',
          size: 'lg',
          Component: BreadcrumbIconPerLevel,
        },
        {
          id: 'BreadcrumbTruncatedLabel',
          title: 'Truncated label',
          note: 'User-written titles of unknown length; the tooltip carries the full text.',
          origin: 'aura',
          Component: BreadcrumbTruncatedLabel,
        },
        {
          id: 'BreadcrumbWithStatus',
          title: 'With status',
          note: 'A page whose object has a state worth seeing before anything else; the badge sits outside the trail.',
          origin: 'custom',
          Component: BreadcrumbWithStatus,
        },
      ],
    },
    {
      id: 'overflow-and-states',
      title: 'Overflow and states',
      description: 'What happens when the trail is too deep, still loading, or partly out of reach.',
      specimens: [
        {
          id: 'BreadcrumbStaticEllipsis',
          title: 'Collapsed, not reachable',
          note: 'Only when the hidden levels are not pages of their own. Otherwise use the menu.',
          origin: 'aura',
          size: 'md',
          Component: BreadcrumbStaticEllipsis,
        },
        {
          id: 'BreadcrumbOverflowMenu',
          title: 'Overflow menu',
          note: 'The standard collapse: first item, a menu of the middle, the last two.',
          origin: 'aura',
          size: 'md',
          Component: BreadcrumbOverflowMenu,
        },
        {
          id: 'BreadcrumbCollapsing',
          title: 'Collapses by depth',
          note: 'Trails built from data: it folds itself past four levels. Go up a level to see it expand.',
          origin: 'custom',
          size: 'md',
          uses: ['navigation/CollapsingBreadcrumb.tsx'],
          Component: BreadcrumbCollapsing,
        },
        {
          id: 'BreadcrumbCollapsingLongLabels',
          title: 'Deep trail, long names',
          note: 'Document and folder paths: both the depth and the label length are capped.',
          origin: 'custom',
          size: 'md',
          uses: ['navigation/CollapsingBreadcrumb.tsx'],
          Component: BreadcrumbCollapsingLongLabels,
        },
        {
          id: 'BreadcrumbLoadingCurrent',
          title: 'Current page loading',
          note: 'The ancestors are known from the route; the page name arrives with the data.',
          origin: 'custom',
          Component: BreadcrumbLoadingCurrent,
        },
        {
          id: 'BreadcrumbNoAccess',
          title: 'Ancestor without access',
          note: 'Keep the level in the trail so the location is honest, and say why it cannot be opened.',
          origin: 'custom',
          Component: BreadcrumbNoAccess,
        },
      ],
    },
    {
      id: 'menus',
      title: 'With menus',
      description: 'An item that opens a menu instead of navigating.',
      specimens: [
        {
          id: 'BreadcrumbPageActions',
          title: 'Current page actions',
          note: 'Rename, duplicate or delete the page from its own name, as in document editors.',
          origin: 'aura',
          size: 'md',
          Component: BreadcrumbPageActions,
        },
        {
          id: 'BreadcrumbSiblingSwitcher',
          title: 'Sibling switcher',
          note: 'Jumping sideways to another area without going up a level first.',
          origin: 'custom',
          size: 'md',
          Component: BreadcrumbSiblingSwitcher,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Where the trail sits on a real screen.',
      specimens: [
        {
          id: 'BreadcrumbPageHeader',
          title: 'Above a page title',
          note: 'Apps without a topbar trail: breadcrumb, then title and page actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: BreadcrumbPageHeader,
        },
        {
          id: 'BreadcrumbInTopbar',
          title: 'In the topbar',
          note: 'The default home of the trail in a Flows app, after the app mark.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: BreadcrumbInTopbar,
        },
        {
          id: 'BreadcrumbDrillDown',
          title: 'Hierarchy browser',
          note: 'Drilling into a tree one level at a time: rows go down, the breadcrumb goes up.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          uses: ['navigation/CollapsingBreadcrumb.tsx'],
          Component: BreadcrumbDrillDown,
        },
        {
          id: 'BreadcrumbSidePanel',
          title: 'Narrow side panel',
          note: 'A detail panel with little room: everything between the root and the parent folds into the menu.',
          origin: 'custom',
          size: 'md',
          uses: ['navigation/CollapsingBreadcrumb.tsx'],
          Component: BreadcrumbSidePanel,
        },
      ],
    },
  ],
});
