export type AreaId = 'foundations' | 'primitives' | 'patterns' | 'industrial' | 'templates';

export type ManifestPage = {
  id: string;
  title: string;
  /** One line shown in navigation overviews and search. */
  blurb: string;
};

export type ManifestGroup = {
  id: string;
  title: string;
  pages: readonly ManifestPage[];
};

export type ManifestArea = {
  id: AreaId;
  title: string;
  blurb: string;
  groups: readonly ManifestGroup[];
};

/**
 * The whole library, in navigation order. A page listed here is implemented by
 * `src/catalog/pages/<area>/<page id>.tsx`; until that file exists the page shows as planned.
 */
export const MANIFEST: readonly ManifestArea[] = [
  {
    id: 'foundations',
    title: 'Foundations',
    blurb: 'The tokens everything else is built from: colour, type, space, shape and icons.',
    groups: [
      {
        id: 'tokens',
        title: 'Tokens',
        pages: [
          { id: 'colors', title: 'Colors', blurb: 'Base, status, decorative and chart tokens.' },
          { id: 'typography', title: 'Typography', blurb: 'Type scale, weights and text roles.' },
          { id: 'spacing-and-shape', title: 'Spacing and shape', blurb: 'Spacing scale, radius and borders.' },
          { id: 'elevation', title: 'Elevation', blurb: 'Shadows, focus rings and surfaces.' },
          { id: 'icons', title: 'Icons', blurb: 'System icons, sizes and pairing rules.' },
        ],
      },
    ],
  },
  {
    id: 'primitives',
    title: 'Primitives',
    blurb: 'Every Aura primitive in at least 20 deliberate variants.',
    groups: [
      {
        id: 'actions',
        title: 'Actions',
        pages: [
          { id: 'button', title: 'Button', blurb: 'Triggers an action or event.' },
          { id: 'button-group', title: 'Button group', blurb: 'Joins related buttons into one control.' },
          { id: 'toggle', title: 'Toggle', blurb: 'A two-state button.' },
          { id: 'segmented-control', title: 'Segmented control', blurb: 'Switches between a few views.' },
          { id: 'toolbar', title: 'Toolbar', blurb: 'A row of grouped controls.' },
          { id: 'action-toolbar', title: 'Action toolbar', blurb: 'Actions for the current selection.' },
          { id: 'dropdown-menu', title: 'Dropdown menu', blurb: 'A menu of actions behind a trigger.' },
          { id: 'kbd', title: 'Kbd', blurb: 'Keyboard keys and shortcuts.' },
        ],
      },
      {
        id: 'forms',
        title: 'Forms',
        pages: [
          { id: 'input', title: 'Input', blurb: 'Single-line text entry.' },
          { id: 'input-group', title: 'Input group', blurb: 'Inputs with addons, icons and buttons.' },
          { id: 'textarea', title: 'Textarea', blurb: 'Multi-line text entry.' },
          { id: 'label', title: 'Label', blurb: 'Names a form control.' },
          { id: 'helper-text', title: 'Helper text', blurb: 'Hints and validation under a control.' },
          { id: 'checkbox', title: 'Checkbox', blurb: 'Selects any number of options.' },
          { id: 'radio-group', title: 'Radio group', blurb: 'Selects exactly one option.' },
          { id: 'switch', title: 'Switch', blurb: 'Turns a setting on or off immediately.' },
          { id: 'slider', title: 'Slider', blurb: 'Picks a value or range on a track.' },
          { id: 'select', title: 'Select', blurb: 'Picks one option from a list.' },
          { id: 'combobox', title: 'Combobox', blurb: 'Searchable single or multi select.' },
          { id: 'search', title: 'Search', blurb: 'A search field with clear.' },
          { id: 'calendar', title: 'Calendar', blurb: 'A month grid for picking dates.' },
          { id: 'date-time-pickers', title: 'Date and time pickers', blurb: 'Date, time and range pickers.' },
        ],
      },
      {
        id: 'data-display',
        title: 'Data display',
        pages: [
          { id: 'avatar', title: 'Avatar', blurb: 'People, teams and entities.' },
          { id: 'badge', title: 'Badge', blurb: 'Short status and category labels.' },
          { id: 'count', title: 'Count', blurb: 'A number with an optional unit.' },
          { id: 'card', title: 'Card', blurb: 'Groups related content and actions.' },
          { id: 'item', title: 'Item', blurb: 'A row in a list or menu.' },
          { id: 'tree', title: 'Tree', blurb: 'Hierarchies you can expand and select.' },
          { id: 'data-grid', title: 'Data grid', blurb: 'Virtualised, sortable tables.' },
          { id: 'chart', title: 'Chart', blurb: 'Line, bar, area and pie charts.' },
          { id: 'code-block', title: 'Code block', blurb: 'Highlighted, copyable code.' },
          { id: 'separator', title: 'Separator', blurb: 'Divides unrelated groups.' },
          { id: 'scroll-area', title: 'Scroll area', blurb: 'Scrollable regions with themed bars.' },
          { id: 'overflow-list', title: 'Overflow list', blurb: 'Collapses items that do not fit.' },
        ],
      },
      {
        id: 'feedback',
        title: 'Feedback',
        pages: [
          { id: 'alert', title: 'Alert', blurb: 'Inline messages in the task flow.' },
          { id: 'banner', title: 'Banner', blurb: 'Page-level announcements.' },
          { id: 'sonner-toast', title: 'Toast', blurb: 'Brief confirmations after an action.' },
          { id: 'progress', title: 'Progress', blurb: 'How far a known task has come.' },
          { id: 'loader', title: 'Loader', blurb: 'Waiting with unknown layout.' },
          { id: 'skeleton', title: 'Skeleton', blurb: 'Placeholders for known layout.' },
          { id: 'shimmer', title: 'Shimmer', blurb: 'Animated text while content streams.' },
          { id: 'empty-state', title: 'Empty state', blurb: 'What to show when there is nothing.' },
        ],
      },
      {
        id: 'navigation',
        title: 'Navigation',
        pages: [
          { id: 'breadcrumb', title: 'Breadcrumb', blurb: 'Where the user is in a hierarchy.' },
          { id: 'tabs', title: 'Tabs', blurb: 'Switches between sections of a page.' },
          { id: 'pagination', title: 'Pagination', blurb: 'Moves through pages of results.' },
          { id: 'topbar', title: 'Topbar', blurb: 'The app header strip.' },
          { id: 'command', title: 'Command', blurb: 'Searchable command palettes.' },
        ],
      },
      {
        id: 'overlays',
        title: 'Overlays and disclosure',
        pages: [
          { id: 'dialog', title: 'Dialog', blurb: 'Focused tasks and confirmations.' },
          { id: 'popover', title: 'Popover', blurb: 'Rich content anchored to a trigger.' },
          { id: 'hover-card', title: 'Hover card', blurb: 'A preview on hover.' },
          { id: 'tooltip', title: 'Tooltip', blurb: 'A short label on hover or focus.' },
          { id: 'accordion', title: 'Accordion', blurb: 'Stacked sections that expand.' },
          { id: 'collapsible', title: 'Collapsible', blurb: 'One region that shows and hides.' },
        ],
      },
      {
        id: 'ai',
        title: 'AI and conversation',
        pages: [
          { id: 'conversation', title: 'Conversation', blurb: 'The scrolling message thread.' },
          { id: 'message', title: 'Message', blurb: 'User and assistant messages.' },
          { id: 'prompt-input', title: 'Prompt input', blurb: 'The composer for a prompt.' },
          { id: 'reasoning', title: 'Reasoning', blurb: 'Collapsible model reasoning.' },
          { id: 'tool', title: 'Tool', blurb: 'Tool calls and their results.' },
          { id: 'sources', title: 'Sources', blurb: 'The sources behind an answer.' },
          { id: 'inline-citation', title: 'Inline citation', blurb: 'Citations inside running text.' },
        ],
      },
    ],
  },
  {
    id: 'patterns',
    title: 'Patterns',
    blurb: 'Primitives mixed into the blocks pages are assembled from.',
    groups: [
      {
        id: 'structure',
        title: 'Page structure',
        pages: [
          { id: 'page-headers', title: 'Page headers', blurb: 'Titles, status, metadata and actions.' },
          { id: 'section-headers', title: 'Section headers', blurb: 'Headings inside a page or card.' },
          { id: 'sidebars', title: 'Sidebars', blurb: 'In-app navigation rails and panels.' },
          { id: 'detail-panels', title: 'Detail panels', blurb: 'Properties, metadata and side panels.' },
        ],
      },
      {
        id: 'data-entry',
        title: 'Data entry',
        pages: [
          { id: 'form-layouts', title: 'Form layouts', blurb: 'Fields grouped into complete forms.' },
          { id: 'filter-bars', title: 'Filter bars', blurb: 'Search, filters and view switches.' },
          { id: 'settings', title: 'Settings', blurb: 'Preference rows and settings groups.' },
          { id: 'wizards', title: 'Wizards and steppers', blurb: 'Multi-step flows and progress.' },
        ],
      },
      {
        id: 'collections',
        title: 'Collections',
        pages: [
          { id: 'list-rows', title: 'List rows', blurb: 'Rows for people, files, runs and more.' },
          { id: 'card-layouts', title: 'Card layouts', blurb: 'Cards for entities, media and summaries.' },
          { id: 'table-toolbars', title: 'Tables and toolbars', blurb: 'Tables with search, bulk actions and paging.' },
          { id: 'stat-summaries', title: 'Stat summaries', blurb: 'Numbers and comparisons at a glance.' },
        ],
      },
      {
        id: 'states',
        title: 'States and feedback',
        pages: [
          { id: 'page-states', title: 'Page states', blurb: 'Loading, empty, error and no access.' },
          { id: 'notifications', title: 'Notifications', blurb: 'Inboxes, activity and status messages.' },
          { id: 'confirmations', title: 'Confirmations', blurb: 'Confirm, undo and destructive flows.' },
          { id: 'search-experiences', title: 'Search experiences', blurb: 'Results, suggestions and palettes.' },
        ],
      },
    ],
  },
  {
    id: 'industrial',
    title: 'Industrial',
    blurb: 'Components for operational data: metrics, trends, alarms, assets and dashboards.',
    groups: [
      {
        id: 'metrics',
        title: 'Metrics',
        pages: [
          { id: 'kpi-tiles', title: 'KPI tiles', blurb: 'One number, its unit, target and trend.' },
          { id: 'gauges-and-meters', title: 'Gauges and meters', blurb: 'Values against a range or limit.' },
          { id: 'sparklines-and-trends', title: 'Sparklines and trends', blurb: 'Compact trends beside a value.' },
          { id: 'status-indicators', title: 'Status indicators', blurb: 'Running, stopped, alarm and quality.' },
        ],
      },
      {
        id: 'charts',
        title: 'Charts',
        pages: [
          { id: 'time-series', title: 'Time series', blurb: 'Sensor trends with limits and events.' },
          { id: 'production-charts', title: 'Production charts', blurb: 'Output, downtime, Pareto and targets.' },
          { id: 'distributions', title: 'Distributions and heat maps', blurb: 'Histograms, heat maps and matrices.' },
        ],
      },
      {
        id: 'operations',
        title: 'Operations',
        pages: [
          { id: 'alarms-and-events', title: 'Alarms and events', blurb: 'Alarm lists, timelines and acknowledgement.' },
          { id: 'asset-cards', title: 'Asset cards', blurb: 'Equipment summaries and health.' },
          { id: 'asset-hierarchy', title: 'Asset hierarchy', blurb: 'Site, system and equipment trees.' },
          { id: 'equipment-health', title: 'Equipment health', blurb: 'Condition, risk and remaining life.' },
          { id: 'work-orders', title: 'Work orders', blurb: 'Maintenance tasks, boards and schedules.' },
          { id: 'process-flow', title: 'Process flow', blurb: 'Units, lines and pipeline stages.' },
          { id: 'sensors-and-tags', title: 'Sensors and tags', blurb: 'Tag lists, live values and limits.' },
          { id: 'data-quality', title: 'Data quality', blurb: 'Freshness, coverage and pipeline runs.' },
          { id: 'shift-logs', title: 'Shift logs', blurb: 'Handover notes, rounds and checklists.' },
        ],
      },
      {
        id: 'dashboards',
        title: 'Dashboards',
        pages: [
          { id: 'dashboard-blocks', title: 'Dashboard blocks', blurb: 'Ready-made rows for a dashboard.' },
          { id: 'dashboards', title: 'Full dashboards', blurb: 'Complete operational screens.' },
        ],
      },
    ],
  },
  {
    id: 'templates',
    title: 'Templates',
    blurb: 'Whole-page layouts from the Aura design guide.',
    groups: [
      {
        id: 'layouts',
        title: 'Page layouts',
        pages: [
          { id: 'app-shells', title: 'App shells', blurb: 'Sidebar, three-panel and split-screen frames.' },
          { id: 'list-and-detail', title: 'List and detail pages', blurb: 'Browsing a collection and one record.' },
          { id: 'form-and-settings', title: 'Form and settings pages', blurb: 'Data entry, settings and wizards.' },
        ],
      },
    ],
  },
];

export type PageLocation = { area: ManifestArea; group: ManifestGroup; page: ManifestPage };

export function findPage(pageId: string): PageLocation | null {
  for (const area of MANIFEST) {
    for (const group of area.groups) {
      const page = group.pages.find((candidate) => candidate.id === pageId);
      if (page) return { area, group, page };
    }
  }
  return null;
}

export function findArea(areaId: string): ManifestArea | null {
  return MANIFEST.find((area) => area.id === areaId) ?? null;
}

export function allPages(): PageLocation[] {
  return MANIFEST.flatMap((area) =>
    area.groups.flatMap((group) => group.pages.map((page) => ({ area, group, page })))
  );
}

/** Module path for a page, relative to `src/catalog/pages`. */
export function pageModulePath(location: PageLocation): string {
  return `./pages/${location.area.id}/${location.page.id}.tsx`;
}
