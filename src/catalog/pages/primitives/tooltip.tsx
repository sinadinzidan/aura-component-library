import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Kbd, KbdGroup } from '@cognite/aura/components/kbd';
import { Label } from '@cognite/aura/components/label';
import { Switch } from '@cognite/aura/components/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconBell,
  IconChartLine,
  IconCheck,
  IconCopy,
  IconDownload,
  IconFilter,
  IconHome,
  IconMaximize,
  IconRefresh,
  IconSettings,
  IconTool,
  IconZoomIn,
  IconZoomOut,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { InfoTooltip } from '../../../library/overlays/InfoTooltip';
import { TruncatedText } from '../../../library/overlays/TruncatedText';
import { ASSETS, PEOPLE, PLANT_KPIS } from '../../data/plant';
import { REFERENCE_NOW, HOUR, formatAgo, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './tooltip.tsx?raw';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const NAV_ITEMS = [
  { label: 'Overview', Icon: IconHome },
  { label: 'Charts', Icon: IconChartLine },
  { label: 'Alarms', Icon: IconBell },
  { label: 'Work orders', Icon: IconTool },
  { label: 'Settings', Icon: IconSettings },
];

const COMPRESSION_ASSETS = ASSETS.filter((asset) => asset.parentId === 'nk-23');

const HEALTH_DOT = {
  good: 'bg-success-foreground-strong',
  watch: 'bg-warning-foreground-strong',
  poor: 'bg-critical-foreground-strong',
} as const;

const HEALTH_LABEL = {
  good: 'Good',
  watch: 'Watch',
  poor: 'Poor',
} as const;

function TooltipBasic() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Publish model</Button>} />
      <TooltipContent>Makes this version available to every app</TooltipContent>
    </Tooltip>
  );
}

function TooltipIconButton() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Refresh data">
            <IconRefresh />
          </Button>
        }
      />
      <TooltipContent>Refresh data</TooltipContent>
    </Tooltip>
  );
}

function TooltipWithShortcut() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Filter alarms">
            <IconFilter />
          </Button>
        }
      />
      <TooltipContent>
        <span className="flex items-center gap-2">
          Filter alarms
          <KbdGroup>
            <Kbd>⇧</Kbd>
            <Kbd>F</Kbd>
          </KbdGroup>
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipTwoSentences() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline">Time granularity</Button>} />
      <TooltipContent>
        <span className="max-w-60 whitespace-normal">
          Controls how data points are aggregated in the chart. Coarser steps hide short spikes.
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipSides() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SIDES.map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline">Shows on {side}</Button>} />
          <TooltipContent side={side}>Placed on the {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function TooltipAlignments() {
  return (
    <div className="flex flex-col gap-2">
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Aligned to the start of this button</Button>} />
        <TooltipContent align="start">Align start</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Aligned to the end of this button</Button>} />
        <TooltipContent align="end">Align end</TooltipContent>
      </Tooltip>
    </div>
  );
}

function TooltipInstant() {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={
          <Button variant="ghost" size="icon" aria-label="Zoom in">
            <IconZoomIn />
          </Button>
        }
      />
      <TooltipContent>Zoom in</TooltipContent>
    </Tooltip>
  );
}

function TooltipPatient() {
  return (
    <TooltipProvider delayDuration={900}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outline">Run transformation</Button>} />
        <TooltipContent>Reads the last 24 hours and rewrites the output table</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TooltipOnBadge() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Badge variant="warning" tabIndex={0} />}>Uncertain</TooltipTrigger>
      <TooltipContent>
        <span className="max-w-60 whitespace-normal">
          The transmitter reported outside its calibrated range in the last hour
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipOnTruncatedText() {
  return (
    <div className="flex w-full max-w-56 flex-col gap-2 text-sm text-base-foreground">
      <TruncatedText text="Nordkapp / Gas compression / 1st stage compressor / Drive-end vibration" />
      <TruncatedText text="Nordkapp / Gas export" />
    </div>
  );
}

function TooltipOnAvatar() {
  const person = PEOPLE[1];

  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0} className="rounded-full" />}>
        <PersonAvatar name={person.name} colorKey={person.id} />
      </TooltipTrigger>
      <TooltipContent>
        {person.name}, {person.role.toLowerCase()}
      </TooltipContent>
    </Tooltip>
  );
}

function TooltipInfoIcon() {
  return (
    <div className="flex items-center gap-1 text-sm font-medium text-base-foreground">
      Energy intensity
      <InfoTooltip label="About energy intensity">
        Energy intensity. Energy used per barrel of oil equivalent exported, averaged over 24 hours.
      </InfoTooltip>
    </div>
  );
}

function TooltipOnAbbreviation() {
  return (
    <p className="text-sm text-base-foreground">
      Gas export{' '}
      <span className="font-semibold tabular-nums">
        {PLANT_KPIS.gasExport.value}{' '}
        <Tooltip>
          <TooltipTrigger
            render={<abbr tabIndex={0} className="cursor-help rounded-sm underline decoration-dotted underline-offset-4" />}
          >
            {PLANT_KPIS.gasExport.unit}
          </TooltipTrigger>
          <TooltipContent>Million standard cubic metres per day</TooltipContent>
        </Tooltip>
      </span>
    </p>
  );
}

function TooltipOnTimestamp() {
  const raisedAt = REFERENCE_NOW - 5 * HOUR;

  return (
    <p className="text-sm text-muted-foreground">
      Acknowledged{' '}
      <Tooltip>
        <TooltipTrigger
          render={<time tabIndex={0} dateTime={new Date(raisedAt).toISOString()} className="rounded-sm text-base-foreground" />}
        >
          {formatAgo(raisedAt)}
        </TooltipTrigger>
        <TooltipContent>{formatDateTime(raisedAt)}</TooltipContent>
      </Tooltip>
    </p>
  );
}

function TooltipUnavailableAction() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="inline-flex opacity-50">
            <Button aria-disabled="true" onClick={(event) => event.preventDefault()}>
              Deploy function
            </Button>
          </span>
        }
      />
      <TooltipContent>Select a schedule before you deploy</TooltipContent>
    </Tooltip>
  );
}

function TooltipConfirmation() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const handle = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(handle);
  }, [copied]);

  const copy = () => {
    void navigator.clipboard.writeText('23-PT-92531').then(
      () => setCopied(true),
      () => setCopied(true)
    );
  };

  return (
    <div className="flex items-center gap-2 font-mono text-sm text-base-foreground">
      23-PT-92531
      <Tooltip>
        <TooltipTrigger
          closeOnClick={false}
          render={
            <Button variant="ghost" size="icon-sm" aria-label={copied ? 'Copied' : 'Copy tag'} onClick={copy}>
              {copied ? <IconCheck /> : <IconCopy />}
            </Button>
          }
        />
        <TooltipContent>{copied ? 'Copied' : 'Copy tag'}</TooltipContent>
      </Tooltip>
    </div>
  );
}

function TooltipConditional() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-col items-center gap-4">
      <Tooltip disabled={!collapsed}>
        <TooltipTrigger
          render={
            <Button variant="ghost" size={collapsed ? 'icon' : 'default'} aria-label="Alarms">
              <IconBell /> {collapsed ? null : 'Alarms'}
            </Button>
          }
        />
        <TooltipContent side="right">Alarms</TooltipContent>
      </Tooltip>
      <Switch label="Collapsed" checked={collapsed} onCheckedChange={(checked) => setCollapsed(checked)} />
    </div>
  );
}

function TooltipNotHoverable() {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Health by asset">
      {COMPRESSION_ASSETS.map((asset) => (
        <Tooltip key={asset.id} disableHoverableContent>
          <TooltipTrigger
            delay={0}
            render={<span tabIndex={0} className="flex size-6 items-center justify-center rounded-sm" />}
          >
            <span className={`size-2.5 rounded-full ${HEALTH_DOT[asset.health]}`} />
            <span className="sr-only">
              {asset.tag}, {HEALTH_LABEL[asset.health]}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {asset.tag} · {HEALTH_LABEL[asset.health]} · {asset.healthScore}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

function TooltipToolbar() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1" role="toolbar" aria-label="Chart tools">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Zoom in">
                <IconZoomIn />
              </Button>
            }
          />
          <TooltipContent side="bottom">Zoom in</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Zoom out">
                <IconZoomOut />
              </Button>
            }
          />
          <TooltipContent side="bottom">Zoom out</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Fit to screen">
                <IconMaximize />
              </Button>
            }
          />
          <TooltipContent side="bottom">Fit to screen</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label="Download as CSV">
                <IconDownload />
              </Button>
            }
          />
          <TooltipContent side="bottom">Download as CSV</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

function TooltipFormLabel() {
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center gap-1">
        <Label htmlFor="tooltip-form-deadband">Deadband (%)</Label>
        <div className="pb-2">
          <InfoTooltip label="About deadband">
            Deadband. A value must move outside this band before a new alarm is raised.
          </InfoTooltip>
        </div>
      </div>
      <Input id="tooltip-form-deadband" type="number" defaultValue={2} />
    </div>
  );
}

function TooltipKpiTile() {
  const kpi = PLANT_KPIS.availability;

  return (
    <div className="w-full max-w-xs rounded-xl bg-muted-background p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">Availability</p>
        <InfoTooltip label="About availability">
          Availability. Share of the last 30 days the plant was able to export gas.
        </InfoTooltip>
      </div>
      <p className="text-2xl font-semibold tabular-nums text-base-foreground">
        {kpi.value}
        {kpi.unit}
      </p>
    </div>
  );
}

function TooltipTableHeader() {
  return (
    <div className="grid w-full max-w-md grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-2 text-sm">
      <span className="text-xs font-medium text-muted-foreground">Asset</span>
      <span className="text-xs font-medium text-muted-foreground">State</span>
      <span className="flex items-center justify-end gap-0.5 text-xs font-medium text-muted-foreground">
        Health
        <InfoTooltip label="About health">Health score. 0 to 100, from vibration, temperature and open work.</InfoTooltip>
      </span>
      {COMPRESSION_ASSETS.slice(0, 3).map((asset) => (
        <div key={asset.id} className="contents">
          <span className="min-w-0 truncate text-base-foreground">{asset.name}</span>
          <StatusBadge status={asset.state} />
          <span className="pr-2 text-right tabular-nums text-base-foreground">{asset.healthScore}</span>
        </div>
      ))}
    </div>
  );
}

function TooltipNavRail() {
  return (
    <TooltipProvider delayDuration={200}>
      <nav aria-label="Sections" className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger
              render={
                <Button variant="ghostOnDark" size="icon" aria-label={label}>
                  <Icon />
                </Button>
              }
            />
            <TooltipContent side="right">{label}</TooltipContent>
          </Tooltip>
        ))}
      </nav>
    </TooltipProvider>
  );
}

export default definePage({
  id: 'tooltip',
  title: 'Tooltip',
  summary:
    'A tooltip is a short, non-interactive hint that appears when the pointer rests on a control or the control takes keyboard focus.',
  docsSlug: 'tooltip',
  guidance: {
    use: [
      'Naming an icon-only button or toggle.',
      'One line, two sentences at most: what it is, then what it does or why it matters.',
      'Showing the full value of text that is cut off.',
      'A focusable trigger, so keyboard users get the same hint.',
    ],
    avoid: [
      'Repeating the visible label.',
      'Information the task depends on; show it inline.',
      'Links, buttons or form controls inside the tooltip.',
      'A natively disabled control as the trigger; it cannot be focused, so explain it inline.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'Hover or focus a trigger to see its hint.',
      specimens: [
        {
          id: 'TooltipBasic',
          title: 'Basic',
          note: 'A button whose consequence is worth one extra line.',
          origin: 'aura',
          Component: TooltipBasic,
        },
        {
          id: 'TooltipIconButton',
          title: 'On an icon button',
          note: 'Every icon-only control: the tooltip is its visible name.',
          origin: 'aura',
          Component: TooltipIconButton,
        },
        {
          id: 'TooltipWithShortcut',
          title: 'With keyboard shortcut',
          note: 'Teaches the shortcut where the action lives.',
          origin: 'aura',
          Component: TooltipWithShortcut,
        },
        {
          id: 'TooltipTwoSentences',
          title: 'Two sentences',
          note: 'The upper limit: cap the width so a longer hint wraps instead of running wide.',
          origin: 'aura',
          Component: TooltipTwoSentences,
        },
      ],
    },
    {
      id: 'placement-and-timing',
      title: 'Placement and timing',
      description: 'Which side it shows on, how it lines up, and how long it waits.',
      specimens: [
        {
          id: 'TooltipSides',
          title: 'Sides',
          note: 'Top by default; move it when the top would cover what the user is reading.',
          origin: 'aura',
          Component: TooltipSides,
        },
        {
          id: 'TooltipAlignments',
          title: 'Alignments',
          note: 'Start or end for wide triggers, so the hint stays near where the pointer entered.',
          origin: 'aura',
          Component: TooltipAlignments,
        },
        {
          id: 'TooltipInstant',
          title: 'No delay',
          note: 'Small, dense targets where users scan icon by icon and the name is the point.',
          origin: 'aura',
          Component: TooltipInstant,
        },
        {
          id: 'TooltipPatient',
          title: 'Long delay',
          note: 'Labelled controls where the hint is a bonus and should not flash on every pass.',
          origin: 'aura',
          Component: TooltipPatient,
        },
      ],
    },
    {
      id: 'triggers',
      title: 'Triggers',
      description: 'Things other than buttons that carry a hint. Each one is focusable.',
      specimens: [
        {
          id: 'TooltipOnBadge',
          title: 'On a badge',
          note: 'A status word that needs its definition on demand.',
          origin: 'aura',
          Component: TooltipOnBadge,
        },
        {
          id: 'TooltipOnTruncatedText',
          title: 'On truncated text',
          note: 'Shows the full value only when the text is actually cut off; the second line fits and stays quiet.',
          origin: 'custom',
          uses: ['overlays/TruncatedText.tsx'],
          Component: TooltipOnTruncatedText,
        },
        {
          id: 'TooltipOnAvatar',
          title: 'On an avatar',
          note: 'Initials alone do not identify a person.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: TooltipOnAvatar,
        },
        {
          id: 'TooltipInfoIcon',
          title: 'Info icon',
          note: 'A label or metric that needs a definition but has no control of its own to hang it on.',
          origin: 'custom',
          uses: ['overlays/InfoTooltip.tsx'],
          Component: TooltipInfoIcon,
        },
        {
          id: 'TooltipOnAbbreviation',
          title: 'On a unit or abbreviation',
          note: 'Spells out a unit that experts read at a glance and newcomers do not.',
          origin: 'aura',
          Component: TooltipOnAbbreviation,
        },
        {
          id: 'TooltipOnTimestamp',
          title: 'On a relative time',
          note: 'Relative time for scanning, the exact timestamp on demand.',
          origin: 'aura',
          Component: TooltipOnTimestamp,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Tooltips that depend on what the control is doing.',
      specimens: [
        {
          id: 'TooltipUnavailableAction',
          title: 'Unavailable action with reason',
          note: 'Only when there is no room for an inline reason: aria-disabled keeps the button focusable so the hint is reachable.',
          origin: 'custom',
          Component: TooltipUnavailableAction,
        },
        {
          id: 'TooltipConfirmation',
          title: 'Changes after the action',
          note: 'The hint names the action, then confirms it, so a copy needs no toast. Click to try.',
          origin: 'custom',
          Component: TooltipConfirmation,
        },
        {
          id: 'TooltipConditional',
          title: 'Only when the label is hidden',
          note: 'A collapsible nav item: the tooltip is switched off while the label is visible.',
          origin: 'aura',
          Component: TooltipConditional,
        },
        {
          id: 'TooltipNotHoverable',
          title: 'Closes when the pointer leaves',
          note: 'Tightly packed triggers, where a lingering tooltip would cover the next one.',
          origin: 'aura',
          Component: TooltipNotHoverable,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Tooltips working together in toolbars, forms, tiles and navigation.',
      specimens: [
        {
          id: 'TooltipToolbar',
          title: 'Toolbar',
          note: 'Icon tools under one provider: the first hint waits, the neighbours follow at once.',
          origin: 'aura',
          Component: TooltipToolbar,
        },
        {
          id: 'TooltipFormLabel',
          title: 'Beside a form label',
          note: 'A definition for a field name; what to type still belongs in helper text.',
          origin: 'custom',
          uses: ['overlays/InfoTooltip.tsx'],
          Component: TooltipFormLabel,
        },
        {
          id: 'TooltipKpiTile',
          title: 'On a KPI tile',
          note: 'Says how a headline number is calculated without spending tile space on it.',
          origin: 'custom',
          uses: ['overlays/InfoTooltip.tsx'],
          Component: TooltipKpiTile,
        },
        {
          id: 'TooltipTableHeader',
          title: 'In a table header',
          note: 'Explains a column once, in the header, instead of in every row.',
          origin: 'custom',
          size: 'md',
          uses: ['overlays/InfoTooltip.tsx', 'display/StatusBadge.tsx'],
          Component: TooltipTableHeader,
        },
        {
          id: 'TooltipNavRail',
          title: 'Icon navigation rail',
          note: 'A collapsed sidebar: labels show to the right, away from the content.',
          origin: 'aura',
          surface: 'chrome',
          Component: TooltipNavRail,
        },
      ],
    },
  ],
});
