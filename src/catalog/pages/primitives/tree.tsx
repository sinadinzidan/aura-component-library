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
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@cognite/aura/components/item';
import { ScrollArea } from '@cognite/aura/components/scroll-area';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { Tree } from '@cognite/aura/components/tree';
import {
  IconAdjustmentsHorizontal,
  IconArrowsExchange,
  IconBuildingFactory2,
  IconCheck,
  IconCylinder,
  IconDroplet,
  IconEngine,
  IconGauge,
  IconLayoutGrid,
  IconLock,
  IconPlus,
  IconPropeller,
  IconWindmill,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { FilterableTree } from '../../../library/data/FilterableTree';
import { MetadataList } from '../../../library/display/MetadataList';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ALARMS, ASSETS, SENSORS, childrenOf, sensorsOf } from '../../data/plant';
import type { Asset, RunState } from '../../data/plant';
import { definePage } from '../../types';

import source from './tree.tsx?raw';

type TreeNode = {
  id: string;
  name: string;
  tag: string;
  kind: Asset['type'] | 'sensor' | 'loading';
  state?: RunState;
  children: string[];
};

const TREE_ASSET_ENTRIES: [string, TreeNode][] = ASSETS.map((asset) => [
  asset.id,
  {
    id: asset.id,
    name: asset.name,
    tag: asset.tag,
    kind: asset.type,
    state: asset.state,
    children: childrenOf(asset.id).map((child) => child.id),
  },
]);

const TREE_ROOT: TreeNode = { id: 'root', name: 'All sites', tag: '', kind: 'site', children: ['nk'] };

/** The asset hierarchy. `root` is a hidden node above the plant; use `nk` as root to start at the areas. */
const TREE_NODES: Record<string, TreeNode> = Object.fromEntries([['root', TREE_ROOT], ...TREE_ASSET_ENTRIES]);

const TREE_SENSOR_ENTRIES: [string, TreeNode][] = SENSORS.map((sensor) => [
  sensor.id,
  { id: sensor.id, name: sensor.name, tag: sensor.tag, kind: 'sensor', children: [] },
]);

const TREE_EQUIPMENT_ENTRIES: [string, TreeNode][] = TREE_ASSET_ENTRIES.map(([id, node]) => [
  id,
  node.children.length > 0 ? node : { ...node, children: sensorsOf(id).map((sensor) => sensor.id) },
]);

/** Four levels: areas, equipment and the sensors on each piece of equipment. */
const TREE_DEEP_NODES: Record<string, TreeNode> = Object.fromEntries([
  ['root', TREE_ROOT],
  ...TREE_EQUIPMENT_ENTRIES,
  ...TREE_SENSOR_ENTRIES,
]);

const TREE_BRANCHES = Object.values(TREE_NODES)
  .filter((node) => node.children.length > 0)
  .map((node) => node.id);

const TREE_LEAVES = Object.values(TREE_NODES)
  .filter((node) => node.children.length === 0)
  .map((node) => node.id);

const TREE_RESTRICTED: readonly string[] = ['nk-27', 'nk-40'];

const TREE_ICONS: Record<TreeNode['kind'], typeof IconGauge> = {
  site: IconBuildingFactory2,
  area: IconLayoutGrid,
  system: IconDroplet,
  compressor: IconEngine,
  pump: IconPropeller,
  separator: IconCylinder,
  exchanger: IconArrowsExchange,
  valve: IconAdjustmentsHorizontal,
  turbine: IconWindmill,
  sensor: IconGauge,
  loading: IconGauge,
};

const treeChildren = (node: TreeNode) => node.children;
const treeName = (node: TreeNode) => node.name;

function treeLeafCount(id: string): number {
  const node = TREE_NODES[id];
  if (node.children.length === 0) return 1;
  return node.children.reduce((sum, child) => sum + treeLeafCount(child), 0);
}

function treeAlarmCount(id: string): number {
  const own = ALARMS.filter((alarm) => alarm.assetId === id && alarm.state !== 'cleared').length;
  return TREE_NODES[id].children.reduce((sum, child) => sum + treeAlarmCount(child), own);
}

function TreeNodeIcon({ node }: { node: TreeNode }) {
  const Icon = TREE_ICONS[node.kind];
  return (
    <ItemMedia>
      <Icon aria-hidden="true" />
    </ItemMedia>
  );
}

function TreeFlat() {
  return (
    <div className="w-full max-w-xs">
      <Tree rootItemId="nk-23" items={TREE_NODES} getChildren={treeChildren} getItemName={treeName}>
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeNested() {
  return (
    <div className="w-full max-w-xs">
      <Tree rootItemId="nk" items={TREE_NODES} getChildren={treeChildren} getItemName={treeName}>
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeDefaultExpanded() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk-20']}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeDeep() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="root"
        items={TREE_DEEP_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk', 'nk-20', '20-va-1001']}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeWithIcons() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk-23']}
      >
        {(item) => (
          <>
            <TreeNodeIcon node={item.getItemData()} />
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
            </ItemContent>
          </>
        )}
      </Tree>
    </div>
  );
}

function TreeWithDescription() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk-27']}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
            <ItemDescription>{item.getItemData().tag}</ItemDescription>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeWithCounts() {
  return (
    <div className="w-full max-w-xs">
      <Tree rootItemId="nk" items={TREE_NODES} getChildren={treeChildren} getItemName={treeName}>
        {(item) => (
          <>
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
            </ItemContent>
            {item.isFolder() ? (
              <span className="text-xs tabular-nums text-muted-foreground">{treeLeafCount(item.getId())}</span>
            ) : null}
          </>
        )}
      </Tree>
    </div>
  );
}

function TreeWithStatus() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk-23"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
      >
        {(item) => {
          const { state } = item.getItemData();
          return (
            <>
              <ItemContent>
                <ItemTitle>{item.getItemName()}</ItemTitle>
              </ItemContent>
              {state ? <StatusBadge status={state} showIcon={false} /> : null}
            </>
          );
        }}
      </Tree>
    </div>
  );
}

function TreeWithActions() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk-20']}
      >
        {(item) => (
          <>
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
            </ItemContent>
            {item.isFolder() ? (
              <ItemActions>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`Add equipment to ${item.getItemName()}`}>
                        <IconPlus />
                      </Button>
                    }
                  />
                  <TooltipContent>Add equipment</TooltipContent>
                </Tooltip>
              </ItemActions>
            ) : null}
          </>
        )}
      </Tree>
    </div>
  );
}

function TreeLongLabels() {
  return (
    <div className="w-48">
      <Tree
        rootItemId="root"
        items={TREE_DEEP_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk', 'nk-23', '23-ha-9114']}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle title={item.getItemName()}>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeCheckboxes() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        checkboxes
        defaultExpandedItems={['nk-20']}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeCheckboxesPartial() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        checkboxes
        defaultExpandedItems={['nk-23']}
        defaultCheckedItems={['23-ka-9101', '23-ka-9102', '27-pa-2001a', '27-pa-2001b']}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeCheckboxesControlled() {
  const [checked, setChecked] = useState<string[]>(['23-ka-9101', '23-ka-9103']);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm tabular-nums text-medium-foreground" aria-live="polite">
          {checked.length} of {TREE_LEAVES.length} selected
        </p>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setChecked(TREE_LEAVES)}>
            Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setChecked([])}>
            Clear
          </Button>
        </div>
      </div>
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        checkboxes
        checkedItems={checked}
        onCheckedItemsChange={setChecked}
        defaultExpandedItems={['nk-23']}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeCheckboxesWithIcons() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk-23"
        items={TREE_DEEP_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        checkboxes
        defaultExpandedItems={['23-ka-9101']}
        defaultCheckedItems={['pt-92531', 'tt-92532', 'vt-92540']}
      >
        {(item) => (
          <>
            <TreeNodeIcon node={item.getItemData()} />
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
              {item.isFolder() ? null : <ItemDescription>{item.getItemData().tag}</ItemDescription>}
            </ItemContent>
          </>
        )}
      </Tree>
    </div>
  );
}

function TreeExpandAll() {
  const [expanded, setExpanded] = useState<string[]>(['nk-20']);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setExpanded(TREE_BRANCHES)}>
          Expand all
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setExpanded([])}>
          Collapse all
        </Button>
      </div>
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        expandedItems={expanded}
        onExpandedItemsChange={setExpanded}
      >
        {(item) => (
          <ItemContent>
            <ItemTitle>{item.getItemName()}</ItemTitle>
          </ItemContent>
        )}
      </Tree>
    </div>
  );
}

function TreeSelectedRow() {
  const [selected, setSelected] = useState('20-va-1001');

  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="nk"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk-20']}
      >
        {(item) => {
          const isSelected = item.getId() === selected;
          return (
            <button
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => setSelected(item.getId())}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none focus-visible:shadow-focus-ring"
            >
              <span
                className={
                  isSelected
                    ? 'min-w-0 flex-1 truncate text-sm font-medium text-base-foreground'
                    : 'min-w-0 flex-1 truncate text-sm text-medium-foreground'
                }
              >
                {item.getItemName()}
              </span>
              {isSelected ? <IconCheck aria-hidden="true" className="size-4 shrink-0" /> : null}
            </button>
          );
        }}
      </Tree>
    </div>
  );
}

function TreeRestrictedNodes() {
  return (
    <div className="w-full max-w-xs">
      <Tree rootItemId="nk" items={TREE_NODES} getChildren={treeChildren} getItemName={treeName}>
        {(item) =>
          TREE_RESTRICTED.includes(item.getId()) ? (
            <>
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{item.getItemName()}</span>
              <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <IconLock aria-hidden="true" className="size-3.5" /> No access
              </span>
            </>
          ) : (
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
            </ItemContent>
          )
        }
      </Tree>
    </div>
  );
}

const TREE_LOADING_NODES: Record<string, TreeNode> = {
  ...TREE_NODES,
  'nk-23': { ...TREE_NODES['nk-23'], children: ['loading-1', 'loading-2', 'loading-3'] },
  'loading-1': { id: 'loading-1', name: 'Loading', tag: '', kind: 'loading', children: [] },
  'loading-2': { id: 'loading-2', name: 'Loading', tag: '', kind: 'loading', children: [] },
  'loading-3': { id: 'loading-3', name: 'Loading', tag: '', kind: 'loading', children: [] },
};

function TreeLoadingChildren() {
  return (
    <div className="w-full max-w-xs" aria-busy="true">
      <Tree
        rootItemId="nk"
        items={TREE_LOADING_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk-23']}
      >
        {(item) =>
          item.getItemData().kind === 'loading' ? (
            <Skeleton className="h-3.5 w-32" />
          ) : (
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
            </ItemContent>
          )
        }
      </Tree>
    </div>
  );
}

function TreeEmpty() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="p">No assets in this data set</EmptyStateTitle>
      <EmptyStateDescription>Add a root asset to start building the hierarchy.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">
          <IconPlus /> Add root asset
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function TreeFilterable() {
  return (
    <div className="w-full max-w-xs">
      <FilterableTree
        rootItemId="root"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        getSearchText={(node) => node.tag}
        searchLabel="Search assets"
        placeholder="Search by name or tag"
        defaultExpandedItems={['nk']}
      >
        {(item) => (
          <>
            <TreeNodeIcon node={item.getItemData()} />
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
            </ItemContent>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">{item.getItemData().tag}</span>
          </>
        )}
      </FilterableTree>
    </div>
  );
}

function TreeAlarmRollup() {
  return (
    <div className="w-full max-w-xs">
      <Tree
        rootItemId="root"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk', 'nk-23']}
      >
        {(item) => {
          const alarms = treeAlarmCount(item.getId());
          return (
            <>
              <TreeNodeIcon node={item.getItemData()} />
              <ItemContent>
                <ItemTitle>{item.getItemName()}</ItemTitle>
              </ItemContent>
              {alarms > 0 ? (
                <Badge variant="error" aria-label={`${alarms} active alarms`}>
                  {alarms}
                </Badge>
              ) : null}
            </>
          );
        }}
      </Tree>
    </div>
  );
}

function TreeAssetHierarchy() {
  return (
    <div className="w-full max-w-md rounded-xl bg-muted-background p-2">
      <Tree
        rootItemId="root"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk', 'nk-23', 'nk-40']}
      >
        {(item) => {
          const node = item.getItemData();
          return (
            <>
              <TreeNodeIcon node={node} />
              <ItemContent>
                <ItemTitle>{node.name}</ItemTitle>
                <ItemDescription>{node.tag}</ItemDescription>
              </ItemContent>
              {node.state && !item.isFolder() ? <StatusBadge status={node.state} outline /> : null}
            </>
          );
        }}
      </Tree>
    </div>
  );
}

function TreeInScrollArea() {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-xl border border-default">
      <ScrollArea className="h-64 w-full">
        <div className="p-2">
          <Tree
            rootItemId="root"
            items={TREE_DEEP_NODES}
            getChildren={treeChildren}
            getItemName={treeName}
            defaultExpandedItems={['nk', 'nk-20', 'nk-23', '23-ka-9101']}
          >
            {(item) => (
              <>
                <TreeNodeIcon node={item.getItemData()} />
                <ItemContent>
                  <ItemTitle>{item.getItemName()}</ItemTitle>
                </ItemContent>
              </>
            )}
          </Tree>
        </div>
      </ScrollArea>
    </div>
  );
}

function TreeScopePicker() {
  const [checked, setChecked] = useState<string[]>(['23-ka-9101', '23-ka-9102', '23-ka-9103']);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Alarm scope</CardTitle>
          <CardDescription>Choose the equipment this rule watches.</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <Tree
          className="w-full"
          rootItemId="nk"
          items={TREE_NODES}
          getChildren={treeChildren}
          getItemName={treeName}
          checkboxes
          checkedItems={checked}
          onCheckedItemsChange={setChecked}
          defaultExpandedItems={['nk-23']}
        >
          {(item) => (
            <ItemContent>
              <ItemTitle>{item.getItemName()}</ItemTitle>
            </ItemContent>
          )}
        </Tree>
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
            {checked.length} selected
          </span>
        </CardFooterStart>
        <CardFooterEnd>
          <Button size="sm" disabled={checked.length === 0}>
            Apply scope
          </Button>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function TreeWithDetail() {
  const [selectedId, setSelectedId] = useState('23-ka-9101');
  const asset = ASSETS.find((candidate) => candidate.id === selectedId) ?? ASSETS[0];

  return (
    <div className="grid w-full gap-6 md:grid-cols-[18rem_minmax(0,1fr)]">
      <Tree
        rootItemId="root"
        items={TREE_NODES}
        getChildren={treeChildren}
        getItemName={treeName}
        defaultExpandedItems={['nk', 'nk-23']}
      >
        {(item) => {
          const isSelected = item.getId() === selectedId;
          return (
            <button
              type="button"
              aria-current={isSelected ? 'true' : undefined}
              onClick={() => setSelectedId(item.getId())}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none focus-visible:shadow-focus-ring"
            >
              <TreeNodeIcon node={item.getItemData()} />
              <span
                className={
                  isSelected
                    ? 'min-w-0 flex-1 truncate text-sm font-medium text-base-foreground'
                    : 'min-w-0 flex-1 truncate text-sm text-medium-foreground'
                }
              >
                {item.getItemName()}
              </span>
              {isSelected ? <IconCheck aria-hidden="true" className="size-4 shrink-0" /> : null}
            </button>
          );
        }}
      </Tree>
      <section aria-label={`${asset.name} details`} className="flex flex-col gap-4 rounded-xl bg-muted-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-medium text-base-foreground">{asset.name}</h4>
            <p className="font-mono text-xs text-muted-foreground">{asset.tag}</p>
          </div>
          <StatusBadge status={asset.state} />
        </div>
        <MetadataList
          items={[
            { label: 'Type', value: <span className="capitalize">{asset.type}</span> },
            { label: 'Criticality', value: asset.criticality },
            { label: 'Health score', value: `${asset.healthScore} / 100` },
            { label: 'Sensors', value: sensorsOf(asset.id).length || undefined },
            { label: 'Active alarms', value: treeAlarmCount(asset.id) },
          ]}
        />
      </section>
    </div>
  );
}

export default definePage({
  id: 'tree',
  title: 'Tree',
  summary:
    'A tree shows hierarchical data as nested rows that expand and collapse, with optional cascading checkboxes. Rows are Item rows, so they take icons, descriptions, badges and actions.',
  docsSlug: 'tree-view',
  guidance: {
    use: [
      'Structures with several levels: asset hierarchies, folders, data models.',
      'Checkboxes when people pick a scope; checking a branch checks everything below it.',
      'Keep rows to one line: a name, and at most one piece of trailing information.',
      'Open the branch that holds the current item, so people land in context.',
    ],
    avoid: [
      'Flat lists — use an item group or a table.',
      'Comparing many attributes per row; use a data grid with expandable rows.',
      'Showing where a page sits in the hierarchy; use a breadcrumb.',
      'More than five or six levels without search.',
    ],
  },
  source,
  sections: [
    {
      id: 'structure',
      title: 'Structure',
      description: 'From a single level to four, collapsed or opened to a branch.',
      specimens: [
        {
          id: 'TreeFlat',
          title: 'Single level',
          note: 'A branch with only leaves; rows keep the chevron column so they align with deeper trees.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeFlat,
        },
        {
          id: 'TreeNested',
          title: 'Nested, collapsed',
          note: 'The default: branches start closed and open from the chevron.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeNested,
        },
        {
          id: 'TreeDefaultExpanded',
          title: 'Opened to a branch',
          note: 'Start with the branch that holds the current item already open.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeDefaultExpanded,
        },
        {
          id: 'TreeDeep',
          title: 'Four levels',
          note: 'Site, area, equipment and sensor; each level indents by 16px.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeDeep,
        },
      ],
    },
    {
      id: 'row-content',
      title: 'Row content',
      description: 'What a row can carry besides its name.',
      specimens: [
        {
          id: 'TreeWithIcons',
          title: 'With icons',
          note: 'Mixed node types that people recognise faster by icon than by name.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeWithIcons,
        },
        {
          id: 'TreeWithDescription',
          title: 'With description',
          note: 'A second line for a tag or ID that people search by.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeWithDescription,
        },
        {
          id: 'TreeWithCounts',
          title: 'With counts',
          note: 'Shows how much is inside a branch before it is opened.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeWithCounts,
        },
        {
          id: 'TreeWithStatus',
          title: 'With status',
          note: 'One status per row, such as run state, in a trailing badge.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: TreeWithStatus,
        },
        {
          id: 'TreeWithActions',
          title: 'With row actions',
          note: 'Secondary actions that appear on hover and keyboard focus. Hover a branch to see it.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeWithActions,
        },
        {
          id: 'TreeLongLabels',
          title: 'Truncated labels',
          note: 'Narrow panels: names cut off with an ellipsis and keep the full name as a title.',
          origin: 'aura',
          Component: TreeLongLabels,
        },
      ],
    },
    {
      id: 'checkboxes',
      title: 'Checkboxes',
      description: 'Cascading selection: a branch is checked, unchecked or partly checked.',
      specimens: [
        {
          id: 'TreeCheckboxes',
          title: 'With checkboxes',
          note: 'Picking several nodes at once, such as the scope of a rule or an export.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeCheckboxes,
        },
        {
          id: 'TreeCheckboxesPartial',
          title: 'Partly checked branch',
          note: 'A branch shows a dash when only some of what is below it is checked.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeCheckboxesPartial,
        },
        {
          id: 'TreeCheckboxesControlled',
          title: 'Select all and clear',
          note: 'Controlled selection with a running count, for trees that feed a filter.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeCheckboxesControlled,
        },
        {
          id: 'TreeCheckboxesWithIcons',
          title: 'Checkboxes with icons',
          note: 'Picking individual sensors under equipment; the checkbox sits before the icon.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeCheckboxesWithIcons,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Expansion, selection, restricted, loading and empty.',
      specimens: [
        {
          id: 'TreeExpandAll',
          title: 'Expand and collapse all',
          note: 'Controlled expansion for trees people scan from top to bottom.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeExpandAll,
        },
        {
          id: 'TreeSelectedRow',
          title: 'Current row',
          note: 'Navigation trees: the row content is a button and the current one is marked.',
          origin: 'custom',
          align: 'stretch',
          Component: TreeSelectedRow,
        },
        {
          id: 'TreeRestrictedNodes',
          title: 'Restricted nodes',
          note: 'Nodes people can see but not open say why instead of only looking dimmed.',
          origin: 'custom',
          align: 'stretch',
          Component: TreeRestrictedNodes,
        },
        {
          id: 'TreeLoadingChildren',
          title: 'Loading children',
          note: 'Skeleton rows hold the place while a branch loads its children.',
          origin: 'custom',
          align: 'stretch',
          Component: TreeLoadingChildren,
        },
        {
          id: 'TreeEmpty',
          title: 'Empty',
          note: 'No hierarchy yet: explain what belongs here and offer the first step.',
          origin: 'aura',
          Component: TreeEmpty,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Trees with search, in panels and beside the detail they select.',
      specimens: [
        {
          id: 'TreeFilterable',
          title: 'With search filter',
          note: 'Large hierarchies: typing keeps matches and the branches that lead to them. Try "pump".',
          origin: 'custom',
          align: 'stretch',
          uses: ['data/FilterableTree.tsx'],
          Component: TreeFilterable,
        },
        {
          id: 'TreeAlarmRollup',
          title: 'Alarm roll-up',
          note: 'Counts roll up to every parent, so a closed branch still shows that something is wrong inside.',
          origin: 'custom',
          align: 'stretch',
          Component: TreeAlarmRollup,
        },
        {
          id: 'TreeInScrollArea',
          title: 'In a scroll area',
          note: 'A side panel with a fixed height; the tree scrolls inside it.',
          origin: 'aura',
          align: 'stretch',
          Component: TreeInScrollArea,
        },
        {
          id: 'TreeAssetHierarchy',
          title: 'Asset hierarchy',
          note: 'The full pattern for an asset explorer: icon, name, tag and run state on a tinted panel.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: TreeAssetHierarchy,
        },
        {
          id: 'TreeScopePicker',
          title: 'Scope picker',
          note: 'A checkbox tree in a card with a count and one commit action.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TreeScopePicker,
        },
        {
          id: 'TreeWithDetail',
          title: 'Tree and detail',
          note: 'Split view: the tree picks an asset and the panel beside it shows the details.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: TreeWithDetail,
        },
      ],
    },
  ],
});
