export type HistoryEntry = {
  id: number;
  sql: string;
  ok: boolean;
  /** Row count on success, or the error message. */
  summary: string;
};

export type Snippet = { id: string; name: string; sql: string };

export type WorkbenchState = {
  history: readonly HistoryEntry[];
  snippets: readonly Snippet[];
  nextId: number;
};

export type WorkbenchAction =
  | { type: 'ran'; sql: string; ok: boolean; summary: string }
  | { type: 'save-snippet'; name: string; sql: string }
  | { type: 'remove-snippet'; id: string }
  | { type: 'clear-history' };

export const HISTORY_SIZE = 20;

export function createWorkbenchState(snippets: readonly Snippet[] = [], history: readonly HistoryEntry[] = []): WorkbenchState {
  return { history, snippets, nextId: history.reduce((max, entry) => Math.max(max, entry.id), 0) + 1 };
}

/** The saved name for a snippet: trimmed, and made unique by a number when it is already taken. */
export function uniqueSnippetName(name: string, snippets: readonly Snippet[]): string {
  const base = name.trim() || 'Untitled query';
  const taken = new Set(snippets.map((snippet) => snippet.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let counter = 2;
  while (taken.has(`${base} ${counter}`.toLowerCase())) counter += 1;
  return `${base} ${counter}`;
}

/**
 * Query history and saved snippets of the workbench. Running the same text twice in a row keeps
 * one entry (the newest), the list is newest first and capped, and snippet names stay unique.
 */
export function workbenchReducer(state: WorkbenchState, action: WorkbenchAction): WorkbenchState {
  switch (action.type) {
    case 'ran': {
      const sql = action.sql.trim();
      if (sql === '') return state;
      const rest = state.history[0]?.sql === sql ? state.history.slice(1) : state.history;
      const entry: HistoryEntry = { id: state.nextId, sql, ok: action.ok, summary: action.summary };
      return { ...state, history: [entry, ...rest].slice(0, HISTORY_SIZE), nextId: state.nextId + 1 };
    }
    case 'save-snippet': {
      if (action.sql.trim() === '') return state;
      const name = uniqueSnippetName(action.name, state.snippets);
      return { ...state, snippets: [...state.snippets, { id: `snippet-${state.nextId}`, name, sql: action.sql }], nextId: state.nextId + 1 };
    }
    case 'remove-snippet':
      return { ...state, snippets: state.snippets.filter((snippet) => snippet.id !== action.id) };
    case 'clear-history':
      return { ...state, history: [] };
  }
}
