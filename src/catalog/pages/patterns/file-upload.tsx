import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { ItemGroup } from '@cognite/aura/components/item';
import { Kbd } from '@cognite/aura/components/kbd';
import { Label } from '@cognite/aura/components/label';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconChevronUp,
  IconCircleCheck,
  IconClipboard,
  IconDownload,
  IconReplace,
  IconUpload,
  IconX,
} from '@cognite/aura/icons';
import { useReducer, useState } from 'react';
import type { ReactNode } from 'react';

import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { FormField } from '../../../library/forms/FormField';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { DropZone } from '../../../library/patterns/content/DropZone';
import { fileKindOf } from '../../../library/patterns/content/fileKind';
import { FilePickerButton } from '../../../library/patterns/content/FilePickerButton';
import { FileRow } from '../../../library/patterns/content/FileRow';
import { FileTypeIcon } from '../../../library/patterns/content/FileTypeIcon';
import { formatBytes } from '../../../library/patterns/content/formatBytes';
import { UploadQueue } from '../../../library/patterns/content/UploadQueue';
import { summarizeUploads, uploadReducer } from '../../../library/patterns/content/uploadReducer';
import type { UploadItem } from '../../../library/patterns/content/uploadReducer';
import { validateFile } from '../../../library/patterns/content/validateFile';
import type { FileRule } from '../../../library/patterns/content/validateFile';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { PanelFrame } from '../../../library/patterns/data-entry/PanelFrame';
import { definePage } from '../../types';

import source from './file-upload.tsx?raw';

const FILE_UPLOAD_RULE: FileRule = { extensions: ['pdf', 'dwg', 'xlsx', 'csv'], maxBytes: 100_000_000 };
const FILE_UPLOAD_ACCEPT = '.pdf,.dwg,.xlsx,.csv';
const FILE_UPLOAD_HINT = 'PDF, DWG, XLSX or CSV, up to 100 MB each';

const FILE_UPLOAD_DATA_SETS = [
  { value: 'docs', label: 'Engineering documents' },
  { value: 'telemetry', label: 'Compressor telemetry' },
  { value: 'sap', label: 'SAP work orders' },
] as const;

const FILE_UPLOAD_BATCH: readonly UploadItem[] = [
  { id: 'pid', name: 'P&ID 23-KA-9101 rev C.pdf', size: 2_400_000, loaded: 1_200_000, status: 'uploading' },
  { id: 'layout', name: 'NK-23 compression area layout.dwg', size: 18_600_000, loaded: 0, status: 'queued' },
  { id: 'survey', name: 'Vibration survey Q1.xlsx', size: 318_000, loaded: 0, status: 'queued' },
];

const FILE_UPLOAD_SETTLED: readonly UploadItem[] = [
  { id: 'proc', name: 'Bearing inspection procedure rev 4.pdf', size: 860_000, loaded: 860_000, status: 'done' },
  {
    id: 'scan',
    name: 'Recompressor datasheet scan.pdf',
    size: 41_000_000,
    loaded: 12_300_000,
    status: 'failed',
    error: 'Connection lost',
  },
  { id: 'export', name: 'Alarm history February.csv', size: 6_200_000, loaded: 1_900_000, status: 'cancelled' },
];

const FILE_UPLOAD_MIXED: readonly UploadItem[] = [
  { id: 'proc', name: 'Bearing inspection procedure rev 4.pdf', size: 860_000, loaded: 860_000, status: 'done' },
  { id: 'pid', name: 'P&ID 23-KA-9101 rev C.pdf', size: 2_400_000, loaded: 2_400_000, status: 'done' },
  { id: 'layout', name: 'NK-23 compression area layout.dwg', size: 18_600_000, loaded: 7_440_000, status: 'uploading' },
  { id: 'survey', name: 'Vibration survey Q1.xlsx', size: 318_000, loaded: 0, status: 'queued' },
  {
    id: 'scan',
    name: 'Recompressor datasheet scan.pdf',
    size: 41_000_000,
    loaded: 12_300_000,
    status: 'failed',
    error: 'Connection lost',
  },
];

type FileUploadCsvRow = { timestamp: string; tag: string; value: string; quality: string };

const FILE_UPLOAD_CSV_ROWS: readonly FileUploadCsvRow[] = [
  { timestamp: '2026-03-12 13:00', tag: '23-PT-92531', value: '48.2', quality: 'Good' },
  { timestamp: '2026-03-12 13:10', tag: '23-PT-92531', value: '48.4', quality: 'Good' },
  { timestamp: '2026-03-12 13:20', tag: '23-PT-92531', value: '48.9', quality: 'Good' },
  { timestamp: '2026-03-12 13:30', tag: '23-PT-92531', value: '', quality: 'Bad' },
  { timestamp: '2026-03-12 13:40', tag: '23-PT-92531', value: '48.6', quality: 'Good' },
];

const FILE_UPLOAD_CSV_COLUMNS: readonly DataTableColumn<FileUploadCsvRow>[] = [
  { id: 'timestamp', header: 'timestamp', cell: (row) => <span className="tabular-nums">{row.timestamp}</span> },
  { id: 'tag', header: 'external_id', cell: (row) => <span className="font-mono text-xs">{row.tag}</span> },
  {
    id: 'value',
    header: 'value',
    align: 'end',
    cell: (row) => (row.value === '' ? <span className="text-muted-foreground">Empty</span> : row.value),
  },
  { id: 'quality', header: 'quality', cell: (row) => row.quality },
];

function fileUploadItems(files: readonly File[]): { id: string; name: string; size: number }[] {
  return files.map((file) => ({ id: `${file.name}:${file.size}`, name: file.name, size: file.size }));
}

function fileUploadNames(files: readonly File[]): string {
  if (files.length === 1) return files[0].name;
  return `${files.length} files, ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}`;
}

function FileUploadSimulate({ onAdvance, disabled, children }: { onAdvance: () => void; disabled: boolean; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" size="sm" disabled={disabled} onClick={onAdvance}>
        Send next 25%
      </Button>
      {children}
      <span className="text-xs text-muted-foreground">{disabled ? 'Nothing left to send.' : 'Simulated: each press moves the upload forward.'}</span>
    </div>
  );
}

function FileUploadRejected({ name, size, message }: { name: string; size: number; message: string }) {
  return (
    <li className="flex min-w-0 items-start gap-3 py-2">
      <FileTypeIcon kind={fileKindOf(name)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-base-foreground" title={name}>
          {name}
        </span>
        <p className="flex items-start gap-1.5 text-xs text-critical-foreground-strong">
          <IconAlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>
            Not added. {message} <span className="tabular-nums text-muted-foreground">({formatBytes(size)})</span>
          </span>
        </p>
      </div>
    </li>
  );
}

function FileUploadDropZone() {
  const [added, setAdded] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      <DropZone
        label="Upload engineering documents"
        hint={FILE_UPLOAD_HINT}
        accept={FILE_UPLOAD_ACCEPT}
        onFiles={(files) => setAdded(fileUploadNames(files))}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {added ? `Added ${added}.` : 'Drop files on the zone or browse to try it.'}
      </p>
    </div>
  );
}

function FileUploadDropZoneDragOver() {
  return (
    <DropZone label="Upload engineering documents" hint={FILE_UPLOAD_HINT} accept={FILE_UPLOAD_ACCEPT} dragging onFiles={() => undefined} />
  );
}

function FileUploadDropZoneDisabled() {
  return (
    <DropZone
      label="Upload engineering documents"
      hint={FILE_UPLOAD_HINT}
      disabled
      disabledReason="You have read access to Engineering documents. Ask Liv Wold for write access to upload."
      onFiles={() => undefined}
    />
  );
}

function FileUploadDropZoneCompact() {
  const [added, setAdded] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      <DropZone
        label="Attach files to WO-104482"
        title="Drop files to attach"
        hint="Photos, PDFs and spreadsheets, up to 25 MB each"
        density="compact"
        onFiles={(files) => setAdded(fileUploadNames(files))}
      />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {added ? `Attached ${added}.` : 'One row high, for the top of a list or inside a form.'}
      </p>
    </div>
  );
}

function FileUploadButton() {
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center gap-2">
      <FilePickerButton multiple accept={FILE_UPLOAD_ACCEPT} inputLabel="Choose documents to upload" onFiles={(files) => setPicked(fileUploadNames(files))}>
        <IconUpload /> Upload files
      </FilePickerButton>
      <p className="text-center text-xs text-muted-foreground" aria-live="polite">
        {picked ? `Picked ${picked}.` : 'Opens the file dialog.'}
      </p>
    </div>
  );
}

function FileUploadPickerRow() {
  const [file, setFile] = useState<{ name: string; size: number } | null>({ name: 'Calibration 23-PT-92531.pdf', size: 412_000 });

  return (
    <div className="flex w-full max-w-sm flex-col">
      <Label>Calibration certificate</Label>
      <div className="flex min-w-0 items-center gap-2">
        <FilePickerButton
          size="sm"
          accept=".pdf"
          inputLabel="Choose a calibration certificate"
          onFiles={(files) => setFile({ name: files[0].name, size: files[0].size })}
        >
          {file ? 'Change file' : 'Choose file'}
        </FilePickerButton>
        {file ? (
          <>
            <span className="min-w-0 flex-1 truncate text-sm text-base-foreground" title={file.name}>
              {file.name}
            </span>
            <IconAction label={`Remove ${file.name}`} onClick={() => setFile(null)}>
              <IconX />
            </IconAction>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No file chosen</span>
        )}
      </div>
      <p className="pt-2 text-xs tabular-nums text-muted-foreground">{file ? formatBytes(file.size) : 'PDF, up to 10 MB'}</p>
    </div>
  );
}

function FileUploadPasteHint() {
  const [pasted, setPasted] = useState<string | null>(null);

  return (
    <div
      role="group"
      aria-label="Add a screenshot to the shift log"
      tabIndex={0}
      onPaste={(event) => {
        const files = Array.from(event.clipboardData.files);
        setPasted(files.length > 0 ? fileUploadNames(files) : 'Nothing to attach: the clipboard holds no image or file');
      }}
      className="flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border border-dashed border-emphasized px-4 py-6 text-center outline-none focus-visible:shadow-focus-ring"
    >
      <IconClipboard aria-hidden="true" className="size-5 text-muted-foreground" />
      <p className="text-sm text-base-foreground">
        Paste a screenshot with <Kbd>Ctrl</Kbd> <Kbd>V</Kbd>
      </p>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {pasted ? `${pasted}.` : 'Click here first, then paste.'}
      </p>
    </div>
  );
}

function FileUploadReplaceFile() {
  const [pending, setPending] = useState<{ name: string; size: number } | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <ItemGroup aria-label="Current file">
        <FileRow
          name="P&ID 23-KA-9101 rev C.pdf"
          size={2_400_000}
          owner="Aisha Khan"
          modified="4 Mar"
          trailing={
            <FilePickerButton
              size="sm"
              variant="outline"
              accept=".pdf"
              inputLabel="Choose a replacement for P&ID 23-KA-9101 rev C.pdf"
              onFiles={(files) => setPending({ name: files[0].name, size: files[0].size })}
            >
              <IconReplace /> Replace file
            </FilePickerButton>
          }
        />
      </ItemGroup>
      {pending ? (
        <Alert variant="info">
          <AlertTitle>Replace with {pending.name}?</AlertTitle>
          <AlertDescription>
            The current file becomes revision C and stays in the revision list. The new file is {formatBytes(pending.size)}.
          </AlertDescription>
          <AlertActions>
            <AlertButton onClick={() => setPending(null)}>Upload as revision D</AlertButton>
            <AlertButton variant="ghost" onClick={() => setPending(null)}>
              Keep current file
            </AlertButton>
          </AlertActions>
        </Alert>
      ) : (
        <p className="text-xs text-muted-foreground">Replacing keeps the name, links and history. The old content becomes a revision.</p>
      )}
    </div>
  );
}

function FileUploadIntoDataSet() {
  const [dataSet, setDataSet] = useState<string>('');
  const [added, setAdded] = useState<string | null>(null);
  const target = FILE_UPLOAD_DATA_SETS.find((option) => option.value === dataSet);

  return (
    <div className="flex w-full flex-col gap-4">
      <FormField label="Data set" required helper="Decides who can see the files and which pipelines pick them up.">
        {(control) => (
          <OptionSelect
            {...control}
            options={FILE_UPLOAD_DATA_SETS}
            value={dataSet}
            onValueChange={setDataSet}
            placeholder="Select a data set"
          />
        )}
      </FormField>
      <DropZone
        label="Upload files to a data set"
        title={target ? `Drop files for ${target.label}` : 'Drop files here'}
        hint={FILE_UPLOAD_HINT}
        density="compact"
        disabled={target === undefined}
        disabledReason="Select a data set first."
        onFiles={(files) => setAdded(fileUploadNames(files))}
      />
      {added && target ? (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Added {added} to {target.label}.
        </p>
      ) : null}
    </div>
  );
}

function FileUploadSingleProgress() {
  const [items, dispatch] = useReducer(uploadReducer, [FILE_UPLOAD_BATCH[1]]);
  const file = items[0];
  const summary = summarizeUploads(items);

  return (
    <div className="flex w-full flex-col gap-4">
      <LabelledProgress
        label={summary.settled ? `Uploaded ${file.name}` : `Uploading ${file.name}`}
        value={summary.percent}
        hint={
          <span className="tabular-nums">
            {formatBytes(file.loaded)} of {formatBytes(file.size)}
            {summary.settled ? '' : ' · Keep this tab open until it finishes'}
          </span>
        }
      />
      <FileUploadSimulate disabled={summary.settled} onAdvance={() => dispatch({ type: 'advance', fraction: 0.25 })} />
    </div>
  );
}

function FileUploadQueue() {
  const [items, dispatch] = useReducer(uploadReducer, [...FILE_UPLOAD_BATCH]);
  const summary = summarizeUploads(items);

  return (
    <div className="flex w-full flex-col gap-3">
      <UploadQueue
        label="Uploads"
        items={items}
        onCancel={(id) => dispatch({ type: 'cancel', id })}
        onRetry={(id) => dispatch({ type: 'retry', id })}
        onRemove={(id) => dispatch({ type: 'remove', id })}
      />
      <FileUploadSimulate disabled={summary.settled} onAdvance={() => dispatch({ type: 'advance', fraction: 0.25 })} />
    </div>
  );
}

function FileUploadRowStates() {
  const [items, dispatch] = useReducer(uploadReducer, [...FILE_UPLOAD_SETTLED]);
  const summary = summarizeUploads(items);

  return (
    <div className="flex w-full flex-col gap-3">
      <UploadQueue
        label="Finished uploads"
        items={items}
        onCancel={(id) => dispatch({ type: 'cancel', id })}
        onRetry={(id) => dispatch({ type: 'retry', id })}
        onRemove={(id) => dispatch({ type: 'remove', id })}
      />
      <FileUploadSimulate disabled={summary.settled} onAdvance={() => dispatch({ type: 'advance', fraction: 0.25 })}>
        {items.length < FILE_UPLOAD_SETTLED.length ? (
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'add', files: FILE_UPLOAD_SETTLED })}>
            Restore rows
          </Button>
        ) : null}
      </FileUploadSimulate>
    </div>
  );
}

function FileUploadSummary() {
  const [items, dispatch] = useReducer(uploadReducer, [...FILE_UPLOAD_MIXED]);
  const [open, setOpen] = useState(false);
  const summary = summarizeUploads(items);
  const parts = [
    `${summary.done} of ${summary.total} uploaded`,
    summary.failed > 0 ? `${summary.failed} failed` : null,
    summary.cancelled > 0 ? `${summary.cancelled} cancelled` : null,
  ].filter((part): part is string => part !== null);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <LabelledProgress
            label={summary.settled ? 'Upload finished' : `Uploading ${summary.active} of ${summary.total} files`}
            value={summary.percent}
            hint={
              <span className="tabular-nums">
                {parts.join(' · ')} · {formatBytes(summary.loadedBytes)} of {formatBytes(summary.totalBytes)}
              </span>
            }
          />
        </div>
        <IconAction label={open ? 'Hide files' : 'Show files'} expanded={open} onClick={() => setOpen(!open)}>
          {open ? <IconChevronUp /> : <IconChevronDown />}
        </IconAction>
      </div>
      {open ? (
        <UploadQueue
          label="Files in this upload"
          items={items}
          onCancel={(id) => dispatch({ type: 'cancel', id })}
          onRetry={(id) => dispatch({ type: 'retry', id })}
          onRemove={(id) => dispatch({ type: 'remove', id })}
        />
      ) : null}
      <FileUploadSimulate disabled={summary.settled} onAdvance={() => dispatch({ type: 'advance', fraction: 0.25 })}>
        {summary.failed > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'retry', id: 'scan' })}>
            Retry failed
          </Button>
        ) : null}
      </FileUploadSimulate>
    </div>
  );
}

function FileUploadResumableNotice() {
  const [state, setState] = useState<'paused' | 'resumed'>('paused');

  return (
    <div className="flex w-full flex-col gap-3">
      {state === 'paused' ? (
        <Alert variant="warning">
          <AlertTitle>Upload paused at 62%</AlertTitle>
          <AlertDescription>
            The connection dropped while sending NK-23 compression area layout.dwg. The 11.5 MB already sent is kept for 24 hours.
          </AlertDescription>
          <AlertActions>
            <AlertButton onClick={() => setState('resumed')}>Resume upload</AlertButton>
            <AlertButton variant="ghost">Discard upload</AlertButton>
          </AlertActions>
        </Alert>
      ) : (
        <>
          <LabelledProgress
            label="Uploading NK-23 compression area layout.dwg"
            value={62}
            hint={<span className="tabular-nums">Resumed from 11.5 MB of 18.6 MB</span>}
          />
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setState('paused')}>
            Show paused notice again
          </Button>
        </>
      )}
    </div>
  );
}

function FileUploadBackgroundTray() {
  const [items, dispatch] = useReducer(uploadReducer, [...FILE_UPLOAD_BATCH]);
  const [open, setOpen] = useState(true);
  const summary = summarizeUploads(items);

  return (
    <div className="flex w-full flex-col gap-3">
      <section aria-label="Background uploads" className="flex w-full flex-col overflow-hidden rounded-xl border border-default bg-popover-background">
        <div className="flex items-center gap-2 px-3 py-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-base-foreground tabular-nums" aria-live="polite">
            {summary.settled ? `${summary.done} of ${summary.total} files uploaded` : `Uploading ${summary.active} files · ${summary.percent}%`}
          </p>
          <IconAction label={open ? 'Collapse uploads' : 'Expand uploads'} expanded={open} onClick={() => setOpen(!open)}>
            {open ? <IconChevronDown /> : <IconChevronUp />}
          </IconAction>
        </div>
        {open ? (
          <div className="border-t border-default px-3 py-1">
            <UploadQueue
              label="Background uploads"
              items={items}
              onCancel={(id) => dispatch({ type: 'cancel', id })}
              onRetry={(id) => dispatch({ type: 'retry', id })}
            />
          </div>
        ) : null}
      </section>
      <FileUploadSimulate disabled={summary.settled} onAdvance={() => dispatch({ type: 'advance', fraction: 0.25 })} />
    </div>
  );
}

function FileUploadTypeError() {
  const [file, setFile] = useState<{ name: string; size: number }>({ name: 'historian-backup.bak', size: 3_800_000 });
  const problem = validateFile(file, { extensions: ['csv', 'xlsx'], maxBytes: 50_000_000 });

  return (
    <div className="flex w-full max-w-md flex-col">
      <Label>Datapoints file</Label>
      <div className="flex min-w-0 items-center gap-2">
        <FilePickerButton size="sm" inputLabel="Choose a datapoints file" onFiles={(files) => setFile({ name: files[0].name, size: files[0].size })}>
          Change file
        </FilePickerButton>
        <span className="min-w-0 flex-1 truncate text-sm text-base-foreground" title={file.name}>
          {file.name}
        </span>
      </div>
      <p role={problem ? 'alert' : undefined} className={`pt-2 text-sm ${problem ? 'text-critical-foreground-strong' : 'text-muted-foreground'}`}>
        {problem ? problem.message : `Ready to import · ${formatBytes(file.size)}`}
      </p>
    </div>
  );
}

function FileUploadSizeError() {
  const [rejected, setRejected] = useState<readonly { name: string; size: number; message: string }[]>([
    { name: 'Recompressor datasheet scan.pdf', size: 412_000_000, message: 'This file is 412 MB. The limit is 100 MB.' },
  ]);
  const [accepted, setAccepted] = useState(0);

  return (
    <div className="flex w-full flex-col gap-2">
      <DropZone
        label="Upload engineering documents"
        hint={FILE_UPLOAD_HINT}
        density="compact"
        onFiles={(files) => {
          const problems = files.flatMap((file) => {
            const problem = validateFile(file, FILE_UPLOAD_RULE);
            return problem ? [{ name: file.name, size: file.size, message: problem.message }] : [];
          });
          setRejected(problems);
          setAccepted(files.length - problems.length);
        }}
      />
      {accepted > 0 ? (
        <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {accepted} {accepted === 1 ? 'file' : 'files'} added to the queue.
        </p>
      ) : null}
      {rejected.length > 0 ? (
        <ul aria-label="Files that were not added" className="flex list-none flex-col">
          {rejected.map((file) => (
            <FileUploadRejected key={file.name} name={file.name} size={file.size} message={file.message} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FileUploadLimitsHelper() {
  return (
    <dl className="flex w-full max-w-xs flex-col gap-2 text-sm">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground">File types</dt>
        <dd className="text-right text-base-foreground">PDF, DWG, XLSX, CSV</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground">Largest file</dt>
        <dd className="tabular-nums text-base-foreground">100 MB</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground">Files per upload</dt>
        <dd className="tabular-nums text-base-foreground">50</dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-muted-foreground">Data set quota</dt>
        <dd className="tabular-nums text-base-foreground">38.2 of 50 GB used</dd>
      </div>
    </dl>
  );
}

function FileUploadDuplicate() {
  const [choice, setChoice] = useState('revision');

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-start gap-3">
        <FileTypeIcon kind="pdf" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-medium text-base-foreground">P&ID 23-KA-9101 rev C.pdf is already in Engineering documents</p>
          <p className="text-xs tabular-nums text-muted-foreground">Existing file: 2.4 MB, uploaded 4 Mar by Aisha Khan</p>
        </div>
      </div>
      <RadioGroup value={choice} onValueChange={(value) => setChoice(String(value))} aria-label="What to do with the duplicate">
        <RadioGroupItem>
          <RadioGroupItemControl value="revision" />
          <RadioGroupItemLabel>Add as a new revision</RadioGroupItemLabel>
          <RadioGroupItemDescription>Keeps the links to assets and the earlier content.</RadioGroupItemDescription>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="both" />
          <RadioGroupItemLabel>Keep both files</RadioGroupItemLabel>
          <RadioGroupItemDescription>The new file is saved as P&ID 23-KA-9101 rev C (2).pdf.</RadioGroupItemDescription>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="skip" />
          <RadioGroupItemLabel>Skip this file</RadioGroupItemLabel>
          <RadioGroupItemDescription>The rest of the upload continues.</RadioGroupItemDescription>
        </RadioGroupItem>
      </RadioGroup>
      <div className="flex justify-end gap-2">
        <Button variant="ghost">Cancel upload</Button>
        <Button>{choice === 'skip' ? 'Skip file' : choice === 'both' ? 'Keep both' : 'Add revision'}</Button>
      </div>
    </div>
  );
}

function FileUploadAllDone() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3 text-center">
      <IconCircleCheck aria-hidden="true" className="size-6 text-success-foreground-strong" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">5 files uploaded</p>
        <p className="text-sm tabular-nums text-muted-foreground">63.2 MB added to Engineering documents. Text search is ready in a few minutes.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="secondary" size="sm">
          View files
        </Button>
        <Button variant="ghost" size="sm">
          Upload more
        </Button>
      </div>
    </div>
  );
}

function FileUploadCsvPreview() {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <FileTypeIcon kind="csv" />
        <div className="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
          <p className="truncate text-sm font-medium text-base-foreground">Discharge pressure 12 March.csv</p>
          <p className="text-xs tabular-nums text-muted-foreground">412 kB · 4 columns · 8,640 rows · comma separated, UTF-8</p>
        </div>
        <Badge variant="warning">
          <IconAlertTriangle /> 14 empty values
        </Badge>
      </div>
      <DataTable
        label="First rows of Discharge pressure 12 March.csv"
        density="dense"
        columns={FILE_UPLOAD_CSV_COLUMNS}
        rows={FILE_UPLOAD_CSV_ROWS}
        getRowId={(row) => row.timestamp}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs tabular-nums text-muted-foreground">Showing 5 of 8,640 rows. Rows with an empty value are skipped on import.</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            Choose another file
          </Button>
          <Button size="sm">Import 8,626 rows</Button>
        </div>
      </div>
    </div>
  );
}

function FileUploadAttachments() {
  const [files, setFiles] = useState<readonly { name: string; size: number }[]>([
    { name: 'Drive-end bearing, borescope.jpg', size: 5_100_000 },
    { name: 'Bearing inspection procedure rev 4.pdf', size: 860_000 },
  ]);

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Attachments</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {files.length} {files.length === 1 ? 'file' : 'files'} on WO-104482
        </span>
      </div>
      {files.length > 0 ? (
        <ItemGroup aria-label="Attachments on WO-104482">
          {files.map((file) => (
            <FileRow
              key={file.name}
              name={file.name}
              size={file.size}
              actions={
                <>
                  <IconAction label={`Download ${file.name}`}>
                    <IconDownload />
                  </IconAction>
                  <IconAction label={`Remove ${file.name}`} onClick={() => setFiles(files.filter((other) => other.name !== file.name))}>
                    <IconX />
                  </IconAction>
                </>
              }
            />
          ))}
        </ItemGroup>
      ) : (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      )}
      <DropZone
        label="Attach files to WO-104482"
        title="Drop files to attach"
        hint="Up to 25 MB each"
        density="compact"
        onFiles={(added) => {
          const known = new Set(files.map((file) => file.name));
          setFiles([...files, ...added.filter((file) => !known.has(file.name)).map((file) => ({ name: file.name, size: file.size }))]);
        }}
      />
    </div>
  );
}

function FileUploadDialogBody() {
  const [dataSet, setDataSet] = useState('docs');
  const [items, dispatch] = useReducer(uploadReducer, [...FILE_UPLOAD_BATCH]);
  const [rejected, setRejected] = useState<readonly { name: string; size: number; message: string }[]>([]);
  const summary = summarizeUploads(items);

  return (
    <PanelFrame
      title="Upload documents"
      description="Files are indexed for search and can be linked to assets afterwards."
      onClose={() => undefined}
      closeLabel="Close upload"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {summary.total === 0
              ? 'No files added'
              : `${summary.done} of ${summary.total} uploaded · ${formatBytes(summary.loadedBytes)} of ${formatBytes(summary.totalBytes)}`}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={summary.settled} onClick={() => dispatch({ type: 'advance', fraction: 0.25 })}>
              Send next 25%
            </Button>
            <Button disabled={!summary.settled || summary.total === 0}>Done</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <FormField label="Data set" required>
          {(control) => <OptionSelect {...control} options={FILE_UPLOAD_DATA_SETS} value={dataSet} onValueChange={setDataSet} />}
        </FormField>
        <DropZone
          label="Upload documents"
          hint={FILE_UPLOAD_HINT}
          accept={FILE_UPLOAD_ACCEPT}
          density="compact"
          onFiles={(files) => {
            const valid = files.filter((file) => validateFile(file, FILE_UPLOAD_RULE) === null);
            setRejected(
              files.flatMap((file) => {
                const problem = validateFile(file, FILE_UPLOAD_RULE);
                return problem ? [{ name: file.name, size: file.size, message: problem.message }] : [];
              })
            );
            dispatch({ type: 'add', files: fileUploadItems(valid) });
          }}
        />
        {rejected.length > 0 ? (
          <ul aria-label="Files that were not added" className="flex list-none flex-col">
            {rejected.map((file) => (
              <FileUploadRejected key={file.name} name={file.name} size={file.size} message={file.message} />
            ))}
          </ul>
        ) : null}
        {items.length > 0 ? (
          <UploadQueue
            label="Files to upload"
            items={items}
            onCancel={(id) => dispatch({ type: 'cancel', id })}
            onRetry={(id) => dispatch({ type: 'retry', id })}
            onRemove={(id) => dispatch({ type: 'remove', id })}
          />
        ) : null}
      </div>
    </PanelFrame>
  );
}

export default definePage({
  id: 'file-upload',
  title: 'File upload',
  summary:
    'Getting files into the product: where they are dropped or picked, what is accepted, how each file progresses, and what happens when one fails. Uploads here are simulated; a button stands in for the network.',
  guidance: {
    use: [
      'A button next to every drop zone: drag and drop is a shortcut, never the only way.',
      'Types and size limit stated before the pick, and repeated in the error when a file breaks them.',
      'One row per file with its own progress, cancel and retry, plus a summary for the batch.',
      'Resume from what was sent when the connection drops, and say so.',
    ],
    avoid: [
      'Rejecting a file without naming it and saying which rule it broke.',
      'A spinner with no percentage for uploads that take longer than a few seconds.',
      'Blocking the whole page while files upload; let people keep working.',
      'Silently overwriting a file with the same name.',
    ],
  },
  source,
  sections: [
    {
      id: 'drop-zones',
      title: 'Drop zones',
      description: 'The target for dragged files, in its resting, drag-over, disabled and compact forms.',
      specimens: [
        {
          id: 'FileUploadDropZone',
          title: 'Drop zone',
          note: 'The main way in on a page whose job is uploading; the button does the same for keyboard and touch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/DropZone.tsx', 'patterns/content/FilePickerButton.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileUploadDropZone,
        },
        {
          id: 'FileUploadDropZoneDragOver',
          title: 'Drag over',
          note: 'Shown while files are held over the zone, so people know where a release will land.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/DropZone.tsx'],
          Component: FileUploadDropZoneDragOver,
        },
        {
          id: 'FileUploadDropZoneDisabled',
          title: 'Disabled with reason',
          note: 'When uploading is not allowed: keep the zone in place and say what unblocks it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/DropZone.tsx'],
          Component: FileUploadDropZoneDisabled,
        },
        {
          id: 'FileUploadDropZoneCompact',
          title: 'Compact zone',
          note: 'Above a list or inside a form, where a tall zone would push the content down.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/DropZone.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileUploadDropZoneCompact,
        },
      ],
    },
    {
      id: 'pickers',
      title: 'Buttons and pickers',
      description: 'Smaller entry points for toolbars, form fields and existing files.',
      specimens: [
        {
          id: 'FileUploadButton',
          title: 'Upload button',
          note: 'In a toolbar or page header, where uploading is one action among several.',
          origin: 'custom',
          uses: ['patterns/content/FilePickerButton.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileUploadButton,
        },
        {
          id: 'FileUploadPickerRow',
          title: 'File picker row',
          note: 'A single-file field in a form: the chosen name sits beside the button and can be cleared.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/content/FilePickerButton.tsx', 'patterns/collections/IconAction.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileUploadPickerRow,
        },
        {
          id: 'FileUploadPasteHint',
          title: 'Paste from clipboard',
          note: 'For screenshots in logs and comments; say the shortcut where the paste will land.',
          origin: 'custom',
          uses: ['patterns/content/formatBytes.ts'],
          Component: FileUploadPasteHint,
        },
        {
          id: 'FileUploadReplaceFile',
          title: 'Replace file',
          note: 'Updating a document in place: confirm what happens to the current content before sending.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx', 'patterns/content/FilePickerButton.tsx', 'patterns/content/formatBytes.ts'],
          Component: FileUploadReplaceFile,
        },
        {
          id: 'FileUploadIntoDataSet',
          title: 'Upload into a data set',
          note: 'When the destination decides access: pick the target first, then the zone opens.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/DropZone.tsx', 'patterns/data-entry/OptionSelect.tsx', 'forms/FormField.tsx'],
          Component: FileUploadIntoDataSet,
        },
      ],
    },
    {
      id: 'progress',
      title: 'Progress',
      description: 'One file, a queue, and the states a row ends in. Press the button to move the simulated upload.',
      specimens: [
        {
          id: 'FileUploadSingleProgress',
          title: 'Single file progress',
          note: 'One large file: the bar says what is uploading, how far it is and what the person must not do.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx', 'patterns/content/uploadReducer.ts', 'patterns/content/formatBytes.ts'],
          Component: FileUploadSingleProgress,
        },
        {
          id: 'FileUploadQueue',
          title: 'Upload queue',
          note: 'Several files at once: each row has its own bar and can be cancelled without stopping the rest.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/UploadQueue.tsx', 'patterns/content/uploadReducer.ts'],
          Component: FileUploadQueue,
        },
        {
          id: 'FileUploadRowStates',
          title: 'Completed, failed and cancelled rows',
          note: 'How a row ends: uploaded, failed with the reason and a retry, or cancelled with a way back.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/UploadQueue.tsx', 'patterns/content/uploadReducer.ts'],
          Component: FileUploadRowStates,
        },
        {
          id: 'FileUploadSummary',
          title: 'Multi-file summary',
          note: 'Large batches: one bar and one line of counts, with the per-file list behind a toggle.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx', 'patterns/content/UploadQueue.tsx', 'patterns/content/uploadReducer.ts'],
          Component: FileUploadSummary,
        },
        {
          id: 'FileUploadResumableNotice',
          title: 'Resumable upload notice',
          note: 'After a dropped connection: say what was kept and for how long, and resume from there.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: FileUploadResumableNotice,
        },
        {
          id: 'FileUploadBackgroundTray',
          title: 'Background upload tray',
          note: 'Uploads that continue while people work elsewhere: a collapsible tray in a corner of the app.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/UploadQueue.tsx', 'patterns/content/uploadReducer.ts', 'patterns/collections/IconAction.tsx'],
          Component: FileUploadBackgroundTray,
        },
      ],
    },
    {
      id: 'validation',
      title: 'Validation and limits',
      description: 'Rules are stated up front and checked before anything is sent.',
      specimens: [
        {
          id: 'FileUploadTypeError',
          title: 'Unsupported type',
          note: 'A single-file field: the error replaces the helper and lists the types that work.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/validateFile.ts', 'patterns/content/FilePickerButton.tsx'],
          Component: FileUploadTypeError,
        },
        {
          id: 'FileUploadSizeError',
          title: 'File too large',
          note: 'A multi-file drop: valid files go on, each rejected file is listed with its size and the limit.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/validateFile.ts', 'patterns/content/DropZone.tsx', 'patterns/content/FileTypeIcon.tsx'],
          Component: FileUploadSizeError,
        },
        {
          id: 'FileUploadLimitsHelper',
          title: 'Upload limits',
          note: 'Beside the zone or behind a help link, when the one-line hint cannot hold every rule.',
          origin: 'custom',
          align: 'stretch',
          Component: FileUploadLimitsHelper,
        },
        {
          id: 'FileUploadDuplicate',
          title: 'Duplicate file',
          note: 'A file with the same name exists: ask once, with the safe choice selected.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/content/FileTypeIcon.tsx'],
          Component: FileUploadDuplicate,
        },
      ],
    },
    {
      id: 'results',
      title: 'After upload and full flows',
      description: 'What people see when the files are in, and the pieces assembled.',
      specimens: [
        {
          id: 'FileUploadAllDone',
          title: 'Upload complete',
          note: 'The end of a batch: what was added, where, and the two likely next steps.',
          origin: 'custom',
          align: 'stretch',
          Component: FileUploadAllDone,
        },
        {
          id: 'FileUploadCsvPreview',
          title: 'CSV preview after upload',
          note: 'Before importing tabular data: show how the file was read and what will be skipped.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx', 'patterns/content/FileTypeIcon.tsx'],
          Component: FileUploadCsvPreview,
        },
        {
          id: 'FileUploadAttachments',
          title: 'Attachments on a record',
          note: 'Files that belong to a work order or an asset: the list first, a compact zone under it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileRow.tsx', 'patterns/content/DropZone.tsx', 'patterns/collections/IconAction.tsx'],
          Component: FileUploadAttachments,
        },
        {
          id: 'FileUploadDialogBody',
          title: 'Upload dialog',
          note: 'The whole flow in a dialog: target, zone, validation, queue and a footer that tracks the batch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: [
            'patterns/data-entry/PanelFrame.tsx',
            'patterns/content/DropZone.tsx',
            'patterns/content/UploadQueue.tsx',
            'patterns/content/uploadReducer.ts',
            'patterns/content/validateFile.ts',
          ],
          Component: FileUploadDialogBody,
        },
      ],
    },
  ],
});
