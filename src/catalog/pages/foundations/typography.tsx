import { definePage } from '../../types';

import source from './typography.tsx?raw';

type ScaleStyle = {
  /** Semantic style name from DESIGN.md. */
  style: string;
  /** Complete class string that renders the style at true size. */
  classes: string;
  /** Size / line-height in pixels. */
  metrics: string;
  weight: string;
  use: string;
  sample: string;
};

const TYPE_SCALE: readonly ScaleStyle[] = [
  {
    style: 'display',
    classes: 'font-marketing text-5xl font-semibold tracking-tighter',
    metrics: '36 / 44',
    weight: 'Space Grotesk 600',
    use: 'Hero and marketing display',
    sample: 'Industrial data, in context',
  },
  {
    style: 'h1',
    classes: 'text-4xl font-semibold tracking-tighter',
    metrics: '32 / 40',
    weight: 'Inter 600',
    use: 'Page title',
    sample: 'Asset performance',
  },
  {
    style: 'h2',
    classes: 'text-3xl font-semibold tracking-tighter',
    metrics: '28 / 32',
    weight: 'Inter 600',
    use: 'Section title',
    sample: 'Gas compression',
  },
  {
    style: 'h3',
    classes: 'text-2xl font-semibold tracking-tight',
    metrics: '24 / 28',
    weight: 'Inter 600',
    use: 'Subsection',
    sample: 'Open work orders',
  },
  {
    style: 'h4',
    classes: 'text-xl font-medium tracking-tight',
    metrics: '20 / 24',
    weight: 'Inter 500',
    use: 'Group label',
    sample: 'Vibration sensors',
  },
  {
    style: 'body-md',
    classes: 'text-base tracking-tight',
    metrics: '16 / 20',
    weight: 'Inter 400',
    use: 'Default body',
    sample: 'Export pump A has run for 312 hours since the last overhaul.',
  },
  {
    style: 'body-sm',
    classes: 'text-sm tracking-tight',
    metrics: '14 / 18',
    weight: 'Inter 400',
    use: 'Secondary body and most UI',
    sample: 'Readings arrive every 10 seconds from the historian.',
  },
  {
    style: 'label',
    classes: 'text-xs font-medium tracking-tight',
    metrics: '12 / 14',
    weight: 'Inter 500',
    use: 'Form labels, compact UI',
    sample: 'Discharge pressure',
  },
  {
    style: 'code',
    classes: 'font-mono text-sm',
    metrics: '14 / 20',
    weight: 'Source Code Pro 400',
    use: 'Monospace content',
    sample: '23-PT-92531.PV',
  },
];

const EXTRA_SIZES = [
  { classes: 'text-lg', metrics: '18 / 24', sample: 'Lead paragraph or a dialog title' },
  { classes: 'text-2xs', metrics: '10 / 12', sample: 'Axis ticks and dense chart annotations' },
] as const;

const WEIGHTS = [
  { classes: 'font-normal', value: '400', use: 'Body copy and values' },
  { classes: 'font-medium', value: '500', use: 'Labels, group headings, emphasis in a row' },
  { classes: 'font-semibold', value: '600', use: 'Page and section headings, key figures' },
] as const;

const COLOR_ROLES = [
  { classes: 'text-base-foreground', role: 'Base', use: 'Headings, values, primary copy' },
  { classes: 'text-medium-foreground', role: 'Medium', use: 'Supporting copy on fields and fills' },
  { classes: 'text-muted-foreground', role: 'Muted', use: 'Metadata, captions, helper text' },
  { classes: 'text-link-foreground', role: 'Link', use: 'Text that navigates' },
  { classes: 'text-base-foreground-disabled', role: 'Disabled', use: 'Text of an inert control' },
] as const;

const FLOW_READINGS = [
  { tag: '23-FT-92510', value: '182,400', unit: 'Sm³/h' },
  { tag: '23-ST-92501', value: '9,840', unit: 'rpm' },
  { tag: '27-FT-20011', value: '412', unit: 'm³/h' },
  { tag: '23-TT-92532', value: '141', unit: '°C' },
] as const;

const ASSET_FIELDS = [
  { label: 'Tag', value: '23-KA-9101' },
  { label: 'Type', value: 'Compressor' },
  { label: 'Site', value: 'Nordkapp' },
  { label: 'Last inspected', value: '14 Oct 2026' },
] as const;

function TypographyScale() {
  return (
    <div className="flex w-full flex-col gap-6">
      {TYPE_SCALE.map((item) => (
        <div key={item.style} className="grid grid-cols-1 items-baseline gap-x-6 gap-y-2 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="text-sm font-medium text-base-foreground">
              {item.style} <span className="font-normal text-muted-foreground">· {item.metrics}</span>
            </p>
            <p className="mt-1 font-mono text-xs break-words text-muted-foreground">{item.classes}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.weight} · {item.use}
            </p>
          </div>
          <p className={`min-w-0 text-base-foreground ${item.classes}`}>{item.sample}</p>
        </div>
      ))}
    </div>
  );
}

function TypographyExtraSizes() {
  return (
    <div className="flex w-full flex-col gap-4">
      {EXTRA_SIZES.map((item) => (
        <div key={item.classes} className="flex flex-col gap-1">
          <p className={`text-base-foreground ${item.classes}`}>{item.sample}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{item.classes}</span> · {item.metrics}
          </p>
        </div>
      ))}
    </div>
  );
}

function TypographyFamilySans() {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="font-sans text-4xl font-semibold text-base-foreground">Inter</p>
      <p className="font-sans text-base text-base-foreground">Aa Bb Cc 0123456789 m³/h °C</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">font-sans</span> · the default for all product UI
      </p>
    </div>
  );
}

function TypographyFamilyMarketing() {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="font-marketing text-4xl font-semibold text-base-foreground">Space Grotesk</p>
      <p className="font-marketing text-base text-base-foreground">Aa Bb Cc 0123456789 m³/h °C</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">font-marketing</span> · marketing display headings only
      </p>
    </div>
  );
}

function TypographyFamilyMono() {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="font-mono text-4xl font-semibold text-base-foreground">Source Code Pro</p>
      <p className="font-mono text-base text-base-foreground">Aa Bb Cc 0123456789 {'{ }'} =&gt;</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-mono">font-mono</span> · code, tags, IDs and technical strings
      </p>
    </div>
  );
}

function TypographyWeights() {
  return (
    <div className="flex w-full flex-col gap-4">
      {WEIGHTS.map((item) => (
        <div key={item.classes} className="flex items-baseline justify-between gap-4">
          <p className={`text-xl text-base-foreground ${item.classes}`}>1st stage compressor</p>
          <p className="text-right text-xs text-muted-foreground">
            <span className="font-mono">{item.classes}</span> · {item.value}
            <br />
            {item.use}
          </p>
        </div>
      ))}
    </div>
  );
}

function TypographyWeightInUse() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl bg-card-background p-4">
      <p className="text-xl font-semibold text-card-foreground">Shift handover</p>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-card-foreground">Open deviations</p>
        <p className="text-sm text-muted-foreground">
          Two alarms were shelved during the night shift and need review before 14:00.
        </p>
      </div>
    </div>
  );
}

function TypographyColorRoles() {
  return (
    <div className="flex w-full flex-col gap-3">
      {COLOR_ROLES.map((item) => (
        <div key={item.classes} className="grid grid-cols-[5rem_minmax(0,1fr)] items-baseline gap-3">
          <p className={`text-base font-medium ${item.classes}`}>{item.role}</p>
          <div className="min-w-0">
            <p className={`text-sm ${item.classes}`}>{item.use}</p>
            <p className="mt-1 font-mono text-xs break-words text-muted-foreground">{item.classes}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TypographyTextHierarchy() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-1">
      <p className="text-sm font-medium text-base-foreground">Interstage cooler fouling</p>
      <p className="text-sm text-medium-foreground">Heat transfer has dropped 12% over the last 30 days.</p>
      <p className="text-xs text-muted-foreground">
        Detected by the fouling model ·{' '}
        <a className="text-link-foreground underline" href="https://docs.cognite.com/cdf/">
          How it works
        </a>
      </p>
    </div>
  );
}

function TypographyTabularNums() {
  return (
    <div className="grid w-full grid-cols-2 gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Proportional (default)</p>
        {FLOW_READINGS.map((row) => (
          <p key={row.tag} className="text-right text-sm text-base-foreground">
            {row.value}
          </p>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-mono text-xs text-muted-foreground">tabular-nums</p>
        {FLOW_READINGS.map((row) => (
          <p key={row.tag} className="text-right text-sm text-base-foreground tabular-nums">
            {row.value}
          </p>
        ))}
      </div>
    </div>
  );
}

function TypographyNumericTable() {
  return (
    <dl className="flex w-full flex-col gap-2">
      {FLOW_READINGS.map((row) => (
        <div key={row.tag} className="flex items-baseline justify-between gap-4">
          <dt className="font-mono text-sm text-medium-foreground">{row.tag}</dt>
          <dd className="text-sm text-base-foreground tabular-nums">
            {row.value} <span className="text-muted-foreground">{row.unit}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function TypographyKeyFigure() {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">Overall equipment effectiveness</p>
      <p className="text-4xl font-semibold tracking-tighter text-base-foreground tabular-nums">
        87.4<span className="text-xl font-medium text-muted-foreground"> %</span>
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">Target 85.0 %</p>
    </div>
  );
}

function TypographyTruncate() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <p className="truncate text-sm text-base-foreground" title="NK-23-KA-9101 1st stage compressor drive-end bearing vibration">
        NK-23-KA-9101 1st stage compressor drive-end bearing vibration
      </p>
      <p className="font-mono text-xs text-muted-foreground">truncate</p>
    </div>
  );
}

function TypographyLineClamp() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-2">
      <p className="line-clamp-2 text-sm text-base-foreground">
        Operator reported intermittent high vibration on the drive end bearing after the restart on Tuesday. The
        reading settles within ten minutes but returns under load.
      </p>
      <p className="font-mono text-xs text-muted-foreground">line-clamp-2</p>
    </div>
  );
}

function TypographyProseMeasure() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="max-w-[37.5rem]">
        <div className="flex items-center gap-2" aria-hidden="true">
          <div className="h-2 w-px bg-emphasized" />
          <div className="h-px flex-1 bg-emphasized" />
          <span className="font-mono text-xs text-muted-foreground">max-w-[37.5rem] · 600px</span>
          <div className="h-px flex-1 bg-emphasized" />
          <div className="h-2 w-px bg-emphasized" />
        </div>
        <p className="mt-3 text-base text-base-foreground">
          A data set groups the time series, events and files that belong to one source system. Give it an owner and a
          description so that people who find a reading in a dashboard can trace it back to where it came from, who
          maintains it and how fresh it is. Keep one data set per source rather than one per team.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        The cap applies to the text column only. Charts, tables and side metadata may run wider.
      </p>
    </div>
  );
}

function TypographyHeadingHierarchy() {
  return (
    <div className="flex w-full max-w-[37.5rem] flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-4xl font-semibold tracking-tighter text-base-foreground">Nordkapp</p>
        <p className="text-base text-muted-foreground">Norwegian Sea · 16 monitored assets</p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tracking-tight text-base-foreground">Gas compression</p>
        <p className="text-base text-base-foreground">
          Three compressors, the interstage cooler and the gas turbine that drives them.
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xl font-medium tracking-tight text-base-foreground">1st stage compressor</p>
        <p className="text-sm text-muted-foreground">Running · last inspected 14 Oct 2026</p>
      </div>
    </div>
  );
}

function TypographyLabelValueStacked() {
  return (
    <dl className="grid w-full grid-cols-2 gap-4">
      {ASSET_FIELDS.map((field) => (
        <div key={field.label} className="flex min-w-0 flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">{field.label}</dt>
          <dd className="truncate text-sm text-base-foreground">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TypographyLabelValueInline() {
  return (
    <dl className="flex w-full flex-col gap-3">
      {ASSET_FIELDS.map((field) => (
        <div key={field.label} className="grid grid-cols-[8rem_minmax(0,1fr)] items-baseline gap-3">
          <dt className="text-sm text-muted-foreground">{field.label}</dt>
          <dd className="truncate text-sm text-base-foreground">{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function TypographyInlineCode() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      Filter on <code className="rounded-sm bg-medium-background px-1 font-mono text-medium-foreground">externalId</code>{' '}
      to find the series, for example{' '}
      <code className="rounded-sm bg-medium-background px-1 font-mono text-medium-foreground">23-PT-92531.PV</code>.
    </p>
  );
}

export default definePage({
  id: 'typography',
  title: 'Typography',
  summary:
    'Inter for product UI, Space Grotesk for marketing display, Source Code Pro for technical strings. The scale is tight on purpose: it keeps dense operational data scannable while body copy stays readable at 16px.',
  guidance: {
    use: [
      'text-sm for most UI, text-xs for labels and metadata, text-base for body copy.',
      'font-medium and font-semibold to build hierarchy; regular for everything else.',
      'tabular-nums on any number that changes or sits in a column.',
      'A 600px cap on continuous body text.',
    ],
    avoid: [
      'Font sizes or line heights outside the scale.',
      'Space Grotesk in product UI; it is for marketing display only.',
      'Colour alone to create hierarchy when size and weight would do.',
      'Truncating a value the user needs in full without a way to see it.',
    ],
  },
  source,
  sections: [
    {
      id: 'scale',
      title: 'Type scale',
      description: 'Nine semantic styles, each shown at true size with the classes that produce it.',
      specimens: [
        {
          id: 'TypographyScale',
          title: 'Semantic styles',
          note: 'Pick the style by the role of the text, then apply its class set unchanged.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: TypographyScale,
        },
        {
          id: 'TypographyExtraSizes',
          title: 'Sizes between the styles',
          note: 'Two theme sizes without a semantic name, for a lead paragraph and for chart annotations.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TypographyExtraSizes,
        },
      ],
    },
    {
      id: 'families-and-weights',
      title: 'Families and weights',
      description: 'Three families, three weights.',
      specimens: [
        {
          id: 'TypographyFamilySans',
          title: 'Inter',
          note: 'Everything in the product unless it is code or marketing display.',
          origin: 'aura',
          align: 'stretch',
          Component: TypographyFamilySans,
        },
        {
          id: 'TypographyFamilyMarketing',
          title: 'Space Grotesk',
          note: 'A hero headline on a landing or sign-in page, never inside the app.',
          origin: 'aura',
          align: 'stretch',
          Component: TypographyFamilyMarketing,
        },
        {
          id: 'TypographyFamilyMono',
          title: 'Source Code Pro',
          note: 'Tags, external IDs, queries and anything the user may copy character by character.',
          origin: 'aura',
          align: 'stretch',
          Component: TypographyFamilyMono,
        },
        {
          id: 'TypographyWeights',
          title: 'Weights',
          note: 'Regular by default; step up to medium or semibold only to mark hierarchy.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TypographyWeights,
        },
        {
          id: 'TypographyWeightInUse',
          title: 'Weights in a card',
          note: 'Semibold title, medium group label, regular copy: one step per level.',
          origin: 'aura',
          size: 'md',
          Component: TypographyWeightInUse,
        },
      ],
    },
    {
      id: 'colour-roles',
      title: 'Text colour roles',
      description: 'Five foreground roles carry emphasis without extra sizes.',
      specimens: [
        {
          id: 'TypographyColorRoles',
          title: 'Foreground roles',
          note: 'Step from base to medium to muted as the text becomes less important.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TypographyColorRoles,
        },
        {
          id: 'TypographyTextHierarchy',
          title: 'Roles together',
          note: 'A title, a supporting line and metadata with a link, at two sizes.',
          origin: 'aura',
          size: 'md',
          Component: TypographyTextHierarchy,
        },
      ],
    },
    {
      id: 'numbers',
      title: 'Numbers',
      description: 'Digits that align and do not jitter when they update.',
      specimens: [
        {
          id: 'TypographyTabularNums',
          title: 'Tabular figures',
          note: 'Right-aligned columns and live values, so digits line up and widths stay put.',
          origin: 'aura',
          Component: TypographyTabularNums,
        },
        {
          id: 'TypographyNumericTable',
          title: 'Tag, value and unit',
          note: 'Monospace tag on the left, tabular value on the right, unit stepped down to muted.',
          origin: 'aura',
          align: 'stretch',
          Component: TypographyNumericTable,
        },
        {
          id: 'TypographyKeyFigure',
          title: 'Key figure',
          note: 'One large number with a small label above and the comparison below.',
          origin: 'aura',
          Component: TypographyKeyFigure,
        },
      ],
    },
    {
      id: 'overflow-and-measure',
      title: 'Overflow and measure',
      description: 'What happens when text is longer than its container, and how wide prose may run.',
      specimens: [
        {
          id: 'TypographyTruncate',
          title: 'Truncate',
          note: 'Single-line names in rows and cards; keep the full text reachable.',
          origin: 'aura',
          Component: TypographyTruncate,
        },
        {
          id: 'TypographyLineClamp',
          title: 'Line clamp',
          note: 'Descriptions in lists and cards that may run to a paragraph.',
          origin: 'aura',
          Component: TypographyLineClamp,
        },
        {
          id: 'TypographyInlineCode',
          title: 'Inline code',
          note: 'A field name or identifier inside a sentence.',
          origin: 'aura',
          Component: TypographyInlineCode,
        },
        {
          id: 'TypographyProseMeasure',
          title: 'Prose measure',
          note: 'Cap paragraphs, descriptions and long labels at 600px wherever the container is wider.',
          origin: 'aura',
          size: 'full',
          align: 'stretch',
          Component: TypographyProseMeasure,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'The scale applied to a page header and to label and value pairs.',
      specimens: [
        {
          id: 'TypographyHeadingHierarchy',
          title: 'Heading hierarchy',
          note: 'Page, section and group: skip a size between levels so each reads as its own step.',
          origin: 'aura',
          size: 'lg',
          align: 'start',
          Component: TypographyHeadingHierarchy,
        },
        {
          id: 'TypographyLabelValueStacked',
          title: 'Label over value',
          note: 'Property grids in detail panels where width is short.',
          origin: 'aura',
          align: 'stretch',
          Component: TypographyLabelValueStacked,
        },
        {
          id: 'TypographyLabelValueInline',
          title: 'Label beside value',
          note: 'Longer property lists where the eye should run down one column of values.',
          origin: 'aura',
          size: 'md',
          align: 'stretch',
          Component: TypographyLabelValueInline,
        },
      ],
    },
  ],
});
