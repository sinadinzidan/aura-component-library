import type { Tone } from '../tones';

/**
 * Reconciling a drawing with a 3D model, tag by tag: which side has it, what that means and how
 * far a review has come. Pure; the link table is the only input.
 */

export type LinkLike = { tag: string; drawingId: string | null; sceneId: string | null };

export type LinkStatus = 'matched' | 'missing-in-model' | 'missing-on-drawing';

export type ReconciliationRow = LinkLike & { status: LinkStatus };

export const LINK_STATUS_LABEL: Readonly<Record<LinkStatus, string>> = {
  matched: 'Matched',
  'missing-in-model': 'Not in the model',
  'missing-on-drawing': 'Not on the drawing',
};

export const LINK_STATUS_TONE: Readonly<Record<LinkStatus, Tone>> = { matched: 'success', 'missing-in-model': 'warning', 'missing-on-drawing': 'warning' };

export function linkStatus(link: LinkLike): LinkStatus {
  if (link.drawingId !== null && link.sceneId !== null) return 'matched';
  return link.drawingId !== null ? 'missing-in-model' : 'missing-on-drawing';
}

/** One row per tag, mismatches first, then by tag. */
export function reconcile(links: readonly LinkLike[]): ReconciliationRow[] {
  return links
    .map((link) => ({ ...link, status: linkStatus(link) }))
    .sort((a, b) => Number(a.status === 'matched') - Number(b.status === 'matched') || a.tag.localeCompare(b.tag));
}

/** How many tags are settled: matched on both sides, or a mismatch somebody has dealt with. */
export function settledCount(rows: readonly ReconciliationRow[], resolved: readonly string[]): number {
  return rows.filter((row) => row.status === 'matched' || resolved.includes(row.tag)).length;
}

/** Share of tags settled, as a whole percentage. An empty table counts as done. */
export function settledPercent(rows: readonly ReconciliationRow[], resolved: readonly string[]): number {
  return rows.length === 0 ? 100 : Math.round((settledCount(rows, resolved) / rows.length) * 100);
}
