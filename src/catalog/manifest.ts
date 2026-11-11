export type AreaId = 'foundations' | 'primitives' | 'patterns' | 'industrial' | 'dashboards' | 'templates';

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
          { id: 'themes', title: 'Themes', blurb: 'Accent, surface, shape, contrast, density and typeface.' },
          { id: 'looks', title: 'Looks', blurb: 'Eight design languages that change structure, not just colour.' },
        ],
      },
      {
        id: 'guidelines',
        title: 'Guidelines',
        pages: [
          { id: 'motion', title: 'Motion', blurb: 'Durations, easing and when to animate.' },
          { id: 'interaction-states', title: 'Interaction states', blurb: 'Hover, pressed, focus, selected, disabled.' },
          { id: 'data-formatting', title: 'Data formatting', blurb: 'Numbers, units, dates, durations and IDs.' },
          { id: 'content-and-voice', title: 'Content and voice', blurb: 'Labels, messages and tone.' },
          { id: 'accessibility', title: 'Accessibility', blurb: 'Focus, names, contrast and keyboard patterns.' },
          { id: 'theme-gallery', title: 'Theme gallery', blurb: 'The same screens in every preset.' },
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
      {
        id: 'extended',
        title: 'Extended primitives',
        pages: [
          { id: 'table', title: 'Table', blurb: 'Static tables with sorting, selection and density.' },
          { id: 'tag', title: 'Tag', blurb: 'Removable, selectable and monospace chips.' },
          { id: 'stepper', title: 'Stepper', blurb: 'Numbered steps through a flow.' },
          { id: 'timeline', title: 'Timeline', blurb: 'Events in order, vertical or horizontal.' },
          { id: 'drawer', title: 'Drawer', blurb: 'A panel that slides in from an edge.' },
          { id: 'alert-dialog', title: 'Alert dialog', blurb: 'A blocking confirmation with a clear choice.' },
          { id: 'context-menu', title: 'Context menu', blurb: 'Actions on right-click or long-press.' },
          { id: 'resizable-panes', title: 'Resizable panes', blurb: 'Split views with a draggable divider.' },
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
          { id: 'error-pages', title: 'Error pages', blurb: 'Not found, server error, offline and maintenance.' },
          { id: 'onboarding', title: 'Onboarding', blurb: 'Welcome, checklists, tours and first-run hints.' },
        ],
      },
      {
        id: 'people',
        title: 'People and access',
        pages: [
          { id: 'authentication', title: 'Authentication', blurb: 'Sign in, sign up, reset and verification.' },
          { id: 'profiles-and-accounts', title: 'Profiles and accounts', blurb: 'Profile cards, account menus and preferences.' },
          { id: 'teams-and-members', title: 'Teams and members', blurb: 'Member lists, invites and group pickers.' },
          { id: 'permissions-and-roles', title: 'Permissions and roles', blurb: 'Role tables, capability matrices and sharing.' },
          { id: 'api-keys-and-tokens', title: 'API keys and tokens', blurb: 'Secrets, client credentials and rotation.' },
        ],
      },
      {
        id: 'collaboration',
        title: 'Collaboration',
        pages: [
          { id: 'comments-and-threads', title: 'Comments and threads', blurb: 'Comment boxes, replies and mentions.' },
          { id: 'activity-and-audit', title: 'Activity and audit', blurb: 'Activity feeds, audit logs and change history.' },
          { id: 'timelines', title: 'Timelines', blurb: 'Vertical and horizontal event timelines.' },
          { id: 'sharing-and-export', title: 'Sharing and export', blurb: 'Share links, exports and scheduled reports.' },
          { id: 'feedback-and-ratings', title: 'Feedback and ratings', blurb: 'Thumbs, ratings, surveys and reports.' },
        ],
      },
      {
        id: 'content',
        title: 'Content and media',
        pages: [
          { id: 'file-upload', title: 'File upload', blurb: 'Drop zones, queues and upload progress.' },
          { id: 'files-and-documents', title: 'Files and documents', blurb: 'File lists, previews and document viewers.' },
          { id: 'tags-and-chips', title: 'Tags and chips', blurb: 'Labels, filter chips and tag inputs.' },
          { id: 'key-value-and-metadata', title: 'Key-value and metadata', blurb: 'Property lists, JSON and definition tables.' },
          { id: 'rich-text-and-notes', title: 'Rich text and notes', blurb: 'Notes, markdown and callouts.' },
          { id: 'help-and-docs', title: 'Help and docs', blurb: 'Help panels, FAQs and inline documentation.' },
        ],
      },
      {
        id: 'workflows',
        title: 'Workflows',
        pages: [
          { id: 'kanban-boards', title: 'Kanban boards', blurb: 'Columns, cards and swimlanes.' },
          { id: 'scheduling-and-calendars', title: 'Scheduling and calendars', blurb: 'Agendas, week views and time slots.' },
          { id: 'approvals-and-reviews', title: 'Approvals and reviews', blurb: 'Requests, sign-offs and review states.' },
          { id: 'bulk-actions', title: 'Bulk actions', blurb: 'Select, edit and act on many items.' },
          { id: 'inline-editing', title: 'Inline editing', blurb: 'Edit in place in rows, cells and headers.' },
          { id: 'import-and-mapping', title: 'Import and mapping', blurb: 'Upload, map columns, validate and commit.' },
          { id: 'compare-and-diff', title: 'Compare and diff', blurb: 'Side-by-side values, versions and changes.' },
          { id: 'master-detail', title: 'Master-detail', blurb: 'A list beside the selected record.' },
        ],
      },
      {
        id: 'builders',
        title: 'Editors and builders',
        pages: [
          { id: 'dashboard-editor', title: 'Dashboard editor', blurb: 'Drag, resize and add widgets.' },
          { id: 'form-builder', title: 'Form builder', blurb: 'Compose a form from field blocks.' },
          { id: 'query-builder', title: 'Query builder', blurb: 'Nested and/or filter conditions.' },
          { id: 'node-graph-editor', title: 'Node graph editor', blurb: 'Draggable nodes and edges.' },
          { id: 'gantt-chart', title: 'Gantt chart', blurb: 'Tasks, dependencies and drag to reschedule.' },
          { id: 'spreadsheet-grid', title: 'Spreadsheet grid', blurb: 'Cell selection, editing, copy and fill.' },
          { id: 'pivot-and-tree-tables', title: 'Pivot and tree tables', blurb: 'Grouped rows, subtotals and hierarchies.' },
          { id: 'calendar-scheduler', title: 'Calendar scheduler', blurb: 'Drag to create and move events.' },
          { id: 'rich-text-editor', title: 'Rich text editor', blurb: 'Formatting toolbar over editable text.' },
          { id: 'code-and-sql-editor', title: 'Code and SQL editor', blurb: 'Highlighted editing with run and results.' },
          { id: 'mobile-navigation', title: 'Mobile navigation', blurb: 'Tab bars, sheets and stacked screens.' },
        ],
      },
      {
        id: 'product',
        title: 'Product and marketing',
        pages: [
          { id: 'hero-sections', title: 'Hero sections', blurb: 'Page openers with a headline and one action.' },
          { id: 'feature-sections', title: 'Feature sections', blurb: 'Feature grids, highlights and comparisons.' },
          { id: 'pricing-and-plans', title: 'Pricing and plans', blurb: 'Plan cards, usage and billing summaries.' },
          { id: 'ai-assistants', title: 'AI assistants', blurb: 'Assistant panels, suggestions and generated results.' },
          { id: 'dashboard-widgets', title: 'Dashboard widgets', blurb: 'General-purpose widgets for any dashboard.' },
          { id: 'navigation-menus', title: 'Navigation menus', blurb: 'App switchers, user menus and footers.' },
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
          { id: 'forecasts-and-predictions', title: 'Forecasts and predictions', blurb: 'Forecast bands, confidence and scenarios.' },
          { id: 'anomaly-detection', title: 'Anomaly detection', blurb: 'Anomalies, scores and flagged periods.' },
          { id: 'chart-annotations', title: 'Chart annotations', blurb: 'Events, limits, notes and regions on charts.' },
          { id: 'time-navigation', title: 'Time navigation', blurb: 'Range pickers, zoom, playback and live mode.' },
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
          { id: 'inspection-rounds', title: 'Inspection rounds', blurb: 'Routes, checkpoints and field readings.' },
          { id: 'root-cause-analysis', title: 'Root cause analysis', blurb: 'Fault trees, five whys and evidence.' },
          { id: 'documents-and-drawings', title: 'Documents and drawings', blurb: 'P&ID viewers, document lists and tag links.' },
          { id: 'pid-viewer', title: 'P&ID viewer', blurb: 'Pan and zoom a drawing with live, clickable tags.' },
          { id: 'alarm-rationalisation', title: 'Alarm rationalisation', blurb: 'Review, prioritise and shelve alarms.' },
          { id: 'lockout-tagout', title: 'Lock-out and tag-out', blurb: 'Isolation boards, points and sign-off.' },
          { id: 'bow-tie-diagrams', title: 'Bow-tie diagrams', blurb: 'Threats, barriers and consequences.' },
          { id: 'batch-and-recipe', title: 'Batch and recipe', blurb: 'Phase timelines and golden-batch comparison.' },
          { id: 'vibration-analysis', title: 'Vibration analysis', blurb: 'Spectrum, waterfall and orbit plots.' },
          { id: 'camera-and-inspection', title: 'Camera and inspection', blurb: 'Camera tiles and image annotation.' },
          { id: 'model-viewer-chrome', title: '3D viewer controls', blurb: 'Toolbars and panels around a 3D model viewer.' },
          { id: 'geographic-map', title: 'Geographic map', blurb: 'Projected maps with markers, clusters and routes.' },
        ],
      },
      {
        id: 'diagrams',
        title: 'Diagrams and symbols',
        pages: [
          { id: 'equipment-symbols', title: 'Equipment symbols', blurb: 'Pump, valve, tank and compressor glyphs.' },
          { id: 'process-diagrams', title: 'Process diagrams', blurb: 'Simplified process schematics with live values.' },
          { id: 'single-line-diagrams', title: 'Single-line diagrams', blurb: 'Electrical networks, breakers and feeders.' },
          { id: 'site-and-fleet-maps', title: 'Site and fleet maps', blurb: 'Schematic site plans and fleet overviews.' },
        ],
      },
      {
        id: 'domains',
        title: 'Domains',
        pages: [
          { id: 'production-and-oee', title: 'Production and OEE', blurb: 'Availability, performance, quality and losses.' },
          { id: 'energy-and-emissions', title: 'Energy and emissions', blurb: 'Consumption, intensity, flaring and CO₂.' },
          { id: 'quality-and-spc', title: 'Quality and SPC', blurb: 'Control charts, capability and lab samples.' },
          { id: 'safety-and-permits', title: 'Safety and permits', blurb: 'Permits to work, barriers and incidents.' },
          { id: 'inventory-and-spares', title: 'Inventory and spares', blurb: 'Stock levels, spare parts and tank inventory.' },
          { id: 'wells-and-reservoir', title: 'Wells and reservoir', blurb: 'Well status, rates and decline curves.' },
          { id: 'power-and-renewables', title: 'Power and renewables', blurb: 'Wind, solar, grid load and dispatch.' },
          { id: 'water-and-utilities', title: 'Water and utilities', blurb: 'Treatment, pumping stations and networks.' },
          { id: 'manufacturing-lines', title: 'Manufacturing lines', blurb: 'Line status, cycle times and changeovers.' },
          { id: 'simulation-and-what-if', title: 'Simulation and what-if', blurb: 'Scenarios, parameters and compared results.' },
        ],
      },
      {
        id: 'dashboards',
        title: 'Dashboards',
        pages: [
          { id: 'dashboard-blocks', title: 'Dashboard blocks', blurb: 'Ready-made rows for a dashboard.' },
          { id: 'wall-displays', title: 'Wall displays', blurb: 'Large-format screens read from a distance.' },
          { id: 'field-screens', title: 'Field screens', blurb: 'Tablet and phone screens for work on site.' },
          { id: 'reports', title: 'Reports', blurb: 'Daily, shift and monthly report layouts.' },
        ],
      },
    ],
  },
  {
    id: 'dashboards',
    title: 'Dashboards',
    blurb: 'Complete dashboards and interactive experiences: 3D plants, futuristic screens, drill-down journeys and classic operational views.',
    groups: [
      {
        id: 'spatial-dashboards',
        title: '3D and spatial',
        pages: [
          { id: 'plant-3d-explorer', title: '3D plant explorer', blurb: 'Fly from the whole plant down to one sensor.' },
          { id: 'offshore-platform-3d', title: 'Offshore platform', blurb: 'Decks you can separate, with live status.' },
          { id: 'compressor-digital-twin', title: 'Compressor digital twin', blurb: 'An exploded machine with sensor hotspots.' },
          { id: 'tank-farm-3d', title: 'Tank farm in 3D', blurb: 'Tanks filled to their real levels.' },
          { id: 'well-field-3d', title: 'Well field', blurb: 'Well paths under the surface.' },
          { id: 'fleet-globe', title: 'Fleet globe', blurb: 'Sites on a globe you can spin.' },
          { id: 'isometric-plant', title: 'Isometric plant', blurb: 'A 2.5D plant drawn in SVG, no WebGL.' },
          { id: 'lng-train-3d', title: 'LNG train', blurb: 'A larger plant: liquefaction train, tanks and jetty.' },
          { id: 'process-flow-3d', title: 'Process flow in 3D', blurb: 'Particles move through pipes at real flow rates.' },
          { id: 'plant-replay-3d', title: 'Incident replay in 3D', blurb: 'Scrub a trip and watch it unfold in the plant.' },
          { id: 'subsea-field-3d', title: 'Subsea field', blurb: 'Templates, flowlines and risers on the seabed.' },
          { id: 'pipeline-flythrough', title: 'Pipeline fly-through', blurb: 'Travel a pipeline corridor station by station.' },
          { id: 'split-pid-3d', title: 'P&ID beside 3D', blurb: 'Select in the drawing, see it in the scene.' },
        ],
      },
      {
        id: 'futuristic-dashboards',
        title: 'Futuristic',
        pages: [
          { id: 'tron-grid-ops', title: 'Grid operations', blurb: 'Neon lines on a perspective grid.' },
          { id: 'hud-command-center', title: 'HUD command center', blurb: 'Brackets, reticles and radial readouts.' },
          { id: 'glass-cockpit', title: 'Glass cockpit', blurb: 'Translucent panels over a live scene.' },
          { id: 'hologram-asset', title: 'Hologram asset', blurb: 'A wireframe machine with scanning readouts.' },
          { id: 'radial-mission-control', title: 'Radial mission control', blurb: 'Everything arranged around one dial.' },
          { id: 'orbit-mission-control', title: 'Orbit mission control', blurb: 'One large ring with small linked circles orbiting it.' },
          { id: 'neon-terminal', title: 'Neon terminal', blurb: 'A text-mode plant in characters and bars.' },
        ],
      },
      {
        id: 'journey-dashboards',
        title: 'Drill-down journeys',
        pages: [
          { id: 'plant-to-sensor', title: 'Plant to sensor', blurb: 'One zoomable canvas, four levels deep.' },
          { id: 'treemap-explorer', title: 'Treemap explorer', blurb: 'Click into areas sized by what matters.' },
          { id: 'sunburst-hierarchy', title: 'Sunburst hierarchy', blurb: 'Rings from site to equipment.' },
          { id: 'miller-columns', title: 'Column browser', blurb: 'Site, area, unit and tag side by side.' },
          { id: 'process-walkthrough', title: 'Process walkthrough', blurb: 'Follow the gas from inlet to export.' },
          { id: 'incident-replay', title: 'Incident replay', blurb: 'Scrub through a trip, minute by minute.' },
        ],
      },
      {
        id: 'operations-dashboards',
        title: 'Operations',
        pages: [
          { id: 'plant-overview', title: 'Plant overview', blurb: 'The whole plant at a glance. Theme: Aura.' },
          { id: 'control-room-console', title: 'Control room console', blurb: 'Dense operator console. Theme: Control room.' },
          { id: 'alarm-management', title: 'Alarm management', blurb: 'Alarm load and standing alarms. Theme: Nordic night.' },
          { id: 'shift-handover', title: 'Shift handover', blurb: 'What the next shift must know. Theme: Amber shift.' },
          { id: 'wall-board', title: 'Wall board', blurb: 'Read from across the room. Theme: Wall display.' },
          { id: 'field-operator', title: 'Field operator', blurb: 'Rounds and tasks on a tablet. Theme: Field.' },
        ],
      },
      {
        id: 'reliability-dashboards',
        title: 'Reliability and maintenance',
        pages: [
          { id: 'compressor-health', title: 'Compressor health', blurb: 'One machine in depth. Theme: Blueprint.' },
          { id: 'maintenance-planning', title: 'Maintenance planning', blurb: 'Backlog, schedule and crews. Theme: Fjord.' },
          { id: 'asset-performance', title: 'Asset performance', blurb: 'Fleet health and bad actors. Theme: Dense data.' },
          { id: 'safety-and-barriers', title: 'Safety and barriers', blurb: 'Permits, barriers and incidents. Theme: Accessible.' },
        ],
      },
      {
        id: 'performance-dashboards',
        title: 'Production and energy',
        pages: [
          { id: 'production-performance', title: 'Production performance', blurb: 'Output, OEE and losses. Theme: Nordic.' },
          { id: 'energy-and-emissions-dashboard', title: 'Energy and emissions', blurb: 'Energy use and CO₂. Theme: Aurora.' },
          { id: 'quality-lab', title: 'Quality lab', blurb: 'Samples, SPC and compliance. Theme: Sky.' },
          { id: 'tank-farm-logistics', title: 'Tank farm and logistics', blurb: 'Inventory and shipments. Theme: Sandstone.' },
          { id: 'wind-farm', title: 'Wind farm', blurb: 'Turbines, output and availability. Theme: Fjord dark.' },
        ],
      },
      {
        id: 'data-dashboards',
        title: 'Data, AI and business',
        pages: [
          { id: 'data-operations', title: 'Data operations', blurb: 'Pipelines, freshness and quality. Theme: Terminal.' },
          { id: 'engineering-config', title: 'Engineering configuration', blurb: 'Tags, limits and changes. Theme: Schematic.' },
          { id: 'ai-operations-assistant', title: 'AI operations assistant', blurb: 'An assistant beside live data. Theme: Dusk night.' },
          { id: 'executive-summary', title: 'Executive summary', blurb: 'The month in one page. Theme: Editorial.' },
          { id: 'people-and-onboarding', title: 'People and onboarding', blurb: 'Crews, training and adoption. Theme: Pink soft.' },
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
          { id: 'dashboard-pages', title: 'Dashboard pages', blurb: 'Full-width metric, chart and table pages.' },
          { id: 'auth-pages', title: 'Auth pages', blurb: 'Sign-in, sign-up and recovery screens.' },
          { id: 'ai-workspaces', title: 'AI workspaces', blurb: 'Chat beside data, canvases and agent runs.' },
          { id: 'landing-pages', title: 'Landing pages', blurb: 'Product home and marketing pages.' },
          { id: 'state-pages', title: 'State pages', blurb: 'Whole-page loading, empty, error and success.' },
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
