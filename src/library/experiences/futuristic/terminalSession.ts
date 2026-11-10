import { COMMAND_HELP, parseCommand } from './commandParser';
import type { AlarmFilter } from './commandParser';

/** Pure state for the text-mode console: selection, panes and the output scrollback. */

export type TerminalNode = { id: string; tag: string; name: string; parentId: string | null };
export type TerminalTag = { tag: string; name: string; nodeId: string };
export type TerminalAlarmState = 'active' | 'acknowledged' | 'cleared' | 'shelved';
export type TerminalAlarm = { id: string; state: TerminalAlarmState };

/** What the console knows about the plant. Richer records are fine; only these fields are read. */
export type TerminalWorld = {
  nodes: readonly TerminalNode[];
  tags: readonly TerminalTag[];
  alarms: readonly TerminalAlarm[];
};

export type TerminalLineKind = 'input' | 'ok' | 'error' | 'info';
export type TerminalLine = { kind: TerminalLineKind; text: string };

export type TerminalState = {
  /** Selected tree node. */
  selectedId: string;
  /** Tag plotted in the trend pane. */
  trendTag: string;
  alarmFilter: AlarmFilter;
  /** Alarms acknowledged in this session. */
  acknowledged: readonly string[];
  /** Collapsed tree nodes. */
  collapsed: readonly string[];
  lines: readonly TerminalLine[];
};

export type TerminalAction =
  | { type: 'command'; input: string }
  | { type: 'select'; id: string }
  | { type: 'move'; direction: 1 | -1 }
  | { type: 'collapse'; id: string }
  | { type: 'expand'; id: string };

export type VisibleNode = { node: TerminalNode; depth: number; hasChildren: boolean; collapsed: boolean };

const MAX_LINES = 60;

/** The tree flattened depth-first, skipping everything under a collapsed node. */
export function visibleNodes(nodes: readonly TerminalNode[], collapsed: readonly string[] = []): VisibleNode[] {
  const result: VisibleNode[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const node of nodes.filter((candidate) => candidate.parentId === parentId)) {
      const hasChildren = nodes.some((candidate) => candidate.parentId === node.id);
      const isCollapsed = collapsed.includes(node.id);
      result.push({ node, depth, hasChildren, collapsed: isCollapsed });
      if (hasChildren && !isCollapsed) walk(node.id, depth + 1);
    }
  };
  walk(null, 0);
  return result;
}

/** A node and everything below it. */
export function subtreeIds(nodes: readonly TerminalNode[], rootId: string): string[] {
  const ids = [rootId];
  for (const id of ids) {
    for (const node of nodes) if (node.parentId === id) ids.push(node.id);
  }
  return ids;
}

/** The node's ancestors, nearest first. */
export function ancestorIds(nodes: readonly TerminalNode[], id: string): string[] {
  const result: string[] = [];
  let current = nodes.find((node) => node.id === id);
  while (current?.parentId) {
    result.push(current.parentId);
    const parentId = current.parentId;
    current = nodes.find((node) => node.id === parentId);
  }
  return result;
}

/** An alarm's state after this session's acknowledgements. */
export function effectiveAlarmState(alarm: TerminalAlarm, acknowledged: readonly string[]): TerminalAlarmState {
  return alarm.state === 'active' && acknowledged.includes(alarm.id) ? 'acknowledged' : alarm.state;
}

export function initialTerminalState(world: TerminalWorld, overrides: Partial<TerminalState> = {}): TerminalState {
  return {
    selectedId: world.nodes[0]?.id ?? '',
    trendTag: world.tags[0]?.tag ?? '',
    alarmFilter: 'active',
    acknowledged: [],
    collapsed: [],
    lines: [{ kind: 'info', text: 'Ready. Type help for the list of commands.' }],
    ...overrides,
  };
}

function print(state: TerminalState, input: string, kind: TerminalLineKind, ...texts: string[]): TerminalState {
  const added: TerminalLine[] = [{ kind: 'input', text: input.trim() }, ...texts.map((text) => ({ kind, text }))];
  return { ...state, lines: [...state.lines, ...added].slice(-MAX_LINES) };
}

function reveal(state: TerminalState, world: TerminalWorld, id: string): TerminalState {
  const ancestors = ancestorIds(world.nodes, id);
  return { ...state, selectedId: id, collapsed: state.collapsed.filter((collapsedId) => !ancestors.includes(collapsedId)) };
}

function runCommand(state: TerminalState, world: TerminalWorld, input: string): TerminalState {
  const command = parseCommand(input);
  switch (command.kind) {
    case 'empty':
      return state;
    case 'error':
      return print(state, input, 'error', command.message);
    case 'help':
      return print(state, input, 'info', ...COMMAND_HELP.map((entry) => `${entry.usage.padEnd(20)}${entry.description}`));
    case 'clear':
      return { ...state, lines: [] };
    case 'show-alarms': {
      const next = { ...state, alarmFilter: command.filter };
      const count = world.alarms.filter(
        (alarm) => command.filter === 'all' || effectiveAlarmState(alarm, state.acknowledged) === 'active'
      ).length;
      return print(next, input, 'ok', command.filter === 'all' ? `Alarm log: all ${count} alarms` : `Alarm log: ${count} unacknowledged`);
    }
    case 'show-tags': {
      const root = world.nodes.find((node) => node.parentId === null);
      if (!root) return print(state, input, 'error', 'No plant loaded');
      return print(reveal(state, world, root.id), input, 'ok', `Tags: all ${world.tags.length} under ${root.tag}`);
    }
    case 'goto': {
      const node = world.nodes.find((candidate) => candidate.tag.toUpperCase() === command.tag);
      if (!node) return print(state, input, 'error', `No asset ${command.tag}`);
      return print(reveal(state, world, node.id), input, 'ok', `Selected ${node.tag} ${node.name}`);
    }
    case 'trend': {
      const tag = world.tags.find((candidate) => candidate.tag.toUpperCase() === command.tag);
      if (!tag) return print(state, input, 'error', `No tag ${command.tag}`);
      return print({ ...reveal(state, world, tag.nodeId), trendTag: tag.tag }, input, 'ok', `Trending ${tag.tag} ${tag.name}`);
    }
    case 'ack': {
      const alarm = world.alarms.find((candidate) => candidate.id === command.alarmId);
      if (!alarm) return print(state, input, 'error', `No alarm ${command.alarmId}`);
      const current = effectiveAlarmState(alarm, state.acknowledged);
      if (current === 'acknowledged') return print(state, input, 'error', `${alarm.id} is already acknowledged`);
      if (current !== 'active') return print(state, input, 'error', `${alarm.id} is ${current}, nothing to acknowledge`);
      return print({ ...state, acknowledged: [...state.acknowledged, alarm.id] }, input, 'ok', `Acknowledged ${alarm.id}`);
    }
  }
}

/** Reducer for one console session over a fixed world. */
export function terminalReducer(world: TerminalWorld): (state: TerminalState, action: TerminalAction) => TerminalState {
  return (state, action) => {
    switch (action.type) {
      case 'command':
        return runCommand(state, world, action.input);
      case 'select':
        return world.nodes.some((node) => node.id === action.id) ? { ...state, selectedId: action.id } : state;
      case 'move': {
        const visible = visibleNodes(world.nodes, state.collapsed);
        const index = visible.findIndex((entry) => entry.node.id === state.selectedId);
        const next = visible[Math.min(visible.length - 1, Math.max(0, index + action.direction))];
        return next ? { ...state, selectedId: next.node.id } : state;
      }
      case 'collapse': {
        if (state.collapsed.includes(action.id)) return state;
        // A selection hidden by the collapse moves up to the collapsed node.
        const hidden = subtreeIds(world.nodes, action.id).includes(state.selectedId);
        return { ...state, collapsed: [...state.collapsed, action.id], selectedId: hidden ? action.id : state.selectedId };
      }
      case 'expand':
        return { ...state, collapsed: state.collapsed.filter((id) => id !== action.id) };
    }
  };
}
