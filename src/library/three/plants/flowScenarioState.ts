/** State of a flow what-if screen: which line is picked and which valves are closed. */
export type FlowScenarioState = {
  /** The picked line, or `null`. */
  selectedId: string | null;
  /** Ids of closed valves. */
  closed: readonly string[];
};

export type FlowScenarioAction =
  | { type: 'select'; lineId: string }
  | { type: 'clear' }
  | { type: 'toggleValve'; valveId: string }
  /** Replace the closed valves wholesale: a named scenario, or the reset to normal. */
  | { type: 'setValves'; closed: readonly string[] };

export function initialFlowScenario(closed: readonly string[], selectedId: string | null = null): FlowScenarioState {
  return { selectedId, closed: [...closed] };
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

export function flowScenarioReducer(state: FlowScenarioState, action: FlowScenarioAction): FlowScenarioState {
  switch (action.type) {
    case 'select':
      // Picking the picked line again lets go of it.
      return { ...state, selectedId: state.selectedId === action.lineId ? null : action.lineId };
    case 'clear':
      return state.selectedId === null ? state : { ...state, selectedId: null };
    case 'toggleValve':
      return { ...state, closed: state.closed.includes(action.valveId) ? state.closed.filter((id) => id !== action.valveId) : [...state.closed, action.valveId] };
    case 'setValves':
      return sameSet(state.closed, action.closed) ? state : { ...state, closed: [...action.closed] };
  }
}

/** Whether the valves are exactly the given set, e.g. to tell which named scenario is active. */
export function isScenario(state: FlowScenarioState, closed: readonly string[]): boolean {
  return sameSet(state.closed, closed);
}
