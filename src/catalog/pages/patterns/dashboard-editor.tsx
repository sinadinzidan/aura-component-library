import { chartSeriesColor } from '@cognite/aura/chart';
import { Kbd } from '@cognite/aura/components/kbd';
import {
  IconAlertTriangle,
  IconChartBar,
  IconChartDonut,
  IconChartLine,
  IconGauge,
  IconLayoutList,
  IconListDetails,
} from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { CategoryChart } from '../../../library/industrial/charts/CategoryChart';
import { TrendChart } from '../../../library/industrial/charts/TrendChart';
import { KpiTile } from '../../../library/industrial/KpiTile';
import { AlarmList } from '../../../library/industrial/operations/AlarmList';
import { isOpenAlarm } from '../../../library/industrial/operations/alarms';
import { BreakdownList } from '../../../library/patterns/collections/BreakdownList';
import { StatRow } from '../../../library/patterns/collections/StatRow';
import { SaveBar } from '../../../library/patterns/data-entry/SaveBar';
import { DonutBreakdown } from '../../../library/patterns/product/DonutBreakdown';
import { WidgetFrame } from '../../../library/patterns/product/WidgetFrame';
import { ThemeScope } from '../../../library/themes/ThemeScope';
import { DashboardCanvas } from '../../../library/tools/dashboard-editor/DashboardCanvas';
import { DashboardEditor } from '../../../library/tools/dashboard-editor/DashboardEditor';
import type { DashboardPreset, DashboardWidgetType } from '../../../library/tools/dashboard-editor/DashboardEditor';
import { DashboardEmptyState } from '../../../library/tools/dashboard-editor/DashboardEmptyState';
import type { EditorWidget } from '../../../library/tools/dashboard-editor/editorReducer';
import { EditorToolbar } from '../../../library/tools/dashboard-editor/EditorToolbar';
import { moveItem } from '../../../library/tools/dashboard-editor/gridLayout';
import { LayoutPresetPicker } from '../../../library/tools/dashboard-editor/LayoutPresetPicker';
import { WidgetChrome } from '../../../library/tools/dashboard-editor/WidgetChrome';
import { WidgetPalette } from '../../../library/tools/dashboard-editor/WidgetPalette';
import { WidgetSettingsPopover } from '../../../library/tools/dashboard-editor/WidgetSettingsPopover';
import { ALARMS, ASSETS, PLANT_KPIS, WORK_ORDERS, findAsset } from '../../data/plant';
import { HOUR, MINUTE, formatAgo, makeSeries } from '../../data/series';
import { definePage } from '../../types';

import source from './dashboard-editor.tsx?raw';

const DASH_RANGES = [
  { value: '8h', label: 'Last 8 hours' },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d', label: 'Last 7 days' },
];

const DASH_SIZES = [
  { id: 'small', label: 'Small', w: 3, h: 2 },
  { id: 'medium', label: 'Medium', w: 4, h: 4 },
  { id: 'wide', label: 'Wide', w: 6, h: 4 },
  { id: 'large', label: 'Large', w: 8, h: 5 },
  { id: 'full', label: 'Full width', w: 12, h: 4 },
];

const DASH_RANGE_SHAPE: Record<string, { points: number; stepMs: number }> = {
  '8h': { points: 32, stepMs: 15 * MINUTE },
  '24h': { points: 48, stepMs: 30 * MINUTE },
  '7d': { points: 56, stepMs: 3 * HOUR },
};

const DASH_RANGE_NAME: Record<string, string> = { '8h': 'last 8 hours', '24h': 'last 24 hours', '7d': 'last 7 days' };

const DASH_WEEKLY = [
  { site: 'Nordkapp', current: 37, previous: 31 },
  { site: 'Hammerfest', current: 22, previous: 26 },
  { site: 'Valhall Sør', current: 18, previous: 15 },
  { site: 'Stord', current: 9, previous: 9 },
];

const DASH_ORDER_TYPES = (['corrective', 'preventive', 'inspection', 'modification'] as const).map((type) => ({
  id: type,
  label: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
  value: WORK_ORDERS.filter((order) => order.type === type).length,
}));

const DASH_OPEN_ALARMS = ALARMS.filter(isOpenAlarm);

const DASH_HEALTH = [...ASSETS]
  .filter((asset) => asset.healthScore < 80)
  .sort((a, b) => a.healthScore - b.healthScore)
  .map((asset) => ({ id: asset.id, label: asset.name, detail: asset.tag, value: asset.healthScore }));

function dashTrendPoints(range: string, seed: number) {
  const shape = DASH_RANGE_SHAPE[range] ?? DASH_RANGE_SHAPE['24h'];
  return makeSeries({ seed, points: shape.points, stepMs: shape.stepMs, base: 48.6, amplitude: 2.2, noise: 0.5, cycles: range === '7d' ? 7 : 1.5, decimals: 1 });
}

function DashKpiBody({ widget }: { widget: EditorWidget }) {
  const kpi = PLANT_KPIS.availability;
  return (
    <KpiTile
      className="h-full"
      label={widget.title}
      value={kpi.value}
      unit={kpi.unit}
      decimals={1}
      delta={{ reference: kpi.previous, goodDirection: 'up', caption: 'vs last week' }}
      target={{ value: kpi.target, label: 'Target' }}
    />
  );
}

function DashTrendBody({ widget }: { widget: EditorWidget }) {
  return (
    <WidgetFrame title={widget.title} description={`23-PT-92531, ${DASH_RANGE_NAME[widget.range] ?? widget.range}`}>
      <TrendChart
        className="h-full min-h-0"
        heightClassName="min-h-0 flex-1"
        label={`Discharge pressure over the ${DASH_RANGE_NAME[widget.range] ?? widget.range}, between 44 and 53 barg`}
        series={[{ key: 'p', label: 'Discharge pressure', points: dashTrendPoints(widget.range, 11), color: chartSeriesColor(1) }]}
        limits={[{ value: 52, label: 'High 52', tone: 'warning' }]}
        yDomain={[40, 56]}
        yTicks={[40, 48, 56]}
        unit="barg"
        decimals={1}
        compact
      />
    </WidgetFrame>
  );
}

function DashCategoryBody({ widget }: { widget: EditorWidget }) {
  return (
    <WidgetFrame title={widget.title} description="This week against last week">
      <CategoryChart
        className="h-full min-h-0"
        heightClassName="min-h-0 flex-1"
        label="Work orders completed per site this week and last week; Nordkapp completed the most with 37"
        rows={DASH_WEEKLY}
        categoryKey="site"
        series={[
          { key: 'current', label: 'This week' },
          { key: 'previous', label: 'Last week', color: 'var(--color-chart-neutral-300)' },
        ]}
        legend
      />
    </WidgetFrame>
  );
}

function DashAlarmsBody({ widget }: { widget: EditorWidget }) {
  return (
    <WidgetFrame title={widget.title} description={`${DASH_OPEN_ALARMS.length} open`}>
      <div className="min-h-0 w-full overflow-hidden">
        <AlarmList
          label="Open alarms, most severe first"
          alarms={DASH_OPEN_ALARMS}
          density="compact"
          formatAge={formatAgo}
          getAssetName={(alarm) => findAsset(ALARMS.find((entry) => entry.id === alarm.id)?.assetId ?? '')?.tag}
        />
      </div>
    </WidgetFrame>
  );
}

function DashDonutBody({ widget }: { widget: EditorWidget }) {
  return (
    <WidgetFrame title={widget.title} description="By work type">
      <DonutBreakdown label="Work orders by type" segments={DASH_ORDER_TYPES} totalLabel="orders" legend={widget.w >= 5 ? 'side' : 'below'} />
    </WidgetFrame>
  );
}

function DashBreakdownBody({ widget }: { widget: EditorWidget }) {
  return (
    <WidgetFrame title={widget.title} description="Health score under 80">
      <BreakdownList label="Assets with a health score under 80" items={DASH_HEALTH} unit="%" ranked limit={4} />
    </WidgetFrame>
  );
}

function DashStatsBody({ widget }: { widget: EditorWidget }) {
  return (
    <WidgetFrame title={widget.title} description="Plant, this shift">
      <StatRow
        label="Plant figures"
        stats={[
          { id: 'oee', label: 'OEE', value: '82.7', unit: '%' },
          { id: 'export', label: 'Gas export', value: '4.38', unit: 'MSm³/d' },
          { id: 'flaring', label: 'Flaring', value: '12.4', unit: 'kSm³/d' },
        ]}
      />
    </WidgetFrame>
  );
}

const DASH_TYPES: readonly DashboardWidgetType[] = [
  { type: 'kpi', label: 'KPI tile', description: 'One headline number with change and target.', icon: <IconGauge />, w: 3, h: 2, minW: 2, minH: 2, render: (widget) => <DashKpiBody widget={widget} /> },
  {
    type: 'trend',
    label: 'Trend chart',
    description: 'One tag over time with its limit.',
    icon: <IconChartLine />,
    w: 6,
    h: 4,
    minW: 3,
    minH: 3,
    hasRange: true,
    render: (widget) => <DashTrendBody widget={widget} />,
  },
  { type: 'category', label: 'Comparison bars', description: 'Work completed per site, this week and last.', icon: <IconChartBar />, w: 6, h: 4, minW: 4, minH: 3, render: (widget) => <DashCategoryBody widget={widget} /> },
  { type: 'alarms', label: 'Alarm list', description: 'Open alarms, most severe first.', icon: <IconAlertTriangle />, w: 4, h: 5, minW: 3, minH: 4, render: (widget) => <DashAlarmsBody widget={widget} /> },
  { type: 'donut', label: 'Work order split', description: 'Orders by type as a donut with legend.', icon: <IconChartDonut />, w: 4, h: 4, minW: 3, minH: 3, render: (widget) => <DashDonutBody widget={widget} /> },
  { type: 'breakdown', label: 'Weakest assets', description: 'Ranked list of the lowest health scores.', icon: <IconListDetails />, w: 4, h: 3, minW: 3, minH: 3, render: (widget) => <DashBreakdownBody widget={widget} /> },
  { type: 'stats', label: 'Figure row', description: 'Three plant figures side by side.', icon: <IconLayoutList />, w: 6, h: 2, minW: 4, minH: 2, render: (widget) => <DashStatsBody widget={widget} /> },
];

const DASH_PALETTE = DASH_TYPES.map(({ type, label, description, icon, w, h }) => ({ type, label, description, icon, w, h }));

function dashWidget(id: string, type: string, title: string, x: number, y: number, w: number, h: number): EditorWidget {
  const def = DASH_TYPES.find((entry) => entry.type === type);
  return { id, type, title, range: '24h', x, y, w, h, minW: def?.minW, minH: def?.minH };
}

const DASH_DEFAULT: readonly EditorWidget[] = [
  dashWidget('a', 'kpi', 'Availability', 0, 0, 3, 2),
  dashWidget('b', 'kpi', 'Plant availability, 7 days', 3, 0, 3, 2),
  dashWidget('c', 'alarms', 'Open alarms', 6, 0, 6, 5),
  dashWidget('d', 'trend', 'Discharge pressure', 0, 2, 6, 4),
  dashWidget('e', 'donut', 'Work orders', 6, 5, 6, 4),
  dashWidget('f', 'category', 'Work completed by site', 0, 6, 6, 4),
];

const DASH_PRESETS: readonly DashboardPreset[] = [
  { id: 'default', name: 'Operations', description: 'KPIs, alarms and live trend.', widgets: DASH_DEFAULT },
  {
    id: 'wall',
    name: 'Wall board',
    description: 'Large numbers for the control room.',
    widgets: [
      dashWidget('w1', 'kpi', 'Availability', 0, 0, 4, 2),
      dashWidget('w2', 'kpi', 'OEE', 4, 0, 4, 2),
      dashWidget('w3', 'kpi', 'Gas export', 8, 0, 4, 2),
      dashWidget('w4', 'trend', 'Discharge pressure', 0, 2, 12, 5),
    ],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Work orders and weak assets.',
    widgets: [
      dashWidget('m1', 'stats', 'Plant figures', 0, 0, 12, 2),
      dashWidget('m2', 'donut', 'Work orders', 0, 2, 4, 4),
      dashWidget('m3', 'breakdown', 'Weakest assets', 4, 2, 4, 4),
      dashWidget('m4', 'category', 'Work completed by site', 8, 2, 4, 4),
    ],
  },
];

const DASH_SMALL: readonly EditorWidget[] = [
  dashWidget('s1', 'kpi', 'Availability', 0, 0, 4, 2),
  dashWidget('s2', 'kpi', 'OEE', 4, 0, 4, 2),
  dashWidget('s3', 'kpi', 'Gas export', 8, 0, 4, 2),
];

const dashNoop = () => undefined;

function DashFrame({ height, children }: { height: string; children: ReactNode }) {
  return <div className={`w-full overflow-hidden rounded-xl border border-default bg-base-background ${height}`}>{children}</div>;
}

function DashEditorFull() {
  return (
    <DashFrame height="h-[44rem]">
      <DashboardEditor
        title="Gas compression"
        description="Nordkapp · NK-23 · shared with the control room"
        widgetTypes={DASH_TYPES}
        initialWidgets={DASH_DEFAULT}
        presets={DASH_PRESETS}
        sizes={DASH_SIZES}
        ranges={DASH_RANGES}
        defaultMode="edit"
        defaultPaletteOpen
      />
    </DashFrame>
  );
}

function DashEditorViewMode() {
  return (
    <DashFrame height="h-[44rem]">
      <DashboardEditor
        title="Gas compression"
        description="Nordkapp · NK-23 · shared with the control room"
        widgetTypes={DASH_TYPES}
        initialWidgets={DASH_DEFAULT}
        presets={DASH_PRESETS}
        sizes={DASH_SIZES}
        ranges={DASH_RANGES}
        defaultMode="view"
      />
    </DashFrame>
  );
}

function DashEditorChromeRest() {
  return (
    <div className="h-40 w-full max-w-xs">
      <WidgetChrome editing sizeLabel="3 × 2" actions={<span className="px-2 text-xs text-muted-foreground">Actions</span>}>
        <DashKpiBody widget={DASH_DEFAULT[0]} />
      </WidgetChrome>
    </div>
  );
}

function DashEditorChromeSelected() {
  return (
    <div className="h-40 w-full max-w-xs">
      <WidgetChrome editing selected sizeLabel="3 × 2" onResizeStart={dashNoop} actions={<span className="px-2 text-xs text-muted-foreground">Actions</span>}>
        <DashKpiBody widget={DASH_DEFAULT[0]} />
      </WidgetChrome>
    </div>
  );
}

function DashEditorResizeHandles() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="h-36 w-full">
        <WidgetChrome editing selected sizeLabel="4 × 2" onResizeStart={dashNoop}>
          <WidgetFrame title="Discharge pressure" description="Last 24 hours">
            <p className="text-sm text-muted-foreground">Handles sit on the right edge, the bottom edge and the corner.</p>
          </WidgetFrame>
        </WidgetChrome>
      </div>
      <p className="text-xs text-muted-foreground">
        Drag a handle to resize in whole cells. With the widget focused, <Kbd>Shift</Kbd> + arrow keys do the same.
      </p>
    </div>
  );
}

function DashEditorDropPlaceholder() {
  const origin = DASH_SMALL;
  const lifted = moveItem(origin, 's1', 4, 0, 12);
  return (
    <div className="w-full">
      <DashboardCanvas
        label="Drop preview"
        widgets={lifted}
        rowHeight={56}
        gap={12}
        editing
        selectedId="s1"
        previewOffset={{ dx: 18, dy: 26 }}
        drag={{ id: 's1', kind: 'move', origin }}
        renderWidget={(widget) => <DashKpiBody widget={widget} />}
      />
    </div>
  );
}

function DashEditorPalette() {
  return (
    <div className="w-full max-w-sm">
      <WidgetPalette widgets={DASH_PALETTE.slice(0, 5)} counts={{ kpi: 2, trend: 1 }} onAdd={dashNoop} />
    </div>
  );
}

function DashEditorSettings() {
  return (
    <div className="flex items-center gap-3">
      <WidgetSettingsPopover value={{ title: 'Discharge pressure', w: 6, h: 4, range: '24h' }} sizes={DASH_SIZES} ranges={DASH_RANGES} onApply={dashNoop} />
      <span className="text-sm text-muted-foreground">Open the cog to change title, size and range.</span>
    </div>
  );
}

function DashEditorToolbarEdit() {
  return (
    <div className="w-full">
      <EditorToolbar title="Gas compression" description="Nordkapp · NK-23" mode="edit" onModeChange={dashNoop} canUndo onUndo={dashNoop} onReset={dashNoop} onTogglePalette={dashNoop} />
    </div>
  );
}

function DashEditorToolbarView() {
  return (
    <div className="w-full">
      <EditorToolbar title="Gas compression" description="Nordkapp · NK-23" mode="view" onModeChange={dashNoop} />
    </div>
  );
}

function DashEditorEmpty() {
  return (
    <div className="w-full max-w-2xl">
      <DashboardEmptyState
        suggestions={[
          { type: 'kpi', label: 'KPI tile' },
          { type: 'trend', label: 'Trend chart' },
          { type: 'alarms', label: 'Alarm list' },
        ]}
        onAdd={dashNoop}
        onBrowse={dashNoop}
      />
    </div>
  );
}

function DashEditorPresets() {
  return (
    <div className="w-full">
      <LayoutPresetPicker presets={DASH_PRESETS.map((preset) => ({ ...preset, items: preset.widgets }))} activeId="default" onApply={dashNoop} />
    </div>
  );
}

function DashEditorUnsavedBar() {
  return (
    <div className="w-full max-w-2xl">
      <SaveBar dirtyCount={3} onSave={dashNoop} onDiscard={dashNoop} saveLabel="Save dashboard" />
    </div>
  );
}

function DashEditorReadOnly() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <EditorToolbar title="Gas compression" mode="view" onModeChange={dashNoop} readOnlyReason="Shared by Liv Wold. Ask her for edit access." />
      <DashboardCanvas label="Read-only dashboard" widgets={DASH_SMALL} rowHeight={56} gap={12} renderWidget={(widget) => <DashKpiBody widget={widget} />} />
    </div>
  );
}

function DashEditorNarrow() {
  return (
    <div className="h-[34rem] w-full max-w-sm overflow-hidden rounded-xl border border-default bg-base-background">
      <DashboardEditor
        title="Gas compression"
        widgetTypes={DASH_TYPES}
        initialWidgets={DASH_DEFAULT.slice(0, 4)}
        sizes={DASH_SIZES}
        ranges={DASH_RANGES}
        defaultMode="edit"
        layout="stacked"
      />
    </div>
  );
}

function DashEditorDark() {
  return (
    <ThemeScope preset="control-room" className="w-full">
      <DashFrame height="h-[32rem]">
        <DashboardEditor
          title="Gas compression"
          widgetTypes={DASH_TYPES}
          initialWidgets={DASH_DEFAULT.slice(0, 4)}
          sizes={DASH_SIZES}
          ranges={DASH_RANGES}
          defaultMode="edit"
        />
      </DashFrame>
    </ThemeScope>
  );
}

export default definePage({
  id: 'dashboard-editor',
  title: 'Dashboard editor',
  summary: 'A grid dashboard people arrange themselves: drag to move, resize from a handle, add from a list, and undo anything.',
  guidance: {
    use: [
      'Let users own their overview: arrange, add, remove and rename widgets, then save as one change.',
      'Snap to a coarse grid; whole-cell moves keep layouts tidy without alignment tools.',
      'Make every drag possible from the keyboard and announce where the widget landed.',
    ],
    avoid: [
      'Handles and outlines in view mode; the dashboard should look finished when it is not being edited.',
      'Letting widgets overlap. Push neighbours down and pack the layout upward instead.',
      'Hiding the way back: keep undo, reset and discard within reach while editing.',
    ],
  },
  source,
  sections: [
    {
      id: 'editor',
      title: 'The editor',
      description: 'Working editors: drag, resize, add, undo and save inside the frame.',
      specimens: [
        {
          id: 'DashEditorFull',
          title: 'Full editor',
          note: 'Pick it for a user-owned dashboard; every change is one undo step and counts toward the save bar.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'tools/dashboard-editor/DashboardEditor.tsx',
            'tools/dashboard-editor/DashboardCanvas.tsx',
            'patterns/product/WidgetFrame.tsx',
            'industrial/KpiTile.tsx',
            'industrial/charts/TrendChart.tsx',
          ],
          Component: DashEditorFull,
        },
        {
          id: 'DashEditorViewMode',
          title: 'View mode',
          note: 'Pick it for everyone who only reads the dashboard: no outlines, handles or actions.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/dashboard-editor/DashboardEditor.tsx'],
          Component: DashEditorViewMode,
        },
      ],
    },
    {
      id: 'parts',
      title: 'Parts',
      description: 'The pieces the editor is built from, shown on their own.',
      specimens: [
        {
          id: 'DashEditorChromeRest',
          title: 'Widget chrome, resting',
          note: 'Pick it to show an editable widget that is not selected: a dashed outline and its actions.',
          origin: 'custom',
          uses: ['tools/dashboard-editor/WidgetChrome.tsx'],
          Component: DashEditorChromeRest,
        },
        {
          id: 'DashEditorChromeSelected',
          title: 'Widget chrome, selected',
          note: 'Pick it for the widget that has focus: a solid outline, its size in cells and resize handles.',
          origin: 'custom',
          uses: ['tools/dashboard-editor/WidgetChrome.tsx'],
          Component: DashEditorChromeSelected,
        },
        {
          id: 'DashEditorResizeHandles',
          title: 'Resize handles',
          note: 'Pick it to explain that the edge and the corner both resize, and the keyboard does the same.',
          origin: 'custom',
          uses: ['tools/dashboard-editor/WidgetChrome.tsx'],
          Component: DashEditorResizeHandles,
        },
        {
          id: 'DashEditorDropPlaceholder',
          title: 'Drop placeholder',
          note: 'Pick it while a widget is lifted: the cell it will take is outlined and the column guides appear.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/dashboard-editor/DashboardCanvas.tsx'],
          Component: DashEditorDropPlaceholder,
        },
        {
          id: 'DashEditorPalette',
          title: 'Widget palette',
          note: 'Pick it for the Add widget panel: each row says what the widget shows and its default size.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/dashboard-editor/WidgetPalette.tsx'],
          Component: DashEditorPalette,
        },
        {
          id: 'DashEditorSettings',
          title: 'Settings popover',
          note: 'Pick it for per-widget title, size preset and time range, applied as one change.',
          origin: 'custom',
          size: 'md',
          uses: ['tools/dashboard-editor/WidgetSettingsPopover.tsx'],
          Component: DashEditorSettings,
        },
        {
          id: 'DashEditorToolbarEdit',
          title: 'Toolbar, editing',
          note: 'Pick it for the bar above the grid while editing: undo, redo, reset, add and done.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/dashboard-editor/EditorToolbar.tsx'],
          Component: DashEditorToolbarEdit,
        },
        {
          id: 'DashEditorToolbarView',
          title: 'Toolbar, viewing',
          note: 'Pick it for readers who can edit: the title and a single way into edit mode.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/dashboard-editor/EditorToolbar.tsx'],
          Component: DashEditorToolbarView,
        },
      ],
    },
    {
      id: 'states',
      title: 'States and variants',
      description: 'Empty, read-only, narrow and dark, plus layout presets and unsaved changes.',
      specimens: [
        {
          id: 'DashEditorEmpty',
          title: 'Empty dashboard',
          note: 'Pick it for a new dashboard: say what goes here and offer three starting widgets.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['tools/dashboard-editor/DashboardEmptyState.tsx'],
          Component: DashEditorEmpty,
        },
        {
          id: 'DashEditorUnsavedBar',
          title: 'Unsaved changes',
          note: 'Pick it to gather edits into one save instead of saving every drag.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/data-entry/SaveBar.tsx'],
          Component: DashEditorUnsavedBar,
        },
        {
          id: 'DashEditorPresets',
          title: 'Layout presets',
          note: 'Pick it to start from an arrangement; applying one replaces the layout in a single undoable step.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/dashboard-editor/LayoutPresetPicker.tsx', 'tools/dashboard-editor/LayoutThumbnail.tsx'],
          Component: DashEditorPresets,
        },
        {
          id: 'DashEditorReadOnly',
          title: 'Read-only notice',
          note: 'Pick it when the viewer cannot edit: say who owns the dashboard and how to get access.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['tools/dashboard-editor/EditorToolbar.tsx', 'tools/dashboard-editor/DashboardCanvas.tsx'],
          Component: DashEditorReadOnly,
        },
        {
          id: 'DashEditorNarrow',
          title: 'Narrow reflow',
          note: 'Pick it for phones and side panels: widgets stack in reading order and arranging is turned off.',
          origin: 'custom',
          size: 'md',
          align: 'start',
          uses: ['tools/dashboard-editor/DashboardEditor.tsx'],
          Component: DashEditorNarrow,
        },
        {
          id: 'DashEditorDark',
          title: 'Dark scope',
          note: 'Pick it to check outlines, handles and chart colours on a dark control-room surface.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['tools/dashboard-editor/DashboardEditor.tsx', 'themes/ThemeScope.tsx'],
          Component: DashEditorDark,
        },
      ],
    },
  ],
});
