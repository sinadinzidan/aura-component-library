import type { Tone } from '../tones';

/** Vocabulary and pure helpers for document registers and drawing viewers. */

export type DocumentKind = 'pid' | 'drawing' | 'datasheet' | 'procedure' | 'report' | 'certificate';

export const DOCUMENT_KINDS: readonly DocumentKind[] = ['pid', 'drawing', 'datasheet', 'procedure', 'report', 'certificate'];

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  pid: 'P&ID',
  drawing: 'Drawing',
  datasheet: 'Data sheet',
  procedure: 'Procedure',
  report: 'Report',
  certificate: 'Certificate',
};

export const DOCUMENT_KIND_TONE: Record<DocumentKind, Tone> = {
  pid: 'blue',
  drawing: 'teal',
  datasheet: 'purple',
  procedure: 'amber',
  report: 'pink',
  certificate: 'green',
};

export type Approval = 'draft' | 'in-review' | 'approved' | 'superseded';

export const APPROVALS: readonly Approval[] = ['draft', 'in-review', 'approved', 'superseded'];

export const APPROVAL_LABEL: Record<Approval, string> = { draft: 'Draft', 'in-review': 'In review', approved: 'Approved', superseded: 'Superseded' };

export const APPROVAL_TONE: Record<Approval, Tone> = { draft: 'neutral', 'in-review': 'info', approved: 'success', superseded: 'warning' };

export type DocumentRecord = {
  /** Document number, for example `NK-23-PID-0103`. */
  id: string;
  kind: DocumentKind;
  title: string;
  revision: string;
  /** Issue date, already formatted. */
  date: string;
  approval: Approval;
  pages: number;
};

/** Documents of one kind (or all) whose number or title contains the query, ignoring case. */
export function filterDocuments(documents: readonly DocumentRecord[], filter: { kind?: DocumentKind | 'all'; query?: string }): DocumentRecord[] {
  const query = (filter.query ?? '').trim().toLowerCase();
  return documents.filter(
    (document) =>
      (filter.kind === undefined || filter.kind === 'all' || document.kind === filter.kind) &&
      (query === '' || document.id.toLowerCase().includes(query) || document.title.toLowerCase().includes(query))
  );
}

/** How many documents sit in each approval state. */
export function countByApproval(documents: readonly { approval: Approval }[]): Record<Approval, number> {
  const counts: Record<Approval, number> = { draft: 0, 'in-review': 0, approved: 0, superseded: 0 };
  for (const document of documents) counts[document.approval] += 1;
  return counts;
}

/** The next zoom level in the given direction, clamped to the range. */
export function stepZoom(zoom: number, direction: 1 | -1, range: { min?: number; max?: number; step?: number } = {}): number {
  const { min = 50, max = 400, step = 25 } = range;
  return Math.min(max, Math.max(min, zoom + direction * step));
}
