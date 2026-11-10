import { toggleReaction, totalReactions } from './reactions';
import type { Reaction } from './reactions';

const REACTIONS: readonly Reaction[] = [
  { id: 'agree', label: 'Agree', count: 3, reacted: false },
  { id: 'seen', label: 'Seen', count: 1, reacted: true },
  { id: 'empty', label: 'Thanks', count: 0, reacted: true },
];

describe(toggleReaction.name, () => {
  it('adds the viewer to a reaction they had not chosen', () => {
    const next = toggleReaction(REACTIONS, 'agree');

    expect(next[0]).toEqual({ id: 'agree', label: 'Agree', count: 4, reacted: true });
  });

  it('removes the viewer from a reaction they had chosen', () => {
    const next = toggleReaction(REACTIONS, 'seen');

    expect(next[1]).toEqual({ id: 'seen', label: 'Seen', count: 0, reacted: false });
  });

  it('never lets a count go below zero', () => {
    const next = toggleReaction(REACTIONS, 'empty');

    expect(next[2].count).toBe(0);
    expect(next[2].reacted).toBe(false);
  });

  it('leaves the other reactions untouched', () => {
    const next = toggleReaction(REACTIONS, 'agree');

    expect(next[1]).toBe(REACTIONS[1]);
  });

  it('returns an equal list for an unknown id', () => {
    expect(toggleReaction(REACTIONS, 'missing')).toEqual(REACTIONS);
  });

  it('does not mutate its input', () => {
    toggleReaction(REACTIONS, 'agree');

    expect(REACTIONS[0].count).toBe(3);
  });
});

describe(totalReactions.name, () => {
  it('sums the counts', () => {
    expect(totalReactions(REACTIONS)).toBe(4);
  });

  it('is zero for no reactions', () => {
    expect(totalReactions([])).toBe(0);
  });

  it('ignores negative counts', () => {
    expect(totalReactions([{ id: 'a', label: 'A', count: -2, reacted: false }])).toBe(0);
  });
});
