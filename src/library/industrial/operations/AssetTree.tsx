import { Badge } from '@cognite/aura/components/badge';
import { Tree } from '@cognite/aura/components/tree';
import { IconBell, IconCheck } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { healthStatus, runStateStatus } from '../status';
import { StatusDot } from '../StatusDot';
import { StatusIndicator } from '../StatusIndicator';

import { ASSET_TREE_ROOT, rollUp } from './assetTreeLogic';
import type { AssetTreeIndex, AssetTreeNode } from './assetTreeLogic';

export type AssetTreeProps = {
  /** From `indexAssetTree`. */
  nodes: AssetTreeIndex;
  /** The node whose children form the top level. Defaults to the hidden root. */
  rootId?: string;
  /** What leads each row: the name (default) or the tag, for people who think in tag numbers. */
  display?: 'name-first' | 'tag-first';
  /** The other of name and tag as quiet secondary text. */
  showSecondary?: boolean;
  /** Run state as a shaped dot before the label. Branches show the worst state below them. */
  showState?: boolean;
  /** Health score at the end of the row; watch and poor become a badge. */
  showHealth?: boolean;
  /** Open alarms on the node and everything below it. */
  showAlarms?: boolean;
  checkboxes?: boolean;
  checkedItems?: string[];
  defaultCheckedItems?: string[];
  onCheckedItemsChange?: (checked: string[]) => void;
  expandedItems?: string[];
  defaultExpandedItems?: string[];
  onExpandedItemsChange?: (expanded: string[]) => void;
  /** Highlights one row. Needs `onSelect` for rows to become selectable. */
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

const ALARM_VARIANT = { critical: 'error', high: 'warning', medium: 'inProgress', low: 'archived' } as const;

const childrenOf = (node: AssetTreeNode) => node.children;
const nameOf = (node: AssetTreeNode) => node.name;

/**
 * An asset hierarchy on Aura's Tree, with what an operator scans a hierarchy for: run state,
 * health and open alarms rolled up to every branch, so a collapsed area still shows that
 * something below it needs attention.
 */
export function AssetTree({
  nodes,
  rootId = ASSET_TREE_ROOT,
  display = 'name-first',
  showSecondary = false,
  showState = false,
  showHealth = false,
  showAlarms = false,
  checkboxes = false,
  checkedItems,
  defaultCheckedItems,
  onCheckedItemsChange,
  expandedItems,
  defaultExpandedItems,
  onExpandedItemsChange,
  selectedId,
  onSelect,
  className,
}: AssetTreeProps) {
  return (
    <Tree
      rootItemId={rootId}
      items={nodes}
      getChildren={childrenOf}
      getItemName={nameOf}
      checkboxes={checkboxes}
      checkedItems={checkedItems}
      defaultCheckedItems={defaultCheckedItems}
      onCheckedItemsChange={onCheckedItemsChange}
      expandedItems={expandedItems}
      defaultExpandedItems={defaultExpandedItems}
      onExpandedItemsChange={onExpandedItemsChange}
      className={className}
    >
      {(item) => {
        const node = item.getItemData();
        const summary = rollUp(nodes, node.id);
        const isSelected = node.id === selectedId;
        const state = node.children.length > 0 ? (summary.worstState ?? node.state) : node.state;
        const stateStatus = state ? runStateStatus(state) : undefined;
        const primary = display === 'tag-first' ? node.tag : node.name;
        const secondary = display === 'tag-first' ? node.name : node.tag;

        const label = (
          <>
            {showState && stateStatus ? (
              <StatusDot
                size="sm"
                tone={stateStatus.tone}
                shape={stateStatus.shape}
                label={node.children.length > 0 ? `Worst state below: ${stateStatus.label}` : stateStatus.label}
              />
            ) : null}
            <span className="flex min-w-0 flex-1 items-baseline gap-2">
              <span
                data-slot="asset-tree-primary"
                className={cn(
                  'truncate text-sm',
                  display === 'tag-first' ? 'font-mono' : undefined,
                  isSelected ? 'font-medium text-base-foreground' : 'text-medium-foreground'
                )}
              >
                {primary}
              </span>
              {showSecondary && secondary ? (
                <span className={cn('truncate text-xs text-muted-foreground', display === 'tag-first' ? undefined : 'font-mono')}>{secondary}</span>
              ) : null}
            </span>
          </>
        );

        return (
          <>
            {onSelect ? (
              <button
                type="button"
                aria-current={isSelected ? 'true' : undefined}
                onClick={() => onSelect(node.id)}
                className="flex min-w-0 flex-1 items-center gap-2 rounded-md text-left outline-none focus-visible:shadow-focus-ring"
              >
                {label}
                {isSelected ? <IconCheck aria-hidden="true" className="size-4 shrink-0" /> : null}
              </button>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-2">{label}</span>
            )}
            {showHealth && node.healthScore !== undefined && node.health ? (
              node.health === 'good' ? (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums" aria-label={`Health ${node.healthScore}, good`}>
                  {node.healthScore}
                </span>
              ) : (
                <StatusIndicator variant="badge" {...healthStatus(node.health)} detail={String(node.healthScore)} className="shrink-0" />
              )
            ) : null}
            {showAlarms && summary.alarms > 0 ? (
              <Badge
                variant={ALARM_VARIANT[summary.worstSeverity ?? 'low']}
                aria-label={`${summary.alarms} open ${summary.alarms === 1 ? 'alarm' : 'alarms'}, worst ${summary.worstSeverity ?? 'low'}`}
                className="shrink-0"
              >
                <IconBell aria-hidden="true" />
                {summary.alarms}
              </Badge>
            ) : null}
          </>
        );
      }}
    </Tree>
  );
}
