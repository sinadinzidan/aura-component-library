import { flowScenarioReducer, initialFlowScenario, isScenario } from './flowScenarioState';

const NORMAL = ['v-flare', 'v-pb'];

describe(flowScenarioReducer.name, () => {
  it('starts with the given valves closed and nothing selected', () => {
    expect(initialFlowScenario(NORMAL)).toEqual({ selectedId: null, closed: ['v-flare', 'v-pb'] });
  });

  it('selects a line and lets go when it is picked again', () => {
    const picked = flowScenarioReducer(initialFlowScenario(NORMAL), { type: 'select', lineId: 'e-feed' });

    expect(picked.selectedId).toBe('e-feed');
    expect(flowScenarioReducer(picked, { type: 'select', lineId: 'e-feed' }).selectedId).toBeNull();
  });

  it('moves the selection to another line', () => {
    const picked = flowScenarioReducer(initialFlowScenario(NORMAL, 'a'), { type: 'select', lineId: 'b' });

    expect(picked.selectedId).toBe('b');
  });

  it('clears the selection, and keeps the same state when there is none', () => {
    const empty = initialFlowScenario(NORMAL);

    expect(flowScenarioReducer(initialFlowScenario(NORMAL, 'a'), { type: 'clear' }).selectedId).toBeNull();
    expect(flowScenarioReducer(empty, { type: 'clear' })).toBe(empty);
  });

  it('closes an open valve and opens a closed one without touching the others', () => {
    const closed = flowScenarioReducer(initialFlowScenario(NORMAL), { type: 'toggleValve', valveId: 'v-k3' });
    const reopened = flowScenarioReducer(closed, { type: 'toggleValve', valveId: 'v-flare' });

    expect(closed.closed).toEqual(['v-flare', 'v-pb', 'v-k3']);
    expect(reopened.closed).toEqual(['v-pb', 'v-k3']);
  });

  it('keeps the selection when valves change', () => {
    const state = flowScenarioReducer(initialFlowScenario(NORMAL, 'e-feed'), { type: 'toggleValve', valveId: 'v-k3' });

    expect(state.selectedId).toBe('e-feed');
  });

  it('replaces the valves for a scenario and returns to normal on reset', () => {
    const tripped = flowScenarioReducer(initialFlowScenario(NORMAL), { type: 'setValves', closed: ['v-k3', 'v-pb'] });
    const reset = flowScenarioReducer(tripped, { type: 'setValves', closed: NORMAL });

    expect(tripped.closed).toEqual(['v-k3', 'v-pb']);
    expect(reset.closed).toEqual(NORMAL);
  });

  it('returns the same state when the scenario is already active, whatever the order', () => {
    const state = initialFlowScenario(NORMAL);

    expect(flowScenarioReducer(state, { type: 'setValves', closed: ['v-pb', 'v-flare'] })).toBe(state);
  });
});

describe(isScenario.name, () => {
  it('compares the closed valves as a set', () => {
    const state = initialFlowScenario(NORMAL);

    expect(isScenario(state, ['v-pb', 'v-flare'])).toBe(true);
    expect(isScenario(state, ['v-pb'])).toBe(false);
    expect(isScenario(state, ['v-pb', 'v-k3'])).toBe(false);
  });
});
