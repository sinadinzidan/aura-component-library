/** One reaction on a comment: a text label, how many people chose it and whether the viewer did. */
export type Reaction = { id: string; label: string; count: number; reacted: boolean };

/**
 * Flips the viewer's own reaction and moves the count with it. The count never drops below zero,
 * and an unknown id leaves the list as it was.
 */
export function toggleReaction(reactions: readonly Reaction[], id: string): Reaction[] {
  return reactions.map((reaction) => {
    if (reaction.id !== id) return reaction;
    const reacted = !reaction.reacted;
    return { ...reaction, reacted, count: Math.max(0, reaction.count + (reacted ? 1 : -1)) };
  });
}

/** Total number of reactions, for a summary such as "7 reactions". */
export function totalReactions(reactions: readonly Reaction[]): number {
  return reactions.reduce((sum, reaction) => sum + Math.max(0, reaction.count), 0);
}
