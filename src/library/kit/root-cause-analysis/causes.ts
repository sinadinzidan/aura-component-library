import type { Tone } from '../tones';

/** Where a suspected cause stands. Confirmed is a finding, not good news, so it is never green. */
export type CauseState = 'confirmed' | 'contributing' | 'open' | 'ruled-out';

export const CAUSE_STATES: Record<CauseState, { tone: Tone; word: string }> = {
  confirmed: { tone: 'critical', word: 'Confirmed' },
  contributing: { tone: 'warning', word: 'Contributing' },
  open: { tone: 'info', word: 'Open' },
  'ruled-out': { tone: 'neutral', word: 'Ruled out' },
};

export type FaultNode = {
  id: string;
  label: string;
  state: CauseState;
  /** How the children combine: any one of them (`or`) or all together (`and`). */
  gate?: 'or' | 'and';
  /** Tag or evidence reference printed under the label. */
  detail?: string;
  children?: readonly FaultNode[];
};

/** Number of nodes in each state, counting the whole tree. */
export function countCauses(node: FaultNode): Record<CauseState, number> {
  const counts: Record<CauseState, number> = { confirmed: 0, contributing: 0, open: 0, 'ruled-out': 0 };
  const visit = (current: FaultNode) => {
    counts[current.state] += 1;
    current.children?.forEach(visit);
  };
  visit(node);
  return counts;
}

/** The ids from the top event down to the given node, or an empty list when it is not in the tree. */
export function pathTo(node: FaultNode, id: string): string[] {
  if (node.id === id) return [node.id];
  for (const child of node.children ?? []) {
    const rest = pathTo(child, id);
    if (rest.length > 0) return [node.id, ...rest];
  }
  return [];
}

/** Share of the evidence that supports a hypothesis, 0–100; 50 when there is none. */
export function supportShare(supports: number, contradicts: number): number {
  const total = supports + contradicts;
  return total === 0 ? 50 : (supports / total) * 100;
}
