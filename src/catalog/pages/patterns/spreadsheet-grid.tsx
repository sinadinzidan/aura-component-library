import { useState } from 'react';

import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import type { SheetColumn } from '../../../library/tools/spreadsheet/columns';
import { evaluateSheet } from '../../../library/tools/spreadsheet/formula';
import { selectionStats } from '../../../library/tools/spreadsheet/selectionStats';
import { SheetFormulaBar } from '../../../library/tools/spreadsheet/SheetFormulaBar';
import { SheetGrid } from '../../../library/tools/spreadsheet/SheetGrid';
import type { SheetClipboard } from '../../../library/tools/spreadsheet/SheetGrid';
import { SheetStatusBar } from '../../../library/tools/spreadsheet/SheetStatusBar';
import { SENSORS, findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './spreadsheet-grid.tsx?raw';

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

/** Alarm limit configuration: one row per instrument of the Nordkapp plant. */
const LIMIT_COLUMNS: readonly SheetColumn[] = [
  { id: 'tag', title: 'Tag', type: 'text', readOnly: true, mono: true, required: true, width: 13 },
  { id: 'name', title: 'Measurement', type: 'text', readOnly: true, width: 24 },
  { id: 'unit', title: 'Unit', type: 'text', readOnly: true, width: 8 },
  { id: 'low', title: 'Low', type: 'number', width: 10 },
  { id: 'high', title: 'High', type: 'number', width: 10 },
  { id: 'highHigh', title: 'Trip', type: 'number', width: 10 },
  { id: 'deadband', title: 'Deadband', type: 'number', unit: '%', decimals: 1, min: 0, max: 10, width: 12 },
  { id: 'delay', title: 'Delay', type: 'number', unit: 's', decimals: 0, min: 0, max: 600, width: 9 },
  { id: 'priority', title: 'Priority', type: 'select', options: PRIORITIES, required: true, width: 11 },
  { id: 'enabled', title: 'Enabled', type: 'checkbox', width: 9 },
  { id: 'reviewed', title: 'Reviewed', type: 'date', width: 13 },
];

const LIMIT_EXTRAS: readonly (readonly string[])[] = [
  ['1.0', '5', 'High', 'true', '2026-02-18'],
  ['1.0', '5', 'Medium', 'true', '2026-02-18'],
  ['0.5', '10', 'High', 'true', '2026-01-27'],
  ['2.0', '3', 'Critical', 'true', '2026-03-09'],
  ['0.5', '0', 'Medium', 'true', '2025-11-04'],
  ['1.5', '30', 'Low', 'true', '2025-11-04'],
  ['2.0', '15', 'High', 'true', '2026-02-02'],
  ['1.0', '5', 'Medium', 'true', '2026-02-02'],
  ['0.5', '10', 'Medium', 'true', '2026-03-03'],
  ['1.5', '30', 'Low', 'true', '2025-12-12'],
  ['1.0', '5', 'High', 'true', '2025-12-12'],
  ['0.5', '10', 'Medium', 'false', '2026-03-10'],
];

const LIMIT_ROWS: readonly (readonly string[])[] = SENSORS.map((sensor, index) => [
  sensor.tag,
  sensor.name,
  sensor.unit,
  String(sensor.lowLimit),
  String(sensor.highLimit),
  sensor.highHighLimit === undefined ? '' : String(sensor.highHighLimit),
  ...LIMIT_EXTRAS[index],
]);

/** Spare parts held in the Nordkapp warehouse. Stock value is a formula; the last row totals it. */
const PART_COLUMNS: readonly SheetColumn[] = [
  { id: 'part', title: 'Part no.', type: 'text', readOnly: true, mono: true, width: 12 },
  { id: 'description', title: 'Description', type: 'text', width: 30 },
  { id: 'fits', title: 'Fits', type: 'text', mono: true, width: 13 },
  { id: 'bin', title: 'Bin', type: 'text', mono: true, width: 8 },
  { id: 'onHand', title: 'On hand', type: 'number', decimals: 0, min: 0, width: 10 },
  { id: 'minimum', title: 'Minimum', type: 'number', decimals: 0, min: 0, width: 10 },
  { id: 'cost', title: 'Unit cost', type: 'number', unit: 'NOK', decimals: 2, min: 0, width: 15 },
  { id: 'value', title: 'Stock value', type: 'number', unit: 'NOK', decimals: 2, width: 17 },
  { id: 'counted', title: 'Last counted', type: 'date', width: 13 },
];

const PART_ROWS: readonly (readonly string[])[] = [
  ['SP-118204', 'Drive-end bearing, tilting pad', '23-KA-9103', 'A-04', '2', '1', '184500', '=E1*G1', '2026-02-11'],
  ['SP-118207', 'Dry gas seal cartridge', '23-KA-9101', 'A-06', '1', '1', '412000', '=E2*G2', '2026-02-11'],
  ['SP-120331', 'Vibration probe, 8 mm', '23-KA-9101', 'C-12', '6', '4', '9850', '=E3*G3', '2026-01-20'],
  ['SP-120977', 'Temperature transmitter, Pt100', '40-PA-4001', 'C-14', '3', '2', '14200', '=E4*G4', '2026-01-20'],
  ['SP-131560', 'Tube bundle gasket set', '23-HA-9114', 'B-02', '4', '2', '6300', '=E5*G5', '2025-12-03'],
  ['SP-140018', 'Mechanical seal, export pump', '27-PA-2001A', 'B-09', '2', '2', '58750', '=E6*G6', '2026-03-02'],
  ['SP-140022', 'Coupling element', '27-PA-2001B', 'B-10', '0', '1', '21400', '=E7*G7', '2026-03-02'],
  ['SP-152406', 'Solenoid valve, 24 V', '20-XV-1105', 'D-01', '5', '2', '4975.5', '=E8*G8', '2025-12-03'],
  ['Total', '', '', '', '=SUM(E1:E8)', '', '', '=SUM(H1:H8)', ''],
];

/** A short slice of the limits for the small specimens. */
const SHORT_LIMIT_COLUMNS: readonly SheetColumn[] = [
  { id: 'tag', title: 'Tag', type: 'text', readOnly: true, mono: true, width: 13 },
  { id: 'low', title: 'Low', type: 'number', decimals: 1, width: 8 },
  { id: 'high', title: 'High', type: 'number', decimals: 1, width: 8 },
  { id: 'trip', title: 'Trip', type: 'number', decimals: 1, width: 8 },
];

const SHORT_LIMIT_ROWS: readonly (readonly string[])[] = SENSORS.slice(0, 5).map((sensor) => [
  sensor.tag,
  String(sensor.lowLimit),
  String(sensor.highLimit),
  sensor.highHighLimit === undefined ? '' : String(sensor.highHighLimit),
]);

const SHORTCUTS: readonly { keys: readonly string[]; action: string }[] = [
  { keys: ['enter'], action: 'Edit the cell, or commit and move down' },
  { keys: ['F2'], action: 'Edit without replacing the text' },
  { keys: ['esc'], action: 'Cancel the edit' },
  { keys: ['shift', 'down'], action: 'Extend the selection' },
  { keys: ['mod', 'down'], action: 'Jump to the edge' },
  { keys: ['mod', 'D'], action: 'Fill down' },
  { keys: ['mod', 'C'], action: 'Copy as tab-separated text' },
  { keys: ['mod', 'V'], action: 'Paste a range' },
  { keys: ['mod', 'Z'], action: 'Undo' },
  { keys: ['shift', 'Space'], action: 'Select the row' },
  { keys: ['mod', 'Space'], action: 'Select the column' },
];

function SheetGridAlarmLimits() {
  return <SheetGrid label="Alarm limit configuration" columns={LIMIT_COLUMNS} rows={LIMIT_ROWS} formulas={false} className="h-128" initialSelection={{ active: { row: 0, col: 4 } }} />;
}

function SheetGridSpareParts() {
  return <SheetGrid label="Spare parts stock" columns={PART_COLUMNS} rows={PART_ROWS} className="h-112" initialSelection={{ active: { row: 0, col: 7 } }} />;
}

function SheetGridCompactReadOnly() {
  return (
    <SheetGrid
      label="Approved alarm limits, revision 14"
      columns={LIMIT_COLUMNS.slice(0, 9)}
      rows={LIMIT_ROWS.map((row) => row.slice(0, 9))}
      readOnly
      density="compact"
      toolbar={false}
      formulas={false}
      className="h-80"
      initialSelection={{ active: { row: 0, col: 3 }, extent: { row: 3, col: 4 } }}
    />
  );
}

function SheetGridShortcuts() {
  return (
    <dl className="flex w-full max-w-sm flex-col gap-2 text-sm">
      {SHORTCUTS.map((shortcut) => (
        <div key={shortcut.action} className="flex items-center justify-between gap-4">
          <dt className="text-medium-foreground">{shortcut.action}</dt>
          <dd className="shrink-0">
            <ShortcutHint keys={shortcut.keys} platform="other" />
          </dd>
        </div>
      ))}
    </dl>
  );
}

const TYPE_COLUMNS: readonly SheetColumn[] = [
  { id: 'text', title: 'Text', type: 'text', width: 18 },
  { id: 'number', title: 'Number', type: 'number', unit: 'barg', decimals: 1, width: 12 },
  { id: 'select', title: 'Select', type: 'select', options: PRIORITIES, width: 11 },
  { id: 'date', title: 'Date', type: 'date', width: 13 },
  { id: 'checkbox', title: 'Checkbox', type: 'checkbox', width: 10 },
];

const TYPE_ROWS: readonly (readonly string[])[] = [
  ['Discharge pressure', '52', 'High', '2026-02-18', 'true'],
  ['Suction pressure', '15', 'Medium', '2026-02-18', 'true'],
  ['Separator level', '70', 'Low', '2026-02-02', 'false'],
];

function SheetGridColumnTypes() {
  return <SheetGrid label="Column types" columns={TYPE_COLUMNS} rows={TYPE_ROWS} toolbar={false} formulas={false} freezeFirstColumn={false} />;
}

function SheetGridRangeSelection() {
  return (
    <SheetGrid
      label="Limits with a selected range"
      columns={SHORT_LIMIT_COLUMNS}
      rows={SHORT_LIMIT_ROWS}
      toolbar={false}
      formulas={false}
      initialSelection={{ active: { row: 1, col: 1 }, extent: { row: 3, col: 2 } }}
    />
  );
}

function SheetGridFormulaBar() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="rounded-lg border border-default px-3 py-1">
        <SheetFormulaBar cell="E4" content="14200" />
      </div>
      <div className="rounded-lg border border-default px-3 py-1">
        <SheetFormulaBar cell="H9" content="=SUM(H1:H8)" result="1,187,177.50" />
      </div>
      <div className="rounded-lg border border-default px-3 py-1">
        <SheetFormulaBar cell="C9" content="" />
      </div>
    </div>
  );
}

const STATUS_RESULTS = evaluateSheet(SHORT_LIMIT_ROWS);

function SheetGridStatusBar() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-default">
        <SheetStatusBar range="C1:C5" stats={selectionStats(STATUS_RESULTS, { r1: 0, c1: 2, r2: 4, c2: 2 })} />
      </div>
      <div className="overflow-hidden rounded-lg border border-default">
        <SheetStatusBar range="B2" stats={selectionStats(STATUS_RESULTS, { r1: 1, c1: 1, r2: 1, c2: 1 })} invalidReason="Must be 0 or more" />
      </div>
      <div className="overflow-hidden rounded-lg border border-default">
        <SheetStatusBar range="A3" stats={selectionStats(STATUS_RESULTS, { r1: 2, c1: 0, r2: 2, c2: 0 })} readOnly invalidCount={2} />
      </div>
    </div>
  );
}

function SheetGridFillHandle() {
  return (
    <SheetGrid
      label="Deadband column with a fill selection"
      columns={[
        { id: 'tag', title: 'Tag', type: 'text', readOnly: true, mono: true, width: 13 },
        { id: 'deadband', title: 'Deadband', type: 'number', unit: '%', decimals: 1, width: 12 },
      ]}
      rows={[['23-PT-92531', '1.0'], ['23-PT-92530', '1.5'], ['23-TT-92532', ''], ['23-VT-92540', ''], ['23-ST-92501', '']]}
      toolbar={false}
      statusBar={false}
      formulas={false}
      initialSelection={{ active: { row: 0, col: 1 }, extent: { row: 1, col: 1 } }}
    />
  );
}

const FORMULA_COLUMNS: readonly SheetColumn[] = [
  { id: 'tag', title: 'Tag', type: 'text', readOnly: true, mono: true, width: 13 },
  { id: 'high', title: 'High', type: 'number', decimals: 1, width: 9 },
  { id: 'proposed', title: 'Proposed', type: 'number', decimals: 1, width: 11 },
];

const FORMULA_ROWS: readonly (readonly string[])[] = [
  ['23-PT-92531', '52', '=B1*1.1'],
  ['23-PT-92530', '15', '=B2*1.1'],
  ['20-PT-10010', '15', '=B3*1.1'],
  ['Sum', '=SUM(B1:B3)', '=SUM(C1:C3)'],
  ['Average', '=AVERAGE(B1:B3)', '=AVERAGE(C1:C3)'],
];

function SheetGridFormulas() {
  return <SheetGrid label="Proposed pressure limits" columns={FORMULA_COLUMNS} rows={FORMULA_ROWS} statusBar={false} initialSelection={{ active: { row: 0, col: 2 } }} />;
}

function SheetGridInjectedClipboard() {
  const [held, setHeld] = useState('23-PT-92531\t40\t52\n23-PT-92530\t10\t15');
  const clipboard: SheetClipboard = {
    readText: () => Promise.resolve(held),
    writeText: (text) => {
      setHeld(text);
      return Promise.resolve();
    },
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <SheetGrid label="Limits with an in-memory clipboard" columns={SHORT_LIMIT_COLUMNS} rows={SHORT_LIMIT_ROWS} statusBar={false} formulas={false} clipboard={clipboard} initialSelection={{ active: { row: 2, col: 1 }, extent: { row: 3, col: 2 } }} />
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">Clipboard, as tab-separated text</span>
        <pre aria-label="Clipboard content" className="max-h-24 overflow-auto rounded-lg bg-muted-background px-3 py-2 font-mono text-xs text-base-foreground">
          {held === '' ? 'Empty' : held}
        </pre>
      </div>
    </div>
  );
}

function SheetGridEditing() {
  return (
    <SheetGrid
      label="Limits with a cell being edited"
      columns={SHORT_LIMIT_COLUMNS}
      rows={SHORT_LIMIT_ROWS}
      formulas={false}
      initialSelection={{ active: { row: 2, col: 2 } }}
      initialDraft="147.5"
    />
  );
}

const INVALID_ROWS: readonly (readonly string[])[] = [
  ['23-PT-92531', 'Discharge pressure', 'barg', '40', '52', '55', '1.0', '5', 'High', 'true', '2026-02-18'],
  ['23-PT-92530', 'Suction pressure', 'barg', 'ten', '15', '', '12.5', '5', 'Urgent', 'true', '18.02.2026'],
  ['23-TT-92532', 'Discharge temperature', '°C', '90', '145', '155', '0.5', '-10', '', 'true', '2026-01-27'],
];

function SheetGridInvalidCells() {
  return <SheetGrid label="Limits with invalid cells" columns={LIMIT_COLUMNS.filter((column) => column.id !== 'name' && column.id !== 'unit' && column.id !== 'highHigh')} rows={INVALID_ROWS.map((row) => [row[0], row[3], row[4], row[6], row[7], row[8], row[9], row[10]])} toolbar={false} formulas={false} initialSelection={{ active: { row: 1, col: 1 } }} />;
}

const ERROR_ROWS: readonly (readonly string[])[] = [
  ['23-PT-92531', '52', '=B1/0'],
  ['23-PT-92530', '15', '=A2*1.1'],
  ['20-PT-10010', '15', '=B9*1.1'],
  ['23-TT-91141', '40', '=TOTAL(B1:B3)'],
  ['27-IT-20013', '95', '=C5+1'],
  ['40-TT-40015', '75', '=B6*'],
];

function SheetGridFormulaErrors() {
  return <SheetGrid label="Formulas with errors" columns={FORMULA_COLUMNS} rows={ERROR_ROWS} toolbar={false} initialSelection={{ active: { row: 0, col: 2 } }} />;
}

function SheetGridReadOnlyColumns() {
  return (
    <SheetGrid
      label="Limits with locked identity columns"
      columns={LIMIT_COLUMNS.slice(0, 6)}
      rows={LIMIT_ROWS.slice(0, 5).map((row) => row.slice(0, 6))}
      toolbar={false}
      formulas={false}
      initialSelection={{ active: { row: 1, col: 1 } }}
    />
  );
}

function SheetGridLoading() {
  return <SheetGrid label="Alarm limits, loading" columns={SHORT_LIMIT_COLUMNS} rows={[]} loading formulas={false} />;
}

function SheetGridEmpty() {
  return (
    <SheetGrid
      label="Alarm limits for an area without instruments"
      columns={SHORT_LIMIT_COLUMNS}
      rows={[]}
      formulas={false}
      empty={
        <span className="flex flex-col items-center gap-1">
          <span className="font-medium text-base-foreground">No instruments in {findAsset('nk-27')?.name ?? 'this area'}</span>
          <span>Pick another area, or add instruments to this one in the asset hierarchy.</span>
        </span>
      }
    />
  );
}

function SheetGridDense() {
  return <SheetGrid label="Alarm limit configuration, compact" columns={LIMIT_COLUMNS} rows={LIMIT_ROWS} density="compact" formulas={false} className="h-96" initialSelection={{ active: { row: 3, col: 3 }, extent: { row: 3, col: 5 } }} />;
}

export default definePage({
  id: 'spreadsheet-grid',
  title: 'Spreadsheet grid',
  summary:
    'An editable grid that behaves like a spreadsheet: one moving cell focus, range selection, typed columns with validation, copy, paste and fill, undo, and simple formulas. For bulk edits of many similar records, such as alarm limits or stock counts.',
  guidance: {
    use: [
      'For editing many rows of the same shape, where people think in columns and ranges.',
      'Lock identity columns and validate every typed column, so a paste cannot break the data.',
      'Keep undo close: a fill or a paste changes many cells in one step.',
      'Show count, sum and average of the selection; it is the fastest check there is.',
    ],
    avoid: [
      'For a handful of fields on one record; use a form or inline editing.',
      'Saving invalid cells silently. Mark them, give the reason, and block the save.',
      'Formulas for anything a column of the data model should compute.',
      'Hiding that a column is read-only until someone types into it.',
    ],
  },
  source,
  sections: [
    {
      id: 'sheets',
      title: 'Working sheets',
      description: 'Complete grids. Click a cell, then use the keyboard, drag a range, paste from a spreadsheet, or drag the fill handle.',
      specimens: [
        {
          id: 'SheetGridAlarmLimits',
          title: 'Alarm limit sheet',
          note: 'Pick it for bulk edits of typed records: numbers with units, a select, a checkbox and a date, with locked identity columns.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/sheetReducer.ts', 'tools/spreadsheet/columns.ts', 'tools/spreadsheet/clipboard.ts'],
          Component: SheetGridAlarmLimits,
        },
        {
          id: 'SheetGridSpareParts',
          title: 'Stock sheet with formulas',
          note: 'Pick it when some cells are computed from others: a value per row and a total that follow every edit.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/formula.ts', 'tools/spreadsheet/sheetReducer.ts'],
          Component: SheetGridSpareParts,
        },
        {
          id: 'SheetGridCompactReadOnly',
          title: 'Compact read-only grid',
          note: 'Use it to review an approved revision: nothing edits, but ranges still select, copy and total.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx'],
          Component: SheetGridCompactReadOnly,
        },
        {
          id: 'SheetGridShortcuts',
          title: 'Keyboard reference',
          note: 'Place it in a help popover beside the grid so the spreadsheet keys are discoverable.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['actions/ShortcutHint.tsx'],
          Component: SheetGridShortcuts,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces a sheet is built from, each small enough to study.',
      specimens: [
        {
          id: 'SheetGridColumnTypes',
          title: 'Column types',
          note: 'Choose a type per column so the editor, the alignment and the validation follow the data.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/columns.ts'],
          Component: SheetGridColumnTypes,
        },
        {
          id: 'SheetGridRangeSelection',
          title: 'Range selection',
          note: 'A drag or Shift with the arrows selects a rectangle; the status bar totals its numbers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/cellRef.ts', 'tools/spreadsheet/selectionStats.ts'],
          Component: SheetGridRangeSelection,
        },
        {
          id: 'SheetGridFormulaBar',
          title: 'Formula bar',
          note: 'Show it whenever cells can hold formulas, so the source is readable while the cell shows the result.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetFormulaBar.tsx'],
          Component: SheetGridFormulaBar,
        },
        {
          id: 'SheetGridStatusBar',
          title: 'Status bar',
          note: 'Keep it under every sheet: the range, the reason a cell is invalid or locked, and the totals.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetStatusBar.tsx', 'tools/spreadsheet/selectionStats.ts'],
          Component: SheetGridStatusBar,
        },
        {
          id: 'SheetGridFillHandle',
          title: 'Fill handle',
          note: 'Drag the square at the corner of the selection down to repeat its pattern, or press Ctrl+D.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/sheetReducer.ts'],
          Component: SheetGridFillHandle,
        },
        {
          id: 'SheetGridFormulas',
          title: 'Formulas',
          note: 'Use sums, averages and simple arithmetic for what-if columns; references shift when a formula is filled down.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/formula.ts'],
          Component: SheetGridFormulas,
        },
        {
          id: 'SheetGridInjectedClipboard',
          title: 'Injected clipboard',
          note: 'Pass your own clipboard where the browser one is blocked, such as an embedded frame, or to test copy and paste.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/clipboard.ts'],
          Component: SheetGridInjectedClipboard,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the grid looks like when it is being edited, wrong, locked, waiting or empty.',
      specimens: [
        {
          id: 'SheetGridEditing',
          title: 'Editing a cell',
          note: 'The editor replaces the cell in place; Enter commits and moves down, Escape restores the old value.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx'],
          Component: SheetGridEditing,
        },
        {
          id: 'SheetGridInvalidCells',
          title: 'Invalid cells',
          note: 'A value that fails its column keeps what was typed, gets a marker, and gives its reason on hover and in the status bar.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/columns.ts'],
          Component: SheetGridInvalidCells,
        },
        {
          id: 'SheetGridFormulaErrors',
          title: 'Formula errors',
          note: 'Each failure has its own code and a sentence: divide by zero, text as a number, outside the sheet, unknown name, a loop, a typo.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx', 'tools/spreadsheet/formula.ts'],
          Component: SheetGridFormulaErrors,
        },
        {
          id: 'SheetGridReadOnlyColumns',
          title: 'Read-only columns',
          note: 'Lock the columns that identify a row; they are tinted, carry a lock in the header, and are skipped by paste and fill.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx'],
          Component: SheetGridReadOnlyColumns,
        },
        {
          id: 'SheetGridLoading',
          title: 'Loading',
          note: 'Show the real headers with placeholder rows while the data loads, so the layout does not jump.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx'],
          Component: SheetGridLoading,
        },
        {
          id: 'SheetGridEmpty',
          title: 'Empty',
          note: 'Keep the headers and say why there are no rows and what to do about it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx'],
          Component: SheetGridEmpty,
        },
        {
          id: 'SheetGridDense',
          title: 'Dense',
          note: 'Use compact rows when the sheet is the whole job and people need many rows in view.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/spreadsheet/SheetGrid.tsx'],
          Component: SheetGridDense,
        },
      ],
    },
  ],
});
