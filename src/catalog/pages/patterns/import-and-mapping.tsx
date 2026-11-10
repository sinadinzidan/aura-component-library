import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { IconAlertTriangle, IconCheck, IconCircleCheck, IconDownload, IconMinus, IconWand } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { DataTable } from '../../../library/patterns/collections/DataTable';
import type { DataTableColumn } from '../../../library/patterns/collections/DataTable';
import { DropZone } from '../../../library/patterns/content/DropZone';
import { FileTypeIcon } from '../../../library/patterns/content/FileTypeIcon';
import { EditableCell } from '../../../library/patterns/data-entry/EditableCell';
import { FormSection } from '../../../library/patterns/data-entry/FormSection';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { Stepper } from '../../../library/patterns/data-entry/Stepper';
import type { StepperStep } from '../../../library/patterns/data-entry/Stepper';
import { WizardFrame } from '../../../library/patterns/data-entry/WizardFrame';
import { missingRequiredFields, suggestMapping } from '../../../library/patterns/workflows/columnMapping';
import type { TargetField } from '../../../library/patterns/workflows/columnMapping';
import { MappingTable } from '../../../library/patterns/workflows/MappingTable';
import type { SourceColumn } from '../../../library/patterns/workflows/MappingTable';
import { ValidationSummaryCard } from '../../../library/patterns/workflows/ValidationSummaryCard';
import { SENSORS } from '../../data/plant';
import { definePage } from '../../types';

import source from './import-and-mapping.tsx?raw';

const NUMBER = new Intl.NumberFormat('en-US');

/** The file being imported throughout the page: the instrument tag list for Nordkapp. */
const FILE = { name: 'nordkapp-tags.csv', size: '412 kB', rows: 1284, columns: 7, uploadedAt: '12 Mar, 13:52', uploadedBy: 'Magnus Solberg' };

const IMPORT_STEPS: readonly StepperStep[] = [
  { id: 'upload', label: 'Upload', description: 'Choose the file.' },
  { id: 'map', label: 'Map', description: 'Match columns to fields.' },
  { id: 'validate', label: 'Validate', description: 'Check every row.' },
  { id: 'import', label: 'Import', description: 'Write the tags.' },
];

const TAG_FIELDS: readonly TargetField[] = [
  { id: 'tag', label: 'Tag', required: true, aliases: ['tag no', 'tag number'] },
  { id: 'description', label: 'Description', required: true },
  { id: 'unit', label: 'Unit', aliases: ['uom'] },
  { id: 'lowLimit', label: 'Low limit', aliases: ['lo lim'] },
  { id: 'highLimit', label: 'High limit', aliases: ['hi lim'] },
  { id: 'area', label: 'Area' },
  { id: 'notes', label: 'Notes' },
];

const TAG_COLUMNS: readonly SourceColumn[] = [
  { name: 'TAG_NO', samples: SENSORS.slice(0, 3).map((sensor) => sensor.tag) },
  { name: 'Text', samples: SENSORS.slice(0, 3).map((sensor) => sensor.name) },
  { name: 'Unit', samples: ['barg', 'barg', '°C'] },
  { name: 'LO_LIM', samples: SENSORS.slice(0, 3).map((sensor) => String(sensor.lowLimit)) },
  { name: 'HI_LIM', samples: SENSORS.slice(0, 3).map((sensor) => String(sensor.highLimit)) },
  { name: 'AREA', samples: ['NK-23', 'NK-23', 'NK-23'] },
  { name: 'Comment', samples: ['', 'Recalibrated 2025', ''] },
];

const TAG_SUGGESTED = suggestMapping(
  TAG_COLUMNS.map((column) => column.name),
  TAG_FIELDS
);

const COUNTS = { valid: 1246, warnings: 26, errors: 12 };

const formatLimit = (value: number, decimals: number): string =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

const TH = 'px-3 py-2 text-left text-xs font-medium text-muted-foreground';
const TD = 'px-3 py-2 align-middle';

function ImportMappingStepper() {
  const [current, setCurrent] = useState(1);
  return (
    <div className="flex w-full flex-col gap-4">
      <Stepper steps={IMPORT_STEPS} current={current} label="Import tags" onStepSelect={setCurrent} />
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-muted-foreground">
          Step {current + 1} of {IMPORT_STEPS.length}: {IMPORT_STEPS[current].description} Completed steps are links back.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
            Back
          </Button>
          <Button size="sm" disabled={current === IMPORT_STEPS.length - 1} onClick={() => setCurrent(current + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImportMappingFileSummary() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-center gap-3">
        <FileTypeIcon kind="csv" size="lg" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-mono text-sm text-base-foreground">{FILE.name}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {FILE.size} · uploaded {FILE.uploadedAt}
          </span>
        </div>
        <Button variant="ghost" size="sm">
          Replace file
        </Button>
      </div>
      <MetadataList
        items={[
          { label: 'Rows', value: <span className="tabular-nums">{NUMBER.format(FILE.rows)}</span> },
          { label: 'Columns', value: <span className="tabular-nums">{FILE.columns}</span> },
          { label: 'Header row', value: 'Row 1' },
          { label: 'Delimiter', value: 'Semicolon, detected' },
          { label: 'Encoding', value: 'UTF-8' },
        ]}
      />
    </div>
  );
}

function ImportMappingDropZone() {
  const [name, setName] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <DropZone
        label="Upload a tag list"
        title="Drop a tag list here"
        hint="CSV or Excel, up to 50 MB. The first row holds the column names."
        accept=".csv,.xlsx"
        onFiles={(files) => setName(files[0]?.name ?? null)}
      />
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {name ? `Selected ${name}. Nothing is imported until the last step.` : 'Nothing is imported until the last step.'}
      </p>
    </div>
  );
}

const DELIMITERS = [
  { value: 'semicolon', label: 'Semicolon ( ; )' },
  { value: 'comma', label: 'Comma ( , )' },
  { value: 'tab', label: 'Tab' },
];

const DECIMALS = [
  { value: 'point', label: 'Point (52.0)' },
  { value: 'comma', label: 'Comma (52,0)' },
];

function ImportMappingFileSettings() {
  const [header, setHeader] = useState(true);
  return (
    <div className="w-full max-w-md">
      <FormSection title="How to read the file" description="Detected from the first 100 rows. Change them if the preview looks wrong.">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Delimiter">{(control) => <OptionSelect {...control} options={DELIMITERS} defaultValue="semicolon" />}</FormField>
          <FormField label="Decimal separator">{(control) => <OptionSelect {...control} options={DECIMALS} defaultValue="point" />}</FormField>
        </div>
        <SettingSwitchRow
          label="First row holds column names"
          description={header ? 'Row 1 is used as headers. 1,284 data rows.' : 'Columns are named A to G. 1,285 data rows.'}
          checked={header}
          onCheckedChange={setHeader}
        />
      </FormSection>
    </div>
  );
}

function ImportMappingTemplates() {
  const [template, setTemplate] = useState('tags');
  const [applied, setApplied] = useState<string | null>(null);
  const labels: Record<string, string> = { tags: 'Nordkapp tag list', sap: 'SAP functional locations', none: 'no template' };
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ChoiceCardGroup
        label="Saved mapping templates"
        value={template}
        onValueChange={setTemplate}
        options={[
          { value: 'tags', label: 'Nordkapp tag list', description: '7 columns · last used 3 Mar by Magnus Solberg', tag: 'Matches this file' },
          { value: 'sap', label: 'SAP functional locations', description: '12 columns · last used 14 Jan' },
          { value: 'none', label: 'Start without a template', description: 'Columns are matched by name, then you review them.' },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {applied ? `Applied ${labels[applied]}.` : 'A template fills in the mapping. You can still change every column.'}
        </p>
        <Button size="sm" variant="secondary" onClick={() => setApplied(template)}>
          Apply template
        </Button>
      </div>
    </div>
  );
}

function ImportMappingTable() {
  const [mapping, setMapping] = useState(TAG_SUGGESTED);
  return (
    <MappingTable
      label={`Column mapping for ${FILE.name}`}
      columns={TAG_COLUMNS}
      fields={TAG_FIELDS}
      mapping={mapping}
      suggested={TAG_SUGGESTED}
      onChange={(column, fieldId) => setMapping({ ...mapping, [column]: fieldId })}
    />
  );
}

function ImportMappingRequiredError() {
  const columns = TAG_COLUMNS.slice(1, 4);
  const [mapping, setMapping] = useState<Record<string, string | null>>({ Text: null, Unit: 'unit', LO_LIM: 'lowLimit' });
  return (
    <MappingTable
      label="Mapping with a required field missing"
      columns={columns}
      fields={TAG_FIELDS.filter((field) => field.id !== 'tag')}
      mapping={mapping}
      suggested={{ Text: null, Unit: 'unit', LO_LIM: 'lowLimit' }}
      onChange={(column, fieldId) => setMapping({ ...mapping, [column]: fieldId })}
    />
  );
}

function ImportMappingMatchStates() {
  const states = [
    { id: 'auto', Icon: IconWand, label: 'Auto-mapped', text: 'The header matched a field or one of its aliases.', tone: 'text-muted-foreground' },
    { id: 'manual', Icon: IconCheck, label: 'Mapped by you', text: 'You picked the field.', tone: 'text-muted-foreground' },
    { id: 'attention', Icon: IconAlertTriangle, label: 'Needs attention', text: 'No match, and a required field is still missing.', tone: 'text-warning-foreground-strong' },
    { id: 'skipped', Icon: IconMinus, label: 'Not imported', text: 'Left out on purpose.', tone: 'text-muted-foreground' },
  ];
  return (
    <dl className="flex w-full max-w-xs flex-col gap-3">
      {states.map(({ id, Icon, label, text, tone }) => (
        <div key={id} className="flex flex-col gap-0.5">
          <dt className={`flex items-center gap-1.5 text-xs font-medium ${tone}`}>
            <Icon aria-hidden="true" className="size-3.5 shrink-0" />
            {label}
          </dt>
          <dd className="text-xs text-muted-foreground">{text}</dd>
        </div>
      ))}
    </dl>
  );
}

function ImportMappingPreview() {
  const rows = SENSORS.slice(0, 5);
  const headers = [
    { field: 'Tag', column: 'TAG_NO' },
    { field: 'Description', column: 'Text' },
    { field: 'Unit', column: 'Unit' },
    { field: 'Low limit', column: 'LO_LIM' },
    { field: 'High limit', column: 'HI_LIM' },
  ];
  return (
    <div className="flex w-full flex-col gap-2">
      <table aria-label={`First rows of ${FILE.name}`} className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-default">
            <th scope="col" className={`${TH} w-10 text-right`}>
              Row
            </th>
            {headers.map((header, index) => (
              <th key={header.field} scope="col" className={`${TH} ${index > 2 ? 'text-right' : ''}`}>
                <span className="block text-base-foreground">{header.field}</span>
                <span className="block font-mono font-normal">{header.column}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((sensor, index) => (
            <tr key={sensor.id} className="border-b border-default">
              <td className={`${TD} text-right text-xs tabular-nums text-muted-foreground`}>{index + 2}</td>
              <td className={`${TD} font-mono text-xs text-base-foreground`}>{sensor.tag}</td>
              <td className={`${TD} text-base-foreground`}>{sensor.name}</td>
              <td className={`${TD} text-muted-foreground`}>{sensor.unit}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatLimit(sensor.lowLimit, sensor.decimals)}</td>
              <td className={`${TD} text-right tabular-nums text-base-foreground`}>{formatLimit(sensor.highLimit, sensor.decimals)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs tabular-nums text-muted-foreground">Showing rows 2–6 of {NUMBER.format(FILE.rows + 1)}. Field names on top, the file's own headers under them.</p>
    </div>
  );
}

function ImportMappingColumnInspector() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <span className="font-mono text-sm text-base-foreground">HI_LIM</span>
        <span className="text-xs text-muted-foreground">Maps to High limit · read as a number</span>
      </div>
      <MetadataList
        items={[
          { label: 'Filled', value: <span className="tabular-nums">1,271 of 1,284</span> },
          { label: 'Distinct', value: <span className="tabular-nums">214</span> },
          { label: 'Range', value: <span className="tabular-nums">0.5 – 210,000</span> },
          { label: 'Not a number', value: <span className="tabular-nums">3</span> },
        ]}
      />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Sample values</span>
        <ul className="flex flex-wrap gap-1.5">
          {['52', '15', '145', '7.1', '10500', '5O.0'].map((value) => (
            <li key={value} className="rounded-md bg-medium-background px-1.5 py-0.5 font-mono text-xs text-base-foreground">
              {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ImportMappingValidationSummary() {
  return (
    <ValidationSummaryCard
      title={`Validation of ${FILE.name}`}
      counts={COUNTS}
      actions={
        <Button variant="secondary" size="sm">
          Review errors
        </Button>
      }
    />
  );
}

function ImportMappingValidationClean() {
  return <ValidationSummaryCard title="Validation of cooling-water-tags.csv" counts={{ valid: 212, warnings: 0, errors: 0 }} actions={<Button size="sm">Continue to import</Button>} />;
}

type ErrorRow = { id: string; row: number; tag: string; field: string; value: string; reason: string; check: (value: string) => string | null };

const TAG_PATTERN = /^\d{2}-[A-Z]{2}-\d{5}$/;

const ERROR_ROWS: readonly ErrorRow[] = [
  {
    id: 'r14',
    row: 14,
    tag: '23-PT-9253',
    field: 'Tag',
    value: '23-PT-9253',
    reason: 'Tag does not match NN-AA-NNNNN',
    check: (value) => (TAG_PATTERN.test(value) ? null : 'Use the form 23-PT-92531.'),
  },
  {
    id: 'r208',
    row: 208,
    tag: '27-IT-20013',
    field: 'High limit',
    value: '9S.0',
    reason: 'Not a number',
    check: (value) => (value !== '' && Number.isFinite(Number(value)) ? null : 'Enter a number, such as 95.0.'),
  },
  {
    id: 'r377',
    row: 377,
    tag: '40-TT-40015',
    field: 'Unit',
    value: '',
    reason: 'Unit is required for analog tags',
    check: (value) => (value === '' ? 'Enter a unit, such as °C.' : null),
  },
  {
    id: 'r902',
    row: 902,
    tag: '20-PT-10010',
    field: 'Low limit',
    value: '110',
    reason: 'Low limit is above the high limit (15.0)',
    check: (value) => (value !== '' && Number(value) < 15 ? null : 'Enter a number below 15.0.'),
  },
];

function ImportMappingErrorRows() {
  const [values, setValues] = useState<Readonly<Record<string, string>>>({});
  const fixed = ERROR_ROWS.filter((row) => values[row.id] !== undefined).length;
  return (
    <div className="flex w-full flex-col gap-2">
      <table aria-label="Rows with errors" className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-default">
            <th scope="col" className={`${TH} w-14 text-right`}>
              Row
            </th>
            <th scope="col" className={TH}>
              Tag
            </th>
            <th scope="col" className={TH}>
              Field
            </th>
            <th scope="col" className={`${TH} w-48`}>
              Value
            </th>
            <th scope="col" className={TH}>
              Problem
            </th>
          </tr>
        </thead>
        <tbody>
          {ERROR_ROWS.map((row) => {
            const isFixed = values[row.id] !== undefined;
            return (
              <tr key={row.id} data-fixed={isFixed ? 'true' : undefined} className="border-b border-default">
                <td className={`${TD} text-right text-xs tabular-nums text-muted-foreground`}>{row.row}</td>
                <td className={`${TD} font-mono text-xs text-base-foreground`}>{row.tag}</td>
                <td className={`${TD} text-muted-foreground`}>{row.field}</td>
                <td className="px-1 py-1 align-middle">
                  <EditableCell
                    label={`${row.field} in row ${row.row}`}
                    value={values[row.id] ?? row.value}
                    display={(values[row.id] ?? row.value) === '' ? <span className="text-muted-foreground">Empty</span> : undefined}
                    affordance="always"
                    validate={row.check}
                    onSave={(value) => setValues({ ...values, [row.id]: value })}
                  />
                </td>
                <td className={TD}>
                  {isFixed ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-success-foreground-strong">
                      <IconCircleCheck aria-hidden="true" className="size-3.5 shrink-0" />
                      Fixed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-critical-foreground-strong">
                      <IconAlertTriangle aria-hidden="true" className="size-3.5 shrink-0" />
                      {row.reason}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
          Showing 4 of 12 rows with errors · {fixed} fixed here. Edit a value to fix it in place; the file itself is not changed.
        </p>
        <Button variant="ghost" size="sm">
          <IconDownload aria-hidden="true" /> Download all 12 rows
        </Button>
      </div>
    </div>
  );
}

function ImportMappingIssuesByReason() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium text-base-foreground">Warnings by reason</h3>
        <p className="text-xs text-muted-foreground">26 rows will be imported with a warning.</p>
      </div>
      <BreakdownList
        label="Warnings by reason"
        items={[
          { id: 'area', label: 'Area not found, tag stays unlinked', value: 14 },
          { id: 'limits', label: 'No alarm limits given', value: 7 },
          { id: 'desc', label: 'Description longer than 64 characters, cut', value: 3 },
          { id: 'unit', label: 'Unit spelled differently from the catalogue', value: 2 },
        ]}
      />
    </div>
  );
}

function ImportMappingDuplicates() {
  const [choice, setChoice] = useState('skip');
  const effect: Record<string, string> = {
    skip: '38 existing tags stay as they are. 1,246 new tags are created.',
    replace: '38 existing tags are overwritten with the values in the file, empty cells included.',
    merge: '38 existing tags get the filled cells of the file. Empty cells leave the current value alone.',
  };
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <ChoiceCardGroup
        label="38 tags in the file already exist"
        value={choice}
        onValueChange={setChoice}
        options={[
          { value: 'skip', label: 'Skip', description: 'Keep the existing tags.', tag: 'Safest' },
          { value: 'replace', label: 'Replace', description: 'The file wins on every field.' },
          { value: 'merge', label: 'Merge', description: 'The file wins where it has a value.' },
        ]}
      />
      <p aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
        {effect[choice]}
      </p>
    </div>
  );
}

function ImportMappingDryRun() {
  const [dryRun, setDryRun] = useState(true);
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <SettingSwitchRow
        label="Dry run"
        description="Runs the whole import and reports the result, without writing anything."
        checked={dryRun}
        onCheckedChange={setDryRun}
      />
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-xs text-muted-foreground">
          {dryRun ? 'Nothing will be written to Nordkapp.' : 'Tags will be written to the Nordkapp project.'}
        </p>
        <Button size="sm">{dryRun ? 'Start dry run' : 'Import 1,272 tags'}</Button>
      </div>
    </div>
  );
}

function ImportMappingReviewStep() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-base font-semibold text-base-foreground">Ready to import</h3>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{FILE.name}</span> into data set Compressor telemetry.
        </p>
      </div>
      <MetadataList
        items={[
          { label: 'Create', value: <span className="tabular-nums">1,234 tags</span> },
          { label: 'Update', value: <span className="tabular-nums">38 tags, merged</span> },
          { label: 'Skip', value: <span className="tabular-nums">12 rows with errors</span> },
          { label: 'Columns', value: '6 of 7 mapped' },
          { label: 'Can be undone', value: 'For 24 hours' },
        ]}
      />
      <div className="flex justify-end gap-2">
        <Button variant="secondary">Back</Button>
        <Button>Import 1,272 tags</Button>
      </div>
    </div>
  );
}

const IMPORT_TOTAL = 1272;
const IMPORT_BATCH = 106;

function ImportMappingProgress() {
  const [done, setDone] = useState(424);
  const [running, setRunning] = useState(false);
  const finished = done >= IMPORT_TOTAL;

  useEffect(() => {
    if (!running || finished) return undefined;
    const timer = window.setInterval(() => setDone((current) => Math.min(IMPORT_TOTAL, current + IMPORT_BATCH)), 500);
    return () => window.clearInterval(timer);
  }, [running, finished]);

  const created = Math.round(done * 0.97);
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <LabelledProgress
        label={finished ? 'Import finished' : running ? 'Importing tags' : 'Import paused'}
        value={done}
        max={IMPORT_TOTAL}
        valueText={`${NUMBER.format(done)} of ${NUMBER.format(IMPORT_TOTAL)} rows`}
        hint={finished ? 'All rows are written.' : `Batch ${Math.floor(done / IMPORT_BATCH) + 1} of ${IMPORT_TOTAL / IMPORT_BATCH}. You can leave this page; the import continues.`}
      />
      <dl className="grid grid-cols-3 gap-4">
        {[
          { label: 'Created', value: created },
          { label: 'Updated', value: done - created },
          { label: 'Failed', value: 0 },
        ].map((item) => (
          <div key={item.label} className="flex flex-col">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-base font-semibold tabular-nums text-base-foreground">{NUMBER.format(item.value)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        {finished ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setDone(424);
              setRunning(false);
            }}
          >
            Reset demo
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setRunning(!running)}>
            {running ? 'Pause import' : 'Resume import'}
          </Button>
        )}
      </div>
    </div>
  );
}

function ImportMappingResult() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-background text-success-foreground">
          <IconCheck aria-hidden="true" className="size-4" />
        </span>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-base-foreground">Imported 1,272 of 1,284 rows</h3>
          <p className="text-sm text-muted-foreground">Finished 12 Mar, 14:06, in 1 min 48 s. 12 rows had errors and were left out.</p>
        </div>
      </div>
      <MetadataList
        items={[
          { label: 'Created', value: <span className="tabular-nums">1,234</span> },
          { label: 'Updated', value: <span className="tabular-nums">38</span> },
          { label: 'Left out', value: <span className="tabular-nums">12</span> },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm">
          <IconDownload aria-hidden="true" /> Download error rows
        </Button>
        <Button size="sm">View imported tags</Button>
      </div>
    </div>
  );
}

function ImportMappingRollback() {
  const [rolledBack, setRolledBack] = useState(false);
  return (
    <div className="w-full max-w-md">
      {rolledBack ? (
        <Alert variant="default">
          <AlertTitle>Import rolled back</AlertTitle>
          <AlertDescription>1,234 tags were removed and 38 tags restored to their earlier values. The file is kept for another try.</AlertDescription>
          <AlertActions>
            <AlertButton variant="ghost" onClick={() => setRolledBack(false)}>
              Show the notice again
            </AlertButton>
          </AlertActions>
        </Alert>
      ) : (
        <Alert variant="info">
          <AlertTitle>You can roll this import back until 13 Mar, 14:06</AlertTitle>
          <AlertDescription>Rolling back removes the 1,234 tags it created and restores the 38 it updated. Data written to the new tags since is lost.</AlertDescription>
          <AlertActions>
            <AlertButton onClick={() => setRolledBack(true)}>Roll back import</AlertButton>
          </AlertActions>
        </Alert>
      )}
    </div>
  );
}

type ImportRun = { id: string; file: string; when: string; by: string; rows: number; outcome: 'completed' | 'partial' | 'rolled-back' | 'failed' };

const RUNS: readonly ImportRun[] = [
  { id: 'IMP-0418', file: 'nordkapp-tags.csv', when: '12 Mar, 14:06', by: 'Magnus Solberg', rows: 1284, outcome: 'partial' },
  { id: 'IMP-0412', file: 'cooling-water-tags.csv', when: '10 Mar, 15:40', by: 'Magnus Solberg', rows: 212, outcome: 'completed' },
  { id: 'IMP-0409', file: 'export-pumps.xlsx', when: '6 Mar, 09:12', by: 'Jonas Nyberg', rows: 64, outcome: 'rolled-back' },
  { id: 'IMP-0401', file: 'valhall-tags.csv', when: '2 Mar, 11:30', by: 'Aisha Khan', rows: 3902, outcome: 'failed' },
];

const OUTCOME = {
  completed: { label: 'Completed', variant: 'success' },
  partial: { label: '12 rows left out', variant: 'warning' },
  'rolled-back': { label: 'Rolled back', variant: 'archived' },
  failed: { label: 'Failed', variant: 'error' },
} as const;

const RUN_COLUMNS: readonly DataTableColumn<ImportRun>[] = [
  { id: 'id', header: 'Import', cell: (run) => <span className="whitespace-nowrap font-mono text-xs">{run.id}</span> },
  { id: 'file', header: 'File', cell: (run) => <span className="font-mono text-xs">{run.file}</span>, sortValue: (run) => run.file },
  { id: 'by', header: 'By', cell: (run) => <span className="whitespace-nowrap">{run.by}</span>, sortValue: (run) => run.by },
  { id: 'when', header: 'Finished', cell: (run) => <span className="whitespace-nowrap tabular-nums">{run.when}</span> },
  { id: 'rows', header: 'Rows', align: 'end', cell: (run) => NUMBER.format(run.rows), sortValue: (run) => run.rows },
  { id: 'outcome', header: 'Outcome', cell: (run) => <Badge variant={OUTCOME[run.outcome].variant}>{OUTCOME[run.outcome].label}</Badge> },
];

function ImportMappingHistory() {
  return <DataTable label="Recent imports" columns={RUN_COLUMNS} rows={RUNS} getRowId={(run) => run.id} density="dense" />;
}

function ImportMappingWizard() {
  const [current, setCurrent] = useState(1);
  const [mapping, setMapping] = useState(TAG_SUGGESTED);
  const [skipErrors, setSkipErrors] = useState(false);
  const [imported, setImported] = useState(false);
  const missing = missingRequiredFields(mapping, TAG_FIELDS);
  const blocked =
    current === 1 && missing.length > 0
      ? `Map ${missing.map((field) => field.label).join(', ')} to continue.`
      : current === 2 && !skipErrors
        ? 'Fix the 12 rows with errors, or choose to leave them out.'
        : undefined;
  return (
    <WizardFrame
      title="Import tags"
      steps={IMPORT_STEPS}
      current={current}
      finishLabel={imported ? 'Import another file' : 'Import 1,272 tags'}
      blockedReason={blocked}
      onBack={() => {
        setImported(false);
        setCurrent(current - 1);
      }}
      onNext={() => setCurrent(current + 1)}
      onFinish={() => {
        if (imported) {
          setImported(false);
          setMapping(TAG_SUGGESTED);
          setSkipErrors(false);
          setCurrent(0);
        } else {
          setImported(true);
        }
      }}
    >
      <div className="min-h-72">
        {current === 0 ? (
          <div className="flex max-w-md items-center gap-3 rounded-xl border border-default p-4">
            <FileTypeIcon kind="csv" size="lg" />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-mono text-sm text-base-foreground">{FILE.name}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {FILE.size} · {NUMBER.format(FILE.rows)} rows · {FILE.columns} columns
              </span>
            </div>
            <Button variant="ghost" size="sm">
              Replace file
            </Button>
          </div>
        ) : null}
        {current === 1 ? (
          <MappingTable
            label={`Column mapping for ${FILE.name}`}
            columns={TAG_COLUMNS}
            fields={TAG_FIELDS}
            mapping={mapping}
            suggested={TAG_SUGGESTED}
            onChange={(column, fieldId) => setMapping({ ...mapping, [column]: fieldId })}
          />
        ) : null}
        {current === 2 ? (
          <div className="flex max-w-xl flex-col gap-2">
            <ValidationSummaryCard title={`Validation of ${FILE.name}`} counts={COUNTS} />
            <SettingSwitchRow
              label="Leave out rows with errors"
              description="Import the 1,272 rows that passed. The 12 others are listed in a report."
              checked={skipErrors}
              onCheckedChange={setSkipErrors}
            />
          </div>
        ) : null}
        {current === 3 ? (
          imported ? (
            <div className="flex max-w-md items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-background text-success-foreground">
                <IconCheck aria-hidden="true" className="size-4" />
              </span>
              <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-semibold text-base-foreground">Imported 1,272 of 1,284 rows</h3>
                <p className="text-sm text-muted-foreground">12 rows had errors and were left out. You can roll the import back for 24 hours.</p>
              </div>
            </div>
          ) : (
            <div className="max-w-md">
              <MetadataList
                items={[
                  { label: 'File', value: <span className="font-mono">{FILE.name}</span> },
                  { label: 'Data set', value: 'Compressor telemetry' },
                  { label: 'Columns mapped', value: `${Object.values(mapping).filter((fieldId) => fieldId !== null).length} of ${TAG_COLUMNS.length}` },
                  { label: 'Rows to import', value: <span className="tabular-nums">1,272</span> },
                  { label: 'Rows left out', value: <span className="tabular-nums">12</span> },
                ]}
              />
            </div>
          )
        ) : null}
      </div>
    </WizardFrame>
  );
}

export default definePage({
  id: 'import-and-mapping',
  title: 'Import and mapping',
  summary:
    'Bringing a file into the system in four steps: upload, map its columns to fields, validate every row, then import. Each step says what will happen before it happens.',
  guidance: {
    use: [
      'Match columns automatically, then show which matches were guessed and which need a decision.',
      'Sample values beside every column, so a match can be checked without opening the file.',
      'Counts of ready, warning and error rows before anything is written.',
      'A way back: a dry run before, a rollback window after, and the error rows as a download.',
    ],
    avoid: [
      'Importing straight from the upload. People need to see the mapping first.',
      'Blocking the whole import on a few bad rows; let them be fixed in place or left out.',
      'An error count without the rows and the reason for each.',
      'Silently overwriting records that already exist. Ask: skip, replace or merge.',
    ],
  },
  source,
  sections: [
    {
      id: 'upload',
      title: 'Upload',
      description: 'The steps of an import, and getting the file in.',
      specimens: [
        {
          id: 'ImportMappingStepper',
          title: 'Import stepper',
          note: 'Every import follows the same four steps; completed steps are links back.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/data-entry/Stepper.tsx'],
          Component: ImportMappingStepper,
        },
        {
          id: 'ImportMappingDropZone',
          title: 'Upload zone',
          note: 'The first step: accepted formats and the promise that nothing is written yet.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/DropZone.tsx'],
          Component: ImportMappingDropZone,
        },
        {
          id: 'ImportMappingFileSummary',
          title: 'File summary card',
          note: 'After upload: what was read from the file, so a wrong delimiter or header row is caught early.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/content/FileTypeIcon.tsx', 'display/MetadataList.tsx'],
          Component: ImportMappingFileSummary,
        },
        {
          id: 'ImportMappingFileSettings',
          title: 'File settings',
          note: 'When detection gets it wrong: delimiter, decimals and the header row, with the effect on the row count.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/FormSection.tsx', 'forms/FormField.tsx', 'forms/SettingSwitchRow.tsx'],
          Component: ImportMappingFileSettings,
        },
        {
          id: 'ImportMappingTemplates',
          title: 'Saved mapping templates',
          note: 'Files that come back every month: reuse a mapping instead of matching columns again.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/ChoiceCardGroup.tsx'],
          Component: ImportMappingTemplates,
        },
      ],
    },
    {
      id: 'mapping',
      title: 'Mapping',
      description: 'Which column feeds which field, and how sure the match is.',
      specimens: [
        {
          id: 'ImportMappingTable',
          title: 'Column mapping table',
          note: 'The mapping step. Pick Description for the Text column to clear the error.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/workflows/MappingTable.tsx', 'patterns/workflows/columnMapping.ts'],
          Component: ImportMappingTable,
        },
        {
          id: 'ImportMappingRequiredError',
          title: 'Unmapped required field',
          note: 'A required field without a column blocks the step: the row is flagged and the field is named below.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/workflows/MappingTable.tsx', 'patterns/workflows/columnMapping.ts'],
          Component: ImportMappingRequiredError,
        },
        {
          id: 'ImportMappingMatchStates',
          title: 'Match states',
          note: 'The four ways a column can be matched, as a legend beside the table.',
          origin: 'custom',
          align: 'stretch',
          Component: ImportMappingMatchStates,
        },
        {
          id: 'ImportMappingPreview',
          title: 'Preview of first rows',
          note: 'The file as it will be read: field names on top, original headers under them.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          Component: ImportMappingPreview,
        },
        {
          id: 'ImportMappingColumnInspector',
          title: 'Column inspector',
          note: 'One column up close when a match is in doubt: fill rate, range and what will not parse.',
          origin: 'custom',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: ImportMappingColumnInspector,
        },
      ],
    },
    {
      id: 'validation',
      title: 'Validation',
      description: 'What the rows look like against the rules, and what to do about the ones that fail.',
      specimens: [
        {
          id: 'ImportMappingValidationSummary',
          title: 'Validation summary',
          note: 'The verdict before importing: ready, warnings and errors as figures, with what it means.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ValidationSummaryCard.tsx', 'patterns/workflows/validationVerdict.ts'],
          Component: ImportMappingValidationSummary,
        },
        {
          id: 'ImportMappingValidationClean',
          title: 'Validation, all ready',
          note: 'Nothing to fix: the zero counts go quiet and the card offers the next step.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/workflows/ValidationSummaryCard.tsx', 'patterns/workflows/validationVerdict.ts'],
          Component: ImportMappingValidationClean,
        },
        {
          id: 'ImportMappingErrorRows',
          title: 'Error rows with inline fix',
          note: 'A handful of bad rows: each with its reason, fixable in place. Click a value to edit it.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/data-entry/EditableCell.tsx'],
          Component: ImportMappingErrorRows,
        },
        {
          id: 'ImportMappingIssuesByReason',
          title: 'Warnings by reason',
          note: 'Many rows with few causes: group by reason so one decision covers them all.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/BreakdownList.tsx'],
          Component: ImportMappingIssuesByReason,
        },
        {
          id: 'ImportMappingDuplicates',
          title: 'Duplicate handling',
          note: 'Records that already exist: skip, replace or merge, with the effect spelled out in numbers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/ChoiceCardGroup.tsx'],
          Component: ImportMappingDuplicates,
        },
      ],
    },
    {
      id: 'import',
      title: 'Import and result',
      description: 'Committing the rows, and what is left to do afterwards.',
      specimens: [
        {
          id: 'ImportMappingDryRun',
          title: 'Dry run toggle',
          note: 'Large or risky imports: rehearse first. The primary button changes its promise with the switch.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: ImportMappingDryRun,
        },
        {
          id: 'ImportMappingReviewStep',
          title: 'Review before import',
          note: 'The last look: what will be created, updated and left out, and whether it can be undone.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: ImportMappingReviewStep,
        },
        {
          id: 'ImportMappingProgress',
          title: 'Import progress',
          note: 'A running import: rows done of the total, running counts and whether it is safe to leave.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ImportMappingProgress,
        },
        {
          id: 'ImportMappingResult',
          title: 'Import result',
          note: 'What was written and what was not, with the failed rows as a download to fix and re-import.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/MetadataList.tsx'],
          Component: ImportMappingResult,
        },
        {
          id: 'ImportMappingRollback',
          title: 'Rollback notice',
          note: 'After a large import: how long it can be undone and exactly what undoing removes.',
          origin: 'custom',
          align: 'stretch',
          Component: ImportMappingRollback,
        },
        {
          id: 'ImportMappingHistory',
          title: 'Recent imports',
          note: 'The log of earlier imports and how each ended, sortable by file, person and size.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/collections/DataTable.tsx'],
          Component: ImportMappingHistory,
        },
      ],
    },
    {
      id: 'full-flow',
      title: 'Full flow',
      description: 'The four steps wired together for the Nordkapp tag list.',
      specimens: [
        {
          id: 'ImportMappingWizard',
          title: 'Import wizard',
          note: 'The whole import in one frame. Next stays blocked, with the reason, until mapping and validation are settled.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/data-entry/WizardFrame.tsx',
            'patterns/workflows/MappingTable.tsx',
            'patterns/workflows/ValidationSummaryCard.tsx',
            'patterns/workflows/columnMapping.ts',
            'forms/SettingSwitchRow.tsx',
          ],
          Component: ImportMappingWizard,
        },
      ],
    },
  ],
});
