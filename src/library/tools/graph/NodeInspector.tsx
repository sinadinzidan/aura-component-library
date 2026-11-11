import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { IconCopy, IconTrash } from '@cognite/aura/icons';
import { useId } from 'react';

import { LayerSwitch } from '../../experiences/spatial/LayerSwitch';
import { StatusIndicator } from '../../industrial/StatusIndicator';
import { SidePanel } from '../../patterns/structure/SidePanel';

import { PORT_TYPE_LABEL, RUN_STATE_LABEL } from './graphModel';
import type { GraphNode, RunState } from './graphModel';

export type NodeInspectorProps = {
  /** One selected node. */
  node: GraphNode;
  /** Number of connections on the node, in and out. */
  connections: number;
  readOnly?: boolean;
  onRename: (title: string) => void;
  onDetail: (detail: string) => void;
  onRunState: (state: RunState) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose?: () => void;
};

const RUN_OPTIONS = (['idle', 'running', 'done', 'failed'] as const).map((value) => ({ value, label: RUN_STATE_LABEL[value] }));
const RUN_TONE = { idle: 'neutral', running: 'info', done: 'success', failed: 'critical' } as const;
const RUN_SHAPE = { idle: 'ring', running: 'square', done: 'dot', failed: 'diamond' } as const;

/** Properties of the selected node: name, configuration, ports and run state, with duplicate and delete. */
export function NodeInspector({ node, connections, readOnly = false, onRename, onDetail, onRunState, onDuplicate, onDelete, onClose }: NodeInspectorProps) {
  const titleId = useId();
  const detailId = useId();
  return (
    <SidePanel
      title={node.title}
      description={`${node.kind} node · ${connections} ${connections === 1 ? 'connection' : 'connections'}`}
      status={<StatusIndicator tone={RUN_TONE[node.state]} shape={RUN_SHAPE[node.state]} label={RUN_STATE_LABEL[node.state]} size="sm" />}
      onClose={onClose}
      frame="edge"
      footer={
        readOnly ? undefined : (
          <>
            <Button variant="secondary" onClick={onDuplicate}>
              <IconCopy /> Duplicate
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              <IconTrash /> Delete
            </Button>
          </>
        )
      }
    >
      <div data-slot="node-inspector" className="flex flex-col gap-4">
        <div className="flex flex-col">
          <Label htmlFor={titleId}>Name</Label>
          <Input id={titleId} value={node.title} readOnly={readOnly} onChange={(event) => onRename(event.target.value)} />
        </div>
        <div className="flex flex-col">
          <Label htmlFor={detailId}>Settings</Label>
          <Input id={detailId} value={node.detail ?? ''} readOnly={readOnly} onChange={(event) => onDetail(event.target.value)} />
        </div>
        {node.error ? (
          <p role="alert" className="rounded-md bg-critical-background p-2 text-sm text-critical-foreground">
            {node.error}
          </p>
        ) : null}
        <div className="flex flex-col gap-1">
          <LayerSwitch label="Run state" value={node.state} options={RUN_OPTIONS} onValueChange={onRunState} />
          {readOnly ? <p className="text-xs text-muted-foreground">Run state is set by the pipeline when it runs.</p> : null}
        </div>
        <section className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-muted-foreground">Ports</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {node.inputs.map((port) => (
              <li key={`in-${port.id}`} className="flex justify-between gap-3">
                <span className="text-base-foreground">In: {port.label}</span>
                <span className="text-muted-foreground">{PORT_TYPE_LABEL[port.type]}</span>
              </li>
            ))}
            {node.outputs.map((port) => (
              <li key={`out-${port.id}`} className="flex justify-between gap-3">
                <span className="text-base-foreground">Out: {port.label}</span>
                <span className="text-muted-foreground">{PORT_TYPE_LABEL[port.type]}</span>
              </li>
            ))}
            {node.inputs.length + node.outputs.length === 0 ? <li className="text-muted-foreground">No ports.</li> : null}
          </ul>
        </section>
      </div>
    </SidePanel>
  );
}
