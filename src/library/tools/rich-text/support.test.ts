import { countCharacters, countWords, describeLength, lengthStatus } from './counts';
import { createEditorState, editorReducer } from './editorReducer';
import type { EditorState } from './editorReducer';
import { canRedo, canUndo, createHistory, pushHistory, redo, replacePresent, undo } from './history';
import { caretAt, lineBounds, mapSelectedLines, normalizeSelection, replaceSelection } from './textState';
import { applySuggestion, filterSuggestions, findTrigger, moveActive } from './triggers';

describe('textState', () => {
  it('clamps and orders a selection', () => {
    expect(normalizeSelection({ value: 'abc', selectionStart: 9, selectionEnd: -2 })).toEqual({ value: 'abc', selectionStart: 0, selectionEnd: 3 });
  });

  it('finds the bounds of the selected lines', () => {
    expect(lineBounds({ value: 'one\ntwo\nthree', selectionStart: 5, selectionEnd: 9 })).toEqual({ start: 4, end: 13 });
  });

  it('does not include the line after a trailing line break', () => {
    expect(lineBounds({ value: 'one\ntwo\nthree', selectionStart: 0, selectionEnd: 4 })).toEqual({ start: 0, end: 3 });
  });

  it('replaces the selection and puts the caret after the insert', () => {
    expect(replaceSelection({ value: 'a-b', selectionStart: 1, selectionEnd: 2 }, ' to ')).toEqual(caretAt('a to b', 5));
  });

  it('maps selected lines and reselects them', () => {
    const mapped = mapSelectedLines({ value: 'a\nb\nc', selectionStart: 0, selectionEnd: 3 }, (line, index) => `${index}:${line}`);
    expect(mapped).toEqual({ value: '0:a\n1:b\nc', selectionStart: 0, selectionEnd: 7 });
  });
});

describe('history', () => {
  it('undoes and redoes in order', () => {
    const history = pushHistory(pushHistory(createHistory('a'), 'b'), 'c');

    expect(undo(history).present).toBe('b');
    expect(undo(undo(history)).present).toBe('a');
    expect(redo(undo(history)).present).toBe('c');
  });

  it('reports what is possible', () => {
    const fresh = createHistory(1);
    expect([canUndo(fresh), canRedo(fresh)]).toEqual([false, false]);
    expect(canUndo(pushHistory(fresh, 2))).toBe(true);
    expect(canRedo(undo(pushHistory(fresh, 2)))).toBe(true);
  });

  it('returns the same history when there is nothing to undo or redo', () => {
    const fresh = createHistory(1);
    expect(undo(fresh)).toBe(fresh);
    expect(redo(fresh)).toBe(fresh);
  });

  it('drops the redo branch on a new change', () => {
    const history = pushHistory(undo(pushHistory(createHistory('a'), 'b')), 'c');
    expect(history.future).toEqual([]);
    expect(undo(history).present).toBe('a');
  });

  it('forgets the oldest steps past the limit', () => {
    let history = createHistory(0);
    for (let step = 1; step <= 5; step += 1) history = pushHistory(history, step, 3);
    expect(history.past).toEqual([2, 3, 4]);
  });

  it('replaces the present without a new step', () => {
    const history = replacePresent(pushHistory(createHistory('a'), 'b'), 'B');
    expect(history.present).toBe('B');
    expect(undo(history).present).toBe('a');
  });
});

describe('counts', () => {
  it.each([
    ['', 0],
    ['Recompressor tripped', 2],
    ['  spaced   out  ', 2],
    ['- **Seal gas** above 0.5 bar', 5],
    ['---', 0],
    ['Vøring Nord', 2],
  ])('counts the words in %j', (text, words) => {
    expect(countWords(text)).toBe(words);
  });

  it('counts characters, not code units', () => {
    expect(countCharacters('Sør')).toBe(3);
    expect(countCharacters('a\r\nb')).toBe(3);
    expect(countCharacters('m³ 𝒙')).toBe(4);
  });

  it.each([
    [10, 'ok'],
    [81, 'near'],
    [100, 'near'],
    [101, 'over'],
  ] as const)('judges a length of %i as %s', (length, status) => {
    expect(lengthStatus(length, { soft: 80, max: 100 })).toBe(status);
  });

  it('has no limit unless one is given', () => {
    expect(lengthStatus(1_000_000, {})).toBe('ok');
  });

  it('describes the length against its limit', () => {
    expect(describeLength(1, {})).toBe('1 character');
    expect(describeLength(861, { max: 2000 })).toBe('861 / 2,000 characters');
    expect(describeLength(2014, { max: 2000 })).toBe('2,014 / 2,000 characters, 14 over');
  });
});

describe('triggers', () => {
  const people = [
    { id: 'ih', label: 'Ingrid Haugen', detail: 'Control room operator' },
    { id: 'ms', label: 'Magnus Solberg', detail: 'Maintenance planner' },
    { id: 'tb', label: 'Tomás Barros', detail: 'Mechanical technician' },
  ];

  it('finds a mention being typed', () => {
    expect(findTrigger(caretAt('Ask @ing', 8))).toEqual({ char: '@', query: 'ing', start: 4 });
  });

  it('finds a bare trigger character', () => {
    expect(findTrigger(caretAt('#', 1))).toEqual({ char: '#', query: '', start: 0 });
  });

  it('ignores a trigger character in the middle of a word', () => {
    expect(findTrigger(caretAt('ops@example', 11))).toBeNull();
  });

  it('closes at white space', () => {
    expect(findTrigger(caretAt('Ask @ingrid now', 15))).toBeNull();
  });

  it('is closed while text is selected', () => {
    expect(findTrigger({ value: '@in', selectionStart: 1, selectionEnd: 3 })).toBeNull();
  });

  it('matches the start of any word first and ignores accents', () => {
    expect(filterSuggestions(people, 'toma').map((person) => person.id)).toEqual(['tb']);
    expect(filterSuggestions(people, 'sol').map((person) => person.id)).toEqual(['ms']);
    expect(filterSuggestions(people, 'm').map((person) => person.id)[0]).toBe('ms');
  });

  it('matches the detail text last', () => {
    expect(filterSuggestions(people, 'planner').map((person) => person.id)).toEqual(['ms']);
  });

  it('returns the first few when nothing is typed', () => {
    expect(filterSuggestions(people, '', 2)).toHaveLength(2);
  });

  it('replaces the typed lookup with the label and a space', () => {
    const state = caretAt('Ask @ing about it', 8);
    const next = applySuggestion(state, { char: '@', query: 'ing', start: 4 }, people[0]);
    expect(next).toEqual(caretAt('Ask @Ingrid Haugen  about it', 19));
  });

  it('wraps the active row', () => {
    expect(moveActive(0, -1, 3)).toBe(2);
    expect(moveActive(2, 1, 3)).toBe(0);
    expect(moveActive(4, 1, 0)).toBe(0);
  });
});

describe(editorReducer.name, () => {
  const type = (state: EditorState, value: string) =>
    editorReducer(state, { type: 'input', state: { value, selectionStart: value.length, selectionEnd: value.length } });

  it('starts with the caret at the end and nothing to undo', () => {
    const state = createEditorState('Note');
    expect(state.history.present).toEqual(caretAt('Note', 4));
    expect(state.history.past).toHaveLength(0);
  });

  it('joins the letters of one word into one undo step', () => {
    let state = createEditorState('');
    for (const value of ['t', 'tr', 'tri', 'trip']) state = type(state, value);

    expect(editorReducer(state, { type: 'undo' }).history.present.value).toBe('');
  });

  it('starts a new undo step at a word boundary', () => {
    let state = createEditorState('');
    for (const value of ['t', 'tr', 'tr ', 'tr a']) state = type(state, value);

    expect(editorReducer(state, { type: 'undo' }).history.present.value).toBe('tr');
  });

  it('makes every command its own undo step and bumps the revision', () => {
    const state = editorReducer(type(createEditorState(''), 'a'), { type: 'apply', state: caretAt('**a**', 3) });

    expect(state.revision).toBe(1);
    expect(editorReducer(state, { type: 'undo' }).history.present.value).toBe('a');
  });

  it('does not join typing after a command into the command', () => {
    let state = editorReducer(createEditorState('a'), { type: 'apply', state: caretAt('- a', 3) });
    state = type(state, '- ab');

    expect(editorReducer(state, { type: 'undo' }).history.present.value).toBe('- a');
  });

  it('records a moved selection without an undo step', () => {
    const state = editorReducer(createEditorState('abc'), { type: 'select', selectionStart: 1, selectionEnd: 2 });

    expect(state.history.present).toEqual({ value: 'abc', selectionStart: 1, selectionEnd: 2 });
    expect(state.history.past).toHaveLength(0);
  });

  it('redoes what was undone', () => {
    const typed = type(createEditorState(''), 'a');
    const state = editorReducer(editorReducer(typed, { type: 'undo' }), { type: 'redo' });

    expect(state.history.present.value).toBe('a');
  });

  it('reset loads new text and forgets the history', () => {
    const state = editorReducer(type(createEditorState(''), 'a'), { type: 'reset', value: 'Template' });

    expect(state.history.present.value).toBe('Template');
    expect(state.history.past).toHaveLength(0);
  });
});
