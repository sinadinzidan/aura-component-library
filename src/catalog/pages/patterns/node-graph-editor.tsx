import { Card, CardContent, CardDescription, CardHeader, CardHeaderCenter, CardTitle } from '@cognite/aura/components/card';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ThemeScope } from '../../../library/themes/ThemeScope';
import { ALARM_RULE_GRAPH, MAINTENANCE_GRAPH, NODE_TEMPLATES, PIPELINE_GRAPH } from '../../../library/tools/graph/graphFixtures';
import { NODE_WIDTH, edgePath, graphBounds, nodeHeight, nodeRect, portPosition } from '../../../library/tools/graph/graphModel';
import type { GraphData, GraphNode, RunState } from '../../../library/tools/graph/graphModel';
import { GraphNodeCard } from '../../../library/tools/graph/GraphNodeCard';
import { NodeGraphEditor } from '../../../library/tools/graph/NodeGraphEditor';
import { NodeInspector } from '../../../library/tools/graph/NodeInspector';
import { NodePalette } from '../../../library/tools/graph/NodePalette';
import { PortTypeLegend } from '../../../library/tools/graph/PortTypeLegend';
import { ViewportMiniMap } from '../../../library/tools/pid/ViewportMiniMap';
import { definePage } from '../../types';

import source from './node-graph-editor.tsx?raw';

const node = (graph: GraphData, id: string): GraphNode => {
  const found = graph.nodes.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Unknown node ${id}`);
  return found;
};

const at = (source: GraphNode, x: number, y: number, patch: Partial<GraphNode> = {}): GraphNode => ({ ...source, x, y, ...patch });

/** A drawing surface for the static parts: an SVG sized to its content, with the arrowhead markers the edges use. */
function NodeGraphSurface({ label, width, height, children }: { label: string; width: number; height: number; children: ReactNode }) {
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} fill="none" className="block w-full" style={{ maxWidth: width }}>
      <defs>
        {(['default', 'selected', 'ok', 'bad'] as const).map((kind) => (
          <marker key={kind} id={`ng-arrow-${kind}`} viewBox="0 0 10 10" refX={9} refY={5} markerUnits="userSpaceOnUse" markerWidth={10} markerHeight={10} orient="auto-start-reverse" className={kind === 'selected' ? 'text-base-foreground' : kind === 'ok' ? 'text-info-foreground-strong' : kind === 'bad' ? 'text-critical-foreground-strong' : 'text-medium-foreground'}>
            <path d="M 0 0 L 10 5 L 0 10 Z" fill="currentColor" />
          </marker>
        ))}
      </defs>
      {children}
    </svg>
  );
}

const SOURCE = PIPELINE_GRAPH.nodes[0];
const TRANSFORM = PIPELINE_GRAPH.nodes[1];
const MODEL = PIPELINE_GRAPH.nodes[3];
const SINK = PIPELINE_GRAPH.nodes[5];

function NodeGraphFull() {
  return (
    <div className="h-176 w-full">
      <NodeGraphEditor graph={PIPELINE_GRAPH} label="Anomaly detection pipeline" />
    </div>
  );
}

function NodeGraphAlarmRule() {
  return (
    <div className="h-136 w-full">
      <NodeGraphEditor graph={ALARM_RULE_GRAPH} label="Compressor high temperature and vibration rule" />
    </div>
  );
}

function NodeGraphDarkScope() {
  return (
    <ThemeScope preset="control-room" className="h-136 w-full">
      <NodeGraphEditor graph={MAINTENANCE_GRAPH} label="Recompressor trip response" initialSelection={['part']} />
    </ThemeScope>
  );
}

function NodeGraphReadOnly() {
  return (
    <div className="h-120 w-full">
      <NodeGraphEditor graph={PIPELINE_GRAPH} label="Anomaly detection pipeline, as deployed" readOnly />
    </div>
  );
}

function NodeGraphCompactCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardHeaderCenter>
          <CardTitle>Alarm rule</CardTitle>
          <CardDescription>Fires when both readings stay high for five minutes.</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent className="w-full">
        <div className="h-72 w-full">
          <NodeGraphEditor graph={ALARM_RULE_GRAPH} label="Alarm rule" variant="compact" readOnly />
        </div>
      </CardContent>
    </Card>
  );
}

function NodeGraphEmptyCanvas() {
  return (
    <div className="h-96 w-full">
      <NodeGraphEditor graph={{ nodes: [], edges: [] }} label="New pipeline" />
    </div>
  );
}

function NodeGraphMultiSelection() {
  return (
    <div className="h-120 w-full">
      <NodeGraphEditor graph={PIPELINE_GRAPH} label="Anomaly detection pipeline" initialSelection={['src', 'clean', 'feat']} />
    </div>
  );
}

function NodeGraphRunStates() {
  const states: RunState[] = ['idle', 'running', 'done', 'failed'];
  const width = 4 * (NODE_WIDTH + 24) + 24;
  return (
    <NodeGraphSurface label="One node in each run state: not run, running, done and failed" width={width} height={nodeHeight(TRANSFORM) + 40}>
      {states.map((state, index) => (
        <GraphNodeCard key={state} node={at(TRANSFORM, 24 + index * (NODE_WIDTH + 24), 20, { state, error: state === 'failed' ? 'The window is longer than the series.' : undefined })} readOnly />
      ))}
    </NodeGraphSurface>
  );
}

function NodeGraphNodeShapes() {
  const sink = at(SINK, 24, 20);
  const source = at(SOURCE, 24 + NODE_WIDTH + 24, 20);
  const model = at(MODEL, 24 + 2 * (NODE_WIDTH + 24), 20);
  const width = 3 * (NODE_WIDTH + 24) + 24;
  return (
    <NodeGraphSurface label="Three node shapes: an output with only inputs, a source with only outputs, and a node with two inputs" width={width} height={nodeHeight(model) + 40}>
      <GraphNodeCard node={sink} readOnly />
      <GraphNodeCard node={source} readOnly />
      <GraphNodeCard node={model} readOnly />
    </NodeGraphSurface>
  );
}

function NodeGraphPortTypes() {
  return (
    <PortTypeLegend
      layout="column"
      descriptions={{
        signal: 'A time series from CDF',
        number: 'A single value',
        boolean: 'A condition that is on or off',
        text: 'A message or identifier',
        table: 'Rows and columns',
        any: 'Accepts any other type',
      }}
    />
  );
}

function NodeGraphEdgeStates() {
  const a = at(SOURCE, 20, 24);
  const b = at(TRANSFORM, 300, 24);
  const c = at(SOURCE, 20, 168);
  const d = at(TRANSFORM, 300, 168);
  const edges = [
    { from: a, to: b, kind: 'default', label: 'Connected' },
    { from: c, to: d, kind: 'bad', label: 'Refused' },
  ] as const;
  return (
    <NodeGraphSurface label="Edges: connected, and a connection being refused" width={560} height={nodeHeight(a) + nodeHeight(c) + 80}>
      {edges.map((edge) => {
        const start = portPosition(edge.from, 'output', 'out');
        const finish = portPosition(edge.to, 'input', 'in');
        if (!start || !finish) return null;
        return (
          <g key={edge.label}>
            <GraphNodeCard node={edge.from} readOnly />
            <GraphNodeCard node={edge.to} readOnly feedback={() => (edge.kind === 'bad' ? 'invalid' : null)} />
            <path d={edgePath(start, finish)} strokeWidth={edge.kind === 'bad' ? 2 : 1.5} strokeDasharray={edge.kind === 'bad' ? '6 4' : undefined} markerEnd={`url(#ng-arrow-${edge.kind})`} className={edge.kind === 'bad' ? 'stroke-critical-foreground-strong' : 'stroke-medium-foreground'} />
            <text x={start.x + 8} y={start.y - 12} fontSize={11} className="fill-muted-foreground">
              {edge.label}
            </text>
          </g>
        );
      })}
    </NodeGraphSurface>
  );
}

function NodeGraphSelectedEdge() {
  const a = at(SOURCE, 20, 24);
  const b = at(TRANSFORM, 300, 72);
  const start = portPosition(a, 'output', 'out');
  const finish = portPosition(b, 'input', 'in');
  if (!start || !finish) return null;
  const mid = { x: (start.x + finish.x) / 2, y: (start.y + finish.y) / 2 };
  return (
    <NodeGraphSurface label="A selected connection with its remove handle" width={560} height={nodeHeight(b) + 100}>
      <GraphNodeCard node={a} readOnly />
      <GraphNodeCard node={b} readOnly />
      <path d={edgePath(start, finish)} strokeWidth={2.5} markerEnd="url(#ng-arrow-selected)" className="stroke-base-foreground" />
      <circle cx={mid.x} cy={mid.y} r={11} strokeWidth={1.5} className="fill-base-background stroke-base-foreground" />
      <path d={`M ${mid.x - 4} ${mid.y - 4} l 8 8 m 0 -8 l -8 8`} strokeWidth={1.5} className="stroke-base-foreground" />
    </NodeGraphSurface>
  );
}

function NodeGraphRefusedConnection() {
  const source = at(SOURCE, 20, 20);
  const model = at(MODEL, 340, 20);
  const start = portPosition(source, 'output', 'out');
  const finish = portPosition(model, 'input', 'thr');
  if (!start || !finish) return null;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <p role="alert" className="rounded-md bg-critical-background px-3 py-1.5 text-sm text-critical-foreground">
        Time series cannot feed number.
      </p>
      <NodeGraphSurface label="A time series output dragged onto a number input, refused" width={560} height={nodeHeight(model) + 40}>
        <GraphNodeCard node={source} readOnly={false} armedPort={{ node: source.id, port: 'out' }} />
        <GraphNodeCard node={model} readOnly={false} armedPort={{ node: source.id, port: 'out' }} feedback={(id) => (id === 'thr' ? 'invalid' : 'valid')} />
        <path d={edgePath(start, finish)} strokeWidth={2} strokeDasharray="6 4" markerEnd="url(#ng-arrow-bad)" className="stroke-critical-foreground-strong" />
      </NodeGraphSurface>
    </div>
  );
}

function NodeGraphPalette() {
  const [added, setAdded] = useState<string[]>([]);
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <NodePalette templates={NODE_TEMPLATES} onAdd={(template) => setAdded([...added, template.title])} />
      <p role="status" className="text-xs text-muted-foreground">
        {added.length === 0 ? 'Nothing added yet.' : `Added ${added[added.length - 1]}. ${added.length} added in total.`}
      </p>
    </div>
  );
}

function NodeGraphInspectorPanel() {
  const [title, setTitle] = useState(MODEL.title);
  const [detail, setDetail] = useState(MODEL.detail ?? '');
  const [state, setState] = useState<RunState>('idle');
  return (
    <div className="h-136 w-full max-w-sm">
      <NodeInspector node={{ ...MODEL, title, detail, state }} connections={3} onRename={setTitle} onDetail={setDetail} onRunState={setState} onDuplicate={() => undefined} onDelete={() => undefined} />
    </div>
  );
}

function NodeGraphInspectorFailed() {
  return (
    <div className="h-136 w-full max-w-sm">
      <NodeInspector node={node(MAINTENANCE_GRAPH, 'part')} connections={2} onRename={() => undefined} onDetail={() => undefined} onRunState={() => undefined} onDuplicate={() => undefined} onDelete={() => undefined} />
    </div>
  );
}

function NodeGraphInspectorReadOnly() {
  return (
    <div className="h-136 w-full max-w-sm">
      <NodeInspector node={node(PIPELINE_GRAPH, 'feat')} connections={2} readOnly onRename={() => undefined} onDetail={() => undefined} onRunState={() => undefined} onDuplicate={() => undefined} onDelete={() => undefined} />
    </div>
  );
}

function NodeGraphMiniMapDemo() {
  const bounds = graphBounds(PIPELINE_GRAPH.nodes);
  const world = { x: bounds.x - 64, y: bounds.y - 64, width: bounds.width + 128, height: bounds.height + 128 };
  const [centre, setCentre] = useState({ x: 400, y: 100 });
  return (
    <ViewportMiniMap world={world} viewport={{ x: centre.x - 300, y: centre.y - 120, width: 600, height: 240 }} label="Mini-map of the anomaly detection pipeline" onRecentre={setCentre}>
      {PIPELINE_GRAPH.nodes.map((candidate) => {
        const rect = nodeRect(candidate);
        return <rect key={candidate.id} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx={6} className="fill-medium-foreground" />;
      })}
    </ViewportMiniMap>
  );
}

export default definePage({
  id: 'node-graph-editor',
  title: 'Node graph editor',
  summary:
    'A canvas of draggable nodes with typed ports. Drag from an output to an input to connect, select with a click or a marquee, snap to a grid, pan and zoom, arrange automatically and undo. Three example graphs: a data pipeline, an alarm rule and a maintenance workflow.',
  guidance: {
    use: [
      'People assemble a flow of steps whose order and data matter: pipelines, calculations, rules and workflows.',
      'Connections have a type, and a wrong one should be refused with a reason, not allowed and then failed at run time.',
      'The graph is small enough to read as a picture, up to a few dozen nodes.',
    ],
    avoid: [
      'A linear list of steps. Use a stepper or a sortable list instead.',
      'Hundreds of nodes. Group them into sub-graphs and open each in its own canvas.',
      'Dragging as the only way to connect. Every connection must also be makeable from the keyboard.',
    ],
  },
  source,
  sections: [
    {
      id: 'editors',
      title: 'The editor',
      description: 'Three working graphs. Drag nodes, drag from an output port to an input port, Shift-drag to select several, Delete to remove, Ctrl+Z to undo.',
      specimens: [
        {
          id: 'NodeGraphFull',
          title: 'Data pipeline',
          note: 'Pick it as the main editor: a palette on the left, an inspector for the selected node and a mini-map.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/graph/NodeGraphEditor.tsx', 'tools/graph/graphReducer.ts', 'tools/graph/graphModel.ts', 'tools/graph/graphLayout.ts'],
          Component: NodeGraphFull,
        },
        {
          id: 'NodeGraphAlarmRule',
          title: 'Alarm rule',
          note: 'Pick it for logic flows: boolean ports only connect to boolean inputs, so a rule cannot be wired nonsensically.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/graph/NodeGraphEditor.tsx'],
          Component: NodeGraphAlarmRule,
        },
        {
          id: 'NodeGraphDarkScope',
          title: 'Maintenance workflow, dark',
          note: 'Pick it for control rooms: the same editor in the control-room theme with a failed step selected.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/graph/NodeGraphEditor.tsx', 'themes/ThemeScope.tsx'],
          Component: NodeGraphDarkScope,
        },
        {
          id: 'NodeGraphReadOnly',
          title: 'Read-only viewer',
          note: 'Pick it to show a deployed graph: it pans, zooms and selects, but nothing can be moved or connected.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/graph/NodeGraphEditor.tsx'],
          Component: NodeGraphReadOnly,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Nodes and edges',
      description: 'The building blocks: how a node says what it is and whether it ran, how ports are typed and how a connection looks.',
      specimens: [
        {
          id: 'NodeGraphRunStates',
          title: 'Run states',
          note: 'Pick it to show progress: each state has a shape and a word, and a failed node carries its error.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/graph/GraphNodeCard.tsx'],
          Component: NodeGraphRunStates,
        },
        {
          id: 'NodeGraphNodeShapes',
          title: 'Node shapes',
          note: 'Pick the shape that matches the step: outputs take only inputs, sources give only outputs, a model takes several.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/graph/GraphNodeCard.tsx'],
          Component: NodeGraphNodeShapes,
        },
        {
          id: 'NodeGraphPortTypes',
          title: 'Port types',
          note: 'Pick it as the key to a graph: every data type has a glyph and a name, so types read without colour.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/graph/PortTypeLegend.tsx'],
          Component: NodeGraphPortTypes,
        },
        {
          id: 'NodeGraphEdgeStates',
          title: 'Edge states',
          note: 'Pick it to see a connection as made and as refused: refusal is dashed, red and comes with a reason.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/graph/GraphNodeCard.tsx', 'tools/graph/graphModel.ts'],
          Component: NodeGraphEdgeStates,
        },
        {
          id: 'NodeGraphSelectedEdge',
          title: 'Selected connection',
          note: 'Pick it for removing a link: a selected edge is heavier and shows a handle at its middle.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/graph/GraphNodeCard.tsx'],
          Component: NodeGraphSelectedEdge,
        },
        {
          id: 'NodeGraphRefusedConnection',
          title: 'Validation error',
          note: 'Pick it when a drop is invalid: valid inputs light up, the wrong one is marked, and the reason is in words.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/graph/GraphNodeCard.tsx'],
          Component: NodeGraphRefusedConnection,
        },
      ],
    },
    {
      id: 'panels',
      title: 'Palette, inspector and map',
      description: 'The panels around the canvas.',
      specimens: [
        {
          id: 'NodeGraphPalette',
          title: 'Node palette',
          note: 'Pick it to add steps: each has its own Add button, so adding never depends on dragging.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/graph/NodePalette.tsx'],
          Component: NodeGraphPalette,
        },
        {
          id: 'NodeGraphInspectorPanel',
          title: 'Inspector',
          note: 'Pick it for editing one node: its name, settings, run state and ports, with duplicate and delete.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/graph/NodeInspector.tsx', 'experiences/spatial/LayerSwitch.tsx'],
          Component: NodeGraphInspectorPanel,
        },
        {
          id: 'NodeGraphInspectorFailed',
          title: 'Inspector, failed node',
          note: 'Pick it when a step fails: the error is stated first, in words, above the settings.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/graph/NodeInspector.tsx'],
          Component: NodeGraphInspectorFailed,
        },
        {
          id: 'NodeGraphInspectorReadOnly',
          title: 'Inspector, read-only',
          note: 'Pick it in a viewer: fields are locked and the duplicate and delete actions are gone.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/graph/NodeInspector.tsx'],
          Component: NodeGraphInspectorReadOnly,
        },
        {
          id: 'NodeGraphMiniMapDemo',
          title: 'Mini-map',
          note: 'Pick it for graphs wider than the screen: click or drag to move the view, arrow keys nudge it.',
          origin: 'custom',
          size: 'sm',
          uses: ['tools/pid/ViewportMiniMap.tsx'],
          Component: NodeGraphMiniMapDemo,
        },
      ],
    },
    {
      id: 'states',
      title: 'States and embedding',
      description: 'The editor with nothing in it, with several nodes selected, and as a small read-only picture in a card.',
      specimens: [
        {
          id: 'NodeGraphEmptyCanvas',
          title: 'Empty canvas',
          note: 'Pick it for a new graph: say what to do first instead of showing an empty grid.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/graph/NodeGraphEditor.tsx'],
          Component: NodeGraphEmptyCanvas,
        },
        {
          id: 'NodeGraphMultiSelection',
          title: 'Selection toolbar',
          note: 'Pick it when several nodes are selected: a toolbar offers duplicate and delete, and the count is spoken.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/graph/NodeGraphEditor.tsx'],
          Component: NodeGraphMultiSelection,
        },
        {
          id: 'NodeGraphCompactCard',
          title: 'Compact in a card',
          note: 'Pick it to summarise a rule on an overview page: no palette, inspector or map, and no editing.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/graph/NodeGraphEditor.tsx'],
          Component: NodeGraphCompactCard,
        },
      ],
    },
  ],
});
