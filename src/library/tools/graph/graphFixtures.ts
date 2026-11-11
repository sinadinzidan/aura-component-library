import type { GraphData, GraphEdge, GraphNode, GraphPort, PortType, RunState } from './graphModel';

const port = (id: string, label: string, type: PortType): GraphPort => ({ id, label, type });

function node(id: string, kind: string, title: string, x: number, y: number, inputs: GraphPort[], outputs: GraphPort[], detail?: string, state: RunState = 'idle', error?: string): GraphNode {
  return { id, kind, title, x, y, inputs, outputs, detail, state, error };
}

const edge = (id: string, from: string, fromPort: string, to: string, toPort: string): GraphEdge => ({ id, from: { node: from, port: fromPort }, to: { node: to, port: toPort } });

/** Data pipeline: time series source, cleaning, features, model, and a table sink. */
export const PIPELINE_GRAPH: GraphData = {
  nodes: [
    node('src', 'source', 'Read time series', 40, 40, [], [port('out', 'Series', 'signal')], '23-PT-92531, 1 min', 'done'),
    node('clean', 'transform', 'Remove outliers', 296, 40, [port('in', 'Series', 'signal')], [port('out', 'Clean series', 'signal')], 'Hampel, window 15', 'done'),
    node('feat', 'transform', 'Rolling features', 552, 40, [port('in', 'Series', 'signal')], [port('out', 'Features', 'table')], 'Mean, std, 1 h', 'running'),
    node('model', 'model', 'Anomaly model', 808, 40, [port('in', 'Features', 'table'), port('thr', 'Threshold', 'number')], [port('out', 'Scores', 'table')], 'Isolation forest'),
    node('thr', 'source', 'Threshold', 552, 168, [], [port('out', 'Value', 'number')], '0.82', 'done'),
    node('sink', 'sink', 'Write to data set', 1064, 40, [port('in', 'Rows', 'table')], [], 'Anomaly scores'),
  ],
  edges: [edge('e1', 'src', 'out', 'clean', 'in'), edge('e2', 'clean', 'out', 'feat', 'in'), edge('e3', 'feat', 'out', 'model', 'in'), edge('e4', 'thr', 'out', 'model', 'thr'), edge('e5', 'model', 'out', 'sink', 'in')],
};

/** Alarm rule: two readings, a comparison, a delay and a notification. */
export const ALARM_RULE_GRAPH: GraphData = {
  nodes: [
    node('t', 'source', 'Discharge temperature', 40, 40, [], [port('out', 'Value', 'number')], '23-TT-92532', 'done'),
    node('v', 'source', 'Vibration', 40, 168, [], [port('out', 'Value', 'number')], '23-VT-92540', 'done'),
    node('gt1', 'logic', 'Above 145 °C', 296, 40, [port('in', 'Value', 'number')], [port('out', 'Result', 'boolean')], 'Greater than', 'done'),
    node('gt2', 'logic', 'Above 7.1 mm/s', 296, 168, [port('in', 'Value', 'number')], [port('out', 'Result', 'boolean')], 'Greater than', 'done'),
    node('and', 'logic', 'Both true', 552, 96, [port('a', 'A', 'boolean'), port('b', 'B', 'boolean')], [port('out', 'Result', 'boolean')], 'And', 'done'),
    node('hold', 'logic', 'Hold for 5 min', 808, 96, [port('in', 'Condition', 'boolean')], [port('out', 'Result', 'boolean')], 'On delay', 'running'),
    node('notify', 'sink', 'Raise high alarm', 1064, 96, [port('in', 'Condition', 'boolean')], [], 'Priority high, shift supervisor'),
  ],
  edges: [edge('e1', 't', 'out', 'gt1', 'in'), edge('e2', 'v', 'out', 'gt2', 'in'), edge('e3', 'gt1', 'out', 'and', 'a'), edge('e4', 'gt2', 'out', 'and', 'b'), edge('e5', 'and', 'out', 'hold', 'in'), edge('e6', 'hold', 'out', 'notify', 'in')],
};

/** Maintenance workflow: a failed step shows the error state. */
export const MAINTENANCE_GRAPH: GraphData = {
  nodes: [
    node('trig', 'source', 'Alarm raised', 40, 40, [], [port('out', 'Alarm', 'text')], 'Recompressor trip', 'done'),
    node('wo', 'action', 'Create work order', 296, 40, [port('in', 'Alarm', 'text')], [port('out', 'Order', 'text')], 'Corrective, P1', 'done'),
    node('part', 'action', 'Check spare parts', 552, 40, [port('in', 'Order', 'text')], [port('out', 'In stock', 'boolean')], 'Warehouse NK-W1', 'failed', 'Inventory service did not answer.'),
    node('assign', 'action', 'Assign technician', 808, 40, [port('in', 'Order', 'text'), port('ok', 'In stock', 'boolean')], [port('out', 'Assigned', 'text')], 'Mechanical, day shift'),
    node('notify', 'sink', 'Notify supervisor', 1064, 40, [port('in', 'Message', 'text')], [], 'Shift supervisor'),
  ],
  edges: [edge('e1', 'trig', 'out', 'wo', 'in'), edge('e2', 'wo', 'out', 'part', 'in'), edge('e3', 'wo', 'out', 'assign', 'in'), edge('e4', 'part', 'out', 'assign', 'ok'), edge('e5', 'assign', 'out', 'notify', 'in')],
};

/** Node kinds the palette can add. */
export type NodeTemplate = { kind: string; title: string; detail: string; inputs: readonly GraphPort[]; outputs: readonly GraphPort[] };

export const NODE_TEMPLATES: readonly NodeTemplate[] = [
  { kind: 'source', title: 'Read time series', detail: 'Choose a tag', inputs: [], outputs: [port('out', 'Series', 'signal')] },
  { kind: 'source', title: 'Constant', detail: 'Set a value', inputs: [], outputs: [port('out', 'Value', 'number')] },
  { kind: 'transform', title: 'Resample', detail: '1 min, mean', inputs: [port('in', 'Series', 'signal')], outputs: [port('out', 'Series', 'signal')] },
  { kind: 'logic', title: 'Compare', detail: 'Greater than', inputs: [port('in', 'Value', 'number')], outputs: [port('out', 'Result', 'boolean')] },
  { kind: 'logic', title: 'And', detail: 'Both true', inputs: [port('a', 'A', 'boolean'), port('b', 'B', 'boolean')], outputs: [port('out', 'Result', 'boolean')] },
  { kind: 'model', title: 'Anomaly model', detail: 'Isolation forest', inputs: [port('in', 'Features', 'table')], outputs: [port('out', 'Scores', 'table')] },
  { kind: 'action', title: 'Create work order', detail: 'Corrective', inputs: [port('in', 'Alarm', 'text')], outputs: [port('out', 'Order', 'text')] },
  { kind: 'sink', title: 'Notify', detail: 'Shift supervisor', inputs: [port('in', 'Message', 'text')], outputs: [] },
];
