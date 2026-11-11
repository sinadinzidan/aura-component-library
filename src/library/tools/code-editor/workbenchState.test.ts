import { HISTORY_SIZE, createWorkbenchState, uniqueSnippetName, workbenchReducer } from './workbenchState';

describe(workbenchReducer.name, () => {
  it('records a run at the top of the history', () => {
    const state = workbenchReducer(createWorkbenchState(), { type: 'ran', sql: 'SELECT * FROM alarms', ok: true, summary: '8 rows' });

    expect(state.history).toEqual([{ id: 1, sql: 'SELECT * FROM alarms', ok: true, summary: '8 rows' }]);
  });

  it('keeps the newest first', () => {
    let state = createWorkbenchState();
    state = workbenchReducer(state, { type: 'ran', sql: 'a', ok: true, summary: '' });
    state = workbenchReducer(state, { type: 'ran', sql: 'b', ok: false, summary: 'Error' });

    expect(state.history.map((entry) => entry.sql)).toEqual(['b', 'a']);
  });

  it('keeps one entry when the same text runs twice in a row', () => {
    let state = createWorkbenchState();
    state = workbenchReducer(state, { type: 'ran', sql: 'a', ok: true, summary: '1 row' });
    state = workbenchReducer(state, { type: 'ran', sql: ' a ', ok: true, summary: '2 rows' });

    expect(state.history).toHaveLength(1);
    expect(state.history[0].summary).toBe('2 rows');
  });

  it('ignores an empty query', () => {
    const state = createWorkbenchState();
    expect(workbenchReducer(state, { type: 'ran', sql: '  ', ok: true, summary: '' })).toBe(state);
  });

  it('caps the history', () => {
    let state = createWorkbenchState();
    for (let index = 0; index < HISTORY_SIZE + 5; index += 1) state = workbenchReducer(state, { type: 'ran', sql: `q${index}`, ok: true, summary: '' });

    expect(state.history).toHaveLength(HISTORY_SIZE);
    expect(state.history[0].sql).toBe(`q${HISTORY_SIZE + 4}`);
  });

  it('clears the history but keeps snippets', () => {
    let state = createWorkbenchState([{ id: 's', name: 'Hot', sql: 'x' }]);
    state = workbenchReducer(state, { type: 'ran', sql: 'a', ok: true, summary: '' });
    state = workbenchReducer(state, { type: 'clear-history' });

    expect(state.history).toEqual([]);
    expect(state.snippets).toHaveLength(1);
  });

  it('saves a snippet with a unique name', () => {
    let state = createWorkbenchState();
    state = workbenchReducer(state, { type: 'save-snippet', name: 'Hot tags', sql: 'a' });
    state = workbenchReducer(state, { type: 'save-snippet', name: 'hot tags', sql: 'b' });

    expect(state.snippets.map((snippet) => snippet.name)).toEqual(['Hot tags', 'hot tags 2']);
    expect(new Set(state.snippets.map((snippet) => snippet.id)).size).toBe(2);
  });

  it('does not save an empty snippet', () => {
    const state = createWorkbenchState();
    expect(workbenchReducer(state, { type: 'save-snippet', name: 'x', sql: ' ' })).toBe(state);
  });

  it('removes a snippet by id', () => {
    const state = workbenchReducer(createWorkbenchState([{ id: 's1', name: 'A', sql: 'a' }, { id: 's2', name: 'B', sql: 'b' }]), { type: 'remove-snippet', id: 's1' });

    expect(state.snippets.map((snippet) => snippet.id)).toEqual(['s2']);
  });

  it('continues numbering after existing history', () => {
    const state = createWorkbenchState([], [{ id: 7, sql: 'q', ok: true, summary: '' }]);
    expect(workbenchReducer(state, { type: 'ran', sql: 'r', ok: true, summary: '' }).history[0].id).toBe(8);
  });
});

describe(uniqueSnippetName.name, () => {
  it('trims and falls back to a default name', () => {
    expect(uniqueSnippetName('  Hot  ', [])).toBe('Hot');
    expect(uniqueSnippetName('   ', [])).toBe('Untitled query');
  });

  it('numbers past every taken name', () => {
    const taken = [
      { id: '1', name: 'Hot', sql: '' },
      { id: '2', name: 'Hot 2', sql: '' },
    ];
    expect(uniqueSnippetName('Hot', taken)).toBe('Hot 3');
  });
});
