import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { EmptyState, EmptyStateDescription, EmptyStateIcon, EmptyStateTitle } from '@cognite/aura/components/empty-state';
import { IconDownload, IconFileText, IconPrinter, IconShare } from '@cognite/aura/icons';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { Figure } from '../../../library/industrial/analytics/Figure';
import { figureReference } from '../../../library/industrial/analytics/figureReference';
import { ReportHeader } from '../../../library/industrial/analytics/ReportHeader';
import { ReportPage } from '../../../library/industrial/analytics/ReportPage';
import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import type { CategoryRow } from '../../../library/industrial/charts/CategoryChart';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { formatDelta, formatValue } from '../../../library/industrial/status';
import { SignOffBlock } from '../../../library/industrial/workflows/SignOffBlock';
import type { SignOffSigner } from '../../../library/industrial/workflows/SignOffBlock';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { DAY, HOUR, REFERENCE_NOW, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './reports.tsx?raw';

/** The production day the daily report covers: 11 March, 06:00 to 06:00. */
const REPORT_DAY_END = REFERENCE_NOW - 8 * HOUR;

const REPORT_EXPORT_HOURLY = makeSeries({ seed: 31, points: 25, base: 4.3, amplitude: 0.12, noise: 0.04, cycles: 1.2, end: REPORT_DAY_END, decimals: 2 }).map((point) => ({ t: point.t, v: point.v }));

const REPORT_FEBRUARY: CategoryRow[] = makeSeries({ seed: 77, points: 28, base: 4.46, amplitude: 0.08, noise: 0.06, cycles: 2, stepMs: DAY, decimals: 2 }).map((point, index) => ({
  category: String(index + 1),
  actual: index === 16 ? 3.71 : index === 17 ? 4.02 : point.v,
}));
const REPORT_FEBRUARY_TOTAL = REPORT_FEBRUARY.reduce((sum, row) => sum + (typeof row.actual === 'number' ? row.actual : 0), 0);

type ReportColumn = { key: string; label: string; align?: 'left' | 'right'; mono?: boolean };
type ReportRow = Record<string, string>;

type ReportLayoutTableProps = { label: string; columns: readonly ReportColumn[]; rows: readonly ReportRow[]; totals?: ReportRow; dense?: boolean };

/** A print-style table: hairlines between rows, a heavier rule above the totals, right-aligned figures. */
function ReportLayoutTable({ label, columns, rows, totals, dense = false }: ReportLayoutTableProps) {
  const pad = dense ? 'py-1' : 'py-2';
  const cell = (column: ReportColumn) => `${pad} pr-4 last:pr-0 ${column.align === 'right' ? 'text-right tabular-nums' : 'text-left'} ${column.mono ? 'font-mono text-xs' : ''}`;
  return (
    <table aria-label={label} className={`w-full ${dense ? 'text-xs' : 'text-sm'}`}>
      <thead>
        <tr className="border-b border-emphasized text-xs text-muted-foreground">
          {columns.map((column) => (
            <th key={column.key} scope="col" className={`pb-2 pr-4 font-medium last:pr-0 ${column.align === 'right' ? 'text-right' : 'text-left'}`}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[columns[0].key]} className="border-b border-default align-top">
            {columns.map((column) => (
              <td key={column.key} className={`${cell(column)} text-base-foreground`}>
                {row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      {totals ? (
        <tfoot>
          <tr className="border-t-2 border-emphasized font-semibold text-base-foreground">
            {columns.map((column) => (
              <td key={column.key} className={cell(column)}>
                {totals[column.key]}
              </td>
            ))}
          </tr>
        </tfoot>
      ) : null}
    </table>
  );
}

function ReportLayoutSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <section aria-label={`${number} ${title}`} className="flex flex-col gap-2">
      <h4 className="flex items-baseline gap-3 text-base font-semibold text-base-foreground">
        <span className="tabular-nums text-muted-foreground">{number}</span>
        {title}
      </h4>
      <div className="flex flex-col gap-3 text-sm text-medium-foreground">{children}</div>
    </section>
  );
}

function ReportLayoutFooterStrip({ page, pages, documentId }: { page: number; pages: number; documentId: string }) {
  return (
    <footer className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-default pt-3 text-xs text-muted-foreground">
      <span>
        Nordkapp gas processing plant · <span className="font-mono">{documentId}</span>
      </span>
      <span>Internal · generated 12 Mar 2026, 06:15 UTC</span>
      <span className="tabular-nums">
        Page {page} of {pages}
      </span>
    </footer>
  );
}

const KPI_COLUMNS: readonly ReportColumn[] = [
  { key: 'kpi', label: 'Figure' },
  { key: 'unit', label: 'Unit' },
  { key: 'actual', label: 'Actual', align: 'right' },
  { key: 'plan', label: 'Plan', align: 'right' },
  { key: 'delta', label: 'Against plan', align: 'right' },
];

const reportKpi = (kpi: string, unit: string, actual: number, plan: number, decimals: number): ReportRow => ({
  kpi,
  unit,
  actual: formatValue(actual, decimals),
  plan: formatValue(plan, decimals),
  delta: formatDelta(actual - plan, decimals),
});

const DAILY_KPIS: readonly ReportRow[] = [
  reportKpi('Gas export', 'MSm³', 4.21, 4.5, 2),
  reportKpi('Availability', '%', 96.4, 97.5, 1),
  reportKpi('OEE', '%', 82.7, 85, 1),
  reportKpi('Energy intensity', 'kWh/boe', 31.2, 30, 1),
  reportKpi('Flaring', 'kSm³', 12.4, 15, 1),
];

const MONTHLY_KPIS: readonly ReportRow[] = [
  reportKpi('Gas export', 'MSm³', Math.round(REPORT_FEBRUARY_TOTAL * 10) / 10, 126, 1),
  reportKpi('Availability', '%', 97.1, 97.5, 1),
  reportKpi('OEE', '%', 84.2, 85, 1),
  reportKpi('Energy intensity', 'kWh/boe', 30.6, 30, 1),
  reportKpi('Flaring', 'kSm³', 361, 420, 0),
];

const DOWNTIME_COLUMNS: readonly ReportColumn[] = [
  { key: 'cause', label: 'Cause' },
  { key: 'tag', label: 'Equipment', mono: true },
  { key: 'events', label: 'Events', align: 'right' },
  { key: 'hours', label: 'Hours', align: 'right' },
  { key: 'loss', label: 'Lost export, MSm³', align: 'right' },
];

const DOWNTIME_ROWS: readonly ReportRow[] = [
  { cause: 'Recompressor trip, high vibration', tag: '23-KA-9103', events: '2', hours: '11.5', loss: '1.42' },
  { cause: 'Interstage cooler fouling', tag: '23-HA-9114', events: '1', hours: '6.0', loss: '0.38' },
  { cause: 'Planned standby test', tag: '27-PA-2001B', events: '4', hours: '2.0', loss: '0.00' },
  { cause: 'Instrument fault', tag: '40-TT-40015', events: '1', hours: '1.5', loss: '0.06' },
];
const DOWNTIME_TOTALS: ReportRow = { cause: 'Total', tag: '', events: '8', hours: '21.0', loss: '1.86' };

const DEVIATIONS = [
  { id: 'D-1', text: 'Gas export 0.29 MSm³ under plan.', cause: 'Recompressor 23-KA-9103 off load 13:46 to 19:20.', action: 'WO-104482, bearing inspection, in progress.' },
  { id: 'D-2', text: 'Discharge temperature above 145 °C for 38 min.', cause: 'Interstage cooler 23-HA-9114 fouled.', action: 'WO-104471, tube bundle cleaning, waiting for parts.' },
  { id: 'D-3', text: 'Bearing temperature signal lost on 40-PA-4001.', cause: 'Transmitter 40-TT-40015 failed.', action: 'WO-104479, replacement planned 13 Mar.' },
];

const APPENDIX_COLUMNS: readonly ReportColumn[] = [
  { key: 'tag', label: 'Tag', mono: true },
  { key: 'name', label: 'Measurement' },
  { key: 'min', label: 'Min', align: 'right' },
  { key: 'avg', label: 'Average', align: 'right' },
  { key: 'max', label: 'Max', align: 'right' },
  { key: 'unit', label: 'Unit' },
];

const APPENDIX_ROWS: readonly ReportRow[] = [
  { tag: '23-PT-92531', name: 'Discharge pressure', min: '46.2', avg: '48.4', max: '50.9', unit: 'barg' },
  { tag: '23-PT-92530', name: 'Suction pressure', min: '11.8', avg: '12.4', max: '13.1', unit: 'barg' },
  { tag: '23-TT-92532', name: 'Discharge temperature', min: '134.8', avg: '139.6', max: '146.3', unit: '°C' },
  { tag: '23-VT-92540', name: 'Drive-end vibration', min: '5.2', avg: '5.9', max: '6.8', unit: 'mm/s' },
  { tag: '20-LT-10012', name: 'Separator level', min: '49.6', avg: '54.1', max: '58.8', unit: '%' },
  { tag: '27-FT-20011', name: 'Export flow', min: '388', avg: '409', max: '436', unit: 'm³/h' },
];

const SHIFT_EVENTS_COLUMNS: readonly ReportColumn[] = [
  { key: 'time', label: 'Time', align: 'right' },
  { key: 'event', label: 'Event' },
  { key: 'tag', label: 'Tag', mono: true },
];

const SHIFT_EVENTS: readonly ReportRow[] = [
  { time: '19:20', event: 'Recompressor restarted after inspection; on load 19:45.', tag: '23-KA-9103' },
  { time: '22:05', event: 'Cooler outlet temperature alarm acknowledged, trending stable.', tag: '23-TT-91141' },
  { time: '01:30', event: 'Export pump A to standby for filter change; pump B on duty.', tag: '27-PA-2001A' },
  { time: '03:10', event: 'Export pump A back on duty.', tag: '27-PA-2001A' },
  { time: '05:00', event: 'Bearing temperature signal lost; alarm shelved until 18:00.', tag: '40-TT-40015' },
];

const SHIFT_SIGNERS: readonly SignOffSigner[] = [
  { id: 'out', role: 'Outgoing shift supervisor', name: 'Liv Wold', state: 'signed', at: '12 Mar, 06:02' },
  { id: 'in', role: 'Incoming shift supervisor', name: 'Ingrid Haugen', state: 'pending' },
];

const APPROVAL_SIGNERS: readonly SignOffSigner[] = [
  { id: 'prepared', role: 'Prepared by', name: 'Aisha Khan', state: 'signed', at: '3 Mar, 10:12' },
  { id: 'reviewed', role: 'Reviewed by', name: 'Magnus Solberg', state: 'signed', at: '4 Mar, 08:40' },
  { id: 'approved', role: 'Approved by', name: 'Liv Wold', state: 'pending' },
];

const RECENT_REPORTS = [
  { id: 'NK-RPT-D-0311', title: 'Daily production report', period: '11 Mar 2026', generated: '12 Mar, 06:15', state: 'Final', pages: 2 },
  { id: 'NK-RPT-S-0311N', title: 'Shift report, night', period: '11 Mar, 18:00–06:00', generated: '12 Mar, 06:02', state: 'Awaiting sign-off', pages: 1 },
  { id: 'NK-RPT-I-0041', title: 'Incident report: recompressor trip', period: '11 Mar 2026', generated: '11 Mar, 17:30', state: 'Draft', pages: 6 },
  { id: 'NK-RPT-M-0226', title: 'Monthly performance summary', period: 'February 2026', generated: '3 Mar, 10:12', state: 'Final', pages: 8 },
] as const;

const REPORT_STATE_BADGE = { Final: 'success', 'Awaiting sign-off': 'warning', Draft: 'secondary' } as const;

function ReportLayoutDailyKpiTable() {
  return <ReportLayoutTable label="Key figures for 11 March against plan" columns={KPI_COLUMNS} rows={DAILY_KPIS} />;
}

function ReportLayoutExportFigure({ number }: { number: number }) {
  return (
    <Figure number={number} caption="Gas export rate through the production day. The dip from 13:46 follows the recompressor trip; export recovered after the restart at 19:45." source="Source: 27-FT-20011, hourly averages, 11 Mar 06:00 to 12 Mar 06:00 UTC.">
      <TrendChart
        heightClassName="h-48"
        label="Gas export rate on 11 March by hour against the 4.5 plan, dipping after the recompressor trip at 13:46 and recovering in the evening"
        series={[{ key: 'export', label: 'Gas export', points: REPORT_EXPORT_HOURLY }]}
        limits={[{ value: 4.5, label: 'Plan 4.50', tone: 'neutral', align: 'left' }]}
        yDomain={[4, 4.6]}
        yTicks={[4, 4.2, 4.4, 4.6]}
        unit="MSm³/d"
        decimals={2}
      />
    </Figure>
  );
}

function ReportLayoutDeviations() {
  return (
    <ol aria-label="Deviations" className="flex flex-col divide-y divide-default">
      {DEVIATIONS.map((deviation) => (
        <li key={deviation.id} className="flex gap-4 py-3 first:pt-0">
          <span className="w-8 shrink-0 font-mono text-xs text-muted-foreground">{deviation.id}</span>
          <div className="flex min-w-0 flex-col gap-1 text-sm">
            <p className="font-medium text-base-foreground">{deviation.text}</p>
            <p className="text-medium-foreground">
              <span className="text-muted-foreground">Cause </span>
              {deviation.cause}
            </p>
            <p className="text-medium-foreground">
              <span className="text-muted-foreground">Action </span>
              {deviation.action}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ReportLayoutSummaryText() {
  return (
    <section aria-label="Executive summary" className="flex flex-col gap-3 border-l-2 border-emphasized pl-4">
      <h4 className="text-xs font-semibold text-muted-foreground">Executive summary</h4>
      <p className="text-base text-base-foreground">February export was 124.3 MSm³, 1.3 % under plan. Two recompressor trips account for three quarters of the shortfall.</p>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-medium-foreground">
        <li>Availability 97.1 % against a 97.5 % target; 21 hours of downtime in 8 events.</li>
        <li>Flaring 14 % under the monthly allowance.</li>
        <li>Decision needed: bring the recompressor bearing replacement forward from the April stop.</li>
      </ul>
    </section>
  );
}

function ReportLayoutHeaderStandard() {
  return (
    <ReportPage label="Standard report header" orientation="auto">
      <ReportHeader overline="Operations report" title="Daily production report" period="11 March 2026, 06:00–06:00" site="Nordkapp" generatedAt="12 Mar 2026, 06:15 UTC" documentId="NK-RPT-D-0311" />
    </ReportPage>
  );
}

function ReportLayoutHeaderCompact() {
  return (
    <ReportPage label="Running header for following pages" orientation="auto">
      <ReportHeader variant="compact" title="Daily production report" period="11 March 2026" site="Nordkapp" documentId="NK-RPT-D-0311" />
      <p className="text-sm text-muted-foreground">Page two onwards repeats the title, site, period and document number on one line.</p>
    </ReportPage>
  );
}

function ReportLayoutHeaderCover() {
  return (
    <ReportPage label="Report cover header" orientation="auto">
      <ReportHeader variant="cover" overline="Monthly report" title="Performance summary" period="February 2026" site="Nordkapp gas processing plant" generatedAt="3 Mar 2026, 10:12 UTC" author="Aisha Khan, rotating equipment engineer" documentId="NK-RPT-M-0226" />
    </ReportPage>
  );
}

function ReportLayoutHeaderStatus() {
  return (
    <ReportPage label="Report header with review state" orientation="auto">
      <ReportHeader
        overline="Incident report"
        title="Recompressor trip on high vibration"
        status={<Badge variant="secondary">Draft</Badge>}
        period="11 March 2026, 13:46"
        site="Nordkapp · NK-23"
        generatedAt="11 Mar 2026, 17:30 UTC"
        author="Liv Wold"
      />
    </ReportPage>
  );
}

function ReportLayoutPageFooter() {
  return (
    <ReportPage label="Page footer strip" orientation="auto">
      <p className="text-sm text-muted-foreground">The footer carries what identifies a loose page: plant, document number, classification, when it was generated and the page count.</p>
      <ReportLayoutFooterStrip page={2} pages={8} documentId="NK-RPT-M-0226" />
    </ReportPage>
  );
}

function ReportLayoutSignOffFooter() {
  const [signers, setSigners] = useState(APPROVAL_SIGNERS);
  return (
    <ReportPage label="Approval footer" orientation="auto">
      <SignOffBlock
        label="Approval, monthly performance summary"
        signers={signers}
        currentSignerId="approved"
        signLabel="Approve report"
        onSign={(id) => setSigners((current) => current.map((signer) => (signer.id === id ? { ...signer, state: 'signed', at: '12 Mar, 14:00' } : signer)))}
      />
    </ReportPage>
  );
}

function ReportLayoutExecutiveSummary() {
  return (
    <ReportPage label="Executive summary block" orientation="auto">
      <ReportLayoutSummaryText />
    </ReportPage>
  );
}

function ReportLayoutNumberedSection() {
  return (
    <ReportPage label="Report sections with numbered headings" orientation="auto">
      <ReportLayoutSection number="2" title="Production">
        <p>Gas export was 4.21 MSm³ against a plan of 4.50. The shortfall of 0.29 MSm³ occurred between 13:46 and 19:45, while the recompressor was off load.</p>
      </ReportLayoutSection>
      <ReportLayoutSection number="2.1" title="Compression">
        <p>The 1st and 2nd stage compressors ran the whole day. Discharge temperature on 23-KA-9101 rose 5 °C and passed its high limit for 38 minutes ({figureReference(2)}).</p>
      </ReportLayoutSection>
    </ReportPage>
  );
}

function ReportLayoutFigureCaption() {
  return (
    <ReportPage label="Figure with caption" orientation="auto">
      <ReportLayoutExportFigure number={1} />
      <p className="text-sm text-medium-foreground">
        Export fell to 4.12 MSm³/d after the trip and was back at plan by 05:00 (see <span className="font-semibold text-base-foreground">{figureReference(1)}</span>).
      </p>
    </ReportPage>
  );
}

function ReportLayoutSummaryTable() {
  return (
    <ReportPage label="Summary table with totals" orientation="auto">
      <Figure kind="Table" number={2} caption="Downtime by cause, February 2026. The recompressor accounts for 76 % of the lost export.">
        <ReportLayoutTable label="Downtime by cause, February 2026" columns={DOWNTIME_COLUMNS} rows={DOWNTIME_ROWS} totals={DOWNTIME_TOTALS} />
      </Figure>
    </ReportPage>
  );
}

function ReportLayoutDeviationList() {
  return (
    <ReportPage label="Deviation list" orientation="auto">
      <ReportLayoutSection number="3" title="Deviations">
        <ReportLayoutDeviations />
      </ReportLayoutSection>
    </ReportPage>
  );
}

function ReportLayoutAppendixTable() {
  return (
    <ReportPage label="Appendix table" orientation="auto">
      <ReportLayoutSection number="A" title="Appendix: process values">
        <Figure kind="Table" number="A1" caption="Minimum, average and maximum of the main process values, 11 March 2026.">
          <ReportLayoutTable dense label="Process values, 11 March 2026" columns={APPENDIX_COLUMNS} rows={APPENDIX_ROWS} />
        </Figure>
      </ReportLayoutSection>
    </ReportPage>
  );
}

function ReportLayoutKpiTable() {
  return (
    <ReportPage label="KPI table" orientation="auto">
      <Figure kind="Table" number={1} caption="Key figures for 11 March against plan. A minus sign means under plan.">
        <ReportLayoutDailyKpiTable />
      </Figure>
    </ReportPage>
  );
}

function ReportLayoutNotes() {
  return (
    <ReportPage label="Notes block" orientation="auto">
      <ReportLayoutSection number="4" title="Notes">
        <ul className="flex list-disc flex-col gap-2 pl-5">
          <li>Test separator 20-VA-1002 lined up to well N-4 from 09:00; results due 13 March.</li>
          <li>Cooling water pump 40-PA-4001 remains in maintenance until 13 March.</li>
          <li>Next standby start test of export pump B is 4 days overdue (WO-104458).</li>
        </ul>
      </ReportLayoutSection>
    </ReportPage>
  );
}

function ReportLayoutExportBar() {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl bg-base-background p-4">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium text-base-foreground">Daily production report · 11 March 2026</p>
        <p className="text-xs text-muted-foreground tabular-nums">2 pages · A4 portrait · generated 12 Mar, 06:15 UTC</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm">
          <IconShare aria-hidden="true" /> Share report
        </Button>
        <Button variant="secondary" size="sm">
          <IconPrinter aria-hidden="true" /> Print report
        </Button>
        <Button size="sm">
          <IconDownload aria-hidden="true" /> Download PDF
        </Button>
      </div>
    </div>
  );
}

function ReportLayoutGenerating() {
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl bg-base-background p-4">
      <p className="text-sm font-medium text-base-foreground">Monthly performance summary · February 2026</p>
      <LabelledProgress label="Generating PDF" value={5} max={8} valueText="Page 5 of 8" hint="Charts are rendered at print resolution. You can leave this page; the report appears under recent reports." />
    </div>
  );
}

function ReportLayoutRecentList() {
  return (
    <div className="flex w-full flex-col gap-2 rounded-xl bg-base-background p-4">
      <p className="text-sm font-medium text-base-foreground">Recent reports</p>
      <ul aria-label="Recent reports" className="flex flex-col divide-y divide-default">
        {RECENT_REPORTS.map((report) => (
          <li key={report.id} className="flex min-w-0 items-center gap-4 py-2.5">
            <IconFileText aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm text-base-foreground">{report.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                <span className="font-mono">{report.id}</span> · {report.period} · {report.pages} {report.pages === 1 ? 'page' : 'pages'}
              </p>
            </div>
            <span className="hidden w-36 shrink-0 md:block">
              <Badge variant={REPORT_STATE_BADGE[report.state]}>{report.state}</Badge>
            </span>
            <span className="hidden w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">{report.generated}</span>
            <IconAction label={`Download ${report.title}, ${report.period}`}>
              <IconDownload />
            </IconAction>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReportLayoutNoReports() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <IconFileText aria-hidden="true" />
      </EmptyStateIcon>
      <EmptyStateTitle as="h4">No reports for this period</EmptyStateTitle>
      <EmptyStateDescription>The daily report for 12 March is generated at 06:15 tomorrow, when the production day closes.</EmptyStateDescription>
    </EmptyState>
  );
}

function ReportLayoutDailyProduction() {
  return (
    <ReportPage
      label="Daily production report, page 1"
      className="mx-auto"
      header={<ReportHeader overline="Operations report" title="Daily production report" period="11 March 2026, 06:00–06:00" site="Nordkapp" generatedAt="12 Mar 2026, 06:15 UTC" documentId="NK-RPT-D-0311" />}
      footer={<ReportLayoutFooterStrip page={1} pages={2} documentId="NK-RPT-D-0311" />}
    >
      <ReportLayoutSection number="1" title="Key figures">
        <ReportLayoutDailyKpiTable />
      </ReportLayoutSection>
      <ReportLayoutSection number="2" title="Production">
        <p>Gas export was 4.21 MSm³, 0.29 under plan. The shortfall occurred while the recompressor was off load ({figureReference(1)}).</p>
        <ReportLayoutExportFigure number={1} />
      </ReportLayoutSection>
      <ReportLayoutSection number="3" title="Deviations">
        <ReportLayoutDeviations />
      </ReportLayoutSection>
    </ReportPage>
  );
}

function ReportLayoutShiftReport() {
  return (
    <ReportPage
      label="Shift report, night shift 11 March"
      className="mx-auto"
      header={<ReportHeader overline="Shift report" title="Night shift, 11 March" period="11 Mar 18:00 – 12 Mar 06:00" site="Nordkapp · control room" generatedAt="12 Mar 2026, 06:02 UTC" author="Liv Wold" />}
      footer={<ReportLayoutFooterStrip page={1} pages={1} documentId="NK-RPT-S-0311N" />}
    >
      <ReportLayoutSection number="1" title="Summary for the incoming shift">
        <p>Plant at full capacity since 19:45. Watch discharge temperature on the 1st stage compressor; it is 3.8 °C under its high limit and rising slowly.</p>
      </ReportLayoutSection>
      <ReportLayoutSection number="2" title="Events">
        <ReportLayoutTable label="Events during the shift" columns={SHIFT_EVENTS_COLUMNS} rows={SHIFT_EVENTS} />
      </ReportLayoutSection>
      <ReportLayoutSection number="3" title="Open at handover">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>4 open alarms: 1 high, 2 medium (1 shelved until 18:00), 1 low.</li>
          <li>WO-104482 complete; WO-104471 waiting for parts; WO-104479 planned for 13 March.</li>
          <li>Permit PTW-26-0421, confined space entry, suspended and not revalidated.</li>
        </ul>
      </ReportLayoutSection>
      <ReportLayoutSection number="4" title="Handover">
        <SignOffBlock label="Shift handover sign-off" signers={SHIFT_SIGNERS} />
      </ReportLayoutSection>
    </ReportPage>
  );
}

function ReportLayoutMonthlySummary() {
  return (
    <ReportPage
      label="Monthly performance summary, February 2026"
      className="mx-auto"
      header={<ReportHeader overline="Monthly report" title="Performance summary" status={<Badge variant="success">Final</Badge>} period="February 2026" site="Nordkapp" generatedAt="3 Mar 2026, 10:12 UTC" documentId="NK-RPT-M-0226" />}
      footer={<ReportLayoutFooterStrip page={1} pages={8} documentId="NK-RPT-M-0226" />}
    >
      <ReportLayoutSummaryText />
      <ReportLayoutSection number="1" title="Key figures">
        <ReportLayoutTable label="Key figures for February against plan" columns={KPI_COLUMNS} rows={MONTHLY_KPIS} />
      </ReportLayoutSection>
      <ReportLayoutSection number="2" title="Daily export">
        <Figure number={1} caption="Gas export per day in February against the 4.5 MSm³ plan. The two low days, 17 and 18 February, follow the first recompressor trip." source="Source: fiscal metering, daily totals.">
          <CategoryChart
            heightClassName="h-44"
            label="Gas export per day in February against the 4.5 plan; 17 and 18 February are the two low days"
            rows={REPORT_FEBRUARY}
            series={[{ key: 'actual', label: 'Gas export' }]}
            references={[{ value: 4.5, label: 'Plan 4.5' }]}
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            labelEvery={3}
            unit="MSm³"
            decimals={2}
          />
        </Figure>
      </ReportLayoutSection>
      <ReportLayoutSection number="3" title="Downtime">
        <ReportLayoutTable label="Downtime by cause, February 2026" columns={DOWNTIME_COLUMNS} rows={DOWNTIME_ROWS} totals={DOWNTIME_TOTALS} />
      </ReportLayoutSection>
    </ReportPage>
  );
}

function ReportLayoutIncidentCover() {
  return (
    <ReportPage label="Incident report cover" footer={<ReportLayoutFooterStrip page={1} pages={6} documentId="NK-RPT-I-0041" />}>
      <div className="flex flex-1 flex-col justify-center gap-10">
        <ReportHeader
          variant="cover"
          overline="Incident report"
          title="Recompressor trip on high vibration"
          status={<Badge variant="secondary">Draft</Badge>}
          period="11 March 2026, 13:46 UTC"
          site="Nordkapp · Gas compression, NK-23"
          generatedAt="11 Mar 2026, 17:30 UTC"
          author="Liv Wold, shift supervisor"
          documentId="NK-RPT-I-0041"
        />
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          {[
            ['Classification', 'Production loss, no injury'],
            ['Severity', 'Medium'],
            ['Equipment', '23-KA-9103 · Recompressor'],
            ['Lost export', '0.29 MSm³'],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-base-foreground tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </ReportPage>
  );
}

function ReportLayoutIncidentSummary() {
  return (
    <ReportPage
      label="Incident report summary"
      header={<ReportHeader variant="compact" title="Recompressor trip on high vibration" site="Nordkapp" period="11 March 2026" documentId="NK-RPT-I-0041" />}
      footer={<ReportLayoutFooterStrip page={2} pages={6} documentId="NK-RPT-I-0041" />}
    >
      <ReportLayoutSection number="1" title="What happened">
        <p>At 13:46 the recompressor tripped on drive-end vibration of 11.6 mm/s against a trip limit of 11.0. Vibration had been above its 7.1 mm/s high limit since 11:30.</p>
      </ReportLayoutSection>
      <ReportLayoutSection number="2" title="Sequence">
        <ReportLayoutTable
          dense
          label="Sequence of events"
          columns={SHIFT_EVENTS_COLUMNS}
          rows={[
            { time: '11:30', event: 'Vibration passes the high limit; alarm raised.', tag: '23-VT-92740' },
            { time: '11:42', event: 'Alarm acknowledged; load reduced 5 %.', tag: '23-KA-9103' },
            { time: '13:46', event: 'Trip on high-high vibration.', tag: '23-VT-92740' },
            { time: '19:45', event: 'Back on load after bearing inspection.', tag: '23-KA-9103' },
          ]}
        />
      </ReportLayoutSection>
      <ReportLayoutSection number="3" title="Immediate actions">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>Drive-end bearing inspected under WO-104482; wear found, within limits for restart.</li>
          <li>Vibration survey of all three compressors ordered (WO-104466).</li>
          <li>Bearing replacement proposed for the April stop.</li>
        </ul>
      </ReportLayoutSection>
    </ReportPage>
  );
}

export default definePage({
  id: 'reports',
  title: 'Reports',
  summary:
    'Print-like report layouts on a paper-proportioned surface: daily, shift, monthly and incident reports, and the parts they are made of. A report is read out of context, so every page says what it is, what period it covers and when it was produced.',
  guidance: {
    use: [
      'Head every report with title, period, site and generation time; repeat a short form on following pages.',
      'Number sections, figures and tables so the text and a meeting can refer to them.',
      'Lead with a summary a manager can stop after; put supporting tables in an appendix.',
      'Write the finding in every caption, not only what the figure is.',
    ],
    avoid: [
      'Interactive controls, tooltips and hover on the page; nothing on paper responds.',
      'Status colour as the only signal; reports are printed in grey and photocopied.',
      'Dashboard cards on a report page; use rules, type and white space.',
      'Relative times such as "2 h ago"; a report is read days later.',
    ],
  },
  source,
  sections: [
    {
      id: 'headers-and-footers',
      title: 'Headers and footers',
      description: 'What identifies a page when it is printed, forwarded or filed.',
      specimens: [
        {
          id: 'ReportLayoutHeaderStandard',
          title: 'Standard header',
          note: 'Pick it for the first page of any report: title, period, site, generation time and document number.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportHeader.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutHeaderStandard,
        },
        {
          id: 'ReportLayoutHeaderStatus',
          title: 'Header with review state',
          note: 'Pick it for reports that go through review: draft or final sits beside the title, the author below.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportHeader.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutHeaderStatus,
        },
        {
          id: 'ReportLayoutHeaderCover',
          title: 'Cover header',
          note: 'Pick it for a title page: a larger title with the report facts listed one per line.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportHeader.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutHeaderCover,
        },
        {
          id: 'ReportLayoutHeaderCompact',
          title: 'Running header',
          note: 'Pick it from page two on: one line that still names the report, the site and the period.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportHeader.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutHeaderCompact,
        },
        {
          id: 'ReportLayoutPageFooter',
          title: 'Page number and footer strip',
          note: 'Pick it at the bottom of every page: plant, document number, classification and page count.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutPageFooter,
        },
        {
          id: 'ReportLayoutSignOffFooter',
          title: 'Sign-off and approval footer',
          note: 'Pick it on reports that are approved: who prepared, reviewed and approved, with times.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/workflows/SignOffBlock.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutSignOffFooter,
        },
      ],
    },
    {
      id: 'text-blocks',
      title: 'Text blocks',
      description: 'Summary, numbered sections, deviations and notes.',
      specimens: [
        {
          id: 'ReportLayoutExecutiveSummary',
          title: 'Executive summary',
          note: 'Pick it first on a monthly or incident report: the finding in one sentence, three points, one decision.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutExecutiveSummary,
        },
        {
          id: 'ReportLayoutNumberedSection',
          title: 'Sections with numbered headings',
          note: 'Pick it for the body of a report: numbers let a meeting say "see 2.1" and find it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx', 'industrial/analytics/figureReference.ts'],
          Component: ReportLayoutNumberedSection,
        },
        {
          id: 'ReportLayoutDeviationList',
          title: 'Deviation list',
          note: 'Pick it for what did not go to plan: each deviation with its cause and the action taken.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutDeviationList,
        },
        {
          id: 'ReportLayoutNotes',
          title: 'Notes',
          note: 'Pick it for what the next reader should know but no table holds: short, dated, with tags.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutNotes,
        },
      ],
    },
    {
      id: 'figures-and-tables',
      title: 'Figures and tables',
      description: 'Numbered, captioned and sourced, so they can be referred to and lifted out.',
      specimens: [
        {
          id: 'ReportLayoutFigureCaption',
          title: 'Figure with caption and reference',
          note: 'Pick it for every chart in a report: a number, a caption with the finding, the source, and a reference from the text.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/Figure.tsx', 'industrial/analytics/figureReference.ts', 'industrial/charts/TrendChart.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutFigureCaption,
        },
        {
          id: 'ReportLayoutKpiTable',
          title: 'KPI table',
          note: 'Pick it for the key figures of a period: actual, plan and the difference, in aligned columns.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/Figure.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutKpiTable,
        },
        {
          id: 'ReportLayoutSummaryTable',
          title: 'Summary table with totals',
          note: 'Pick it when rows add up: the totals row sits under a heavier rule.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/Figure.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutSummaryTable,
        },
        {
          id: 'ReportLayoutAppendixTable',
          title: 'Appendix table',
          note: 'Pick it for supporting data at the back: denser type, tags in monospace, lettered numbering.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/Figure.tsx', 'industrial/analytics/ReportPage.tsx'],
          Component: ReportLayoutAppendixTable,
        },
      ],
    },
    {
      id: 'export-and-library',
      title: 'Export and report list',
      description: 'The screen controls around a report: getting it out and finding earlier ones.',
      specimens: [
        {
          id: 'ReportLayoutExportBar',
          title: 'Export bar',
          note: 'Pick it above a report preview: what will be exported, then share, print and download.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          Component: ReportLayoutExportBar,
        },
        {
          id: 'ReportLayoutGenerating',
          title: 'Generating',
          note: 'Pick it while a long report renders: progress by page and where the result will appear.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ReportLayoutGenerating,
        },
        {
          id: 'ReportLayoutRecentList',
          title: 'Recent reports',
          note: 'Pick it as the report library: title, number, period, review state and a download per row.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          surface: 'muted',
          uses: ['patterns/collections/IconAction.tsx'],
          Component: ReportLayoutRecentList,
        },
        {
          id: 'ReportLayoutNoReports',
          title: 'No reports yet',
          note: 'Pick it when a period has no report; say when the next one is generated.',
          origin: 'custom',
          size: 'sm',
          align: 'stretch',
          Component: ReportLayoutNoReports,
        },
      ],
    },
    {
      id: 'report-pages',
      title: 'Report pages',
      description: 'Whole pages in A4 proportions, built from the parts above.',
      specimens: [
        {
          id: 'ReportLayoutIncidentCover',
          title: 'Incident report cover',
          note: 'Pick it as page one of an incident report: what, when, where, how severe and who wrote it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx', 'industrial/analytics/ReportHeader.tsx'],
          Component: ReportLayoutIncidentCover,
        },
        {
          id: 'ReportLayoutIncidentSummary',
          title: 'Incident summary page',
          note: 'Pick it as page two: what happened, the sequence with times and tags, and the immediate actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx', 'industrial/analytics/ReportHeader.tsx'],
          Component: ReportLayoutIncidentSummary,
        },
        {
          id: 'ReportLayoutDailyProduction',
          title: 'Daily production report',
          note: 'Pick it for the report sent every morning: key figures, the export trend and the deviations on one page.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx', 'industrial/analytics/ReportHeader.tsx', 'industrial/analytics/Figure.tsx', 'industrial/charts/TrendChart.tsx'],
          Component: ReportLayoutDailyProduction,
        },
        {
          id: 'ReportLayoutShiftReport',
          title: 'Shift report',
          note: 'Pick it for handover on paper: a summary for the incoming shift, events, what is open and two signatures.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx', 'industrial/analytics/ReportHeader.tsx', 'industrial/workflows/SignOffBlock.tsx'],
          Component: ReportLayoutShiftReport,
        },
        {
          id: 'ReportLayoutMonthlySummary',
          title: 'Monthly performance summary',
          note: 'Pick it for management reporting: executive summary, key figures, the month by day and downtime by cause.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          surface: 'muted',
          uses: ['industrial/analytics/ReportPage.tsx', 'industrial/analytics/ReportHeader.tsx', 'industrial/analytics/Figure.tsx', 'industrial/charts/CategoryChart.tsx'],
          Component: ReportLayoutMonthlySummary,
        },
      ],
    },
  ],
});
