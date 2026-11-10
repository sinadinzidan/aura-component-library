/**
 * State and moves of a kanban board, kept apart from any rendering so the same reducer drives
 * menus, keyboard buttons and a drag library alike. Cards live in exactly one column, in order.
 */

export type BoardColumnState = { id: string; cardIds: readonly string[] };

export type BoardState = {
  columns: readonly BoardColumnState[];
  /** Ids of the columns shown collapsed. */
  collapsed: readonly string[];
};

export type BoardAction =
  /** Puts a card in a column, at `index` or at the end. */
  | { type: 'move'; cardId: string; toColumnId: string; index?: number }
  /** Moves a card to the column before or after its own. */
  | { type: 'step'; cardId: string; direction: 'previous' | 'next' }
  /** Moves a card one place up or down inside its column. */
  | { type: 'reorder'; cardId: string; direction: 'up' | 'down' }
  /** Adds a new card to the end of a column. */
  | { type: 'add'; cardId: string; columnId: string }
  | { type: 'remove'; cardId: string }
  | { type: 'toggle-collapse'; columnId: string };

export type WipStatus = 'none' | 'under' | 'at' | 'over';

/** Id of the column that holds the card. */
export function columnOfCard(state: BoardState, cardId: string): string | undefined {
  return state.columns.find((column) => column.cardIds.includes(cardId))?.id;
}

/** Id of the column before or after the card's own, when there is one. */
export function adjacentColumn(state: BoardState, cardId: string, direction: 'previous' | 'next'): string | undefined {
  const index = state.columns.findIndex((column) => column.cardIds.includes(cardId));
  if (index === -1) return undefined;
  return state.columns[index + (direction === 'next' ? 1 : -1)]?.id;
}

/** Where a column stands against its work-in-progress limit. `none` when it has no limit. */
export function wipStatus(count: number, limit?: number): WipStatus {
  if (limit === undefined) return 'none';
  if (count > limit) return 'over';
  return count === limit ? 'at' : 'under';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function moveCard(state: BoardState, cardId: string, toColumnId: string, index?: number): BoardState {
  const from = columnOfCard(state, cardId);
  if (from === undefined || !state.columns.some((column) => column.id === toColumnId)) return state;
  const fromIndex = state.columns.find((column) => column.id === from)?.cardIds.indexOf(cardId);
  if (from === toColumnId && (index === undefined || index === fromIndex)) return state;

  return {
    ...state,
    columns: state.columns.map((column) => {
      const without = column.cardIds.filter((id) => id !== cardId);
      if (column.id !== toColumnId) return column.id === from ? { ...column, cardIds: without } : column;
      const at = clamp(index ?? without.length, 0, without.length);
      return { ...column, cardIds: [...without.slice(0, at), cardId, ...without.slice(at)] };
    }),
  };
}

/** Pure reducer for a board. Unknown cards and columns leave the state untouched. */
export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'move':
      return moveCard(state, action.cardId, action.toColumnId, action.index);
    case 'step': {
      const target = adjacentColumn(state, action.cardId, action.direction);
      return target === undefined ? state : moveCard(state, action.cardId, target);
    }
    case 'reorder': {
      const column = state.columns.find((candidate) => candidate.cardIds.includes(action.cardId));
      if (!column) return state;
      const index = column.cardIds.indexOf(action.cardId) + (action.direction === 'down' ? 1 : -1);
      if (index < 0 || index >= column.cardIds.length) return state;
      return moveCard(state, action.cardId, column.id, index);
    }
    case 'add': {
      if (columnOfCard(state, action.cardId) !== undefined) return state;
      if (!state.columns.some((column) => column.id === action.columnId)) return state;
      return {
        ...state,
        columns: state.columns.map((column) =>
          column.id === action.columnId ? { ...column, cardIds: [...column.cardIds, action.cardId] } : column
        ),
      };
    }
    case 'remove': {
      if (columnOfCard(state, action.cardId) === undefined) return state;
      return {
        ...state,
        columns: state.columns.map((column) => ({ ...column, cardIds: column.cardIds.filter((id) => id !== action.cardId) })),
      };
    }
    case 'toggle-collapse': {
      if (!state.columns.some((column) => column.id === action.columnId)) return state;
      const collapsed = state.collapsed.includes(action.columnId)
        ? state.collapsed.filter((id) => id !== action.columnId)
        : [...state.collapsed, action.columnId];
      return { ...state, collapsed };
    }
  }
}
