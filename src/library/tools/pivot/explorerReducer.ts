import type { Aggregation, PivotSpec } from './pivot';
import type { PivotSelection } from './PivotTable';

/** State of a pivot explorer: which fields are on rows and columns, the measure, display options and the drilled cell. */
export type ExplorerState = {
  /** Row fields, outermost first. Up to two. */
  rows: readonly string[];
  column: string | null;
  measure: string;
  aggregation: Aggregation;
  heat: boolean;
  collapsed: readonly string[];
  drill: PivotSelection | null;
};

export type ExplorerAction =
  | { type: 'setRow'; level: 0 | 1; field: string | null }
  | { type: 'setColumn'; field: string | null }
  | { type: 'setMeasure'; field: string }
  | { type: 'setAggregation'; aggregation: Aggregation }
  | { type: 'setHeat'; heat: boolean }
  | { type: 'toggleGroup'; id: string }
  | { type: 'collapseAll'; ids: readonly string[] }
  | { type: 'expandAll' }
  | { type: 'drill'; selection: PivotSelection }
  | { type: 'closeDrill' };

export const MAX_ROW_FIELDS = 2;

export function initialExplorerState(spec: Pick<PivotSpec, 'rows' | 'column' | 'measure' | 'aggregation'>, heat = false): ExplorerState {
  return { rows: spec.rows.slice(0, MAX_ROW_FIELDS), column: spec.column, measure: spec.measure, aggregation: spec.aggregation, heat, collapsed: [], drill: null };
}

/** Changing the layout invalidates collapsed groups and the drilled cell. */
function relaid(state: ExplorerState, change: Partial<ExplorerState>): ExplorerState {
  return { ...state, ...change, collapsed: [], drill: null };
}

export function explorerReducer(state: ExplorerState, action: ExplorerAction): ExplorerState {
  switch (action.type) {
    case 'setRow': {
      const others = state.rows.filter((_, index) => index !== action.level);
      if (action.field === null) {
        // Removing the outer field promotes the inner one.
        return relaid(state, { rows: action.level === 0 ? others : state.rows.slice(0, action.level) });
      }
      const field = action.field;
      const column = state.column === field ? null : state.column;
      const rows = state.rows.slice();
      rows[action.level] = field;
      return relaid(state, { rows: rows.filter((value, index) => rows.indexOf(value) === index), column });
    }
    case 'setColumn': {
      if (action.field === null) return relaid(state, { column: null });
      return relaid(state, { column: action.field, rows: state.rows.filter((field) => field !== action.field) });
    }
    case 'setMeasure':
      return { ...state, measure: action.field, drill: null };
    case 'setAggregation':
      return { ...state, aggregation: action.aggregation, drill: null };
    case 'setHeat':
      return { ...state, heat: action.heat };
    case 'toggleGroup': {
      const has = state.collapsed.includes(action.id);
      return { ...state, collapsed: has ? state.collapsed.filter((id) => id !== action.id) : [...state.collapsed, action.id] };
    }
    case 'collapseAll':
      return { ...state, collapsed: [...action.ids] };
    case 'expandAll':
      return { ...state, collapsed: [] };
    case 'drill':
      return { ...state, drill: action.selection };
    case 'closeDrill':
      return { ...state, drill: null };
    default:
      return state;
  }
}

export function specOf(state: ExplorerState, order?: PivotSpec['order']): PivotSpec {
  return { rows: state.rows, column: state.column, measure: state.measure, aggregation: state.aggregation, order };
}
