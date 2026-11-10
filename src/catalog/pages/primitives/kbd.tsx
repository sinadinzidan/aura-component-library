import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@cognite/aura/components/input-group';
import { Kbd, KbdGroup } from '@cognite/aura/components/kbd';
import { Label } from '@cognite/aura/components/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconChevronDown,
  IconCommand,
  IconCornerDownLeft,
  IconRefresh,
  IconSearch,
} from '@cognite/aura/icons';

import { ShortcutHint } from '../../../library/actions/ShortcutHint';
import { definePage } from '../../types';

import source from './kbd.tsx?raw';

const SHORTCUTS = [
  { action: 'Open search', keys: ['mod', 'K'], mode: 'chord' },
  { action: 'Acknowledge selected alarm', keys: ['A'], mode: 'chord' },
  { action: 'Create work order', keys: ['mod', 'shift', 'W'], mode: 'chord' },
  { action: 'Go to alarms', keys: ['G', 'A'], mode: 'sequence' },
  { action: 'Go to work orders', keys: ['G', 'W'], mode: 'sequence' },
] as const;

const NAV_ROWS = [
  { label: 'Alarms', keys: ['G', 'A'] },
  { label: 'Work orders', keys: ['G', 'W'] },
  { label: 'Trends', keys: ['G', 'T'] },
] as const;

function KbdSingle() {
  return <Kbd>K</Kbd>;
}

function KbdModifiers() {
  return (
    <div className="flex items-center gap-3">
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>⌥</Kbd>
      <Kbd>⌃</Kbd>
    </div>
  );
}

function KbdNamedKeys() {
  return (
    <div className="flex items-center gap-3">
      <Kbd>Esc</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Space</Kbd>
    </div>
  );
}

function KbdWithIcon() {
  return (
    <div className="flex items-center gap-3">
      <Kbd aria-label="Command">
        <IconCommand />
      </Kbd>
      <Kbd aria-label="Enter">
        <IconCornerDownLeft />
      </Kbd>
      <Kbd aria-label="Up arrow">
        <IconArrowUp />
      </Kbd>
      <Kbd aria-label="Down arrow">
        <IconArrowDown />
      </Kbd>
    </div>
  );
}

function KbdArrowCluster() {
  return (
    <KbdGroup>
      <Kbd aria-label="Left arrow">
        <IconArrowLeft />
      </Kbd>
      <Kbd aria-label="Up arrow">
        <IconArrowUp />
      </Kbd>
      <Kbd aria-label="Down arrow">
        <IconArrowDown />
      </Kbd>
      <Kbd aria-label="Right arrow">
        <IconArrowRight />
      </Kbd>
    </KbdGroup>
  );
}

function KbdGroupChord() {
  return (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  );
}

function KbdGroupThreeKeys() {
  return (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>⇧</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  );
}

function KbdGroupWithPlus() {
  return (
    <KbdGroup>
      <Kbd>Ctrl</Kbd>
      <span className="text-xs text-muted-foreground">+</span>
      <Kbd>Shift</Kbd>
      <span className="text-xs text-muted-foreground">+</span>
      <Kbd>K</Kbd>
    </KbdGroup>
  );
}

function KbdGroupSequence() {
  return (
    <KbdGroup>
      <Kbd>G</Kbd>
      <span className="text-xs text-muted-foreground">then</span>
      <Kbd>A</Kbd>
    </KbdGroup>
  );
}

function KbdGroupAlternatives() {
  return (
    <KbdGroup>
      <Kbd>J</Kbd>
      <span className="text-xs text-muted-foreground">or</span>
      <Kbd>↓</Kbd>
    </KbdGroup>
  );
}

function KbdCombined() {
  return <Kbd>⇧⌘Z</Kbd>;
}

function KbdDisabled() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button variant="secondary" disabled>
        Run query
        <KbdGroup>
          <Kbd aria-disabled>⌘</Kbd>
          <Kbd aria-disabled>↵</Kbd>
        </KbdGroup>
      </Button>
      <p className="text-sm text-muted-foreground">Write a query to run it.</p>
    </div>
  );
}

function KbdPlatformAware() {
  return (
    <dl className="grid grid-cols-[auto_auto] items-center gap-x-4 gap-y-3 text-sm">
      <dt className="text-muted-foreground">macOS</dt>
      <dd>
        <ShortcutHint keys={['mod', 'shift', 'K']} platform="mac" />
      </dd>
      <dt className="text-muted-foreground">Windows and Linux</dt>
      <dd>
        <ShortcutHint keys={['mod', 'shift', 'K']} platform="other" />
      </dd>
    </dl>
  );
}

function KbdPlatformDetected() {
  return (
    <p className="flex items-center gap-2 text-sm text-base-foreground">
      Save changes
      <ShortcutHint keys={['mod', 'S']} />
    </p>
  );
}

function KbdHintSequence() {
  return (
    <p className="flex items-center gap-2 text-sm text-base-foreground">
      Go to alarms
      <ShortcutHint keys={['G', 'A']} mode="sequence" />
    </p>
  );
}

function KbdInlineText() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      Press <Kbd>/</Kbd> to search assets, or <Kbd>Esc</Kbd> to close the panel.
    </p>
  );
}

function KbdInButton() {
  return (
    <Button variant="secondary">
      Run query
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>↵</Kbd>
      </KbdGroup>
    </Button>
  );
}

function KbdInTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" aria-label="Refresh data">
            <IconRefresh />
          </Button>
        }
      />
      <TooltipContent>
        <span className="flex items-center gap-2">
          Refresh data <ShortcutHint keys={['R']} />
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function KbdInSearchField() {
  return (
    <div className="w-full max-w-xs">
      <Label htmlFor="kbd-search">Search assets</Label>
      <InputGroup>
        <InputGroupAddon>
          <IconSearch />
        </InputGroupAddon>
        <InputGroupInput id="kbd-search" placeholder="Tag or name" />
        <InputGroupAddon align="inline-end">
          <Kbd>/</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

function KbdInMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Alarm actions <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>
          Acknowledge <DropdownMenuShortcut>A</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Shelve for 1 hour <DropdownMenuShortcut>S</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Create work order <DropdownMenuShortcut>⇧⌘W</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function KbdShortcutList() {
  return (
    <div className="w-full max-w-md">
      <p className="pb-3 text-sm font-medium text-base-foreground">Keyboard shortcuts</p>
      <dl className="flex flex-col gap-3">
        {SHORTCUTS.map((shortcut) => (
          <div key={shortcut.action} className="flex items-center justify-between gap-4 text-sm">
            <dt className="text-medium-foreground">{shortcut.action}</dt>
            <dd>
              <ShortcutHint keys={shortcut.keys} mode={shortcut.mode} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function KbdCommandFooter() {
  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-xl bg-muted-background px-3 py-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-2">
        <KbdGroup>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
        </KbdGroup>
        Navigate
      </span>
      <span className="flex items-center gap-2">
        <Kbd>↵</Kbd> Open
      </span>
      <span className="ml-auto flex items-center gap-2">
        <Kbd>Esc</Kbd> Close
      </span>
    </div>
  );
}

function KbdNavRows() {
  return (
    <ul className="flex w-full max-w-xs flex-col gap-1">
      {NAV_ROWS.map((row) => (
        <li key={row.label} className="flex items-center justify-between gap-3 py-1 text-sm text-base-foreground">
          {row.label}
          <ShortcutHint keys={row.keys} mode="sequence" />
        </li>
      ))}
    </ul>
  );
}

function KbdOnMuted() {
  return (
    <p className="flex items-center gap-2 text-sm text-medium-foreground">
      Open command menu
      <KbdGroup>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </p>
  );
}

export default definePage({
  id: 'kbd',
  title: 'Kbd',
  summary:
    'Kbd shows a keyboard key. Group keys to show a shortcut, and put it next to the action it triggers so people learn it while they work.',
  docsSlug: 'kbd',
  guidance: {
    use: [
      'Shortcuts for the few actions people repeat most, shown where the action lives.',
      'One key per Kbd, grouped in press order: modifiers first, then the key.',
      'Platform conventions: ⌘ on a Mac, Ctrl on Windows and Linux.',
      'Words for keys without a well-known symbol: Esc, Tab, Space.',
    ],
    avoid: [
      'Shortcuts that fight the browser or operating system.',
      'A shortcut as the only way to reach an action.',
      'Using Kbd to style ordinary text, codes or tags.',
      'A shortcut hint on every control — it becomes noise.',
    ],
  },
  source,
  sections: [
    {
      id: 'keys',
      title: 'Keys',
      description: 'A single key, shown as a letter, a symbol, a word or an icon.',
      specimens: [
        {
          id: 'KbdSingle',
          title: 'Single key',
          note: 'A one-key shortcut; letters are always upper case.',
          origin: 'aura',
          Component: KbdSingle,
        },
        {
          id: 'KbdModifiers',
          title: 'Modifier symbols',
          note: 'Mac modifier glyphs, for apps whose users are mostly on macOS.',
          origin: 'aura',
          Component: KbdModifiers,
        },
        {
          id: 'KbdNamedKeys',
          title: 'Named keys',
          note: 'Keys with no familiar symbol are written out; the key grows with the word.',
          origin: 'aura',
          Component: KbdNamedKeys,
        },
        {
          id: 'KbdWithIcon',
          title: 'Icon keys',
          note: 'An icon when the glyph renders poorly in the UI font; name it for screen readers.',
          origin: 'aura',
          Component: KbdWithIcon,
        },
        {
          id: 'KbdCombined',
          title: 'Combined in one key',
          note: 'The compact form menus use: the whole shortcut in a single chip.',
          origin: 'aura',
          Component: KbdCombined,
        },
      ],
    },
    {
      id: 'combinations',
      title: 'Combinations',
      description: 'Several keys in a group, pressed together, in order, or as alternatives.',
      specimens: [
        {
          id: 'KbdGroupChord',
          title: 'Two-key shortcut',
          note: 'The usual case: one modifier and a key, held together.',
          origin: 'aura',
          Component: KbdGroupChord,
        },
        {
          id: 'KbdGroupThreeKeys',
          title: 'Three-key shortcut',
          note: 'A second modifier for the less common variant of an action.',
          origin: 'aura',
          Component: KbdGroupThreeKeys,
        },
        {
          id: 'KbdGroupWithPlus',
          title: 'Joined with plus',
          note: 'With written-out modifiers, a plus makes clear the keys are held together.',
          origin: 'aura',
          Component: KbdGroupWithPlus,
        },
        {
          id: 'KbdGroupSequence',
          title: 'Sequence',
          note: 'Keys pressed one after the other, such as go-to shortcuts.',
          origin: 'aura',
          Component: KbdGroupSequence,
        },
        {
          id: 'KbdGroupAlternatives',
          title: 'Alternatives',
          note: 'Two keys that do the same thing.',
          origin: 'aura',
          Component: KbdGroupAlternatives,
        },
        {
          id: 'KbdArrowCluster',
          title: 'Arrow keys',
          note: 'Says a grid, chart or canvas can be moved through with the arrows.',
          origin: 'aura',
          Component: KbdArrowCluster,
        },
      ],
    },
    {
      id: 'states-and-platform',
      title: 'States and platform',
      description: 'Disabled keys, and shortcuts that follow the platform. The library supplies the platform logic.',
      specimens: [
        {
          id: 'KbdDisabled',
          title: 'Disabled',
          note: 'Inside a disabled control the keys drop their fill so they do not stand out.',
          origin: 'aura',
          Component: KbdDisabled,
        },
        {
          id: 'KbdPlatformAware',
          title: 'Platform-aware shortcut',
          note: 'One definition, shown with the right modifier names on each platform.',
          origin: 'custom',
          uses: ['actions/ShortcutHint.tsx'],
          Component: KbdPlatformAware,
        },
        {
          id: 'KbdPlatformDetected',
          title: 'Detected platform',
          note: 'Without a fixed platform the hint follows the device it is viewed on.',
          origin: 'custom',
          uses: ['actions/ShortcutHint.tsx'],
          Component: KbdPlatformDetected,
        },
      ],
    },
    {
      id: 'in-controls',
      title: 'In controls',
      description: 'Shortcut hints placed on the thing they trigger.',
      specimens: [
        {
          id: 'KbdInlineText',
          title: 'In a sentence',
          note: 'Help and empty-state text that tells people which key to press.',
          origin: 'aura',
          Component: KbdInlineText,
        },
        {
          id: 'KbdInButton',
          title: 'In a button',
          note: 'A frequent action that is worth learning the shortcut for.',
          origin: 'aura',
          Component: KbdInButton,
        },
        {
          id: 'KbdInSearchField',
          title: 'In a search field',
          note: 'Shows the key that focuses the field from anywhere on the page.',
          origin: 'aura',
          Component: KbdInSearchField,
        },
        {
          id: 'KbdInTooltip',
          title: 'In a tooltip',
          note: 'Icon buttons have no room for a hint; the tooltip carries it. Hover to see.',
          origin: 'custom',
          uses: ['actions/ShortcutHint.tsx'],
          Component: KbdInTooltip,
        },
        {
          id: 'KbdInMenu',
          title: 'In a menu',
          note: 'Menu items show their shortcut at the trailing edge. Open to see.',
          origin: 'aura',
          Component: KbdInMenu,
        },
        {
          id: 'KbdOnMuted',
          title: 'On a muted surface',
          note: 'Keys keep their own fill on a grey page or card.',
          origin: 'aura',
          surface: 'muted',
          Component: KbdOnMuted,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Lists and legends built from keys.',
      specimens: [
        {
          id: 'KbdHintSequence',
          title: 'Sequence hint',
          note: 'The same component writes sequences and reads them out as "G then A".',
          origin: 'custom',
          uses: ['actions/ShortcutHint.tsx'],
          Component: KbdHintSequence,
        },
        {
          id: 'KbdNavRows',
          title: 'Navigation shortcuts',
          note: 'Go-to sequences beside the destinations they jump to.',
          origin: 'custom',
          uses: ['actions/ShortcutHint.tsx'],
          Component: KbdNavRows,
        },
        {
          id: 'KbdCommandFooter',
          title: 'Legend in a footer',
          note: 'A quiet row under a command menu or table that says how to drive it.',
          origin: 'custom',
          Component: KbdCommandFooter,
        },
        {
          id: 'KbdShortcutList',
          title: 'Shortcut reference',
          note: 'The full list in a help dialog: action on the left, keys on the right.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/ShortcutHint.tsx'],
          Component: KbdShortcutList,
        },
      ],
    },
  ],
});
