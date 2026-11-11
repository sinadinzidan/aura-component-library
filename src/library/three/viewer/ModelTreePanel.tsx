import { Button } from '@cognite/aura/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconEye, IconEyeOff, IconFocusCentered } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { flattenAssemblies } from '../models/assemblyTree';
import type { AssemblyNode } from '../models/assemblyTree';

import { nodeVisibility } from './modelTree';
import type { TreeVisibility } from './modelTree';

export type ModelTreePanelProps = {
  tree: AssemblyNode;
  visibility: TreeVisibility;
  selectedId?: string | null;
  /** Show or hide a part, or every part under a group. */
  onToggle: (id: string) => void;
  /** Fade everything but this node, or clear isolation when it is already isolated. */
  onIsolate: (id: string) => void;
  onSelect?: (id: string) => void;
  onShowAll?: () => void;
  className?: string;
};

const ROW_ACTION = 'focus-visible:outline-2 focus-visible:outline-[var(--ring-default)]';

/**
 * The structure of a model as a list: every group and part with an eye to hide it, a button to
 * isolate it (everything else fades) and a name that selects it. A group shows a partly hidden
 * state when only some of its parts are off. The tree is a flat list of buttons, so Tab walks it.
 */
export function ModelTreePanel({ tree, visibility, selectedId = null, onToggle, onIsolate, onSelect, onShowAll, className }: ModelTreePanelProps) {
  const rows = flattenAssemblies(tree);
  const anyChange = visibility.hiddenIds.length > 0 || visibility.isolatedId !== null;

  return (
    <div data-slot="model-tree-panel" className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{visibility.isolatedId ? 'One group isolated' : visibility.hiddenIds.length > 0 ? `${visibility.hiddenIds.length} hidden` : 'All shown'}</span>
        {onShowAll ? (
          <Button variant="ghost" size="sm" disabled={!anyChange} onClick={onShowAll}>
            Show all
          </Button>
        ) : null}
      </div>
      <ul aria-label="Model structure" className="flex flex-col">
        {rows.map(({ node, depth }) => {
          const state = nodeVisibility(tree, visibility, node.id);
          const isolated = visibility.isolatedId === node.id;
          const selected = selectedId === node.id;
          const leaf = !node.children || node.children.length === 0;
          const stateWord = state === 'visible' ? 'shown' : state === 'hidden' ? 'hidden' : 'partly hidden';
          return (
            <li key={node.id} className={cn('flex items-center gap-1 rounded-md', selected && 'bg-secondary-background')} style={{ paddingLeft: `${depth * 0.75}rem` }}>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label={`${node.name}, ${stateWord}. ${state === 'visible' ? 'Hide' : 'Show'}`} aria-pressed={state === 'visible'} className={ROW_ACTION} onClick={() => onToggle(node.id)}>
                      {state === 'hidden' ? <IconEyeOff /> : <IconEye className={state === 'partial' ? 'opacity-50' : undefined} />}
                    </Button>
                  }
                />
                <TooltipContent>{state === 'visible' ? 'Hide' : 'Show'} {node.name}</TooltipContent>
              </Tooltip>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect?.(node.id)}
                className={cn('flex min-w-0 flex-1 flex-col items-start rounded-md px-1.5 py-1 text-left outline-none hover:bg-secondary-background', ROW_ACTION, state === 'hidden' && 'text-muted-foreground')}
              >
                <span className={cn('max-w-full truncate text-sm', leaf ? 'text-base-foreground' : 'font-medium text-base-foreground', state === 'hidden' && 'text-muted-foreground')}>{node.name}</span>
                {node.detail ? <span className="font-mono text-xs text-muted-foreground">{node.detail}</span> : null}
              </button>
              {node.id !== tree.id ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant={isolated ? 'secondary' : 'ghost'} size="icon-sm" aria-label={`Isolate ${node.name}`} aria-pressed={isolated} className={ROW_ACTION} onClick={() => onIsolate(node.id)}>
                        <IconFocusCentered />
                      </Button>
                    }
                  />
                  <TooltipContent>{isolated ? 'Clear isolation' : `Isolate ${node.name}`}</TooltipContent>
                </Tooltip>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
