import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@cognite/aura/components/hover-card';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { IconExternalLink, IconLock } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ALARMS, PEOPLE, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { formatAgo, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './hover-card.tsx?raw';

const LINK = 'rounded-sm font-medium text-link-foreground underline-offset-4 hover:text-link-foreground-hover hover:underline';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const ALIGNMENTS = ['start', 'center', 'end'] as const;

// The links in these specimens lead nowhere; a real trigger keeps its normal navigation.
const stay = (event: MouseEvent<HTMLAnchorElement>) => event.preventDefault();

type AssetCardProps = {
  assetId: string;
};

function AssetCard({ assetId }: AssetCardProps) {
  const asset = findAsset(assetId);
  if (!asset) return null;
  const parent = asset.parentId ? findAsset(asset.parentId) : undefined;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-base-foreground">{asset.name}</p>
          <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
        </div>
        <StatusBadge status={asset.state} />
      </div>
      <MetadataList
        items={[
          { label: 'Area', value: parent?.name },
          { label: 'Health score', value: <span className="tabular-nums">{asset.healthScore}</span> },
          { label: 'Criticality', value: asset.criticality },
        ]}
      />
    </div>
  );
}

type PersonCardProps = {
  personId: string;
};

function PersonCard({ personId }: PersonCardProps) {
  const person = findPerson(personId);
  if (!person) return null;

  return (
    <div className="flex items-center gap-3">
      <PersonAvatar name={person.name} colorKey={person.id} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-base-foreground">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">{person.role}</p>
      </div>
    </div>
  );
}

function HoverCardBasic() {
  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>23-KA-9101</HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm font-semibold text-base-foreground">1st stage compressor</p>
        <p className="pt-1 text-sm text-muted-foreground">Gas compression, Nordkapp plant.</p>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardInSentence() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      The recompressor tripped at 13:46 and{' '}
      <HoverCard>
        <HoverCardTrigger render={<a href="#work-order" className={LINK} onClick={stay} />}>WO-104482</HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm font-semibold text-base-foreground">{WORK_ORDERS[0].title}</p>
          <p className="pt-1 text-sm text-muted-foreground">Corrective, priority P1, in progress.</p>
        </HoverCardContent>
      </HoverCard>{' '}
      was raised to inspect the drive-end bearing.
    </p>
  );
}

function HoverCardOnAvatar() {
  const person = PEOPLE[2];

  return (
    <HoverCard>
      <HoverCardTrigger
        render={<a href="#person" className="rounded-full" aria-label={`Open ${person.name}`} onClick={stay} />}
      >
        <PersonAvatar name={person.name} colorKey={person.id} />
      </HoverCardTrigger>
      <HoverCardContent>
        <PersonCard personId={person.id} />
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardWide() {
  const alarm = ALARMS[0];

  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#alarm" className={LINK} onClick={stay} />}>Alarm 4812</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <p className="text-sm font-semibold text-base-foreground">{alarm.message}</p>
        <p className="pt-1 text-sm text-muted-foreground">
          {alarm.sensorTag} read {alarm.value} against a trip limit of {alarm.limit}. Raised{' '}
          {formatAgo(alarm.raisedAt)}.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardSides() {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
      {SIDES.map((side) => (
        <HoverCard key={side}>
          <HoverCardTrigger render={<a href="#side" className={LINK} onClick={stay} />}>Opens on {side}</HoverCardTrigger>
          <HoverCardContent side={side} className="w-48">
            <p className="text-sm text-muted-foreground">Opens on the {side} and flips when there is no room.</p>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}

function HoverCardAlignments() {
  return (
    <div className="flex flex-col items-center gap-4 text-sm">
      {ALIGNMENTS.map((align) => (
        <HoverCard key={align}>
          <HoverCardTrigger render={<a href="#align" className={LINK} onClick={stay} />}>
            Aligned to the {align} of this link
          </HoverCardTrigger>
          <HoverCardContent align={align} className="w-40">
            <p className="text-sm text-muted-foreground">Align {align}.</p>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}

function HoverCardQuick() {
  return (
    <HoverCard openDelay={100} closeDelay={100}>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>23-KA-9102</HoverCardTrigger>
      <HoverCardContent>
        <AssetCard assetId="23-ka-9102" />
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardPatient() {
  return (
    <HoverCard openDelay={900}>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>27-PA-2001A</HoverCardTrigger>
      <HoverCardContent>
        <AssetCard assetId="27-pa-2001a" />
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardLingering() {
  return (
    <HoverCard closeDelay={600}>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>20-VA-1001</HoverCardTrigger>
      <HoverCardContent sideOffset={12}>
        <AssetCard assetId="20-va-1001" />
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardUserProfile() {
  const person = PEOPLE[0];

  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#person" className={LINK} onClick={stay} />}>{person.name}</HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex flex-col gap-3">
          <PersonCard personId={person.id} />
          <MetadataList
            items={[
              { label: 'Site', value: 'Nordkapp' },
              { label: 'Shift', value: 'Day, 07:00 to 19:00' },
              { label: 'On call', value: 'Yes' },
            ]}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardAssetPreview() {
  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>23-KA-9103</HoverCardTrigger>
      <HoverCardContent className="w-72">
        <AssetCard assetId="23-ka-9103" />
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardLinkPreview() {
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <a href="https://docs.cognite.com/cdf/dm/" target="_blank" rel="noreferrer" className={LINK}>
            Data modeling guide
          </a>
        }
      />
      <HoverCardContent className="w-72">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          docs.cognite.com <IconExternalLink aria-hidden="true" className="size-3" />
        </p>
        <p className="pt-1 text-sm font-semibold text-base-foreground">About data modeling</p>
        <p className="pt-1 text-sm text-muted-foreground">
          How spaces, containers and views describe industrial data as a graph. Opens in a new tab.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardDataSet() {
  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#data-set" className={LINK} onClick={stay} />}>
        Nordkapp compressor telemetry
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-base-foreground">Nordkapp compressor telemetry</p>
            <p className="pt-1 text-sm text-muted-foreground">Process values from the OPC UA historian, area NK-23.</p>
          </div>
          <MetadataList
            items={[
              { label: 'Time series', value: <span className="tabular-nums">1,284</span> },
              { label: 'Last updated', value: '2 min ago' },
              { label: 'Owner', value: findPerson('ak')?.name },
            ]}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardTimeSeries() {
  const sensor = SENSORS[2];
  const position = ((sensor.value - sensor.rangeMin) / (sensor.rangeMax - sensor.rangeMin)) * 100;
  const limit = ((sensor.highLimit - sensor.rangeMin) / (sensor.rangeMax - sensor.rangeMin)) * 100;

  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#time-series" className={`${LINK} font-mono`} onClick={stay} />}>
        {sensor.tag}
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <p className="text-xs text-muted-foreground">{sensor.name}</p>
        <p className="pt-1 text-2xl font-semibold tabular-nums text-base-foreground">
          {sensor.value.toFixed(sensor.decimals)}{' '}
          <span className="text-sm font-medium text-muted-foreground">{sensor.unit}</span>
        </p>
        <div
          className="relative mt-3 h-1.5 rounded-full bg-muted-background"
          role="img"
          aria-label={`${sensor.value} ${sensor.unit} on a range of ${sensor.rangeMin} to ${sensor.rangeMax}, high limit ${sensor.highLimit}`}
        >
          <div className="h-full rounded-full bg-chart-1-300" style={{ width: `${position}%` }} />
          <div className="absolute -top-1 h-3.5 w-0.5 bg-base-foreground" style={{ left: `${limit}%` }} />
        </div>
        <div className="flex justify-between pt-2 text-xs tabular-nums text-muted-foreground">
          <span>
            {sensor.rangeMin} {sensor.unit}
          </span>
          <span>
            High limit {sensor.highLimit} {sensor.unit}
          </span>
          <span>
            {sensor.rangeMax} {sensor.unit}
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardWorkOrder() {
  const order = WORK_ORDERS[2];

  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#work-order" className={LINK} onClick={stay} />}>{order.id}</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-semibold text-base-foreground">{order.title}</p>
            <StatusBadge status={order.status} />
          </div>
          <MetadataList
            items={[
              { label: 'Asset', value: findAsset(order.assetId)?.tag },
              { label: 'Assignee', value: findPerson(order.assigneeId)?.name },
              { label: 'Due', value: formatDate(order.dueAt) },
            ]}
          />
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardGlossary() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      Purge with nitrogen until the gas test reads below 1%{' '}
      <HoverCard>
        <HoverCardTrigger
          render={
            <a
              href="#glossary"
              className="rounded-sm underline decoration-dotted underline-offset-4"
              onClick={stay}
            />
          }
        >
          LEL
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-sm font-semibold text-base-foreground">Lower explosive limit</p>
          <p className="pt-1 text-sm text-muted-foreground">
            The lowest concentration of gas in air that can ignite. Hot work needs a reading below 1%.
          </p>
        </HoverCardContent>
      </HoverCard>
      .
    </p>
  );
}

function HoverCardLoading() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    const handle = window.setTimeout(() => setLoaded(true), 1200);
    return () => window.clearTimeout(handle);
  }, [open, loaded]);

  return (
    <HoverCard open={open} onOpenChange={setOpen}>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>23-HA-9114</HoverCardTrigger>
      <HoverCardContent className="w-72" aria-busy={!loaded}>
        {loaded ? (
          <AssetCard assetId="23-ha-9114" />
        ) : (
          <div className="flex flex-col gap-3" role="status" aria-label="Loading asset">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardNoAccess() {
  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>HF-31-KA-1001</HoverCardTrigger>
      <HoverCardContent>
        <div className="flex items-start gap-3">
          <IconLock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-semibold text-base-foreground">No access to Hammerfest LNG</p>
            <p className="pt-1 text-sm text-muted-foreground">Ask a site admin for the asset reader role to see it.</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardStaleData() {
  const sensor = SENSORS[11];

  return (
    <HoverCard>
      <HoverCardTrigger render={<a href="#time-series" className={`${LINK} font-mono`} onClick={stay} />}>
        {sensor.tag}
      </HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-base-foreground">{sensor.name}</p>
          <Badge variant="warning">Bad quality</Badge>
        </div>
        <p className="pt-1 text-sm text-muted-foreground">
          No valid value for 9 hours. The transmitter is being replaced under WO-104479.
        </p>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardInList() {
  return (
    <ul className="flex w-full max-w-md flex-col gap-3 text-sm">
      {WORK_ORDERS.slice(0, 4).map((order) => {
        const asset = findAsset(order.assetId);
        return (
          <li key={order.id} className="flex items-center justify-between gap-4">
            <span className="min-w-0 truncate text-base-foreground">{order.title}</span>
            <HoverCard>
              <HoverCardTrigger render={<a href="#asset" className={`${LINK} shrink-0 font-mono`} onClick={stay} />}>
                {asset?.tag}
              </HoverCardTrigger>
              <HoverCardContent align="end" className="w-72">
                <AssetCard assetId={order.assetId} />
              </HoverCardContent>
            </HoverCard>
          </li>
        );
      })}
    </ul>
  );
}

function HoverCardMention() {
  const author = PEOPLE[4];
  const mentioned = PEOPLE[3];

  return (
    <div className="flex w-full max-w-md items-start gap-3">
      <PersonAvatar name={author.name} colorKey={author.id} sizes="xsm" />
      <div className="min-w-0 text-sm">
        <p className="font-medium text-base-foreground">
          {author.name} <span className="font-normal text-muted-foreground">· 14 min ago</span>
        </p>
        <p className="pt-1 text-base-foreground">
          Isolation is in place.{' '}
          <HoverCard>
            <HoverCardTrigger render={<a href="#person" className={LINK} onClick={stay} />}>
              @{mentioned.name}
            </HoverCardTrigger>
            <HoverCardContent align="start">
              <PersonCard personId={mentioned.id} />
            </HoverCardContent>
          </HoverCard>{' '}
          can start on the bearing when the gas test is signed.
        </p>
      </div>
    </div>
  );
}

function HoverCardWithAction() {
  return (
    <HoverCard closeDelay={300}>
      <HoverCardTrigger render={<a href="#asset" className={LINK} onClick={stay} />}>23-GT-9001</HoverCardTrigger>
      <HoverCardContent className="w-72">
        <div className="flex flex-col gap-4">
          <AssetCard assetId="23-gt-9001" />
          <Button variant="outline" size="sm" className="w-full">
            Open asset page
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function HoverCardAvatarRow() {
  return (
    <div className="flex items-center gap-2">
      {PEOPLE.slice(0, 4).map((person) => (
        <HoverCard key={person.id} openDelay={200}>
          <HoverCardTrigger
            render={<a href="#person" className="rounded-full" aria-label={`Open ${person.name}`} onClick={stay} />}
          >
            <PersonAvatar name={person.name} colorKey={person.id} sizes="xsm" />
          </HoverCardTrigger>
          <HoverCardContent side="top">
            <PersonCard personId={person.id} />
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );
}

export default definePage({
  id: 'hover-card',
  title: 'Hover card',
  summary:
    'A hover card previews the thing a link points to, such as a person, an asset or a document, when the pointer rests on it or it takes keyboard focus.',
  guidance: {
    use: [
      'A read-only preview of a linked record, so users can decide whether to follow the link.',
      'A real link as the trigger; the card adds to the destination, it never replaces it.',
      'The few facts that identify the record: name, status, one or two key values.',
      'A longer open delay in dense tables, so cards do not flicker as the pointer crosses.',
    ],
    avoid: [
      'Anything the user must read or do; hover is not available on touch.',
      'Forms and controls; use a popover when users need to interact.',
      'A one-line hint; that is a tooltip.',
      'Repeating what the row or page already shows.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Hover or focus a link to open its card.',
      specimens: [
        {
          id: 'HoverCardBasic',
          title: 'Basic',
          note: 'A tag or ID that means little on its own gets a name and a place.',
          origin: 'aura',
          Component: HoverCardBasic,
        },
        {
          id: 'HoverCardInSentence',
          title: 'In running text',
          note: 'A reference inside a sentence, previewed without breaking the read.',
          origin: 'aura',
          Component: HoverCardInSentence,
        },
        {
          id: 'HoverCardOnAvatar',
          title: 'On an avatar',
          note: 'An avatar that links to a profile and shows only initials at rest.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: HoverCardOnAvatar,
        },
        {
          id: 'HoverCardWide',
          title: 'Wide',
          note: 'Wider than the default 256px when the preview is a sentence or two.',
          origin: 'aura',
          Component: HoverCardWide,
        },
      ],
    },
    {
      id: 'placement-and-timing',
      title: 'Placement and timing',
      description: 'Which side the card opens on, how it lines up, and how quickly it opens and closes.',
      specimens: [
        {
          id: 'HoverCardSides',
          title: 'Sides',
          note: 'Bottom by default; choose the side that keeps the neighbouring content readable.',
          origin: 'aura',
          Component: HoverCardSides,
        },
        {
          id: 'HoverCardAlignments',
          title: 'Alignments',
          note: 'Start for links at the left of a column, end for links at the right edge.',
          origin: 'aura',
          Component: HoverCardAlignments,
        },
        {
          id: 'HoverCardQuick',
          title: 'Quick',
          note: 'A short delay for a single prominent link where the preview is the point.',
          origin: 'aura',
          Component: HoverCardQuick,
        },
        {
          id: 'HoverCardPatient',
          title: 'Patient',
          note: 'A long open delay for dense tables, so cards only open on a deliberate pause.',
          origin: 'aura',
          Component: HoverCardPatient,
        },
        {
          id: 'HoverCardLingering',
          title: 'Lingering',
          note: 'A long close delay when the card sits further from its link and the pointer has to travel.',
          origin: 'aura',
          Component: HoverCardLingering,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What a preview holds for the records people link to most.',
      specimens: [
        {
          id: 'HoverCardUserProfile',
          title: 'User profile',
          note: 'Who a name is: role, site and whether they are on shift.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'display/MetadataList.tsx'],
          Component: HoverCardUserProfile,
        },
        {
          id: 'HoverCardAssetPreview',
          title: 'Asset with status',
          note: 'An asset tag anywhere in the product: name, run state and health at a glance.',
          origin: 'custom',
          uses: ['display/StatusBadge.tsx', 'display/MetadataList.tsx'],
          Component: HoverCardAssetPreview,
        },
        {
          id: 'HoverCardLinkPreview',
          title: 'External link',
          note: 'A link that leaves the product: show where it goes before the user commits.',
          origin: 'custom',
          Component: HoverCardLinkPreview,
        },
        {
          id: 'HoverCardDataSet',
          title: 'Data set summary',
          note: 'A data set name with its size, freshness and owner.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx'],
          Component: HoverCardDataSet,
        },
        {
          id: 'HoverCardTimeSeries',
          title: 'Time series tag',
          note: 'An instrument tag with its latest value placed on its range and against its limit.',
          origin: 'custom',
          Component: HoverCardTimeSeries,
        },
        {
          id: 'HoverCardWorkOrder',
          title: 'Work order',
          note: 'A work order number with its title, status, assignee and due date.',
          origin: 'custom',
          uses: ['display/StatusBadge.tsx', 'display/MetadataList.tsx'],
          Component: HoverCardWorkOrder,
        },
        {
          id: 'HoverCardGlossary',
          title: 'Glossary term',
          note: 'A domain abbreviation that needs more than a tooltip-length definition.',
          origin: 'custom',
          Component: HoverCardGlossary,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'When the preview is still loading, is not allowed, or has nothing current to show.',
      specimens: [
        {
          id: 'HoverCardLoading',
          title: 'Loading',
          note: 'The preview is fetched on first hover; the skeleton holds the card at its final size.',
          origin: 'custom',
          Component: HoverCardLoading,
        },
        {
          id: 'HoverCardNoAccess',
          title: 'No access',
          note: 'The link is visible but the record is not; say why and who can fix it.',
          origin: 'custom',
          Component: HoverCardNoAccess,
        },
        {
          id: 'HoverCardStaleData',
          title: 'Stale data',
          note: 'A record whose value cannot be trusted says so instead of showing the last number.',
          origin: 'custom',
          Component: HoverCardStaleData,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Hover cards where they usually live: lists, comments and groups of people.',
      specimens: [
        {
          id: 'HoverCardInList',
          title: 'In a list',
          note: 'Every row links to a related record; the cards align to the end so they stay over the list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: HoverCardInList,
        },
        {
          id: 'HoverCardMention',
          title: 'Mention in a comment',
          note: 'An @mention that shows who the person is without leaving the thread.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: HoverCardMention,
        },
        {
          id: 'HoverCardWithAction',
          title: 'With a link onward',
          note: 'One navigation action inside the card; the close delay gives the pointer time to reach it.',
          origin: 'custom',
          Component: HoverCardWithAction,
        },
        {
          id: 'HoverCardAvatarRow',
          title: 'Avatar row',
          note: 'A row of people where each avatar opens its own profile card.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: HoverCardAvatarRow,
        },
      ],
    },
  ],
});
