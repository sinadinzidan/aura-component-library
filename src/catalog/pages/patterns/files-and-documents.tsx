import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { ItemGroup } from '@cognite/aura/components/item';
import {
  IconArchive,
  IconCircleCheck,
  IconCircleDashed,
  IconDownload,
  IconExternalLink,
  IconEyeOff,
  IconFolder,
  IconFolderOpen,
  IconInnerShadowTopLeft,
  IconLink,
  IconLock,
  IconPaperclip,
  IconShare,
  IconTrash,
  IconUpload,
  IconUsers,
  IconWorld,
  IconX,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { SelectionActionBar } from '../../../library/actions/SelectionActionBar';
import { RowActionsMenu } from '../../../library/data/RowActionsMenu';
import { SelectionCheckbox } from '../../../library/data/SelectionCheckbox';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { RetryBlock } from '../../../library/feedback/RetryBlock';
import { CollapsingBreadcrumb } from '../../../library/navigation/CollapsingBreadcrumb';
import { EntityCard } from '../../../library/patterns/collections/EntityCard';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { useSelection } from '../../../library/patterns/collections/useSelection';
import { DocumentViewerFrame } from '../../../library/patterns/content/DocumentViewerFrame';
import { FILE_KIND_LABEL, fileKindOf } from '../../../library/patterns/content/fileKind';
import type { FileKind } from '../../../library/patterns/content/fileKind';
import { FileRow } from '../../../library/patterns/content/FileRow';
import { FileTypeIcon } from '../../../library/patterns/content/FileTypeIcon';
import { formatBytes } from '../../../library/patterns/content/formatBytes';
import { PagePreview } from '../../../library/patterns/content/PagePreview';
import { PropertyList } from '../../../library/patterns/structure/PropertyList';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { SidePanel } from '../../../library/patterns/structure/SidePanel';
import { ASSETS, findPerson } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, formatAgo, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './files-and-documents.tsx?raw';

type FileDocStatus = 'draft' | 'review' | 'approved' | 'superseded';

type FileDocFile = {
  id: string;
  name: string;
  size: number;
  modifiedAt: number;
  ownerId: string;
  revision: string;
  status: FileDocStatus;
  pages: number;
  /** Tags of the assets the file is linked to. */
  assets: readonly string[];
  preview: 'text' | 'drawing' | 'table' | 'image';
};

const FILE_DOC_FILES: readonly FileDocFile[] = [
  { id: 'pid', name: 'P&ID 23-KA-9101 rev C.pdf', size: 2_400_000, modifiedAt: REFERENCE_NOW - 8 * DAY, ownerId: 'ak', revision: 'C', status: 'approved', pages: 14, assets: ['23-KA-9101', '23-HA-9114', '23-GT-9001'], preview: 'drawing' },
  { id: 'layout', name: 'NK-23 compression area layout.dwg', size: 18_600_000, modifiedAt: REFERENCE_NOW - 21 * DAY, ownerId: 'ms', revision: 'B', status: 'approved', pages: 1, assets: ['NK-23'], preview: 'drawing' },
  { id: 'proc', name: 'Bearing inspection procedure rev 4.pdf', size: 860_000, modifiedAt: REFERENCE_NOW - 2 * DAY, ownerId: 'ak', revision: '4', status: 'review', pages: 6, assets: ['23-KA-9103'], preview: 'text' },
  { id: 'survey', name: 'Vibration survey Q1.xlsx', size: 318_000, modifiedAt: REFERENCE_NOW - 12 * DAY, ownerId: 'ak', revision: '1', status: 'draft', pages: 3, assets: ['23-KA-9101'], preview: 'table' },
  { id: 'photo', name: 'Drive-end bearing, borescope.jpg', size: 5_100_000, modifiedAt: REFERENCE_NOW - 2 * HOUR, ownerId: 'tb', revision: '1', status: 'draft', pages: 1, assets: ['23-KA-9103'], preview: 'image' },
  { id: 'alarms', name: 'Alarm history February.csv', size: 6_200_000, modifiedAt: REFERENCE_NOW - 3 * DAY, ownerId: 'ih', revision: '1', status: 'approved', pages: 1, assets: [], preview: 'table' },
  { id: 'datasheet', name: 'Recompressor datasheet.pdf', size: 1_900_000, modifiedAt: REFERENCE_NOW - 400 * DAY, ownerId: 'ms', revision: 'A', status: 'superseded', pages: 22, assets: ['23-KA-9103'], preview: 'text' },
  { id: 'model', name: 'NK-23 module.rvm', size: 212_000_000, modifiedAt: REFERENCE_NOW - 60 * DAY, ownerId: 'ms', revision: '2', status: 'approved', pages: 1, assets: ['NK-23'], preview: 'image' },
];

const FILE_DOC_PID = FILE_DOC_FILES[0];
const FILE_DOC_PROCEDURE = FILE_DOC_FILES[2];

const FILE_DOC_STATUS = {
  draft: { label: 'Draft', variant: 'archived', Icon: IconCircleDashed },
  review: { label: 'In review', variant: 'inProgress', Icon: IconInnerShadowTopLeft },
  approved: { label: 'Approved', variant: 'success', Icon: IconCircleCheck },
  superseded: { label: 'Superseded', variant: 'archived', Icon: IconArchive },
} as const;

const FILE_DOC_LEGEND: readonly { kind: FileKind; examples: string }[] = [
  { kind: 'pdf', examples: 'Procedures, datasheets' },
  { kind: 'drawing', examples: 'P&IDs, layouts' },
  { kind: 'spreadsheet', examples: 'Surveys, registers' },
  { kind: 'csv', examples: 'Exports, datapoints' },
  { kind: 'image', examples: 'Inspection photos' },
  { kind: 'model', examples: 'Plant modules' },
];

const FILE_DOC_REVISIONS = [
  { id: 'C', note: 'Added anti-surge valve 23-FV-92512 and its bypass', personId: 'ak', at: REFERENCE_NOW - 8 * DAY, size: 2_400_000 },
  { id: 'B', note: 'Updated instrument tags after the 2024 turnaround', personId: 'ms', at: REFERENCE_NOW - 190 * DAY, size: 2_300_000 },
  { id: 'A', note: 'Issued for construction', personId: 'ms', at: REFERENCE_NOW - 820 * DAY, size: 2_100_000 },
] as const;

type FileDocFolder = { id: string; name: string; parentId: string | null; fileIds: readonly string[] };

const FILE_DOC_FOLDERS: readonly FileDocFolder[] = [
  { id: 'root', name: 'Engineering documents', parentId: null, fileIds: ['alarms'] },
  { id: 'nk-20', name: 'NK-20 Inlet and separation', parentId: 'root', fileIds: [] },
  { id: 'nk-23', name: 'NK-23 Gas compression', parentId: 'root', fileIds: ['layout', 'survey', 'model'] },
  { id: 'pids', name: 'P&IDs', parentId: 'nk-23', fileIds: ['pid'] },
  { id: 'procedures', name: 'Procedures', parentId: 'nk-23', fileIds: ['proc', 'datasheet'] },
];

const FILE_DOC_SHARING = [
  { id: 'private', Icon: IconLock, label: 'Private', detail: 'Only you can open it', file: FILE_DOC_FILES[3] },
  { id: 'people', Icon: IconUsers, label: 'Shared with 4 people', detail: 'Rotating equipment team', file: FILE_DOC_FILES[2] },
  { id: 'site', Icon: IconWorld, label: 'Everyone at Nordkapp', detail: 'Read access through the data set', file: FILE_DOC_FILES[0] },
  { id: 'link', Icon: IconLink, label: 'Link expires 19 Mar', detail: 'Anyone with the link can view', file: FILE_DOC_FILES[4] },
] as const;

function fileDocOwner(file: FileDocFile): string {
  return findPerson(file.ownerId)?.name ?? 'Unknown owner';
}

function fileDocModified(file: FileDocFile): string {
  return REFERENCE_NOW - file.modifiedAt < 2 * DAY ? formatAgo(file.modifiedAt) : formatDate(file.modifiedAt);
}

function fileDocById(id: string): FileDocFile {
  return FILE_DOC_FILES.find((file) => file.id === id) ?? FILE_DOC_FILES[0];
}

function fileDocAssetName(tag: string): string {
  return ASSETS.find((asset) => asset.tag === tag)?.name ?? 'Unknown asset';
}

function fileDocTrail(folder: FileDocFolder): FileDocFolder[] {
  const parent = FILE_DOC_FOLDERS.find((entry) => entry.id === folder.parentId);
  return parent ? [...fileDocTrail(parent), folder] : [folder];
}

function FileDocStatusBadge({ status }: { status: FileDocStatus }) {
  const { label, variant, Icon } = FILE_DOC_STATUS[status];
  return (
    <Badge variant={variant}>
      <Icon /> {label}
    </Badge>
  );
}

function FileDocPage({ file, page }: { file: FileDocFile; page: number }) {
  return (
    <PagePreview
      label={`Page ${page} of ${file.name}`}
      variant={page === 1 ? file.preview : 'text'}
      orientation={file.preview === 'drawing' && page === 1 ? 'landscape' : 'portrait'}
    />
  );
}

function FileDocPanelHeight({ children }: { children: ReactNode }) {
  return <div className="h-[30rem] w-full">{children}</div>;
}

function FileDocRow() {
  return (
    <ItemGroup aria-label="Files">
      {FILE_DOC_FILES.slice(0, 5).map((file) => (
        <FileRow key={file.id} name={file.name} size={file.size} owner={fileDocOwner(file)} modified={fileDocModified(file)} />
      ))}
    </ItemGroup>
  );
}

function FileDocRowDense() {
  return (
    <ItemGroup aria-label="Files, dense">
      {FILE_DOC_FILES.map((file) => (
        <FileRow key={file.id} density="dense" name={file.name} size={file.size} modified={fileDocModified(file)} />
      ))}
    </ItemGroup>
  );
}

function FileDocDocumentStatus() {
  return (
    <ItemGroup aria-label="Controlled documents">
      {[FILE_DOC_FILES[0], FILE_DOC_FILES[2], FILE_DOC_FILES[3], FILE_DOC_FILES[6]].map((file) => (
        <FileRow
          key={file.id}
          name={file.name}
          size={file.size}
          owner={`Rev ${file.revision}`}
          meta={<FileDocStatusBadge status={file.status} />}
        />
      ))}
    </ItemGroup>
  );
}

function FileDocSearchResults() {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-xs tabular-nums text-muted-foreground">2 files mention “anti-surge”</p>
      <ItemGroup aria-label="Search results">
        <EntityRow
          leading={<FileTypeIcon kind="pdf" />}
          title={FILE_DOC_PID.name}
          description={
            <span>
              Page 3 · …the <mark className="rounded-sm bg-medium-background px-0.5 font-medium text-base-foreground">anti-surge</mark> valve
              23-FV-92512 opens on low flow…
            </span>
          }
          meta={<span className="tabular-nums">{fileDocModified(FILE_DOC_PID)}</span>}
        />
        <EntityRow
          leading={<FileTypeIcon kind="pdf" />}
          title={FILE_DOC_PROCEDURE.name}
          description={
            <span>
              Page 2 · …confirm the <mark className="rounded-sm bg-medium-background px-0.5 font-medium text-base-foreground">anti-surge</mark>{' '}
              controller is in manual before…
            </span>
          }
          meta={<span className="tabular-nums">{fileDocModified(FILE_DOC_PROCEDURE)}</span>}
        />
      </ItemGroup>
    </div>
  );
}

function FileDocRowActions() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      <ItemGroup aria-label="Files with actions">
        {FILE_DOC_FILES.slice(0, 3).map((file) => (
          <FileRow
            key={file.id}
            name={file.name}
            size={file.size}
            modified={fileDocModified(file)}
            actions={
              <IconAction label={`Download ${file.name}`} onClick={() => setLast(`Download started for ${file.name}`)}>
                <IconDownload />
              </IconAction>
            }
            trailing={
              <RowActionsMenu
                label={`Actions for ${file.name}`}
                actions={[
                  { id: 'rename', label: 'Rename', onSelect: () => setLast(`Rename ${file.name}`) },
                  { id: 'move', label: 'Move to folder', onSelect: () => setLast(`Move ${file.name}`) },
                  { id: 'link', label: 'Link to asset', onSelect: () => setLast(`Link ${file.name} to an asset`) },
                  { id: 'delete', label: 'Delete file', destructive: true, onSelect: () => setLast(`Delete ${file.name}`) },
                ]}
              />
            }
          />
        ))}
      </ItemGroup>
      <p className="px-2 text-xs text-muted-foreground" aria-live="polite">
        {last ?? 'Hover or focus a row for download; the menu holds the rest.'}
      </p>
    </div>
  );
}

function FileDocLockedIndicator() {
  const [lockedByMe, setLockedByMe] = useState(false);

  return (
    <ItemGroup aria-label="Files with check-out state">
      <FileRow
        name={FILE_DOC_PROCEDURE.name}
        size={FILE_DOC_PROCEDURE.size}
        lockedBy="Aisha Khan"
        trailing={
          <Button variant="ghost" size="sm" disabled>
            Check out
          </Button>
        }
      />
      <FileRow
        name={FILE_DOC_FILES[3].name}
        size={FILE_DOC_FILES[3].size}
        lockedBy={lockedByMe ? 'you' : undefined}
        trailing={
          <Button variant="ghost" size="sm" onClick={() => setLockedByMe(!lockedByMe)}>
            {lockedByMe ? 'Check in' : 'Check out'}
          </Button>
        }
      />
    </ItemGroup>
  );
}

function FileDocSharingStatus() {
  return (
    <ItemGroup aria-label="Files and who can open them">
      {FILE_DOC_SHARING.map((share) => (
        <FileRow
          key={share.id}
          density="dense"
          name={share.file.name}
          meta={
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <share.Icon aria-hidden="true" className="size-3.5" />
              {share.label}
            </span>
          }
        />
      ))}
    </ItemGroup>
  );
}

function FileDocTypeLegend() {
  return (
    <ul aria-label="File types" className="grid w-full max-w-xs list-none grid-cols-1 gap-3">
      {FILE_DOC_LEGEND.map((entry) => (
        <li key={entry.kind} className="flex items-center gap-3">
          <FileTypeIcon kind={entry.kind} size="sm" tinted />
          <span className="text-sm text-base-foreground">{FILE_KIND_LABEL[entry.kind]}</span>
          <span className="ml-auto text-xs text-muted-foreground">{entry.examples}</span>
        </li>
      ))}
    </ul>
  );
}

function FileDocAttachmentChips() {
  const [files, setFiles] = useState<readonly FileDocFile[]>([FILE_DOC_FILES[4], FILE_DOC_FILES[2], FILE_DOC_FILES[3]]);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconPaperclip aria-hidden="true" className="size-3.5" />
        <span className="tabular-nums">
          {files.length} {files.length === 1 ? 'attachment' : 'attachments'}
        </span>
      </p>
      <ul aria-label="Attachments" className="flex list-none flex-col items-start gap-2">
        {files.map((file) => (
          <li key={file.id} className="flex max-w-full items-center gap-2 rounded-lg bg-medium-background py-1 pl-1 pr-1 text-sm text-base-foreground">
            <FileTypeIcon kind={fileKindOf(file.name)} size="sm" />
            <span className="min-w-0 truncate" title={file.name}>
              {file.name}
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatBytes(file.size)}</span>
            <IconAction label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((other) => other.id !== file.id))}>
              <IconX />
            </IconAction>
          </li>
        ))}
      </ul>
      {files.length === 0 ? (
        <Button variant="ghost" size="sm" className="self-start" onClick={() => setFiles([FILE_DOC_FILES[4], FILE_DOC_FILES[2], FILE_DOC_FILES[3]])}>
          Restore attachments
        </Button>
      ) : null}
    </div>
  );
}

function FileDocLinkedAssets() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <SectionHeader title="Linked assets" count={FILE_DOC_PID.assets.length} size="sm" as="h3" />
      <ul aria-label="Assets linked to the P&ID" className="flex list-none flex-col gap-2">
        {FILE_DOC_PID.assets.map((tag) => (
          <li key={tag} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-mono text-xs text-base-foreground">{tag}</span>
            <span className="min-w-0 truncate text-muted-foreground">{fileDocAssetName(tag)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FileDocGridTiles() {
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <ul aria-label="Files" className="grid list-none grid-cols-2 gap-4 sm:grid-cols-4">
        {FILE_DOC_FILES.slice(0, 4).map((file) => (
          <li key={file.id} className="min-w-0">
            <button
              type="button"
              onClick={() => setOpened(file.name)}
              className="flex h-full w-full cursor-pointer flex-col gap-2 rounded-lg p-1 text-left outline-none hover:bg-base-background-hover focus-visible:shadow-focus-ring"
            >
              <PagePreview label={`Preview of ${file.name}`} variant={file.preview} orientation="landscape" />
              <span className="break-words text-sm font-medium text-base-foreground">{file.name}</span>
              <span className="mt-auto text-xs tabular-nums text-muted-foreground">
                {FILE_KIND_LABEL[fileKindOf(file.name)]} · {formatBytes(file.size)} · {fileDocModified(file)}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {opened ? `Opened ${opened}.` : 'Select a tile to open the file.'}
      </p>
    </div>
  );
}

function FileDocDocumentCard() {
  return (
    <div className="w-full max-w-xs">
      <EntityCard
        title="Bearing inspection procedure"
        description="Rev 4 · 6 pages"
        status={<FileDocStatusBadge status="review" />}
        media={
          <div className="flex w-full justify-center bg-muted-background px-4 pt-4">
            <div className="w-32">
              <PagePreview label="First page of the bearing inspection procedure" />
            </div>
          </div>
        }
        footerNote={`Updated ${fileDocModified(FILE_DOC_PROCEDURE)}`}
        footerActions={
          <Button variant="secondary" size="sm">
            Open document
          </Button>
        }
      />
    </div>
  );
}

function FileDocRecentFiles() {
  const recent = [...FILE_DOC_FILES].sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 4);

  return (
    <div className="flex w-full flex-col gap-2">
      <SectionHeader
        title="Recent files"
        size="sm"
        as="h3"
        actions={
          <Button variant="ghost" size="sm">
            View all files
          </Button>
        }
      />
      <ItemGroup aria-label="Recent files">
        {recent.map((file) => (
          <FileRow key={file.id} density="dense" name={file.name} modified={formatAgo(file.modifiedAt)} onOpen={() => undefined} />
        ))}
      </ItemGroup>
    </div>
  );
}

function FileDocRevisionList() {
  const [current, setCurrent] = useState<string>('C');

  return (
    <div className="flex w-full flex-col gap-2">
      <SectionHeader title="Revisions" count={FILE_DOC_REVISIONS.length} size="sm" as="h3" />
      <ItemGroup aria-label="Revisions of P&ID 23-KA-9101">
        {FILE_DOC_REVISIONS.map((revision) => (
          <EntityRow
            key={revision.id}
            leading={
              <span className="flex size-9 items-center justify-center rounded-lg bg-medium-background font-mono text-sm font-medium text-medium-foreground">
                {revision.id}
              </span>
            }
            title={revision.note}
            description={
              <span className="tabular-nums">
                {findPerson(revision.personId)?.name} · {formatDate(revision.at)} · {formatBytes(revision.size)}
              </span>
            }
            meta={revision.id === current ? <Badge variant="secondary">Current</Badge> : undefined}
            trailing={
              revision.id === current ? undefined : (
                <Button variant="ghost" size="sm" onClick={() => setCurrent(revision.id)}>
                  Restore
                </Button>
              )
            }
          />
        ))}
      </ItemGroup>
    </div>
  );
}

function FileDocFolderBrowser() {
  const [folderId, setFolderId] = useState('nk-23');
  const folder = FILE_DOC_FOLDERS.find((entry) => entry.id === folderId) ?? FILE_DOC_FOLDERS[0];
  const children = FILE_DOC_FOLDERS.filter((entry) => entry.parentId === folder.id);
  const trail = fileDocTrail(folder);

  return (
    <div className="flex w-full flex-col gap-3">
      <CollapsingBreadcrumb
        items={trail.map((entry) => ({ id: entry.id, label: entry.name }))}
        onNavigate={(item) => setFolderId(item.id)}
      />
      {children.length + folder.fileIds.length > 0 ? (
        <ItemGroup aria-label={`Contents of ${folder.name}`}>
          {children.map((child) => (
            <EntityRow
              key={child.id}
              leading={
                <span className="flex size-9 items-center justify-center rounded-lg bg-medium-background text-medium-foreground">
                  <IconFolder aria-hidden="true" className="size-5" />
                </span>
              }
              title={child.name}
              description={
                <span className="tabular-nums">
                  Folder · {child.fileIds.length} {child.fileIds.length === 1 ? 'file' : 'files'}
                </span>
              }
              onOpen={() => setFolderId(child.id)}
            />
          ))}
          {folder.fileIds.map((id) => {
            const file = fileDocById(id);
            return <FileRow key={id} name={file.name} size={file.size} modified={fileDocModified(file)} />;
          })}
        </ItemGroup>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">This folder is empty.</p>
      )}
    </div>
  );
}

function FileDocSelectionBulk() {
  const files = FILE_DOC_FILES.slice(0, 5);
  const selection = useSelection(
    files.map((file) => file.id),
    ['pid', 'proc']
  );
  const selectedBytes = files.filter((file) => selection.isSelected(file.id)).reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-9 items-center gap-2 px-2">
        <SelectionCheckbox
          label="Select all files"
          checked={selection.allSelected}
          indeterminate={selection.partiallySelected}
          onChange={(checked) => selection.toggleAll(checked)}
        />
        <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {selection.count === 0 ? `${files.length} files` : `${selection.count} selected · ${formatBytes(selectedBytes)}`}
        </span>
      </div>
      <ItemGroup aria-label="Files">
        {files.map((file) => (
          <FileRow
            key={file.id}
            density="dense"
            name={file.name}
            size={file.size}
            selection={{
              checked: selection.isSelected(file.id),
              onChange: (checked) => selection.toggle(file.id, checked),
              label: `Select ${file.name}`,
            }}
          />
        ))}
      </ItemGroup>
      <SelectionActionBar
        count={selection.count}
        noun={{ one: 'file', other: 'files' }}
        maxVisible={2}
        actions={[
          { id: 'download', label: 'Download', icon: <IconDownload />, onSelect: () => undefined },
          { id: 'move', label: 'Move', icon: <IconFolderOpen />, onSelect: () => undefined },
          { id: 'share', label: 'Share', icon: <IconShare />, onSelect: () => undefined },
          { id: 'delete', label: 'Delete', icon: <IconTrash />, destructive: true, onSelect: () => selection.clear() },
        ]}
        onClear={selection.clear}
      />
    </div>
  );
}

function FileDocEmptyFolder() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconFolderOpen />
      </EmptyStateIcon>
      <EmptyStateTitle as="h3">No files in NK-20 yet</EmptyStateTitle>
      <EmptyStateDescription>Upload drawings and procedures for Inlet and separation, or move them here.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          <IconUpload /> Upload files
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function FileDocPreviewUnavailable() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconEyeOff />
      </EmptyStateIcon>
      <EmptyStateTitle as="h3">No preview for RVM files</EmptyStateTitle>
      <EmptyStateDescription>NK-23 module.rvm is 212 MB. Open it in the 3D viewer or download it.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          Open in 3D viewer
        </Button>
        <Button variant="ghost" size="sm">
          <IconDownload /> Download
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function FileDocPreviewFailed() {
  return (
    <RetryBlock
      title="Couldn't load the preview"
      description="The file is safe. Rendering page 1 timed out; try again or download the file."
      onRetry={() => Promise.resolve()}
      retryLabel="Load preview again"
    />
  );
}

function FileDocViewerChrome() {
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [downloads, setDownloads] = useState(0);

  return (
    <div className="flex w-full flex-col gap-2">
      <FileDocPanelHeight>
        <DocumentViewerFrame
          title={FILE_DOC_PID.name}
          page={page}
          pageCount={FILE_DOC_PID.pages}
          onPageChange={setPage}
          zoom={zoom}
          onZoomChange={setZoom}
          onDownload={() => setDownloads(downloads + 1)}
          actions={
            <IconAction label="Open in a new tab">
              <IconExternalLink />
            </IconAction>
          }
        >
          <div className="h-fit shrink-0" style={{ width: `${Math.round(zoom * 0.7)}%` }}>
            <FileDocPage file={FILE_DOC_PID} page={page} />
          </div>
        </DocumentViewerFrame>
      </FileDocPanelHeight>
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {downloads === 0 ? 'The page area is a placeholder; paging and zoom work.' : `Download requested ${downloads} ${downloads === 1 ? 'time' : 'times'}.`}
      </p>
    </div>
  );
}

function FileDocDetailPanel() {
  return (
    <FileDocPanelHeight>
      <SidePanel
        title={FILE_DOC_PID.name}
        description={`${FILE_KIND_LABEL[fileKindOf(FILE_DOC_PID.name)]} · ${formatBytes(FILE_DOC_PID.size)}`}
        leading={<FileTypeIcon kind="pdf" />}
        onClose={() => undefined}
        closeLabel="Close file details"
        footer={
          <>
            <Button variant="ghost">
              <IconDownload /> Download
            </Button>
            <Button>Open file</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <PropertyList
            dense
            items={[
              { label: 'Status', value: <FileDocStatusBadge status={FILE_DOC_PID.status} /> },
              { label: 'Revision', value: FILE_DOC_PID.revision },
              { label: 'Owner', value: fileDocOwner(FILE_DOC_PID) },
              { label: 'Modified', value: formatDate(FILE_DOC_PID.modifiedAt) },
              { label: 'Pages', value: FILE_DOC_PID.pages },
              { label: 'Data set', value: 'Engineering documents' },
              {
                label: 'External ID',
                value: <span className="font-mono text-xs">NK-PID-23-9101</span>,
                action: <CopyButton variant="ghost" size="icon-sm" text="NK-PID-23-9101" label="Copy external ID" iconOnly />,
              },
              { label: 'Source' },
            ]}
          />
          <div className="flex flex-col gap-2">
            <SectionHeader title="Linked assets" count={FILE_DOC_PID.assets.length} size="sm" as="h3" />
            <ul aria-label="Linked assets" className="flex list-none flex-col gap-2">
              {FILE_DOC_PID.assets.map((tag) => (
                <li key={tag} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-mono text-xs text-base-foreground">{tag}</span>
                  <span className="min-w-0 truncate text-muted-foreground">{fileDocAssetName(tag)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SidePanel>
    </FileDocPanelHeight>
  );
}

function FileDocPageThumbnails() {
  const [page, setPage] = useState(2);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ul aria-label="Pages of the bearing inspection procedure" className="grid list-none grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((number) => (
          <li key={number}>
            <button
              type="button"
              aria-current={number === page ? 'page' : undefined}
              aria-label={`Go to page ${number}`}
              onClick={() => setPage(number)}
              className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg p-1 outline-none ring-2 ring-transparent hover:bg-base-background-hover focus-visible:shadow-focus-ring aria-[current=page]:ring-primary-background"
            >
              <PagePreview label={`Page ${number}`} variant={number === 4 ? 'table' : 'text'} />
              <span className={`text-xs tabular-nums ${number === page ? 'font-medium text-base-foreground' : 'text-muted-foreground'}`}>{number}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
        Page {page} of 6
      </p>
    </div>
  );
}

function FileDocCompareRevisions() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-4">
        <figure className="flex min-w-0 flex-col gap-2">
          <figcaption className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-base-foreground">Revision B</span>
            <span className="tabular-nums">{formatDate(FILE_DOC_REVISIONS[1].at)}</span>
          </figcaption>
          <PagePreview label="P&ID 23-KA-9101 revision B, page 1" variant="drawing" orientation="landscape" />
        </figure>
        <figure className="flex min-w-0 flex-col gap-2">
          <figcaption className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-base-foreground">
              Revision C <Badge variant="secondary">Current</Badge>
            </span>
            <span className="tabular-nums">{formatDate(FILE_DOC_REVISIONS[0].at)}</span>
          </figcaption>
          <PagePreview label="P&ID 23-KA-9101 revision C, page 1" variant="drawing" orientation="landscape" />
        </figure>
      </div>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-base-foreground">What changed:</span> {FILE_DOC_REVISIONS[0].note}. 2 of 14 pages differ.
      </p>
    </div>
  );
}

function FileDocWorkspace() {
  const files = FILE_DOC_FILES.slice(0, 5);
  const [fileId, setFileId] = useState('pid');
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const file = fileDocById(fileId);

  return (
    <div className="grid h-[34rem] w-full grid-cols-[minmax(0,5fr)_minmax(0,8fr)] gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)_minmax(0,4fr)]">
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
        <div className="flex flex-col px-2 pb-1">
          <span className="text-xs text-muted-foreground">Engineering documents</span>
          <h3 className="text-sm font-medium text-base-foreground">NK-23 Gas compression</h3>
        </div>
        <ItemGroup aria-label="Files in NK-23 Gas compression">
          {files.map((entry) => (
            <FileRow
              key={entry.id}
              density="dense"
              name={entry.name}
              selected={entry.id === fileId}
              onOpen={() => {
                setFileId(entry.id);
                setPage(1);
              }}
            />
          ))}
        </ItemGroup>
      </div>
      <DocumentViewerFrame
        title={file.name}
        page={page}
        pageCount={file.pages}
        onPageChange={setPage}
        zoom={zoom}
        onZoomChange={setZoom}
        onDownload={() => undefined}
      >
        <div className="h-fit shrink-0" style={{ width: `${Math.round(zoom * 0.8)}%` }}>
          <FileDocPage file={file} page={page} />
        </div>
      </DocumentViewerFrame>
      <div className="hidden min-h-0 lg:block">
        <SidePanel title="Details" description={`${FILE_KIND_LABEL[fileKindOf(file.name)]} · ${formatBytes(file.size)}`}>
          <div className="flex flex-col gap-6">
            <PropertyList
              dense
              layout="stacked"
              items={[
                { label: 'Status', value: <FileDocStatusBadge status={file.status} /> },
                { label: 'Revision', value: file.revision },
                { label: 'Owner', value: fileDocOwner(file) },
                { label: 'Modified', value: formatDate(file.modifiedAt) },
              ]}
            />
            <div className="flex flex-col gap-2">
              <SectionHeader title="Linked assets" count={file.assets.length} size="sm" as="h3" />
              {file.assets.length > 0 ? (
                <ul aria-label="Linked assets" className="flex list-none flex-col gap-2">
                  {file.assets.map((tag) => (
                    <li key={tag} className="flex flex-col text-sm">
                      <span className="font-mono text-xs text-base-foreground">{tag}</span>
                      <span className="text-muted-foreground">{fileDocAssetName(tag)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Not linked to any asset.</p>
              )}
            </div>
          </div>
        </SidePanel>
      </div>
    </div>
  );
}

function FileDocOwnerRows() {
  return (
    <ItemGroup aria-label="Files by owner">
      {FILE_DOC_FILES.slice(0, 4).map((file) => {
        const owner = fileDocOwner(file);
        return (
          <FileRow
            key={file.id}
            name={file.name}
            size={file.size}
            tinted
            modified={fileDocModified(file)}
            meta={
              <span className="inline-flex items-center gap-2">
                <PersonAvatar name={owner} sizes="xsm" />
                <span className="hidden sm:inline">{owner}</span>
              </span>
            }
          />
        );
      })}
    </ItemGroup>
  );
}

export default definePage({
  id: 'files-and-documents',
  title: 'Files and documents',
  summary:
    'How files appear once they are in the product: rows, tiles and cards, folders, revisions, the viewer and the detail panel. Previews are token-drawn placeholders, so every state works without an image.',
  guidance: {
    use: [
      'One row anatomy for every file: type icon, name, then type, size and owner, with the date at the end.',
      'Type shown by icon and word; decorative tints only tell kinds apart, never status.',
      'Revision and approval state as a labelled badge beside the file, not in its name.',
      'A viewer that keeps page and zoom in state the caller owns, so links restore the same view.',
    ],
    avoid: [
      'Thumbnails as the only identifier: always show the name and the type.',
      'A lock or sharing icon with no words saying who or what it refers to.',
      'Bulk actions that do not say how many files and how many megabytes they cover.',
      'An empty viewer when a preview fails or is unsupported; say why and offer the download.',
    ],
  },
  source,
  sections: [
    {
      id: 'rows',
      title: 'File rows',
      description: 'The same row with different facts at the end: owner, status, lock and sharing.',
      specimens: [
        {
          id: 'FileDocRow',
          title: 'File row',
          note: 'The default list: type icon, name, then type, size and owner, with the modified date at the end.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx', 'patterns/content/FileTypeIcon.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileDocRow,
        },
        {
          id: 'FileDocOwnerRows',
          title: 'Tinted icons and owner',
          note: 'Mixed folders where type matters and no status colour sits nearby; the owner gets an avatar.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx', 'display/PersonAvatar.tsx'],
          Component: FileDocOwnerRows,
        },
        {
          id: 'FileDocRowDense',
          title: 'Dense rows',
          note: 'Long folders people scan: one line per file, size and date in aligned columns.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx'],
          Component: FileDocRowDense,
        },
        {
          id: 'FileDocDocumentStatus',
          title: 'Revision and approval status',
          note: 'Controlled documents: the revision is a fact on the second line, the approval state a badge.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx'],
          Component: FileDocDocumentStatus,
        },
        {
          id: 'FileDocSearchResults',
          title: 'Search result with snippet',
          note: 'Full-text search: the page and the sentence around the match say why the file was found.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/content/FileTypeIcon.tsx'],
          Component: FileDocSearchResults,
        },
        {
          id: 'FileDocRowActions',
          title: 'Row actions',
          note: 'The frequent action on hover and focus, everything else in one overflow menu per row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx', 'patterns/collections/IconAction.tsx', 'data/RowActionsMenu.tsx'],
          Component: FileDocRowActions,
        },
        {
          id: 'FileDocLockedIndicator',
          title: 'Checked out',
          note: 'Files one person edits at a time: say who holds the lock and disable check-out for everyone else.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx'],
          Component: FileDocLockedIndicator,
        },
        {
          id: 'FileDocSharingStatus',
          title: 'Sharing status',
          note: 'Who can open each file, as an icon with words: private, named people, the whole site or a link.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx'],
          Component: FileDocSharingStatus,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Small parts',
      description: 'Pieces that sit inside other screens: a legend, attachment chips and linked assets.',
      specimens: [
        {
          id: 'FileDocTypeLegend',
          title: 'File type legend',
          note: 'Beside a mixed list or in a help panel, so the icons and tints are explained once.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/FileTypeIcon.tsx', 'patterns/content/fileKind.ts'],
          Component: FileDocTypeLegend,
        },
        {
          id: 'FileDocAttachmentChips',
          title: 'Attachment chips',
          note: 'Files attached to a comment or message: compact, removable, with the size visible.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/FileTypeIcon.tsx', 'patterns/collections/IconAction.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileDocAttachmentChips,
        },
        {
          id: 'FileDocLinkedAssets',
          title: 'Linked assets',
          note: 'The equipment a document describes: tag in monospace, name beside it.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/structure/SectionHeader.tsx'],
          Component: FileDocLinkedAssets,
        },
      ],
    },
    {
      id: 'tiles',
      title: 'Tiles, cards and lists',
      description: 'When the look of a page helps people find a file, and how history is listed.',
      specimens: [
        {
          id: 'FileDocGridTiles',
          title: 'File grid tiles',
          note: 'Drawings and photos people recognise by sight; the name and type stay under every preview.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/PagePreview.tsx', 'patterns/content/fileKind.ts', 'patterns/content/formatBytes.ts'],
          Component: FileDocGridTiles,
        },
        {
          id: 'FileDocDocumentCard',
          title: 'Document card',
          note: 'One document featured on a dashboard or an asset page, with its first page as a placeholder.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/collections/EntityCard.tsx', 'patterns/content/PagePreview.tsx'],
          Component: FileDocDocumentCard,
        },
        {
          id: 'FileDocRecentFiles',
          title: 'Recent files',
          note: 'A short way back to what someone just worked on, on a home page or in a side panel.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: FileDocRecentFiles,
        },
        {
          id: 'FileDocRevisionList',
          title: 'Revision list',
          note: 'Every version with who changed what and when; the current one is labelled, older ones can be restored.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'patterns/structure/SectionHeader.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileDocRevisionList,
        },
      ],
    },
    {
      id: 'folders',
      title: 'Folders and selection',
      description: 'Moving through a hierarchy, acting on several files, and the states a folder or preview can be in.',
      specimens: [
        {
          id: 'FileDocFolderBrowser',
          title: 'Folder breadcrumb and list',
          note: 'Hierarchies people browse: folders first, then files, with the path above. Open a folder to try it.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          uses: ['navigation/CollapsingBreadcrumb.tsx', 'patterns/collections/EntityRow.tsx', 'patterns/content/FileRow.tsx'],
          Component: FileDocFolderBrowser,
        },
        {
          id: 'FileDocSelectionBulk',
          title: 'Selection with bulk actions',
          note: 'Acting on several files: the count and total size are stated before download, move or delete.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/content/FileRow.tsx',
            'patterns/collections/useSelection.ts',
            'actions/SelectionActionBar.tsx',
            'data/SelectionCheckbox.tsx',
          ],
          Component: FileDocSelectionBulk,
        },
        {
          id: 'FileDocEmptyFolder',
          title: 'Empty folder',
          note: 'A folder with nothing in it yet: say what belongs here and offer the upload.',
          origin: 'custom',
          Component: FileDocEmptyFolder,
        },
        {
          id: 'FileDocPreviewUnavailable',
          title: 'Preview not available',
          note: 'Types the viewer cannot render: say so, and offer the tool that can open it and the download.',
          origin: 'custom',
          Component: FileDocPreviewUnavailable,
        },
        {
          id: 'FileDocPreviewFailed',
          title: 'Preview failed',
          note: 'Rendering failed but the file is fine: reassure, retry in place, keep the download reachable.',
          origin: 'custom',
          uses: ['feedback/RetryBlock.tsx'],
          Component: FileDocPreviewFailed,
        },
      ],
    },
    {
      id: 'viewer',
      title: 'Viewer and detail',
      description: 'Reading a document, its metadata beside it, and the three panes together.',
      specimens: [
        {
          id: 'FileDocViewerChrome',
          title: 'Viewer chrome',
          note: 'Around any rendered document: name, page stepping, zoom and download in one toolbar.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/DocumentViewerFrame.tsx', 'patterns/content/PagePreview.tsx', 'patterns/collections/IconAction.tsx'],
          Component: FileDocViewerChrome,
        },
        {
          id: 'FileDocDetailPanel',
          title: 'File detail panel',
          note: 'Beside a list or viewer: metadata as a property list, then the assets the file is linked to.',
          origin: 'custom',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
            'patterns/structure/SectionHeader.tsx',
            'actions/CopyButton.tsx',
          ],
          Component: FileDocDetailPanel,
        },
        {
          id: 'FileDocPageThumbnails',
          title: 'Page thumbnails',
          note: 'Long documents: jump by the shape of a page, with the current one outlined and numbered.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/PagePreview.tsx'],
          Component: FileDocPageThumbnails,
        },
        {
          id: 'FileDocCompareRevisions',
          title: 'Compare revisions',
          note: 'Reviewing a new revision: both sheets side by side, labelled, with the change note under them.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/PagePreview.tsx'],
          Component: FileDocCompareRevisions,
        },
        {
          id: 'FileDocWorkspace',
          title: 'Document workspace',
          note: 'The full screen: folder list, viewer and details. Pick a file on the left to change the other two.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/content/FileRow.tsx',
            'patterns/content/DocumentViewerFrame.tsx',
            'patterns/content/PagePreview.tsx',
            'patterns/structure/SidePanel.tsx',
            'patterns/structure/PropertyList.tsx',
          ],
          Component: FileDocWorkspace,
        },
      ],
    },
  ],
});
