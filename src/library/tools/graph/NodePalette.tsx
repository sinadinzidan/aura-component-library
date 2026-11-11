import { Button } from '@cognite/aura/components/button';
import { IconPlus } from '@cognite/aura/icons';

import type { NodeTemplate } from './graphFixtures';
import { PORT_TYPE_LABEL } from './graphModel';
import { PortGlyph } from './GraphNodeCard';

export type NodePaletteProps = {
  templates: readonly NodeTemplate[];
  onAdd: (template: NodeTemplate) => void;
  /** Locks the palette and says why. */
  disabledReason?: string;
};

const KIND_LABEL: Record<string, string> = { source: 'Source', transform: 'Transform', logic: 'Logic', model: 'Model', action: 'Action', sink: 'Output' };

/**
 * The node types that can be added to a graph. Each row says what the node takes in and gives
 * out, and has its own Add button, so adding never depends on dragging.
 */
export function NodePalette({ templates, onAdd, disabledReason }: NodePaletteProps) {
  return (
    <div data-slot="node-palette" className="flex w-full min-w-0 flex-col gap-2">
      {disabledReason ? <p className="text-xs text-muted-foreground">{disabledReason}</p> : null}
      <ul aria-label="Nodes to add" className="flex flex-col divide-y divide-default">
        {templates.map((template) => (
          <li key={`${template.kind}-${template.title}`} className="flex items-center gap-3 py-2">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-base-foreground">{template.title}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {KIND_LABEL[template.kind] ?? template.kind}
                {[...template.inputs, ...template.outputs].slice(0, 3).map((port) => (
                  <svg key={`${port.id}-${port.type}`} viewBox="0 0 16 16" className="size-3" role="img" aria-label={PORT_TYPE_LABEL[port.type]}>
                    <PortGlyph type={port.type} x={8} y={8} r={4} className="fill-base-background stroke-medium-foreground" />
                  </svg>
                ))}
              </span>
            </span>
            <Button variant="secondary" size="icon-sm" aria-label={`Add ${template.title}`} disabled={disabledReason !== undefined} onClick={() => onAdd(template)}>
              <IconPlus />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
