import {
  ancestorIds,
  effectiveAlarmState,
  initialTerminalState,
  subtreeIds,
  terminalReducer,
  visibleNodes,
} from './terminalSession';
import type { TerminalState, TerminalWorld } from './terminalSession';

const WORLD: TerminalWorld = {
  nodes: [
    { id: 'nk', tag: 'NK', name: 'Plant', parentId: null },
    { id: 'nk-23', tag: 'NK-23', name: 'Gas compression', parentId: 'nk' },
    { id: 'ka-1', tag: '23-KA-9101', name: '1st stage compressor', parentId: 'nk-23' },
    { id: 'nk-27', tag: 'NK-27', name: 'Gas export', parentId: 'nk' },
  ],
  tags: [
    { tag: '23-PT-92531', name: 'Discharge pressure', nodeId: 'ka-1' },
    { tag: '27-FT-20011', name: 'Export flow', nodeId: 'nk-27' },
  ],
  alarms: [
    { id: 'alm-1', state: 'active' },
    { id: 'alm-2', state: 'acknowledged' },
    { id: 'alm-3', state: 'cleared' },
  ],
};

const reduce = terminalReducer(WORLD);
const start = (overrides: Partial<TerminalState> = {}) => initialTerminalState(WORLD, { lines: [], ...overrides });
const run = (input: string, state: TerminalState = start()) => reduce(state, { type: 'command', input });

describe(visibleNodes.name, () => {
  it('flattens the tree depth-first with depths', () => {
    expect(visibleNodes(WORLD.nodes).map((entry) => [entry.node.id, entry.depth])).toEqual([
      ['nk', 0],
      ['nk-23', 1],
      ['ka-1', 2],
      ['nk-27', 1],
    ]);
  });

  it('hides everything under a collapsed node', () => {
    const visible = visibleNodes(WORLD.nodes, ['nk-23']);
    expect(visible.map((entry) => entry.node.id)).toEqual(['nk', 'nk-23', 'nk-27']);
    expect(visible[1]).toMatchObject({ hasChildren: true, collapsed: true });
  });
});

describe('tree helpers', () => {
  it('lists a subtree from its root', () => {
    expect(subtreeIds(WORLD.nodes, 'nk-23')).toEqual(['nk-23', 'ka-1']);
  });

  it('lists ancestors nearest first', () => {
    expect(ancestorIds(WORLD.nodes, 'ka-1')).toEqual(['nk-23', 'nk']);
    expect(ancestorIds(WORLD.nodes, 'nk')).toEqual([]);
  });
});

describe(effectiveAlarmState.name, () => {
  it('turns an active alarm acknowledged once it is in the session list', () => {
    expect(effectiveAlarmState({ id: 'alm-1', state: 'active' }, ['alm-1'])).toBe('acknowledged');
    expect(effectiveAlarmState({ id: 'alm-1', state: 'active' }, [])).toBe('active');
  });

  it('leaves other states alone', () => {
    expect(effectiveAlarmState({ id: 'alm-3', state: 'cleared' }, ['alm-3'])).toBe('cleared');
  });
});

describe(initialTerminalState.name, () => {
  it('starts on the root, the first tag and unacknowledged alarms', () => {
    expect(initialTerminalState(WORLD)).toMatchObject({ selectedId: 'nk', trendTag: '23-PT-92531', alarmFilter: 'active' });
    expect(initialTerminalState(WORLD).lines).toHaveLength(1);
  });
});

describe('commands', () => {
  it('does nothing for an empty line', () => {
    const state = start();
    expect(run('   ', state)).toBe(state);
  });

  it('echoes the input and prints the command list for help', () => {
    const state = run('help');
    expect(state.lines[0]).toEqual({ kind: 'input', text: 'help' });
    expect(state.lines.slice(1).every((line) => line.kind === 'info')).toBe(true);
    expect(state.lines.some((line) => line.text.startsWith('trend <tag>'))).toBe(true);
  });

  it('prints an error for an unknown command', () => {
    expect(run('launch').lines[1]).toEqual({ kind: 'error', text: 'Unknown command: launch. Type help for the list.' });
  });

  it('selects an asset with goto, whatever the case', () => {
    const state = run('goto 23-ka-9101');
    expect(state.selectedId).toBe('ka-1');
    expect(state.lines[1]).toEqual({ kind: 'ok', text: 'Selected 23-KA-9101 1st stage compressor' });
  });

  it('expands collapsed ancestors on goto', () => {
    expect(run('goto 23-KA-9101', start({ collapsed: ['nk-23', 'nk-27'] })).collapsed).toEqual(['nk-27']);
  });

  it('reports an unknown asset and keeps the selection', () => {
    const state = run('goto 99-XX-1');
    expect(state.selectedId).toBe('nk');
    expect(state.lines[1]).toEqual({ kind: 'error', text: 'No asset 99-XX-1' });
  });

  it('plots a tag with trend and selects its asset', () => {
    const state = run('trend 27-ft-20011');
    expect(state.trendTag).toBe('27-FT-20011');
    expect(state.selectedId).toBe('nk-27');
    expect(state.lines[1].text).toBe('Trending 27-FT-20011 Export flow');
  });

  it('reports an unknown tag and keeps the trend', () => {
    const state = run('trend 00-PT-1');
    expect(state.trendTag).toBe('23-PT-92531');
    expect(state.lines[1]).toEqual({ kind: 'error', text: 'No tag 00-PT-1' });
  });

  it('acknowledges an active alarm', () => {
    const state = run('ack alm-1');
    expect(state.acknowledged).toEqual(['alm-1']);
    expect(state.lines[1]).toEqual({ kind: 'ok', text: 'Acknowledged alm-1' });
  });

  it('refuses to acknowledge twice', () => {
    const state = run('ack alm-1', run('ack alm-1'));
    expect(state.acknowledged).toEqual(['alm-1']);
    expect(state.lines[state.lines.length - 1]).toEqual({ kind: 'error', text: 'alm-1 is already acknowledged' });
  });

  it('refuses alarms that are already acknowledged, not active, or unknown', () => {
    expect(run('ack alm-2').lines[1].text).toBe('alm-2 is already acknowledged');
    expect(run('ack alm-3').lines[1].text).toBe('alm-3 is cleared, nothing to acknowledge');
    expect(run('ack alm-9').lines[1].text).toBe('No alarm alm-9');
  });

  it('switches the alarm log between unacknowledged and all', () => {
    const all = run('show alarms all');
    expect(all.alarmFilter).toBe('all');
    expect(all.lines[1].text).toBe('Alarm log: all 3 alarms');
    const active = run('show alarms', all);
    expect(active.alarmFilter).toBe('active');
    expect(active.lines[active.lines.length - 1].text).toBe('Alarm log: 1 unacknowledged');
  });

  it('counts unacknowledged alarms after this session’s acknowledgements', () => {
    const state = run('show alarms', run('ack alm-1'));
    expect(state.lines[state.lines.length - 1].text).toBe('Alarm log: 0 unacknowledged');
  });

  it('goes back to the root for show tags', () => {
    const state = run('show tags', start({ selectedId: 'ka-1' }));
    expect(state.selectedId).toBe('nk');
    expect(state.lines[1].text).toBe('Tags: all 2 under NK');
  });

  it('empties the output on clear and keeps everything else', () => {
    const state = run('clear', run('goto NK-27'));
    expect(state.lines).toEqual([]);
    expect(state.selectedId).toBe('nk-27');
  });

  it('keeps the scrollback bounded', () => {
    let state = start();
    for (let index = 0; index < 50; index += 1) state = run('goto NK-27', state);
    expect(state.lines.length).toBeLessThanOrEqual(60);
  });
});

describe('selection', () => {
  it('selects a known node and ignores an unknown one', () => {
    expect(reduce(start(), { type: 'select', id: 'nk-27' }).selectedId).toBe('nk-27');
    const state = start();
    expect(reduce(state, { type: 'select', id: 'nope' })).toBe(state);
  });

  it('moves down and up through the visible rows', () => {
    const down = reduce(start(), { type: 'move', direction: 1 });
    expect(down.selectedId).toBe('nk-23');
    expect(reduce(down, { type: 'move', direction: -1 }).selectedId).toBe('nk');
  });

  it('stops at both ends', () => {
    expect(reduce(start(), { type: 'move', direction: -1 }).selectedId).toBe('nk');
    expect(reduce(start({ selectedId: 'nk-27' }), { type: 'move', direction: 1 }).selectedId).toBe('nk-27');
  });

  it('skips rows under a collapsed node', () => {
    expect(reduce(start({ selectedId: 'nk-23', collapsed: ['nk-23'] }), { type: 'move', direction: 1 }).selectedId).toBe('nk-27');
  });

  it('collapses a node and pulls a hidden selection up to it', () => {
    const state = reduce(start({ selectedId: 'ka-1' }), { type: 'collapse', id: 'nk-23' });
    expect(state.collapsed).toEqual(['nk-23']);
    expect(state.selectedId).toBe('nk-23');
  });

  it('expands a collapsed node', () => {
    expect(reduce(start({ collapsed: ['nk-23'] }), { type: 'expand', id: 'nk-23' }).collapsed).toEqual([]);
  });
});
