import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@cognite/aura/components/command';
import { Kbd, KbdGroup } from '@cognite/aura/components/kbd';
import { Loader } from '@cognite/aura/components/loader';
import { Popover, PopoverContent, PopoverTrigger } from '@cognite/aura/components/popover';
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBell,
  IconBuildingFactory2,
  IconChartLine,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconDownload,
  IconEngine,
  IconFileText,
  IconGauge,
  IconLayoutDashboard,
  IconLock,
  IconMoon,
  IconPlus,
  IconSearch,
  IconSettings,
  IconTool,
  IconTrash,
  IconUser,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { CommandPalette } from '../../../library/navigation/CommandPalette';
import { ASSETS, PEOPLE, SENSORS, SITES, findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './command.tsx?raw';

const EQUIPMENT = ASSETS.filter((asset) => asset.type === 'compressor' || asset.type === 'pump');

/** An inline command list needs its own edge; in a dialog or popover the overlay provides it. */
function CommandFrame({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-sm overflow-hidden rounded-xl border border-default">{children}</div>;
}

function CommandBasic() {
  return (
    <CommandFrame>
      <Command label="Go to page">
        <CommandInput placeholder="Go to page" />
        <CommandList>
          <CommandEmpty>No matching pages.</CommandEmpty>
          <CommandItem>Overview</CommandItem>
          <CommandItem>Alarms</CommandItem>
          <CommandItem>Work orders</CommandItem>
          <CommandItem>Trends</CommandItem>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandGrouped() {
  return (
    <CommandFrame>
      <Command label="Command palette">
        <CommandInput placeholder="Type a command or search" />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>
          <CommandGroup heading="Go to">
            <CommandItem>Alarms</CommandItem>
            <CommandItem>Work orders</CommandItem>
          </CommandGroup>
          <CommandGroup heading="Actions">
            <CommandItem>Create work order</CommandItem>
            <CommandItem>Acknowledge all alarms</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandWithSeparators() {
  return (
    <CommandFrame>
      <Command label="Dashboard actions">
        <CommandInput placeholder="Search actions" />
        <CommandList>
          <CommandEmpty>No matching actions.</CommandEmpty>
          <CommandGroup>
            <CommandItem>Add chart</CommandItem>
            <CommandItem>Add KPI tile</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem>Duplicate dashboard</CommandItem>
            <CommandItem>Export as PDF</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandListOnly() {
  return (
    <CommandFrame>
      <Command label="Alarm actions">
        <CommandList>
          <CommandItem>Acknowledge alarm</CommandItem>
          <CommandItem>Shelve for 1 hour</CommandItem>
          <CommandItem>Create work order</CommandItem>
          <CommandItem>Open trend</CommandItem>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandRecentFirst() {
  return (
    <CommandFrame>
      <Command label="Command palette">
        <CommandInput placeholder="Type a command or search" />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>
          <CommandGroup heading="Recent">
            <CommandItem>
              <IconEngine /> 23-KA-9101 · 1st stage compressor
            </CommandItem>
            <CommandItem>
              <IconTool /> WO-104482 · Inspect drive-end bearing
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Suggested">
            <CommandItem>
              <IconPlus /> Create work order
            </CommandItem>
            <CommandItem>
              <IconBell /> Go to alarms
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandWithIcons() {
  return (
    <CommandFrame>
      <Command label="Go to page">
        <CommandInput placeholder="Go to page" />
        <CommandList>
          <CommandEmpty>No matching pages.</CommandEmpty>
          <CommandItem>
            <IconLayoutDashboard /> Overview
          </CommandItem>
          <CommandItem>
            <IconAlertTriangle /> Alarms
          </CommandItem>
          <CommandItem>
            <IconTool /> Work orders
          </CommandItem>
          <CommandItem>
            <IconChartLine /> Trends
          </CommandItem>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandWithShortcuts() {
  return (
    <CommandFrame>
      <Command label="Command palette">
        <CommandInput placeholder="Type a command or search" />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem>
              <IconPlus /> Create work order
              <CommandShortcut>C W</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <IconCopy /> Copy link to page
              <CommandShortcut>⌘⇧C</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <IconDownload /> Export data
              <CommandShortcut>⌘E</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <IconSettings /> Open settings
              <CommandShortcut>⌘,</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandInsetGroup() {
  return (
    <CommandFrame>
      <Command label="View options">
        <CommandList>
          <CommandGroup heading="Density" inset>
            <CommandItem>
              <IconCheck /> Comfortable
            </CommandItem>
            <CommandItem>
              <span className="size-4" /> Compact
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Time zone" inset>
            <CommandItem>
              <IconCheck /> UTC
            </CommandItem>
            <CommandItem>
              <span className="size-4" /> Plant local time
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandWithDescriptions() {
  return (
    <CommandFrame>
      <Command label="Create">
        <CommandInput placeholder="What do you want to create?" />
        <CommandList>
          <CommandEmpty>Nothing to create by that name.</CommandEmpty>
          <CommandItem value="Work order">
            <IconTool />
            <span className="flex flex-col">
              <span>Work order</span>
              <span className="text-xs text-muted-foreground">Plan corrective or preventive maintenance</span>
            </span>
          </CommandItem>
          <CommandItem value="Dashboard">
            <IconLayoutDashboard />
            <span className="flex flex-col">
              <span>Dashboard</span>
              <span className="text-xs text-muted-foreground">Charts and KPI tiles for an asset or area</span>
            </span>
          </CommandItem>
          <CommandItem value="Alarm rule">
            <IconBell />
            <span className="flex flex-col">
              <span>Alarm rule</span>
              <span className="text-xs text-muted-foreground">Notify when a sensor crosses a limit</span>
            </span>
          </CommandItem>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandWithMetadata() {
  return (
    <CommandFrame>
      <Command label="Find equipment">
        <CommandInput placeholder="Find equipment by tag or name" />
        <CommandList>
          <CommandEmpty>No equipment matches.</CommandEmpty>
          <CommandGroup heading="Equipment">
            {EQUIPMENT.slice(0, 5).map((asset) => (
              <CommandItem key={asset.id} value={`${asset.tag} ${asset.name}`}>
                <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{asset.tag}</span>
                <span className="min-w-0 flex-1 truncate">{asset.name}</span>
                {asset.state === 'tripped' ? <Badge variant="error">Tripped</Badge> : null}
                {asset.state === 'standby' ? <Badge variant="secondary">Standby</Badge> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandWithKeywords() {
  const [search, setSearch] = useState('vibration');

  return (
    <CommandFrame>
      <Command label="Find a sensor">
        <CommandInput placeholder="Find a sensor" value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>No sensors match.</CommandEmpty>
          {SENSORS.slice(0, 6).map((sensor) => (
            <CommandItem
              key={sensor.id}
              value={sensor.tag}
              keywords={[sensor.name, sensor.unit, findAsset(sensor.assetId)?.name ?? '']}
            >
              <IconGauge /> <span className="font-mono text-xs">{sensor.tag}</span>
              <CommandShortcut>{sensor.name}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandCurrentChoice() {
  const [siteId, setSiteId] = useState('nordkapp');

  return (
    <CommandFrame>
      <Command label="Switch site">
        <CommandInput placeholder="Switch site" />
        <CommandList>
          <CommandEmpty>No sites match.</CommandEmpty>
          <CommandGroup heading="Sites">
            {SITES.map((site) => (
              <CommandItem key={site.id} value={site.name} onSelect={() => setSiteId(site.id)}>
                <IconBuildingFactory2 />
                {site.name}
                <span className="text-xs text-muted-foreground">{site.region}</span>
                {site.id === siteId ? <IconCheck className="ml-auto" aria-label="Current site" /> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandNoResults() {
  const [search, setSearch] = useState('turbine blade');

  return (
    <CommandFrame>
      <Command label="Go to page">
        <CommandInput placeholder="Go to page" value={search} onValueChange={setSearch} />
        <CommandList>
          <CommandEmpty>No pages match “{search}”. Try a tag such as 23-KA-9101.</CommandEmpty>
          <CommandItem>Overview</CommandItem>
          <CommandItem>Alarms</CommandItem>
          <CommandItem>Work orders</CommandItem>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandNoResultsWithFallback() {
  const [search, setSearch] = useState('seal gas');
  const [created, setCreated] = useState<string | null>(null);

  return (
    <CommandFrame>
      <Command label="Find a work order" shouldFilter={false}>
        <CommandInput
          placeholder="Find a work order"
          value={search}
          onValueChange={(next) => {
            setSearch(next);
            setCreated(null);
          }}
        />
        <CommandList>
          <CommandGroup heading={created ? 'Created' : 'No work orders match'}>
            {created ? (
              <CommandItem disabled>
                <IconCheck /> Draft “{created}” created
              </CommandItem>
            ) : (
              <CommandItem disabled={search.trim() === ''} onSelect={() => setCreated(search.trim())}>
                <IconPlus /> Create work order “{search.trim()}”
              </CommandItem>
            )}
            <CommandItem>
              <IconSearch /> Search all Nordkapp data
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandDisabledItems() {
  return (
    <CommandFrame>
      <Command label="Compressor actions">
        <CommandInput placeholder="Search actions" />
        <CommandList>
          <CommandEmpty>No matching actions.</CommandEmpty>
          <CommandGroup heading="23-KA-9103 · Recompressor">
            <CommandItem>
              <IconTool /> Create work order
            </CommandItem>
            <CommandItem disabled>
              <IconLock /> Start compressor
              <CommandShortcut>Tripped</CommandShortcut>
            </CommandItem>
            <CommandItem disabled>
              <IconLock /> Change setpoint
              <CommandShortcut>Needs operator role</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandLoadingResults() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2">
      <CommandFrame>
        <Command label="Search time series" shouldFilter={false}>
          <CommandInput placeholder="Search time series" defaultValue="pressure" />
          <CommandList aria-busy={loading}>
            {loading ? (
              <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader variant="inline" /> Searching 1,284 time series…
              </div>
            ) : (
              <CommandGroup heading="3 results">
                {SENSORS.filter((sensor) => sensor.name.includes('pressure')).map((sensor) => (
                  <CommandItem key={sensor.id} value={sensor.tag}>
                    <IconGauge /> {sensor.name}
                    <CommandShortcut>{sensor.tag}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandFrame>
      <Button variant="ghost" size="sm" onClick={() => setLoading(!loading)}>
        {loading ? 'Show results' : 'Show loading'}
      </Button>
    </div>
  );
}

function CommandCustomMatching() {
  return (
    <CommandFrame>
      <Command
        label="Find a sensor by tag"
        filter={(value, search) => (value.toLowerCase().replace(/-/g, '').startsWith(search.replace(/[-\s]/g, '').toLowerCase()) ? 1 : 0)}
      >
        <CommandInput placeholder="Tag starts with, for example 23pt" defaultValue="23pt" />
        <CommandList>
          <CommandEmpty>No tag starts with that.</CommandEmpty>
          {SENSORS.slice(0, 8).map((sensor) => (
            <CommandItem key={sensor.id} value={sensor.tag}>
              <span className="font-mono text-xs">{sensor.tag}</span>
              <CommandShortcut>{sensor.name}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandConfirmDestructive() {
  const [step, setStep] = useState<'actions' | 'confirm' | 'deleted'>('actions');

  return (
    <CommandFrame>
      <Command label="Dashboard actions">
        {step === 'actions' ? <CommandInput placeholder="Search actions" /> : null}
        <CommandList>
          {step === 'actions' ? (
            <CommandGroup heading="Compression overview">
              <CommandItem>
                <IconCopy /> Duplicate dashboard
              </CommandItem>
              <CommandItem>
                <IconDownload /> Export as PDF
              </CommandItem>
              <CommandItem onSelect={() => setStep('confirm')}>
                <IconTrash /> Delete dashboard
                <IconChevronRight className="ml-auto" />
              </CommandItem>
            </CommandGroup>
          ) : null}
          {step === 'confirm' ? (
            <CommandGroup heading="Delete “Compression overview”? This cannot be undone.">
              <CommandItem onSelect={() => setStep('actions')}>Keep dashboard</CommandItem>
              <CommandItem onSelect={() => setStep('deleted')}>
                <IconTrash /> Delete permanently
              </CommandItem>
            </CommandGroup>
          ) : null}
          {step === 'deleted' ? (
            <CommandGroup heading="Dashboard deleted">
              <CommandItem onSelect={() => setStep('actions')}>Start over</CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandNestedPages() {
  const [page, setPage] = useState<'root' | 'assign'>('root');
  const [search, setSearch] = useState('');
  const [assignee, setAssignee] = useState('Unassigned');

  const open = (next: 'root' | 'assign') => {
    setPage(next);
    setSearch('');
  };

  return (
    <CommandFrame>
      <Command
        label="Work order actions"
        onKeyDown={(event) => {
          if (page === 'assign' && search === '' && (event.key === 'Backspace' || event.key === 'Escape')) {
            event.preventDefault();
            open('root');
          }
        }}
      >
        <CommandInput
          placeholder={page === 'root' ? 'WO-104466 · Search actions' : 'Assign to… Backspace goes back'}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          {page === 'root' ? (
            <CommandGroup heading="Vibration survey, 1st stage compressor">
              <CommandItem onSelect={() => open('assign')}>
                <IconUser /> Assign to…
                <CommandShortcut>{assignee}</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <IconFileText /> Add note
              </CommandItem>
              <CommandItem>
                <IconArrowRight /> Move to planned
              </CommandItem>
            </CommandGroup>
          ) : (
            <CommandGroup heading="Assign to">
              {PEOPLE.slice(0, 4).map((person) => (
                <CommandItem
                  key={person.id}
                  value={`${person.name} ${person.role}`}
                  onSelect={() => {
                    setAssignee(person.name);
                    open('root');
                  }}
                >
                  {person.name}
                  <CommandShortcut>{person.role}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </CommandFrame>
  );
}

function CommandInDialog() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string | null>(null);

  const run = (label: string) => {
    setLast(label);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="outline" onClick={() => setOpen(true)}>
        <IconSearch /> Open command palette
      </Button>
      <p className="text-xs text-muted-foreground">{last ? `Last command: ${last}` : 'Nothing run yet'}</p>
      <CommandDialog open={open} onOpenChange={setOpen} title="Command palette" description="Search for a command to run">
        <CommandInput placeholder="Type a command or search" />
        <CommandList>
          <CommandEmpty>No matching commands.</CommandEmpty>
          <CommandGroup heading="Go to">
            <CommandItem onSelect={() => run('Go to alarms')}>
              <IconBell /> Go to alarms
              <CommandShortcut>G A</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run('Go to work orders')}>
              <IconTool /> Go to work orders
              <CommandShortcut>G W</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => run('Create work order')}>
              <IconPlus /> Create work order
              <CommandShortcut>C W</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => run('Switch to dark mode')}>
              <IconMoon /> Switch to dark mode
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}

function CommandPaletteWithHotkey() {
  const [last, setLast] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <CommandPalette
        hotkey="k"
        triggerLabel="Search or run a command"
        groups={[
          {
            id: 'go',
            heading: 'Go to',
            items: [
              { id: 'alarms', label: 'Go to alarms', icon: <IconBell />, shortcut: 'G A', onSelect: () => setLast('Go to alarms') },
              { id: 'trends', label: 'Go to trends', icon: <IconChartLine />, shortcut: 'G T', onSelect: () => setLast('Go to trends') },
            ],
          },
          {
            id: 'actions',
            heading: 'Actions',
            items: [
              { id: 'create', label: 'Create work order', icon: <IconPlus />, shortcut: 'C W', onSelect: () => setLast('Create work order') },
              { id: 'export', label: 'Export data', icon: <IconDownload />, keywords: ['csv', 'download'], onSelect: () => setLast('Export data') },
            ],
          },
        ]}
      />
      <p className="text-center text-xs text-muted-foreground">
        {last ? `Last command: ${last}` : 'Click, or press ⌘K or Ctrl+K'}
      </p>
    </div>
  );
}

function CommandInPopover() {
  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState('23-ka-9101');
  const asset = findAsset(assetId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconEngine /> {asset?.tag} <IconChevronDown />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-80 p-0">
        <Command label="Switch equipment">
          <CommandInput placeholder="Switch equipment" />
          <CommandList>
            <CommandEmpty>No equipment matches.</CommandEmpty>
            <CommandGroup heading="Gas compression">
              {ASSETS.filter((entry) => entry.parentId === 'nk-23').map((entry) => (
                <CommandItem
                  key={entry.id}
                  value={`${entry.tag} ${entry.name}`}
                  onSelect={() => {
                    setAssetId(entry.id);
                    setOpen(false);
                  }}
                >
                  <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">{entry.tag}</span>
                  <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                  {entry.id === assetId ? <IconCheck aria-label="Current" /> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CommandShortcutHint() {
  return (
    <div className="flex flex-col items-center gap-3">
      <Button variant="ghost" size="sm">
        <IconSearch /> Search
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <p className="max-w-56 text-center text-xs text-muted-foreground">
        Show the shortcut on whatever opens the palette, so people learn it without reading docs.
      </p>
    </div>
  );
}

export default definePage({
  id: 'command',
  title: 'Command',
  summary:
    'A keyboard-first list for finding and running actions or jumping to a page. Type to filter, arrow to move, Enter to run — usually in a dialog behind ⌘K.',
  docsSlug: 'command',
  guidance: {
    use: [
      'App-wide, when there are more actions and pages than navigation can show.',
      'Groups with headings, and action-oriented labels: "Create work order", "Go to alarms".',
      'Recent and frequent items first, before the user has typed anything.',
      'The shortcut shown on the button that opens it, and on items that have their own.',
    ],
    avoid: [
      'Filtering one list or table — use Search.',
      'Choosing a value in a form — use Select or Combobox.',
      'Running destructive commands straight from the list; add a confirming step.',
      'An empty list with no message when nothing matches.',
    ],
  },
  source,
  sections: [
    {
      id: 'structure',
      title: 'Structure',
      description: 'Input, list, groups and separators. All of these filter as you type.',
      specimens: [
        {
          id: 'CommandBasic',
          title: 'Input and list',
          note: 'A short flat list of destinations or actions.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandBasic,
        },
        {
          id: 'CommandGrouped',
          title: 'Grouped',
          note: 'More than about six items, or items of different kinds such as pages and actions.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandGrouped,
        },
        {
          id: 'CommandWithSeparators',
          title: 'Separated without headings',
          note: 'Clusters that are obvious from their labels and do not need naming.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandWithSeparators,
        },
        {
          id: 'CommandListOnly',
          title: 'List without input',
          note: 'A handful of actions for one object, still driven by arrow keys and Enter.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandListOnly,
        },
        {
          id: 'CommandRecentFirst',
          title: 'Recent and suggested',
          note: 'The default view of an app-wide palette, before anything is typed.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandRecentFirst,
        },
        {
          id: 'CommandInsetGroup',
          title: 'Inset groups',
          note: 'Lists where a leading check or icon column is reserved; headings line up with the labels.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandInsetGroup,
        },
      ],
    },
    {
      id: 'item-content',
      title: 'Item content',
      description: 'What a row can carry besides its label.',
      specimens: [
        {
          id: 'CommandWithIcons',
          title: 'With icons',
          note: 'Items of different kinds; the icon tells pages, actions and objects apart.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandWithIcons,
        },
        {
          id: 'CommandWithShortcuts',
          title: 'With shortcuts',
          note: 'Commands that have a direct shortcut; the palette is where people learn it.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandWithShortcuts,
        },
        {
          id: 'CommandWithDescriptions',
          title: 'With descriptions',
          note: 'A few choices whose names alone do not say what they do.',
          origin: 'custom',
          align: 'stretch',
          Component: CommandWithDescriptions,
        },
        {
          id: 'CommandWithMetadata',
          title: 'Tag, name and status',
          note: 'Looking up industrial objects, which people search by tag and recognise by name.',
          origin: 'custom',
          align: 'stretch',
          Component: CommandWithMetadata,
        },
        {
          id: 'CommandCurrentChoice',
          title: 'Current choice marked',
          note: 'Switching context — site, project, workspace — where one option is already active.',
          origin: 'custom',
          align: 'stretch',
          Component: CommandCurrentChoice,
        },
        {
          id: 'CommandWithKeywords',
          title: 'Matches on keywords',
          note: 'Items people describe in words the label does not contain. Here "vibration" finds a tag.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandWithKeywords,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Nothing found, not allowed, still searching, and are you sure.',
      specimens: [
        {
          id: 'CommandNoResults',
          title: 'No results',
          note: 'Always say that nothing matched, and suggest what would.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandNoResults,
        },
        {
          id: 'CommandNoResultsWithFallback',
          title: 'No results with a way forward',
          note: 'When the search text is a good start for creating the thing, or for a wider search.',
          origin: 'custom',
          align: 'stretch',
          Component: CommandNoResultsWithFallback,
        },
        {
          id: 'CommandDisabledItems',
          title: 'Unavailable commands',
          note: 'Commands that exist but cannot run now; the reason sits where the shortcut would.',
          origin: 'custom',
          align: 'stretch',
          Component: CommandDisabledItems,
        },
        {
          id: 'CommandLoadingResults',
          title: 'Loading results',
          note: 'Results that come from the server: turn off local filtering and show progress in the list.',
          origin: 'custom',
          align: 'stretch',
          Component: CommandLoadingResults,
        },
        {
          id: 'CommandCustomMatching',
          title: 'Custom matching',
          note: 'Identifiers people type without separators: "23pt" should find 23-PT-92531.',
          origin: 'aura',
          align: 'stretch',
          Component: CommandCustomMatching,
        },
        {
          id: 'CommandConfirmDestructive',
          title: 'Confirm a destructive command',
          note: 'Anything irreversible gets a second step inside the palette, with the safe choice first.',
          origin: 'custom',
          align: 'stretch',
          Component: CommandConfirmDestructive,
        },
      ],
    },
    {
      id: 'overlays',
      title: 'In overlays',
      description: 'How the palette is opened. All of these stay closed until you use the trigger.',
      specimens: [
        {
          id: 'CommandShortcutHint',
          title: 'Trigger with shortcut',
          note: 'The entry point in a topbar or toolbar: a search-shaped button that teaches ⌘K.',
          origin: 'aura',
          Component: CommandShortcutHint,
        },
        {
          id: 'CommandInDialog',
          title: 'In a dialog',
          note: 'The app-wide palette: centred, over everything, closed after a command runs.',
          origin: 'aura',
          Component: CommandInDialog,
        },
        {
          id: 'CommandInPopover',
          title: 'In a popover',
          note: 'A switcher tied to one control, such as the equipment a page is about.',
          origin: 'custom',
          Component: CommandInPopover,
        },
        {
          id: 'CommandPaletteWithHotkey',
          title: 'Palette with ⌘K',
          note: 'The whole pattern from one component: trigger, shortcut listener, dialog, close on run.',
          origin: 'custom',
          uses: ['navigation/CommandPalette.tsx'],
          Component: CommandPaletteWithHotkey,
        },
        {
          id: 'CommandNestedPages',
          title: 'Nested pages',
          note: 'A command that needs one more choice, such as who to assign to. Backspace goes back.',
          origin: 'custom',
          size: 'md',
          Component: CommandNestedPages,
        },
      ],
    },
  ],
});
