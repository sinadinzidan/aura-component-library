import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@cognite/aura/components/breadcrumb';
import { Button } from '@cognite/aura/components/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@cognite/aura/components/collapsible';
import { EmptyState, EmptyStateActions, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { Search } from '@cognite/aura/components/search';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconSelector } from '@cognite/aura/icons';
import { Fragment, useState } from 'react';
import type { MouseEvent } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { SkeletonList } from '../../../library/feedback/SkeletonList';
import { AssetCard } from '../../../library/industrial/operations/AssetCard';
import { ASSET_TREE_ROOT, filterAssetTree, indexAssetTree, pathTo, rollUp, siblingsOf } from '../../../library/industrial/operations/assetTreeLogic';
import type { AssetTreeNode } from '../../../library/industrial/operations/assetTreeLogic';
import { AssetTree } from '../../../library/industrial/operations/AssetTree';
import { SeverityBadge } from '../../../library/industrial/operations/SeverityBadge';
import { healthStatus, runStateStatus } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { ValueReadout } from '../../../library/industrial/ValueReadout';
import { ALARMS, ASSETS, sensorsOf } from '../../data/plant';
import { definePage } from '../../types';

import source from './asset-hierarchy.tsx?raw';

/** The asset list with each asset's open alarms attached, indexed for the tree helpers. */
const HIERARCHY = indexAssetTree(
  ASSETS.map((asset) => ({
    ...asset,
    alarms: ALARMS.filter((alarm) => alarm.assetId === asset.id && (alarm.state === 'active' || alarm.state === 'acknowledged')).map((alarm) => alarm.severity),
  })),
  'All sites'
);

const HIERARCHY_BRANCHES = Object.values(HIERARCHY)
  .filter((node) => node.children.length > 0 && node.id !== ASSET_TREE_ROOT)
  .map((node) => node.id);

const HIERARCHY_LEAVES = Object.values(HIERARCHY).filter((node) => node.children.length === 0);

const HIERARCHY_AREAS = HIERARCHY.nk.children.map((id) => HIERARCHY[id]);

/** Keeps the catalog on this page. In an app, drop it and let the router follow the link. */
const stay = (event: MouseEvent) => event.preventDefault();

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2 align-middle';

const TYPE_LABELS: Record<string, string> = {
  compressor: 'Compressors',
  pump: 'Pumps',
  separator: 'Separators',
  exchanger: 'Heat exchangers',
  valve: 'Valves',
  turbine: 'Turbines',
};

function AssetHierarchyPlain() {
  return (
    <div className="w-full max-w-xs">
      <AssetTree nodes={HIERARCHY} defaultExpandedItems={['nk', 'nk-20']} />
    </div>
  );
}

function AssetHierarchyStateDots() {
  return (
    <div className="w-full max-w-xs">
      <AssetTree nodes={HIERARCHY} showState defaultExpandedItems={['nk', 'nk-23']} />
    </div>
  );
}

function AssetHierarchyHealthBadges() {
  return (
    <div className="w-full max-w-xs">
      <AssetTree nodes={HIERARCHY} rootId="nk" showHealth defaultExpandedItems={['nk-23']} />
    </div>
  );
}

function AssetHierarchyAlarmCounts() {
  return (
    <div className="w-full max-w-xs">
      <AssetTree nodes={HIERARCHY} showAlarms defaultExpandedItems={['nk', 'nk-23']} />
    </div>
  );
}

function AssetHierarchyNameFirst() {
  return (
    <div className="w-full max-w-xs">
      <AssetTree nodes={HIERARCHY} rootId="nk" showSecondary defaultExpandedItems={['nk-27']} />
    </div>
  );
}

function AssetHierarchyTagFirst() {
  return (
    <div className="w-full max-w-xs">
      <AssetTree nodes={HIERARCHY} rootId="nk" display="tag-first" showSecondary defaultExpandedItems={['nk-27']} />
    </div>
  );
}

function AssetHierarchySearch() {
  const [query, setQuery] = useState('pump');
  const filtered = filterAssetTree(HIERARCHY, query);
  const isFiltering = query.trim() !== '';
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Search
        aria-label="Search assets by name or tag"
        placeholder="Search by name or tag"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
      />
      {isFiltering ? (
        <p role="status" className="px-2 text-xs text-muted-foreground tabular-nums">
          {filtered.matches === 0 ? `No assets match "${query.trim()}"` : `${filtered.matches} of ${ASSETS.length} assets`}
        </p>
      ) : null}
      {filtered.matches > 0 ? (
        <AssetTree
          // The tree caches children per item, so each query gets a fresh instance.
          key={query.trim().toLowerCase()}
          nodes={filtered.index}
          showSecondary
          showState
          expandedItems={isFiltering ? filtered.expanded : undefined}
          defaultExpandedItems={['nk']}
        />
      ) : null}
    </div>
  );
}

function AssetHierarchyCheckboxes() {
  const [checked, setChecked] = useState<string[]>(['23-ka-9101', '23-ka-9102', '23-ka-9103']);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="px-2 text-sm tabular-nums text-medium-foreground" aria-live="polite">
          {checked.length} of {HIERARCHY_LEAVES.length} units selected
        </p>
        <Button variant="ghost" size="sm" onClick={() => setChecked([])}>
          Clear
        </Button>
      </div>
      <AssetTree nodes={HIERARCHY} rootId="nk" checkboxes checkedItems={checked} onCheckedItemsChange={setChecked} showSecondary defaultExpandedItems={['nk-23']} />
    </div>
  );
}

function AssetHierarchySingleSelect() {
  const [selectedId, setSelectedId] = useState('20-va-1001');
  return (
    <div className="w-full max-w-sm">
      <AssetTree nodes={HIERARCHY} selectedId={selectedId} onSelect={setSelectedId} showState defaultExpandedItems={['nk', 'nk-20']} />
    </div>
  );
}

function AssetHierarchyExpandAll() {
  const [expanded, setExpanded] = useState<string[]>(['nk']);
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(HIERARCHY_BRANCHES)}>
          Expand all
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(['nk'])}>
          Areas only
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setExpanded([])}>
          Collapse all
        </Button>
      </div>
      <AssetTree nodes={HIERARCHY} expandedItems={expanded} onExpandedItemsChange={setExpanded} showAlarms />
    </div>
  );
}

function AssetHierarchyFilteredEmpty() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Search aria-label="Search assets by name or tag" defaultValue="23-KA-91O1" />
      <EmptyState type="no-results">
        <EmptyStateIcon />
        <EmptyStateTitle as="h4">No assets match &quot;23-KA-91O1&quot;</EmptyStateTitle>
        <EmptyStateDescription>Check the tag, or search by name.</EmptyStateDescription>
        <EmptyStateActions>
          <Button variant="secondary" size="sm">
            Clear search
          </Button>
        </EmptyStateActions>
      </EmptyState>
    </div>
  );
}

function AssetHierarchyEmpty() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No assets in this project</EmptyStateTitle>
      <EmptyStateDescription>Assets appear here once a hierarchy has been ingested.</EmptyStateDescription>
    </EmptyState>
  );
}

function AssetHierarchyLoading() {
  return (
    <div className="w-full max-w-xs">
      <SkeletonList rows={6} media={false} description={false} label="Loading asset hierarchy" />
    </div>
  );
}

function AssetHierarchyBreadcrumb() {
  const path = pathTo(HIERARCHY, '23-ka-9103');
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {path.map((node, index) => (
          <Fragment key={node.id}>
            {index > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {index === path.length - 1 ? (
                <BreadcrumbPage>{node.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/assets/${node.id}`} onClick={stay}>
                  {node.name}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function AssetHierarchyPathChips() {
  const path = pathTo(HIERARCHY, '23-ka-9103');
  return (
    <nav aria-label="Asset path" className="flex flex-wrap items-center gap-1">
      {path.map((node, index) => (
        <Fragment key={node.id}>
          {index > 0 ? <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" /> : null}
          <Button variant={index === path.length - 1 ? 'secondary' : 'outline'} size="sm" aria-current={index === path.length - 1 ? 'page' : undefined}>
            <span className="font-mono">{node.tag}</span>
            <span className="sr-only">{node.name}</span>
          </Button>
        </Fragment>
      ))}
    </nav>
  );
}

function AssetHierarchySiblingNav() {
  const [currentId, setCurrentId] = useState('23-ka-9102');
  const current = HIERARCHY[currentId];
  const siblings = siblingsOf(HIERARCHY, currentId);
  const parent = current.parentId ? HIERARCHY[current.parentId] : undefined;
  return (
    <div className="flex w-full max-w-md items-center gap-3">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={siblings.previous ? `Previous: ${siblings.previous.name}` : 'No previous unit'}
              disabled={!siblings.previous}
              onClick={() => siblings.previous && setCurrentId(siblings.previous.id)}
            >
              <IconChevronLeft />
            </Button>
          }
        />
        <TooltipContent>{siblings.previous ? siblings.previous.name : 'First unit in this area'}</TooltipContent>
      </Tooltip>
      <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
        <span className="truncate text-sm font-medium text-base-foreground">{current.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          <span className="font-mono">{current.tag}</span> · {siblings.position} of {siblings.count} in {parent?.name}
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={siblings.next ? `Next: ${siblings.next.name}` : 'No next unit'}
              disabled={!siblings.next}
              onClick={() => siblings.next && setCurrentId(siblings.next.id)}
            >
              <IconChevronRight />
            </Button>
          }
        />
        <TooltipContent>{siblings.next ? siblings.next.name : 'Last unit in this area'}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function AssetHierarchySummaryCounts() {
  const summary = rollUp(HIERARCHY, 'nk');
  const types = Object.keys(TYPE_LABELS).map((type) => ({ type, count: HIERARCHY_LEAVES.filter((node) => node.type === type).length }));
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <dl className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <dt className="text-xs text-muted-foreground">Areas and systems</dt>
          <dd>
            <ValueReadout value={HIERARCHY_AREAS.length} />
          </dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-xs text-muted-foreground">Equipment</dt>
          <dd>
            <ValueReadout value={summary.equipment} />
          </dd>
        </div>
        <div className="flex flex-col gap-2">
          <dt className="text-xs text-muted-foreground">Open alarms</dt>
          <dd>
            <ValueReadout value={summary.alarms} />
          </dd>
        </div>
      </dl>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {types.map((entry) => (
          <li key={entry.type} className="text-xs text-muted-foreground">
            {TYPE_LABELS[entry.type]} <span className="font-medium text-base-foreground tabular-nums">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssetHierarchyAreaList() {
  return (
    <div className="flex w-full max-w-md flex-col gap-1">
      {HIERARCHY_AREAS.map((area, index) => {
        const summary = rollUp(HIERARCHY, area.id);
        return (
          <Collapsible key={area.id} defaultOpen={index === 1}>
            <CollapsibleTrigger
              render={
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="truncate">{area.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">{area.tag}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums">{summary.equipment} {summary.equipment === 1 ? 'unit' : 'units'}</span>
                    <IconSelector aria-hidden="true" className="text-muted-foreground" />
                  </span>
                </Button>
              }
            />
            <CollapsibleContent>
              <ul className="flex flex-col gap-2 py-2 pl-3 pr-10">
                {area.children.map((id) => {
                  const unit = HIERARCHY[id];
                  return (
                    <li key={id} className="flex items-center justify-between gap-4">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="truncate text-sm text-base-foreground">{unit.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">{unit.tag}</span>
                      </span>
                      {unit.state ? <StatusIndicator size="sm" {...runStateStatus(unit.state)} /> : null}
                    </li>
                  );
                })}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

function AssetHierarchyByType() {
  const groups = Object.keys(TYPE_LABELS)
    .map((type) => ({ type, units: HIERARCHY_LEAVES.filter((node) => node.type === type) }))
    .filter((group) => group.units.length > 1);
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      {groups.map((group) => (
        <section key={group.type} aria-label={TYPE_LABELS[group.type]} className="flex flex-col gap-2">
          <h4 className="flex items-baseline justify-between text-xs font-medium text-muted-foreground">
            {TYPE_LABELS[group.type]}
            <span className="tabular-nums">{group.units.length}</span>
          </h4>
          <ul className="flex flex-col gap-2">
            {group.units.map((unit) => (
              <li key={unit.id} className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-baseline gap-3">
                <span className="font-mono text-xs text-base-foreground">{unit.tag}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {unit.name} · {pathTo(HIERARCHY, unit.id)[1]?.name}
                </span>
                {unit.state ? <StatusIndicator size="sm" {...runStateStatus(unit.state)} /> : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function AssetHierarchyTreeTable() {
  const [expanded, setExpanded] = useState<readonly string[]>(['nk', 'nk-23']);
  const rows: { node: AssetTreeNode; depth: number }[] = [];
  const visit = (id: string, depth: number) => {
    const node = HIERARCHY[id];
    rows.push({ node, depth });
    if (expanded.includes(id)) node.children.forEach((child) => visit(child, depth + 1));
  };
  HIERARCHY[ASSET_TREE_ROOT].children.forEach((id) => visit(id, 0));
  const toggle = (id: string) => setExpanded((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]));

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-2xl border-collapse text-sm">
        <thead>
          <tr>
            <th scope="col" className={TH}>
              Asset
            </th>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              State
            </th>
            <th scope="col" className={TH}>
              Health
            </th>
            <th scope="col" className={`${TH} text-right`}>
              Units
            </th>
            <th scope="col" className={TH}>
              Open alarms
            </th>
            <th scope="col" className={TH}>
              Criticality
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ node, depth }) => {
            const summary = rollUp(HIERARCHY, node.id);
            const isBranch = node.children.length > 0;
            const isOpen = expanded.includes(node.id);
            const asset = ASSETS.find((candidate) => candidate.id === node.id);
            return (
              <tr key={node.id} className="border-t border-default">
                <td className={TD}>
                  <span className="flex items-center gap-1" style={{ paddingInlineStart: `${depth * 1.25}rem` }}>
                    {isBranch ? (
                      <Button variant="ghost" size="icon-sm" aria-expanded={isOpen} aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${node.name}`} onClick={() => toggle(node.id)}>
                        {isOpen ? <IconChevronDown /> : <IconChevronRight />}
                      </Button>
                    ) : (
                      <span aria-hidden="true" className="size-7 shrink-0" />
                    )}
                    <span className={isBranch ? 'font-medium text-base-foreground' : 'text-base-foreground'}>{node.name}</span>
                  </span>
                </td>
                <td className={`${TD} whitespace-nowrap font-mono text-xs text-muted-foreground`}>{node.tag}</td>
                <td className={TD}>{node.state ? <StatusIndicator size="sm" {...runStateStatus(node.state)} /> : null}</td>
                <td className={TD}>{node.health ? <StatusIndicator size="sm" {...healthStatus(node.health)} detail={String(node.healthScore)} /> : null}</td>
                <td className={`${TD} text-right text-muted-foreground tabular-nums`}>{isBranch ? summary.equipment : ''}</td>
                <td className={TD}>
                  {summary.alarms > 0 && summary.worstSeverity ? (
                    <SeverityBadge severity={summary.worstSeverity} count={summary.alarms} />
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </td>
                <td className={`${TD} text-muted-foreground`}>{asset?.criticality}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AssetHierarchyDrillDown() {
  const [areaId, setAreaId] = useState('nk-23');
  const [unitId, setUnitId] = useState('23-ka-9103');
  const site = HIERARCHY.nk;
  const area = HIERARCHY[areaId];
  const cardAlarms = (id: string) => {
    const summary = rollUp(HIERARCHY, id);
    return { count: summary.alarms, severity: summary.worstSeverity };
  };
  return (
    <div className="grid w-full gap-6 md:grid-cols-3">
      <section aria-label="Site" className="flex min-w-0 flex-col gap-3">
        <h4 className="text-xs font-medium text-muted-foreground">Site</h4>
        <AssetCard tag={site.tag} name={site.name} state={site.state ?? 'running'} alarms={cardAlarms(site.id)} selected onSelect={() => undefined} />
      </section>
      <section aria-label="Areas" className="flex min-w-0 flex-col gap-3">
        <h4 className="text-xs font-medium text-muted-foreground">Areas in {site.name}</h4>
        {HIERARCHY_AREAS.map((node) => (
          <AssetCard
            key={node.id}
            tag={node.tag}
            name={node.name}
            state={node.state ?? 'running'}
            stateDetail={`${node.children.length} ${node.children.length === 1 ? 'unit' : 'units'}`}
            alarms={cardAlarms(node.id)}
            selected={node.id === areaId}
            onSelect={() => {
              setAreaId(node.id);
              setUnitId(node.children[0]);
            }}
          />
        ))}
      </section>
      <section aria-label="Equipment" className="flex min-w-0 flex-col gap-3">
        <h4 className="text-xs font-medium text-muted-foreground">Equipment in {area.name}</h4>
        {area.children.map((id) => {
          const node = HIERARCHY[id];
          return (
            <AssetCard
              key={id}
              tag={node.tag}
              name={node.name}
              state={node.state ?? 'running'}
              alarms={cardAlarms(id)}
              selected={id === unitId}
              onSelect={() => setUnitId(id)}
            />
          );
        })}
      </section>
    </div>
  );
}

function AssetHierarchySplit() {
  const [selectedId, setSelectedId] = useState('23-ka-9101');
  const node = HIERARCHY[selectedId];
  const path = pathTo(HIERARCHY, selectedId);
  const summary = rollUp(HIERARCHY, selectedId);
  const asset = ASSETS.find((candidate) => candidate.id === selectedId);
  return (
    <div className="grid w-full gap-6 md:grid-cols-[20rem_minmax(0,1fr)]">
      <AssetTree nodes={HIERARCHY} selectedId={selectedId} onSelect={setSelectedId} showState showAlarms defaultExpandedItems={['nk', 'nk-23']} />
      <section aria-label={`${node.name} details`} className="flex min-w-0 flex-col gap-4 rounded-xl bg-muted-background p-4">
        <p className="truncate text-xs text-muted-foreground">
          {path
            .slice(0, -1)
            .map((step) => step.name)
            .join(' / ') || 'Site'}
        </p>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate text-lg font-medium text-base-foreground">{node.name}</h4>
            <p className="font-mono text-xs text-muted-foreground">{node.tag}</p>
          </div>
          {node.state ? <StatusIndicator variant="badge" {...runStateStatus(node.state)} /> : null}
        </div>
        <MetadataList
          items={[
            { label: 'Type', value: <span className="capitalize">{node.type}</span> },
            { label: 'Criticality', value: asset?.criticality },
            { label: 'Health', value: node.health ? <StatusIndicator size="sm" {...healthStatus(node.health)} detail={String(node.healthScore)} /> : undefined },
            { label: node.children.length > 0 ? 'Units below' : 'Sensors', value: <span className="tabular-nums">{node.children.length > 0 ? summary.equipment : sensorsOf(node.id).length}</span> },
            {
              label: 'Open alarms',
              value: summary.alarms > 0 && summary.worstSeverity ? <SeverityBadge severity={summary.worstSeverity} count={summary.alarms} /> : 'None',
            },
          ]}
        />
        <div className="flex gap-2">
          <Button size="sm">Open asset</Button>
          <Button variant="secondary" size="sm">
            Show in diagram
          </Button>
        </div>
      </section>
    </div>
  );
}

export default definePage({
  id: 'asset-hierarchy',
  title: 'Asset hierarchy',
  summary:
    'Site, area and equipment as a tree and as the other shapes a hierarchy takes: breadcrumbs, path chips, drill-down cards and an indented table. State, health and open alarms roll up, so a collapsed branch still shows that something below it needs attention.',
  guidance: {
    use: [
      'Open the branch that holds the current asset, so people land in context.',
      'Roll alarms and the worst run state up to every branch; nobody should have to expand a tree to find a trip.',
      'Offer tag-first display where people work from P&IDs and tag numbers, name-first elsewhere.',
      'Use a breadcrumb for where an asset sits and a tree for moving around the hierarchy.',
    ],
    avoid: [
      'More than one trailing signal per row in a narrow tree; move to the indented table when several columns matter.',
      'A filter that hides the branches leading to a match — the path is part of the answer.',
      'Colouring healthy rows. Good health is a quiet number; watch and poor become badges.',
    ],
  },
  source,
  sections: [
    {
      id: 'trees',
      title: 'Trees',
      description: 'The plant as a tree, with one trailing signal at a time.',
      specimens: [
        {
          id: 'AssetHierarchyPlain',
          title: 'Plain tree',
          note: 'Pick it for navigation where the names are enough and state lives on the page the row opens.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx', 'industrial/operations/assetTreeLogic.ts'],
          align: 'stretch',
          Component: AssetHierarchyPlain,
        },
        {
          id: 'AssetHierarchyStateDots',
          title: 'With state dots',
          note: 'Pick it in operations views: each unit shows its run state, each branch the worst state below it.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx', 'industrial/StatusDot.tsx'],
          align: 'stretch',
          Component: AssetHierarchyStateDots,
        },
        {
          id: 'AssetHierarchyHealthBadges',
          title: 'With health badges',
          note: 'Pick it for condition monitoring: scores down the right edge, with watch and poor raised to badges.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: AssetHierarchyHealthBadges,
        },
        {
          id: 'AssetHierarchyAlarmCounts',
          title: 'With rolled-up alarm counts',
          note: 'Pick it so a collapsed area still shows how many alarms are open below it, in the colour of the worst.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx', 'industrial/operations/assetTreeLogic.ts'],
          align: 'stretch',
          Component: AssetHierarchyAlarmCounts,
        },
        {
          id: 'AssetHierarchyNameFirst',
          title: 'Name first',
          note: 'Pick it for people who know the plant by what things are called; the tag follows quietly.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx'],
          align: 'stretch',
          Component: AssetHierarchyNameFirst,
        },
        {
          id: 'AssetHierarchyTagFirst',
          title: 'Tag number first',
          note: 'Pick it for people who work from P&IDs and tag lists; the tag leads in monospace so numbers align.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx'],
          align: 'stretch',
          Component: AssetHierarchyTagFirst,
        },
      ],
    },
    {
      id: 'find',
      title: 'Find and select',
      description: 'Searching, choosing one asset, choosing many, and having nothing to show.',
      specimens: [
        {
          id: 'AssetHierarchySearch',
          title: 'Search filter',
          note: 'Pick it for any hierarchy past a screenful: matches on name or tag stay with the branches that lead to them.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx', 'industrial/operations/assetTreeLogic.ts'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchySearch,
        },
        {
          id: 'AssetHierarchyCheckboxes',
          title: 'Multi-select',
          note: 'Pick checkboxes to choose a scope — the units a report, trend or work package covers.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchyCheckboxes,
        },
        {
          id: 'AssetHierarchySingleSelect',
          title: 'Single select',
          note: 'Pick it when the tree drives a detail panel: one row is current, marked by weight and a check.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchySingleSelect,
        },
        {
          id: 'AssetHierarchyExpandAll',
          title: 'Expand to a level',
          note: 'Pick it for deep hierarchies, so people can open everything, stop at areas, or fold it away.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchyExpandAll,
        },
        {
          id: 'AssetHierarchyFilteredEmpty',
          title: 'No matches',
          note: 'Pick it when a search finds nothing: repeat the query, suggest the other way to search, offer to clear.',
          origin: 'custom',
          align: 'stretch',
          Component: AssetHierarchyFilteredEmpty,
        },
        {
          id: 'AssetHierarchyEmpty',
          title: 'Empty',
          note: 'Pick it when the project has no hierarchy yet, and say what makes assets appear.',
          origin: 'custom',
          Component: AssetHierarchyEmpty,
        },
        {
          id: 'AssetHierarchyLoading',
          title: 'Loading',
          note: 'Pick it while the hierarchy loads, so the panel keeps its shape.',
          origin: 'custom',
          uses: ['feedback/SkeletonList.tsx'],
          align: 'stretch',
          Component: AssetHierarchyLoading,
        },
      ],
    },
    {
      id: 'position',
      title: 'Path and position',
      description: 'Where an asset sits, and how to get to its neighbours.',
      specimens: [
        {
          id: 'AssetHierarchyBreadcrumb',
          title: 'Breadcrumb path',
          note: 'Pick it above an asset page: the path from site to unit, every level a link.',
          origin: 'custom',
          uses: ['industrial/operations/assetTreeLogic.ts'],
          size: 'md',
          Component: AssetHierarchyBreadcrumb,
        },
        {
          id: 'AssetHierarchyPathChips',
          title: 'Path chips',
          note: 'Pick chips where space is tight and readers know the tags: the same path, in tag numbers.',
          origin: 'custom',
          uses: ['industrial/operations/assetTreeLogic.ts'],
          size: 'md',
          Component: AssetHierarchyPathChips,
        },
        {
          id: 'AssetHierarchySiblingNav',
          title: 'Sibling navigator',
          note: 'Pick it on a detail page to step through the units of one area without going back to the tree.',
          origin: 'custom',
          uses: ['industrial/operations/assetTreeLogic.ts'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchySiblingNav,
        },
        {
          id: 'AssetHierarchySummaryCounts',
          title: 'Hierarchy summary',
          note: 'Pick it above a tree or on a site page: how big the hierarchy is and what it is made of.',
          origin: 'custom',
          uses: ['industrial/operations/assetTreeLogic.ts', 'industrial/ValueReadout.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchySummaryCounts,
        },
      ],
    },
    {
      id: 'shapes',
      title: 'Other shapes',
      description: 'The same hierarchy when a tree is not the right control.',
      specimens: [
        {
          id: 'AssetHierarchyAreaList',
          title: 'Collapsible area list',
          note: 'Pick it for a two-level plant on a narrow panel or a phone: areas fold, units list with their state.',
          origin: 'custom',
          uses: ['industrial/operations/assetTreeLogic.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchyAreaList,
        },
        {
          id: 'AssetHierarchyByType',
          title: 'Grouped by type',
          note: 'Pick it when people look for "all the pumps": the hierarchy flattened, with the area as context.',
          origin: 'custom',
          uses: ['industrial/operations/assetTreeLogic.ts', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: AssetHierarchyByType,
        },
        {
          id: 'AssetHierarchyDrillDown',
          title: 'Drill-down cards',
          note: 'Pick it for overview screens and touch: site, area and equipment as columns of cards, one choice per level.',
          origin: 'custom',
          uses: ['industrial/operations/AssetCard.tsx', 'industrial/operations/assetTreeLogic.ts'],
          size: 'full',
          align: 'stretch',
          Component: AssetHierarchyDrillDown,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Tables and split views',
      description: 'The hierarchy as the frame of a whole screen.',
      specimens: [
        {
          id: 'AssetHierarchyTreeTable',
          title: 'Indented table',
          note: 'Pick it when several facts per asset matter at once: the tree becomes the first column of a table.',
          origin: 'custom',
          uses: ['industrial/operations/assetTreeLogic.ts', 'industrial/operations/SeverityBadge.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AssetHierarchyTreeTable,
        },
        {
          id: 'AssetHierarchySplit',
          title: 'Tree and detail',
          note: 'Pick it as the asset explorer: the tree on the left chooses, the panel on the right answers.',
          origin: 'custom',
          uses: ['industrial/operations/AssetTree.tsx', 'industrial/operations/assetTreeLogic.ts', 'display/MetadataList.tsx', 'industrial/operations/SeverityBadge.tsx'],
          size: 'full',
          align: 'stretch',
          Component: AssetHierarchySplit,
        },
      ],
    },
  ],
});
