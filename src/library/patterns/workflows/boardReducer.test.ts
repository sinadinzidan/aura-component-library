import { adjacentColumn, boardReducer, columnOfCard, wipStatus } from './boardReducer';
import type { BoardState } from './boardReducer';

const board = (): BoardState => ({
  columns: [
    { id: 'open', cardIds: ['a', 'b', 'c'] },
    { id: 'doing', cardIds: ['d'] },
    { id: 'done', cardIds: [] },
  ],
  collapsed: [],
});

const cards = (state: BoardState, columnId: string) => state.columns.find((column) => column.id === columnId)?.cardIds;

describe(boardReducer.name, () => {
  it('moves a card to the end of another column', () => {
    const next = boardReducer(board(), { type: 'move', cardId: 'a', toColumnId: 'doing' });

    expect(cards(next, 'open')).toEqual(['b', 'c']);
    expect(cards(next, 'doing')).toEqual(['d', 'a']);
  });

  it('moves a card to a given place in another column', () => {
    const next = boardReducer(board(), { type: 'move', cardId: 'b', toColumnId: 'doing', index: 0 });

    expect(cards(next, 'doing')).toEqual(['b', 'd']);
  });

  it('clamps an index beyond the end of the column', () => {
    const next = boardReducer(board(), { type: 'move', cardId: 'a', toColumnId: 'done', index: 9 });

    expect(cards(next, 'done')).toEqual(['a']);
  });

  it('returns the same state when a card is moved to where it already is', () => {
    const state = board();

    expect(boardReducer(state, { type: 'move', cardId: 'd', toColumnId: 'doing' })).toBe(state);
    expect(boardReducer(state, { type: 'move', cardId: 'b', toColumnId: 'open', index: 1 })).toBe(state);
  });

  it('ignores an unknown card or column', () => {
    const state = board();

    expect(boardReducer(state, { type: 'move', cardId: 'x', toColumnId: 'done' })).toBe(state);
    expect(boardReducer(state, { type: 'move', cardId: 'a', toColumnId: 'nowhere' })).toBe(state);
  });

  it('steps a card to the next column', () => {
    const next = boardReducer(board(), { type: 'step', cardId: 'd', direction: 'next' });

    expect(cards(next, 'done')).toEqual(['d']);
  });

  it('steps a card to the previous column', () => {
    const next = boardReducer(board(), { type: 'step', cardId: 'd', direction: 'previous' });

    expect(cards(next, 'open')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('does not step past the first or last column', () => {
    const state = board();

    expect(boardReducer(state, { type: 'step', cardId: 'a', direction: 'previous' })).toBe(state);
  });

  it('reorders a card inside its column', () => {
    const down = boardReducer(board(), { type: 'reorder', cardId: 'a', direction: 'down' });
    const up = boardReducer(board(), { type: 'reorder', cardId: 'c', direction: 'up' });

    expect(cards(down, 'open')).toEqual(['b', 'a', 'c']);
    expect(cards(up, 'open')).toEqual(['a', 'c', 'b']);
  });

  it('does not reorder past the ends of a column', () => {
    const state = board();

    expect(boardReducer(state, { type: 'reorder', cardId: 'a', direction: 'up' })).toBe(state);
    expect(boardReducer(state, { type: 'reorder', cardId: 'c', direction: 'down' })).toBe(state);
  });

  it('adds a new card to the end of a column', () => {
    const next = boardReducer(board(), { type: 'add', cardId: 'e', columnId: 'open' });

    expect(cards(next, 'open')).toEqual(['a', 'b', 'c', 'e']);
  });

  it('does not add a card that is already on the board', () => {
    const state = board();

    expect(boardReducer(state, { type: 'add', cardId: 'a', columnId: 'done' })).toBe(state);
  });

  it('removes a card', () => {
    const next = boardReducer(board(), { type: 'remove', cardId: 'b' });

    expect(cards(next, 'open')).toEqual(['a', 'c']);
  });

  it('collapses and expands a column', () => {
    const collapsed = boardReducer(board(), { type: 'toggle-collapse', columnId: 'done' });
    const expanded = boardReducer(collapsed, { type: 'toggle-collapse', columnId: 'done' });

    expect(collapsed.collapsed).toEqual(['done']);
    expect(expanded.collapsed).toEqual([]);
  });

  it('never mutates the state it was given', () => {
    const state = board();
    const snapshot = JSON.stringify(state);

    boardReducer(state, { type: 'move', cardId: 'a', toColumnId: 'done' });
    boardReducer(state, { type: 'reorder', cardId: 'a', direction: 'down' });

    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe(columnOfCard.name, () => {
  it('finds the column that holds a card', () => {
    expect(columnOfCard(board(), 'd')).toBe('doing');
    expect(columnOfCard(board(), 'x')).toBeUndefined();
  });
});

describe(adjacentColumn.name, () => {
  it('names the neighbouring columns', () => {
    expect(adjacentColumn(board(), 'd', 'previous')).toBe('open');
    expect(adjacentColumn(board(), 'd', 'next')).toBe('done');
  });

  it('has no neighbour beyond the edges', () => {
    expect(adjacentColumn(board(), 'a', 'previous')).toBeUndefined();
    expect(adjacentColumn(board(), 'x', 'next')).toBeUndefined();
  });
});

describe(wipStatus.name, () => {
  it('judges a count against its limit', () => {
    expect(wipStatus(2, 3)).toBe('under');
    expect(wipStatus(3, 3)).toBe('at');
    expect(wipStatus(4, 3)).toBe('over');
  });

  it('reports no status without a limit', () => {
    expect(wipStatus(40)).toBe('none');
  });
});
