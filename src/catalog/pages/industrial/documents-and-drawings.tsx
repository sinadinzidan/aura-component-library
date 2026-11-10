import { Button } from '@cognite/aura/components/button';
import { Card } from '@cognite/aura/components/card';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemDescription, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Search } from '@cognite/aura/components/search';
import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';
import { Separator } from '@cognite/aura/components/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowsExchange, IconDownload, IconFileUpload, IconMessage, IconStack2, IconTag } from '@cognite/aura/icons';
import { useId, useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { runStateStatus } from '../../../library/industrial/status';
import type { StatusDescriptor } from '../../../library/industrial/status';
import { StatusIndicator } from '../../../library/industrial/StatusIndicator';
import { DocumentRow } from '../../../library/industrial/workflows/DocumentRow';
import { PagePreview } from '../../../library/industrial/workflows/PagePreview';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import { TagChip } from '../../../library/industrial/workflows/TagChip';
import { ViewerToolbar } from '../../../library/industrial/workflows/ViewerToolbar';
import { documentKindLabel } from '../../../library/industrial/workflows/workflow';
import type { DocumentKind } from '../../../library/industrial/workflows/workflow';
import { ASSETS } from '../../data/plant';
import { definePage } from '../../types';

import source from './documents-and-drawings.tsx?raw';

type Approval = 'draft' | 'in-review' | 'approved' | 'superseded';

const APPROVAL: Record<Approval, StatusDescriptor> = {
  draft: { tone: 'neutral', label: 'Draft', shape: 'ring' },
  'in-review': { tone: 'info', label: 'In review', shape: 'ring' },
  approved: { tone: 'success', label: 'Approved', shape: 'dot' },
  superseded: { tone: 'neutral', label: 'Superseded', shape: 'square' },
};

type Doc = { id: string; kind: DocumentKind; title: string; revision: string; date: string; approval: Approval; pages: number };

/** The document register for area NK-23, gas compression. */
const DOCS: readonly Doc[] = [
  { id: 'NK-23-PID-0103', kind: 'pid', title: 'Gas compression, recompressor', revision: 'D', date: '4 Feb 2026', approval: 'approved', pages: 1 },
  { id: 'NK-23-PID-0101', kind: 'pid', title: 'Gas compression, 1st stage', revision: 'C', date: '18 Nov 2025', approval: 'approved', pages: 1 },
  { id: 'NK-23-PR-0012', kind: 'procedure', title: 'Compressor start-up procedure', revision: '05', date: '12 Jan 2026', approval: 'in-review', pages: 14 },
  { id: 'NK-23-DS-9103', kind: 'datasheet', title: 'Recompressor data sheet', revision: 'B', date: '3 Jun 2024', approval: 'approved', pages: 6 },
  { id: 'NK-23-RP-0231', kind: 'report', title: 'Vibration survey, 1st stage compressor', revision: 'A', date: '1 Mar 2026', approval: 'draft', pages: 22 },
  { id: 'NK-23-CE-0418', kind: 'certificate', title: 'Safety valve certificate, 23-PSV-9105', revision: '02', date: '20 Aug 2025', approval: 'approved', pages: 2 },
  { id: 'NK-23-GA-0031', kind: 'drawing', title: 'Recompressor general arrangement', revision: 'B', date: '9 Sep 2023', approval: 'superseded', pages: 3 },
];

const PID = DOCS[0];
const PROCEDURE = DOCS[2];

const KIND_FILTERS: readonly { value: 'all' | DocumentKind; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pid', label: 'P&IDs' },
  { value: 'procedure', label: 'Procedures' },
  { value: 'datasheet', label: 'Data sheets' },
  { value: 'report', label: 'Reports' },
];

const REVISIONS: readonly { revision: string; date: string; author: string; note: string; approval: Approval }[] = [
  { revision: 'D', date: '4 Feb 2026', author: 'Aisha Khan', note: 'Added lube oil flow transmitter 23-FT-92772 and low-flow trip.', approval: 'approved' },
  { revision: 'C', date: '18 Nov 2025', author: 'Aisha Khan', note: 'Seal gas filter duplexed; valve 23-XV-9146 added.', approval: 'superseded' },
  { revision: 'B', date: '2 May 2024', author: 'Magnus Solberg', note: 'As-built after the 2024 turnaround.', approval: 'superseded' },
  { revision: 'A', date: '11 Aug 2021', author: 'Magnus Solberg', note: 'Issued for construction.', approval: 'superseded' },
];

type Hotspot = { tag: string; name: string; x: number; y: number };

/** Tags detected on the recompressor P&ID, with the centre of each tag label on the sheet. */
const HOTSPOTS: readonly Hotspot[] = [
  { tag: '23-XV-9140', name: 'Suction isolation valve', x: 110, y: 240 },
  { tag: '23-KA-9103', name: 'Recompressor', x: 280, y: 262 },
  { tag: '23-VT-92740', name: 'Drive-end vibration', x: 214, y: 78 },
  { tag: '23-TT-92745', name: 'Bearing temperature', x: 346, y: 78 },
  { tag: '23-HA-9131', name: 'Discharge cooler', x: 440, y: 246 },
  { tag: '23-PT-92770', name: 'Lube oil pressure', x: 520, y: 98 },
];

const ANNOTATIONS: readonly { id: number; author: string; date: string; text: string; tag: string; resolved: boolean }[] = [
  { id: 1, author: 'Aisha Khan', date: '14 Mar', text: 'Proposed location for the low lube oil flow trip. Confirm the tapping point with instrumentation.', tag: '23-KA-9103', resolved: false },
  { id: 2, author: 'Jonas Nyberg', date: '15 Mar', text: 'Tapping point is free; isolation valve needed upstream.', tag: '23-PT-92770', resolved: false },
  { id: 3, author: 'Tomás Barros', date: '13 Mar', text: 'Valve tag on site reads 23-XV-9140A. Drawing corrected in revision D.', tag: '23-XV-9140', resolved: true },
];

const SEARCH_RESULTS: readonly { doc: Doc; page: number; before: string; match: string; after: string }[] = [
  { doc: PROCEDURE, page: 6, before: 'Confirm that ', match: 'seal gas', after: ' differential pressure is above 0.5 bar before opening the suction isolation valve.' },
  { doc: PROCEDURE, page: 9, before: 'If the ', match: 'seal gas', after: ' filter differential exceeds 1.0 bar, hold the sequence and change over to the standby filter.' },
  { doc: DOCS[3], page: 3, before: 'Dry gas seals, tandem arrangement. ', match: 'Seal gas', after: ' supply 60 barg, filtered to 1 µm.' },
  { doc: PID, page: 1, before: 'Note 4: ', match: 'seal gas', after: ' filters 23-FL-9144A/B are duplexed with a common differential transmitter.' },
];

const TAG_LINKS: readonly { tag: string; name: string; docs: readonly { id: string; where: string }[] }[] = [
  { tag: '23-KA-9103', name: 'Recompressor', docs: [{ id: 'NK-23-PID-0103', where: 'Sheet 1, grid D4' }, { id: 'NK-23-DS-9103', where: 'Pages 1–6' }, { id: 'NK-23-PR-0012', where: 'Pages 4, 6, 9' }] },
  { tag: '23-VT-92740', name: 'Drive-end vibration', docs: [{ id: 'NK-23-PID-0103', where: 'Sheet 1, grid C3' }] },
  { tag: '23-PT-92770', name: 'Lube oil pressure', docs: [{ id: 'NK-23-PID-0103', where: 'Sheet 1, grid F2' }, { id: 'NK-23-PR-0012', where: 'Page 5' }] },
];

const LINKED_ASSETS = ASSETS.filter((asset) => ['23-ka-9103', '23-ka-9101', '23-ha-9114', '23-gt-9001'].includes(asset.id));

const LAYERS: readonly { id: string; label: string; detail: string }[] = [
  { id: 'tags', label: 'Detected tags', detail: '6 on this sheet' },
  { id: 'annotations', label: 'Annotations', detail: '2 open, 1 resolved' },
  { id: 'changes', label: 'Changes since revision C', detail: '3 changes' },
];

const VIEW_MODES = ['side-by-side', 'overlay'] as const;
type ViewMode = (typeof VIEW_MODES)[number];

function isViewMode(value: unknown): value is ViewMode {
  return VIEW_MODES.some((mode) => mode === value);
}

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2.5 align-middle';

type PidCanvasProps = { zoom?: number; selected?: string; showTags?: boolean; showAnnotations?: boolean };

/**
 * A stand-in for a rendered P&ID: a few lines and symbols drawn with tokens, tag labels with
 * hotspot boxes over the detected tags, and numbered annotation pins. Not a real drawing.
 */
function PidCanvas({ zoom = 100, selected, showTags = true, showAnnotations = true }: PidCanvasProps) {
  return (
    <div className="flex size-full items-center justify-center overflow-hidden bg-muted-background">
      <svg
        role="img"
        aria-label={`P&ID ${PID.id}, ${PID.title}, at ${zoom} percent. ${showTags ? `${HOTSPOTS.length} detected tags highlighted${selected ? `, ${selected} selected` : ''}.` : 'Tag highlights hidden.'}`}
        viewBox="0 0 600 340"
        fill="none"
        className="h-auto w-full max-w-3xl origin-center text-muted-foreground transition-transform"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        <rect x={6} y={6} width={588} height={328} className="fill-base-background stroke-emphasized" strokeWidth={1} />
        <path d="M 24 200 H 92 M 128 200 H 246 M 314 200 H 410 M 470 200 H 576" stroke="currentColor" strokeWidth={1.5} />
        <path d="M 576 196 L 584 200 L 576 204 Z" fill="currentColor" />
        <path d="M 92 188 L 110 200 L 92 212 Z M 128 188 L 110 200 L 128 212 Z" stroke="currentColor" strokeWidth={1.5} />
        <circle cx={280} cy={200} r={34} stroke="currentColor" strokeWidth={1.5} />
        <path d="M 262 176 L 304 190 M 262 224 L 304 210" stroke="currentColor" strokeWidth={1.5} />
        <rect x={410} y={182} width={60} height={36} rx={4} stroke="currentColor" strokeWidth={1.5} />
        <path d="M 418 200 L 428 190 L 440 210 L 452 190 L 462 200" stroke="currentColor" strokeWidth={1.5} />
        <path d="M 226 124 L 262 172 M 334 124 L 298 172 M 520 140 V 200" stroke="currentColor" strokeWidth={1} strokeDasharray="4 3" />
        <circle cx={214} cy={110} r={16} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <circle cx={346} cy={110} r={16} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <circle cx={520} cy={126} r={16} stroke="currentColor" strokeWidth={1.5} className="fill-base-background" />
        <text x={214} y={114} textAnchor="middle" className="fill-base-foreground text-xs">
          VT
        </text>
        <text x={346} y={114} textAnchor="middle" className="fill-base-foreground text-xs">
          TT
        </text>
        <text x={520} y={130} textAnchor="middle" className="fill-base-foreground text-xs">
          PT
        </text>
        <rect x={430} y={286} width={164} height={48} className="stroke-emphasized" strokeWidth={1} />
        <path d="M 430 310 H 594" className="stroke-emphasized" strokeWidth={1} />
        <text x={438} y={303} className="fill-muted-foreground font-mono text-xs">
          {PID.id}
        </text>
        <text x={438} y={327} className="fill-muted-foreground text-xs">
          Rev {PID.revision} · Sheet 1 of 1
        </text>
        {HOTSPOTS.map((spot) => {
          const isSelected = spot.tag === selected;
          return (
            <g key={spot.tag}>
              {showTags ? (
                <rect
                  x={spot.x - 44}
                  y={spot.y - 13}
                  width={88}
                  height={18}
                  rx={3}
                  strokeWidth={isSelected ? 2 : 1}
                  className={isSelected ? 'fill-decorative-2-background stroke-decorative-2-foreground' : 'fill-decorative-2-background/50 stroke-decorative-2-foreground/50'}
                />
              ) : null}
              <text x={spot.x} y={spot.y} textAnchor="middle" className={`font-mono text-xs ${showTags ? 'fill-decorative-2-foreground' : 'fill-base-foreground'} ${isSelected ? 'font-semibold' : ''}`}>
                {spot.tag}
              </text>
            </g>
          );
        })}
        {showAnnotations
          ? [
              { id: 1, x: 322, y: 158 },
              { id: 2, x: 548, y: 152 },
            ].map((pin) => (
              <g key={pin.id}>
                <circle cx={pin.x} cy={pin.y} r={9} className="fill-primary-background" />
                <text x={pin.x} y={pin.y + 4} textAnchor="middle" className="fill-primary-foreground text-xs font-medium">
                  {pin.id}
                </text>
              </g>
            ))
          : null}
      </svg>
    </div>
  );
}

function DetectedTagList({ selected, onSelect }: { selected: string; onSelect: (tag: string) => void }) {
  return (
    <ul aria-label="Detected tags" className="flex flex-col gap-0.5">
      {HOTSPOTS.map((spot) => {
        const isSelected = spot.tag === selected;
        return (
          <li key={spot.tag}>
            <button
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(spot.tag)}
              className={`flex w-full flex-col rounded-lg px-2 py-1.5 text-left hover:bg-muted-background focus-visible:shadow-focus-ring focus-visible:outline-none ${isSelected ? 'bg-muted-background' : ''}`}
            >
              <span className="font-mono text-sm text-base-foreground">{spot.tag}</span>
              <span className="truncate text-xs text-muted-foreground">{spot.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function LayerButtons({ showTags, showAnnotations, onTags, onAnnotations }: { showTags: boolean; showAnnotations: boolean; onTags: () => void; onAnnotations: () => void }) {
  return (
    <>
      <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant={showTags ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Show detected tags" aria-pressed={showTags} onClick={onTags}>
              <IconTag />
            </Button>
          }
        />
        <TooltipContent>{showTags ? 'Hide detected tags' : 'Show detected tags'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant={showAnnotations ? 'secondary' : 'ghost'} size="icon-sm" aria-label="Show annotations" aria-pressed={showAnnotations} onClick={onAnnotations}>
              <IconMessage />
            </Button>
          }
        />
        <TooltipContent>{showAnnotations ? 'Hide annotations' : 'Show annotations'}</TooltipContent>
      </Tooltip>
    </>
  );
}

function DocCard({ doc, preview }: { doc: Doc; preview: 'document' | 'drawing' }) {
  return (
    <Card className="w-full max-w-56 gap-3">
      <PagePreview kind={preview} label={`Preview of ${doc.id}, first page`} className="bg-base-background" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium text-base-foreground">{doc.title}</span>
        <span className="truncate text-xs text-muted-foreground">
          <span className="font-mono">{doc.id}</span> · Rev {doc.revision}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <StatusIndicator size="sm" {...APPROVAL[doc.approval]} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {doc.pages} {doc.pages === 1 ? 'page' : 'pages'}
        </span>
      </div>
    </Card>
  );
}

function DocDrawingRow() {
  return (
    <div className="w-full max-w-lg">
      <DocumentRow kind={PID.kind} title={PID.title} number={PID.id} revision={PID.revision} date={PID.date} />
    </div>
  );
}

function DocDrawingKinds() {
  const kinds: readonly DocumentKind[] = ['pid', 'drawing', 'datasheet', 'procedure', 'report', 'certificate'];
  return (
    <div className="flex w-full max-w-lg flex-col divide-y divide-default">
      {kinds.map((kind) => {
        const doc = DOCS.find((candidate) => candidate.kind === kind) ?? PID;
        return <DocumentRow key={kind} kind={kind} title={doc.title} number={doc.id} revision={doc.revision} date={doc.date} />;
      })}
    </div>
  );
}

function DocDrawingApprovalStates() {
  return (
    <div className="flex flex-col gap-3">
      <StatusIndicator {...APPROVAL.draft} />
      <StatusIndicator {...APPROVAL['in-review']} detail="2 of 3 approvals" />
      <StatusIndicator {...APPROVAL.approved} />
      <StatusIndicator {...APPROVAL.superseded} detail="by rev D" />
    </div>
  );
}

function DocDrawingCard() {
  return <DocCard doc={PROCEDURE} preview="document" />;
}

function DocDrawingCardDrawing() {
  return <DocCard doc={PID} preview="drawing" />;
}

function DocDrawingList() {
  const [kind, setKind] = useState<'all' | DocumentKind>('all');
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const docs = DOCS.filter((doc) => (kind === 'all' || doc.kind === kind) && (needle === '' || doc.title.toLowerCase().includes(needle) || doc.id.toLowerCase().includes(needle)));
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-xs">
          <Search aria-label="Search documents" placeholder="Search by title or number" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} />
        </div>
        <div role="group" aria-label="Filter by document kind" className="flex flex-wrap items-center gap-2">
          {KIND_FILTERS.map((filter) => (
            <Button key={filter.value} size="sm" variant={kind === filter.value ? 'secondary' : 'ghost'} aria-pressed={kind === filter.value} onClick={() => setKind(filter.value)}>
              {filter.label}
            </Button>
          ))}
        </div>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {docs.length} of {DOCS.length} documents
        </span>
      </div>
      {docs.length === 0 ? (
        <p className="border-t border-default pt-3 text-sm text-muted-foreground">No documents match. Try the document number, or clear the filters.</p>
      ) : (
        <div className="flex flex-col divide-y divide-default border-t border-default">
          {docs.map((doc) => (
            <DocumentRow
              key={doc.id}
              kind={doc.kind}
              title={doc.title}
              number={doc.id}
              revision={doc.revision}
              date={doc.date}
              status={
                <span className="w-28 shrink-0">
                  <StatusIndicator size="sm" {...APPROVAL[doc.approval]} />
                </span>
              }
              trailing={
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`Download ${doc.id}`}>
                        <IconDownload />
                      </Button>
                    }
                  />
                  <TooltipContent>Download {doc.id}</TooltipContent>
                </Tooltip>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocDrawingSearchResults() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <span className="text-xs text-muted-foreground tabular-nums">
        {SEARCH_RESULTS.length} passages in 3 documents for <span className="font-medium text-base-foreground">seal gas</span>
      </span>
      <ul className="flex flex-col gap-4">
        {SEARCH_RESULTS.map((result) => (
          <li key={`${result.doc.id}-${result.page}`} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">
                {documentKindLabel(result.doc.kind)} · <span className="font-mono">{result.doc.id}</span> · {result.doc.title}
              </span>
              <span className="shrink-0 tabular-nums">Page {result.page}</span>
            </span>
            <p className="text-sm text-base-foreground">
              {result.before}
              <mark className="rounded-xs bg-decorative-6-background px-0.5 font-medium text-decorative-6-foreground">{result.match}</mark>
              {result.after}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocDrawingRevisionHistory() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Revision history</span>
        <span className="font-mono text-xs text-muted-foreground">{PID.id}</span>
      </div>
      <ol className="flex flex-col divide-y divide-default">
        {REVISIONS.map((revision, index) => (
          <li key={revision.revision} className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-start gap-3 py-2">
            <span className={`pt-0.5 text-sm tabular-nums ${index === 0 ? 'font-semibold text-base-foreground' : 'text-muted-foreground'}`}>{revision.revision}</span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className={`text-sm ${index === 0 ? 'text-base-foreground' : 'text-muted-foreground'}`}>{revision.note}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {revision.date} · {revision.author}
              </span>
            </div>
            <span className="pt-0.5 text-xs text-muted-foreground">{index === 0 ? 'Current' : APPROVAL[revision.approval].label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DocDrawingUpload() {
  const id = useId();
  const [file, setFile] = useState<string | null>('NK-23-PID-0103_revE.pdf');
  const [note, setNote] = useState('');
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Upload a new revision</span>
        <span className="text-xs text-muted-foreground">
          Current: Rev {PID.revision} · next: <span className="font-medium text-base-foreground">Rev E</span>
        </span>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-emphasized p-3">
        <IconFileUpload aria-hidden className="size-5 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-mono text-sm text-base-foreground">{file ?? 'No file chosen'}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{file ? 'PDF · 2.4 MB · 1 page' : 'PDF or DWG, up to 50 MB'}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => setFile(file ? null : 'NK-23-PID-0103_revE.pdf')}>
          {file ? 'Remove file' : 'Choose file'}
        </Button>
      </div>
      <div className="flex flex-col">
        <Label htmlFor={id} required>
          What changed
        </Label>
        <Input id={id} placeholder="One line for the revision history" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">{file === null ? 'Choose a file to continue.' : note.trim() === '' ? 'Describe the change to continue.' : 'Revision E starts as a draft and goes to review.'}</span>
        <Button size="sm" disabled={file === null || note.trim() === ''}>
          Upload revision
        </Button>
      </div>
    </div>
  );
}

function DocDrawingApproval() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-base-foreground">{PROCEDURE.title}</span>
          <span className="text-xs text-muted-foreground">
            <span className="font-mono">{PROCEDURE.id}</span> · Rev {PROCEDURE.revision}
          </span>
        </div>
        <StatusIndicator variant="badge" {...APPROVAL['in-review']} detail="2 of 3" />
      </div>
      <SignOffBlock
        label={`Approval of ${PROCEDURE.id} revision ${PROCEDURE.revision}`}
        signers={[
          { id: 'author', role: 'Author', name: 'Aisha Khan', state: 'signed', at: '12 Jan, 09:30' },
          { id: 'checker', role: 'Checker, operations', name: 'Liv Wold', state: 'signed', at: '15 Jan, 14:05' },
          { id: 'approver', role: 'Approver, technical authority', name: 'Magnus Solberg', state: 'pending' },
        ]}
      />
      <p className="text-xs text-muted-foreground">Revision 04 stays in force until revision 05 is approved.</p>
    </div>
  );
}

function DocDrawingMetadata() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-base-foreground">{PID.title}</span>
        <span className="font-mono text-xs text-muted-foreground">{PID.id}</span>
      </div>
      <MetadataList
        items={[
          { label: 'Type', value: documentKindLabel(PID.kind) },
          { label: 'Revision', value: `${PID.revision} · ${PID.date}` },
          { label: 'Status', value: <StatusIndicator size="sm" {...APPROVAL[PID.approval]} /> },
          { label: 'Discipline', value: 'Process' },
          { label: 'Area', value: 'NK-23 Gas compression' },
          { label: 'Owner', value: 'Aisha Khan' },
          { label: 'Source', value: 'Document archive' },
          { label: 'File', value: 'PDF · 2.4 MB' },
        ]}
      />
    </div>
  );
}

function DocDrawingOffline() {
  const [offline, setOffline] = useState(true);
  const [area, setArea] = useState(false);
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <SettingSwitchRow
        label="Available offline"
        description={offline ? 'Revision D is saved on this device, 2.4 MB. It updates when a new revision is approved.' : 'Keep a copy on this device for use in the field.'}
        checked={offline}
        onCheckedChange={setOffline}
      />
      <SettingSwitchRow label="All documents for area NK-23" description="214 documents, about 380 MB. Downloads on Wi-Fi only." checked={area} onCheckedChange={setArea} />
    </div>
  );
}

function DocDrawingTagLinks() {
  return (
    <ul aria-label="Documents by tag" className="flex w-full max-w-lg flex-col gap-4">
      {TAG_LINKS.map((link) => (
        <li key={link.tag} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <TagChip tag={link.tag} />
              <span className="truncate text-sm text-base-foreground">{link.name}</span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {link.docs.length} {link.docs.length === 1 ? 'document' : 'documents'}
            </span>
          </div>
          <ul className="flex flex-col gap-1 border-l border-emphasized pl-3">
            {link.docs.map((doc) => (
              <li key={doc.id} className="flex items-baseline justify-between gap-3 text-xs">
                <span className="font-mono text-base-foreground">{doc.id}</span>
                <span className="text-muted-foreground tabular-nums">{doc.where}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function DocDrawingLinkedAssets() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Linked assets</span>
        <span className="text-xs text-muted-foreground tabular-nums">{LINKED_ASSETS.length} on this drawing</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {LINKED_ASSETS.map((asset) => (
          <li key={asset.id} className="flex items-center gap-3 py-2">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-base-foreground">{asset.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{asset.tag}</span>
            </div>
            <span className="w-24 shrink-0">
              <StatusIndicator size="sm" {...runStateStatus(asset.state)} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocDrawingToolbar() {
  const [zoom, setZoom] = useState(100);
  const [showTags, setShowTags] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(false);
  return (
    <div className="flex w-full max-w-lg items-center justify-center rounded-lg border border-default p-1">
      <ViewerToolbar zoom={zoom} onZoomChange={setZoom} onFit={() => setZoom(100)} label="Drawing controls">
        <LayerButtons showTags={showTags} showAnnotations={showAnnotations} onTags={() => setShowTags(!showTags)} onAnnotations={() => setShowAnnotations(!showAnnotations)} />
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        <Button variant="ghost" size="sm">
          <IconDownload /> Download
        </Button>
      </ViewerToolbar>
    </div>
  );
}

function DocDrawingCompareHeader() {
  const [mode, setMode] = useState<ViewMode>('side-by-side');
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 flex-col rounded-lg bg-muted-background p-3">
          <span className="text-xs text-muted-foreground">Before</span>
          <span className="text-sm font-medium text-base-foreground">Rev C</span>
          <span className="truncate text-xs text-muted-foreground tabular-nums">18 Nov 2025 · superseded</span>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Swap revisions">
                <IconArrowsExchange />
              </Button>
            }
          />
          <TooltipContent>Swap revisions</TooltipContent>
        </Tooltip>
        <div className="flex min-w-0 flex-col rounded-lg bg-muted-background p-3">
          <span className="text-xs text-muted-foreground">After</span>
          <span className="text-sm font-medium text-base-foreground">Rev D</span>
          <span className="truncate text-xs text-muted-foreground tabular-nums">4 Feb 2026 · current</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground tabular-nums">3 changes · 1 tag added, 1 line added, 1 note edited</span>
        <SegmentedControl value={mode} onValueChange={(value) => (isViewMode(value) ? setMode(value) : undefined)}>
          <SegmentedControlList size="small" aria-label="Comparison view">
            <SegmentedControlButton value="side-by-side" tabContent="label-only">
              Side by side
            </SegmentedControlButton>
            <SegmentedControlButton value="overlay" tabContent="label-only">
              Overlay
            </SegmentedControlButton>
          </SegmentedControlList>
        </SegmentedControl>
      </div>
    </div>
  );
}

function DocDrawingLegend() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Lines</span>
        <div className="flex items-center gap-3 text-xs text-base-foreground">
          <span aria-hidden className="w-8 border-t-2 border-muted-foreground" />
          Process line
        </div>
        <div className="flex items-center gap-3 text-xs text-base-foreground">
          <span aria-hidden className="w-8 border-t border-dashed border-muted-foreground" />
          Instrument signal
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Overlays</span>
        <div className="flex items-center gap-3 text-xs text-base-foreground">
          <span aria-hidden className="h-4 w-8 rounded-xs border border-decorative-2-foreground bg-decorative-2-background" />
          Detected tag, links to the asset
        </div>
        <div className="flex items-center gap-3 text-xs text-base-foreground">
          <span aria-hidden className="inline-flex size-4 items-center justify-center rounded-full bg-primary-background text-xs font-medium text-primary-foreground">
            1
          </span>
          <span className="pl-4">Annotation</span>
        </div>
      </div>
    </div>
  );
}

function DocDrawingDetectedTags() {
  const [selected, setSelected] = useState('23-KA-9103');
  return (
    <div className="flex w-full max-w-56 flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 px-2">
        <span className="text-sm font-medium text-base-foreground">Detected tags</span>
        <span className="text-xs text-muted-foreground tabular-nums">{HOTSPOTS.length}</span>
      </div>
      <DetectedTagList selected={selected} onSelect={setSelected} />
    </div>
  );
}

function DocDrawingLayers() {
  const [visible, setVisible] = useState<readonly string[]>(['tags', 'annotations']);
  return (
    <div className="flex w-full max-w-56 flex-col gap-3">
      <span className="flex items-center gap-2 text-sm font-medium text-base-foreground">
        <IconStack2 aria-hidden className="size-4 text-muted-foreground" />
        Layers
      </span>
      <CheckboxGroup aria-label="Drawing layers">
        {LAYERS.map((layer) => (
          <CheckboxItem key={layer.id}>
            <CheckboxItemControl
              checked={visible.includes(layer.id)}
              onCheckedChange={(checked) => setVisible((current) => (checked ? [...current, layer.id] : current.filter((entry) => entry !== layer.id)))}
            />
            <CheckboxItemLabel>{layer.label}</CheckboxItemLabel>
            <CheckboxItemDescription>{layer.detail}</CheckboxItemDescription>
          </CheckboxItem>
        ))}
      </CheckboxGroup>
    </div>
  );
}

function DocDrawingAnnotations() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-base-foreground">Annotations</span>
        <span className="text-xs text-muted-foreground tabular-nums">2 open · 1 resolved</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {ANNOTATIONS.map((annotation) => (
          <li key={annotation.id} className="flex items-start gap-3 py-2">
            <span
              className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ${annotation.resolved ? 'border border-emphasized text-muted-foreground' : 'bg-primary-background text-primary-foreground'}`}
            >
              {annotation.id}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={`text-sm ${annotation.resolved ? 'text-muted-foreground' : 'text-base-foreground'}`}>{annotation.text}</span>
              <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <PersonAvatar name={annotation.author} sizes="xxsm" />
                {annotation.author} · {annotation.date}
                <TagChip tag={annotation.tag} />
              </span>
            </div>
            <span className="shrink-0 pt-0.5 text-xs text-muted-foreground">{annotation.resolved ? 'Resolved' : 'Open'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DocDrawingHotspots() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="h-64 overflow-hidden rounded-lg border border-default">
        <PidCanvas selected="23-VT-92740" showAnnotations={false} />
      </div>
      <p className="text-xs text-muted-foreground">
        Six tags detected on the sheet. <span className="font-mono">23-VT-92740</span> is selected; the others are outlined more lightly.
      </p>
    </div>
  );
}

function DocDrawingViewer() {
  const [zoom, setZoom] = useState(100);
  const [selected, setSelected] = useState('23-KA-9103');
  const [showTags, setShowTags] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const spot = HOTSPOTS.find((candidate) => candidate.tag === selected) ?? HOTSPOTS[1];
  return (
    <div className="flex h-128 w-full flex-col overflow-hidden rounded-xl border border-default bg-base-background">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-default px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-base-foreground">{PID.title}</span>
            <span className="text-xs text-muted-foreground">
              <span className="font-mono">{PID.id}</span> · Rev {PID.revision} · {PID.date}
            </span>
          </div>
          <StatusIndicator variant="badge" {...APPROVAL[PID.approval]} />
        </div>
        <ViewerToolbar zoom={zoom} onZoomChange={setZoom} onFit={() => setZoom(100)} range={{ min: 50, max: 200 }} label="Drawing controls">
          <LayerButtons showTags={showTags} showAnnotations={showAnnotations} onTags={() => setShowTags(!showTags)} onAnnotations={() => setShowAnnotations(!showAnnotations)} />
        </ViewerToolbar>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_15rem]">
        <PidCanvas zoom={zoom} selected={selected} showTags={showTags} showAnnotations={showAnnotations} />
        <aside aria-label="Detected tags" className="flex min-h-0 flex-col gap-3 overflow-y-auto border-l border-default p-2">
          <div className="flex items-baseline justify-between gap-3 px-2 pt-1">
            <span className="text-sm font-medium text-base-foreground">Detected tags</span>
            <span className="text-xs text-muted-foreground tabular-nums">{HOTSPOTS.length}</span>
          </div>
          <DetectedTagList selected={selected} onSelect={setSelected} />
          <div className="mt-auto flex flex-col gap-2 border-t border-default px-2 pt-3">
            <span className="text-xs text-muted-foreground">Selected</span>
            <span className="text-sm text-base-foreground">{spot.name}</span>
            <Button variant="secondary" size="sm" className="w-full">
              Open asset
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocDrawingDocumentPage() {
  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <PagePreview kind="document" label={`Preview of ${PROCEDURE.id}, page 1`} />
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground tabular-nums">
          <span>Page 1 of {PROCEDURE.pages}</span>
          <Button variant="outline" size="sm">
            Open document
          </Button>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{PROCEDURE.id}</span>
            <StatusIndicator variant="badge" {...APPROVAL[PROCEDURE.approval]} />
          </div>
          <h3 className="text-xl font-semibold text-base-foreground">{PROCEDURE.title}</h3>
          <p className="text-sm text-muted-foreground">Step-by-step start of the 1st stage, 2nd stage and recompressor from a cold stop, with permissives and hold points.</p>
        </div>
        <MetadataList
          items={[
            { label: 'Type', value: documentKindLabel(PROCEDURE.kind) },
            { label: 'Revision', value: `${PROCEDURE.revision} · ${PROCEDURE.date}` },
            { label: 'In force', value: 'Rev 04 · 3 Mar 2025' },
            { label: 'Owner', value: 'Aisha Khan' },
            { label: 'Area', value: 'NK-23 Gas compression' },
          ]}
        />
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tags mentioned</span>
          <div className="flex flex-wrap gap-2">
            {['23-KA-9101', '23-KA-9102', '23-KA-9103', '23-XV-9140', '23-PT-92770'].map((tag) => (
              <TagChip key={tag} tag={tag} onSelect={() => undefined} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Revisions</span>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th scope="col" className={TH}>
                  Rev
                </th>
                <th scope="col" className={TH}>
                  Change
                </th>
                <th scope="col" className={TH}>
                  Status
                </th>
                <th scope="col" className={`${TH} text-right`}>
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { revision: '05', note: 'Seal gas hold point added before suction valve opens', approval: 'in-review' as const, date: '12 Jan 2026' },
                { revision: '04', note: 'Anti-surge valve check moved before crank', approval: 'approved' as const, date: '3 Mar 2025' },
                { revision: '03', note: 'Updated after 2024 turnaround', approval: 'superseded' as const, date: '20 May 2024' },
              ].map((row) => (
                <tr key={row.revision} className="border-t border-default">
                  <td className={`${TD} text-base-foreground tabular-nums`}>{row.revision}</td>
                  <td className={`${TD} text-muted-foreground`}>{row.note}</td>
                  <td className={TD}>
                    <StatusIndicator size="sm" {...APPROVAL[row.approval]} />
                  </td>
                  <td className={`${TD} text-right whitespace-nowrap text-muted-foreground tabular-nums`}>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default definePage({
  id: 'documents-and-drawings',
  title: 'Documents and drawings',
  summary:
    'The engineering record behind the plant: documents and drawings as rows and cards with revision and approval, a viewer for P&IDs with the tags it detected, and the links between tags, assets and the pages that mention them.',
  guidance: {
    use: [
      'Show the revision and its approval state wherever a document is named.',
      'Say which revision is in force when a newer one is still in review.',
      'Let detected tags on a drawing lead to the asset, and list them beside the canvas.',
      'Use a placeholder block while a page loads, sized like the page it stands for.',
    ],
    avoid: [
      'Opening a superseded revision without saying it is superseded.',
      'Tag highlights in status colours; a hotspot is a link, not an alarm.',
      'Viewer buttons with icons only and no name or tooltip.',
      'An upload that does not ask what changed.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'Rows and cards',
      description: 'One document on a line or as a card, with its kind, revision and approval.',
      specimens: [
        {
          id: 'DocDrawingRow',
          title: 'Document row',
          note: 'Pick it as the default line for a document: kind icon, title and number, revision, issue date.',
          origin: 'custom',
          uses: ['industrial/workflows/DocumentRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingRow,
        },
        {
          id: 'DocDrawingKinds',
          title: 'Document kinds',
          note: 'Pick the kind from six: each has its own icon and word, so a mixed list can be scanned by type.',
          origin: 'custom',
          uses: ['industrial/workflows/DocumentRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingKinds,
        },
        {
          id: 'DocDrawingApprovalStates',
          title: 'Approval states',
          note: 'Pick these four words and shapes for the state of a revision: draft, in review, approved, superseded.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx'],
          Component: DocDrawingApprovalStates,
        },
        {
          id: 'DocDrawingCard',
          title: 'Document card',
          note: 'Pick it in a grid of documents: a page placeholder, then title, number, revision and state.',
          origin: 'custom',
          uses: ['industrial/workflows/PagePreview.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: DocDrawingCard,
        },
        {
          id: 'DocDrawingCardDrawing',
          title: 'Drawing card',
          note: 'Pick the same card for a drawing: the placeholder takes the landscape shape of a sheet.',
          origin: 'custom',
          uses: ['industrial/workflows/PagePreview.tsx', 'industrial/StatusIndicator.tsx'],
          align: 'stretch',
          Component: DocDrawingCardDrawing,
        },
      ],
    },
    {
      id: 'lists',
      title: 'Lists, revisions and links',
      description: 'Finding a document, following its revisions, and seeing what it is connected to.',
      specimens: [
        {
          id: 'DocDrawingList',
          title: 'Document list with filters',
          note: 'Pick it as the register for an area: search, filter by kind, and approval on every row. Type or filter to try.',
          origin: 'custom',
          uses: ['industrial/workflows/DocumentRow.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: DocDrawingList,
        },
        {
          id: 'DocDrawingSearchResults',
          title: 'Search within documents',
          note: 'Pick it for full-text results: the passage with the match marked, the document and the page.',
          origin: 'custom',
          uses: ['industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingSearchResults,
        },
        {
          id: 'DocDrawingRevisionHistory',
          title: 'Revision history',
          note: 'Pick it to show how a document got here: newest first, what changed, who issued it and when.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: DocDrawingRevisionHistory,
        },
        {
          id: 'DocDrawingUpload',
          title: 'Upload a new revision',
          note: 'Pick it to issue a revision: the file, the next revision letter, and a required line on what changed. Type to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: DocDrawingUpload,
        },
        {
          id: 'DocDrawingApproval',
          title: 'Approval status',
          note: 'Pick it for a revision in review: who has signed, who has not, and which revision is in force meanwhile.',
          origin: 'custom',
          uses: ['industrial/workflows/SignOffBlock.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingApproval,
        },
        {
          id: 'DocDrawingMetadata',
          title: 'Metadata panel',
          note: 'Pick it in a side panel: type, revision, state, discipline, area, owner and file.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx', 'industrial/StatusIndicator.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingMetadata,
        },
        {
          id: 'DocDrawingOffline',
          title: 'Offline availability',
          note: 'Pick it for field use: a switch per document or area, saying what is stored and how large it is.',
          origin: 'custom',
          uses: ['forms/SettingSwitchRow.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingOffline,
        },
        {
          id: 'DocDrawingTagLinks',
          title: 'Tag-to-document links',
          note: 'Pick it on a tag or asset page: every document that mentions the tag, and where in it.',
          origin: 'custom',
          uses: ['industrial/workflows/TagChip.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingTagLinks,
        },
        {
          id: 'DocDrawingLinkedAssets',
          title: 'Linked assets',
          note: 'Pick it on a document page: the equipment it covers, with each unit’s current state.',
          origin: 'custom',
          uses: ['industrial/StatusIndicator.tsx', 'industrial/status.ts'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingLinkedAssets,
        },
      ],
    },
    {
      id: 'viewer',
      title: 'Viewer parts',
      description: 'The pieces around a drawing: controls, layers, the legend, detected tags and annotations.',
      specimens: [
        {
          id: 'DocDrawingToolbar',
          title: 'Viewer toolbar',
          note: 'Pick it above a canvas: zoom out, level, zoom in, fit, then layer toggles and download. Click to try.',
          origin: 'custom',
          uses: ['industrial/workflows/ViewerToolbar.tsx', 'industrial/workflows/workflow.ts'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingToolbar,
        },
        {
          id: 'DocDrawingCompareHeader',
          title: 'Compare revisions header',
          note: 'Pick it above two canvases: which revisions, how many changes, and side by side or overlay.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: DocDrawingCompareHeader,
        },
        {
          id: 'DocDrawingLegend',
          title: 'Drawing legend',
          note: 'Pick it in a corner of the viewer: line styles and what the overlays mean.',
          origin: 'custom',
          Component: DocDrawingLegend,
        },
        {
          id: 'DocDrawingDetectedTags',
          title: 'Detected tags list',
          note: 'Pick it as the side panel of a viewer: selecting a tag here highlights it on the sheet. Click to try.',
          origin: 'custom',
          align: 'stretch',
          Component: DocDrawingDetectedTags,
        },
        {
          id: 'DocDrawingLayers',
          title: 'Layers',
          note: 'Pick it when a drawing has several overlays: one checkbox each, with what it contains.',
          origin: 'custom',
          align: 'stretch',
          Component: DocDrawingLayers,
        },
        {
          id: 'DocDrawingAnnotations',
          title: 'Annotation list',
          note: 'Pick it beside a marked-up drawing: numbered to match the pins, with author, date and the tag concerned.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'industrial/workflows/TagChip.tsx'],
          size: 'md',
          align: 'stretch',
          Component: DocDrawingAnnotations,
        },
        {
          id: 'DocDrawingHotspots',
          title: 'Tag hotspots on a canvas',
          note: 'Pick it to show what was detected: a quiet outline on every tag and a stronger one on the selected tag.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: DocDrawingHotspots,
        },
      ],
    },
    {
      id: 'screens',
      title: 'Viewer and document page',
      description: 'The parts assembled: a P&ID viewer and a document detail page.',
      specimens: [
        {
          id: 'DocDrawingViewer',
          title: 'P&ID viewer',
          note: 'Pick it as the viewer chrome: title and revision, toolbar, canvas with hotspots, and detected tags at the side. Zoom and select to try.',
          origin: 'custom',
          uses: ['industrial/workflows/ViewerToolbar.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: DocDrawingViewer,
        },
        {
          id: 'DocDrawingDocumentPage',
          title: 'Document detail page',
          note: 'Pick it as the page for one document: preview, what it is and what it mentions, and its revisions.',
          origin: 'custom',
          uses: ['industrial/workflows/PagePreview.tsx', 'industrial/workflows/TagChip.tsx', 'display/MetadataList.tsx', 'industrial/StatusIndicator.tsx'],
          size: 'full',
          align: 'stretch',
          Component: DocDrawingDocumentPage,
        },
      ],
    },
  ],
});
