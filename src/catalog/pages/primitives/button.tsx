import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Kbd } from '@cognite/aura/components/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowRight,
  IconBell,
  IconChevronDown,
  IconDownload,
  IconExternalLink,
  IconFilter,
  IconPlayerPlay,
  IconPlus,
  IconRefresh,
  IconSettings,
  IconShare,
  IconTrash,
} from '@cognite/aura/icons';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { CopyButton } from '../../../library/actions/CopyButton';
import { SplitButton } from '../../../library/actions/SplitButton';
import { definePage } from '../../types';

import source from './button.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function ButtonPrimary() {
  return <Button>Save changes</Button>;
}

function ButtonSecondary() {
  return <Button variant="secondary">Export data</Button>;
}

function ButtonOutline() {
  return <Button variant="outline">View details</Button>;
}

function ButtonGhost() {
  return <Button variant="ghost">Cancel</Button>;
}

function ButtonDestructive() {
  return <Button variant="destructive">Delete pipeline</Button>;
}

function ButtonHierarchy() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost">Cancel</Button>
      <Button variant="secondary">Save draft</Button>
      <Button>Publish model</Button>
    </div>
  );
}

function ButtonSizes() {
  return (
    <div className="flex items-center gap-3">
      <Button size="sm">Small</Button>
      <Button>Default</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

function ButtonIconSizes() {
  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="icon-sm" aria-label="Add row">
        <IconPlus />
      </Button>
      <Button variant="secondary" size="icon" aria-label="Add row">
        <IconPlus />
      </Button>
      <Button variant="secondary" size="icon-lg" aria-label="Add row">
        <IconPlus />
      </Button>
    </div>
  );
}

function ButtonLeadingIcon() {
  return (
    <Button>
      <IconPlus /> Add data set
    </Button>
  );
}

function ButtonTrailingIcon() {
  return (
    <Button variant="secondary">
      Continue <IconArrowRight />
    </Button>
  );
}

function ButtonIconOnly() {
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

function ButtonWithShortcut() {
  return (
    <Button variant="secondary">
      Run query <Kbd>⌘</Kbd>
      <Kbd>↵</Kbd>
    </Button>
  );
}

function ButtonWithCount() {
  return (
    <Button variant="outline">
      <IconFilter /> Filters <Badge variant="secondary">3</Badge>
    </Button>
  );
}

function ButtonFullWidth() {
  return (
    <div className="w-full max-w-xs">
      <Button className="w-full">Create work order</Button>
    </div>
  );
}

function ButtonDisabledWithReason() {
  return (
    <div className="flex flex-col items-center gap-2">
      <Button disabled>Deploy function</Button>
      <p className="text-sm text-muted-foreground">Select a schedule before you deploy.</p>
    </div>
  );
}

function ButtonLoading() {
  return (
    <AsyncButton onAction={() => wait(1600)} pendingLabel="Saving…">
      Save changes
    </AsyncButton>
  );
}

function ButtonLoadingSecondary() {
  return (
    <AsyncButton variant="secondary" onAction={() => wait(1600)} pendingLabel="Running…">
      <IconPlayerPlay /> Run transformation
    </AsyncButton>
  );
}

function ButtonCopyConfirm() {
  return <CopyButton variant="outline" text="23-KA-9101" label="Copy tag" />;
}

function ButtonCopyIconOnly() {
  return (
    <div className="flex items-center gap-2 font-mono text-sm text-base-foreground">
      23-KA-9101
      <CopyButton variant="ghost" size="icon-sm" text="23-KA-9101" label="Copy tag" iconOnly />
    </div>
  );
}

function ButtonOnDarkPrimary() {
  return <Button variant="defaultOnDark">Open workspace</Button>;
}

function ButtonOnDarkSecondary() {
  return <Button variant="secondaryOnDark">Invite people</Button>;
}

function ButtonOnDarkGhost() {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghostOnDark" size="icon" aria-label="Notifications">
        <IconBell />
      </Button>
      <Button variant="ghostOnDark" size="icon" aria-label="Settings">
        <IconSettings />
      </Button>
    </div>
  );
}

function ButtonSplit() {
  return (
    <SplitButton
      onClick={() => undefined}
      menuLabel="More save options"
      options={[
        { id: 'draft', label: 'Save as draft', onSelect: () => undefined },
        { id: 'copy', label: 'Save as copy', onSelect: () => undefined },
      ]}
    >
      Save changes
    </SplitButton>
  );
}

function ButtonSplitSecondary() {
  return (
    <SplitButton
      variant="secondary"
      size="sm"
      onClick={() => undefined}
      menuLabel="More export options"
      options={[
        { id: 'csv', label: 'Export as CSV', onSelect: () => undefined },
        { id: 'parquet', label: 'Export as Parquet', onSelect: () => undefined },
      ]}
    >
      <IconDownload /> Export
    </SplitButton>
  );
}

function ButtonMenuTrigger() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Actions <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Move to data set</DropdownMenuItem>
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ButtonConfirmInline() {
  return (
    <ConfirmButton size="sm" confirmLabel="Confirm delete" onConfirm={() => undefined}>
      <IconTrash /> Delete
    </ConfirmButton>
  );
}

function ButtonAsLink() {
  return (
    <Button
      variant="outline"
      render={<a href="https://docs.cognite.com/cdf/flows" target="_blank" rel="noreferrer" />}
    >
      Open Flows docs <IconExternalLink />
    </Button>
  );
}

function ButtonDialogFooter() {
  return (
    <div className="flex w-full max-w-sm justify-end gap-2 rounded-xl bg-muted-background p-4">
      <Button variant="ghost">Cancel</Button>
      <Button>Create data set</Button>
    </div>
  );
}

function ButtonDestructiveFooter() {
  return (
    <div className="flex w-full max-w-sm justify-end gap-2 rounded-xl bg-muted-background p-4">
      <Button variant="ghost">Keep pipeline</Button>
      <Button variant="destructive">Delete pipeline</Button>
    </div>
  );
}

function ButtonToolbarCluster() {
  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm">
        <IconFilter /> Filter
      </Button>
      <Button variant="ghost" size="sm">
        <IconShare /> Share
      </Button>
      <Button variant="ghost" size="sm">
        <IconDownload /> Export
      </Button>
    </div>
  );
}

function ButtonStackedActions() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-2">
      <Button className="w-full">Acknowledge alarm</Button>
      <Button variant="secondary" className="w-full">
        Assign to me
      </Button>
      <Button variant="ghost" className="w-full">
        Snooze for 1 hour
      </Button>
    </div>
  );
}

export default definePage({
  id: 'button',
  title: 'Button',
  summary:
    'Buttons trigger an action or event. Emphasis shows importance: one primary action per view, with everything else stepping down.',
  docsSlug: 'button',
  guidance: {
    use: [
      'One primary button for the most important action on a view.',
      'Secondary, outline and ghost for supporting actions, in that order of emphasis.',
      'Verb + object labels in sentence case: "Save changes", "Delete pipeline".',
      'Destructive only for the final, confirming step of an irreversible action.',
    ],
    avoid: [
      'More than one primary button in the same view.',
      'A button where a link belongs — buttons act, links navigate.',
      'Disabled buttons with no visible reason or way to resolve it.',
      'Icon-only buttons without an accessible name and a tooltip.',
    ],
  },
  source,
  sections: [
    {
      id: 'emphasis',
      title: 'Emphasis',
      description: 'The five levels of importance. Pick by how much the action matters, not by how it looks.',
      specimens: [
        {
          id: 'ButtonPrimary',
          title: 'Primary',
          note: 'The single most important action on a view.',
          origin: 'aura',
          Component: ButtonPrimary,
        },
        {
          id: 'ButtonSecondary',
          title: 'Secondary',
          note: 'Supporting actions next to a primary one.',
          origin: 'aura',
          Component: ButtonSecondary,
        },
        {
          id: 'ButtonOutline',
          title: 'Outline',
          note: 'Low emphasis in dense UI, or when it sits on a tinted surface.',
          origin: 'aura',
          Component: ButtonOutline,
        },
        {
          id: 'ButtonGhost',
          title: 'Ghost',
          note: 'Tertiary actions and toolbar buttons; use as many as needed.',
          origin: 'aura',
          Component: ButtonGhost,
        },
        {
          id: 'ButtonDestructive',
          title: 'Destructive',
          note: 'The confirming step of an irreversible action, usually in a dialog.',
          origin: 'aura',
          Component: ButtonDestructive,
        },
        {
          id: 'ButtonHierarchy',
          title: 'Hierarchy in a row',
          note: 'Three actions of falling importance; primary sits furthest right.',
          origin: 'aura',
          Component: ButtonHierarchy,
        },
      ],
    },
    {
      id: 'size-and-content',
      title: 'Size and content',
      description: 'Three heights, with labels, icons, shortcuts and counts.',
      specimens: [
        {
          id: 'ButtonSizes',
          title: 'Sizes',
          note: 'Small (28px) for toolbars and the topbar, default (36px) elsewhere, large (40px) for focused flows.',
          origin: 'aura',
          Component: ButtonSizes,
        },
        {
          id: 'ButtonIconSizes',
          title: 'Icon sizes',
          note: 'Square icon buttons that match the three text button heights.',
          origin: 'aura',
          Component: ButtonIconSizes,
        },
        {
          id: 'ButtonLeadingIcon',
          title: 'Leading icon',
          note: 'An icon that reinforces the verb, such as add or download.',
          origin: 'aura',
          Component: ButtonLeadingIcon,
        },
        {
          id: 'ButtonTrailingIcon',
          title: 'Trailing icon',
          note: 'Direction or destination: continue, open, expand.',
          origin: 'aura',
          Component: ButtonTrailingIcon,
        },
        {
          id: 'ButtonIconOnly',
          title: 'Icon only with tooltip',
          note: 'Only for highly recognisable icons where space is tight.',
          origin: 'aura',
          Component: ButtonIconOnly,
        },
        {
          id: 'ButtonWithShortcut',
          title: 'With keyboard shortcut',
          note: 'Teaches the shortcut for a frequent action.',
          origin: 'aura',
          Component: ButtonWithShortcut,
        },
        {
          id: 'ButtonWithCount',
          title: 'With count',
          note: 'Shows how many filters or items the action currently covers.',
          origin: 'aura',
          Component: ButtonWithCount,
        },
        {
          id: 'ButtonFullWidth',
          title: 'Full width',
          note: 'Narrow side panels, popovers and small cards.',
          origin: 'aura',
          Component: ButtonFullWidth,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the button looks like while it cannot be used, is working, or has just succeeded.',
      specimens: [
        {
          id: 'ButtonDisabledWithReason',
          title: 'Disabled with reason',
          note: 'If a button must be disabled, say what unblocks it.',
          origin: 'aura',
          Component: ButtonDisabledWithReason,
        },
        {
          id: 'ButtonLoading',
          title: 'Loading',
          note: 'Stays busy until the action settles and blocks a second submit. Click to try.',
          origin: 'custom',
          uses: ['actions/AsyncButton.tsx'],
          Component: ButtonLoading,
        },
        {
          id: 'ButtonLoadingSecondary',
          title: 'Loading, secondary',
          note: 'The same behaviour for a supporting action that takes a while.',
          origin: 'custom',
          uses: ['actions/AsyncButton.tsx'],
          Component: ButtonLoadingSecondary,
        },
        {
          id: 'ButtonCopyConfirm',
          title: 'Copy with confirmation',
          note: 'Confirms in place, so a one-click copy needs no toast.',
          origin: 'custom',
          uses: ['actions/CopyButton.tsx'],
          Component: ButtonCopyConfirm,
        },
        {
          id: 'ButtonCopyIconOnly',
          title: 'Copy beside a value',
          note: 'Icon-only copy next to an ID, tag or key.',
          origin: 'custom',
          uses: ['actions/CopyButton.tsx'],
          Component: ButtonCopyIconOnly,
        },
      ],
    },
    {
      id: 'on-dark',
      title: 'On dark chrome',
      description: 'Fixed-dark variants for sidebars and other chrome that stays dark in both themes.',
      specimens: [
        {
          id: 'ButtonOnDarkPrimary',
          title: 'Primary on dark',
          note: 'The main action inside persistent dark chrome.',
          origin: 'aura',
          surface: 'chrome',
          Component: ButtonOnDarkPrimary,
        },
        {
          id: 'ButtonOnDarkSecondary',
          title: 'Secondary on dark',
          note: 'A supporting action inside persistent dark chrome.',
          origin: 'aura',
          surface: 'chrome',
          Component: ButtonOnDarkSecondary,
        },
        {
          id: 'ButtonOnDarkGhost',
          title: 'Ghost on dark',
          note: 'Icon actions in a dark sidebar or header.',
          origin: 'aura',
          surface: 'chrome',
          Component: ButtonOnDarkGhost,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Buttons combined with menus, confirmation and each other.',
      specimens: [
        {
          id: 'ButtonSplit',
          title: 'Split button',
          note: 'One default action plus a short menu of close alternatives.',
          origin: 'custom',
          uses: ['actions/SplitButton.tsx'],
          Component: ButtonSplit,
        },
        {
          id: 'ButtonSplitSecondary',
          title: 'Split button, small secondary',
          note: 'The split pattern at toolbar size.',
          origin: 'custom',
          uses: ['actions/SplitButton.tsx'],
          Component: ButtonSplitSecondary,
        },
        {
          id: 'ButtonMenuTrigger',
          title: 'Menu trigger',
          note: 'Several actions of equal weight behind one button.',
          origin: 'aura',
          Component: ButtonMenuTrigger,
        },
        {
          id: 'ButtonConfirmInline',
          title: 'Two-step delete',
          note: 'Dense rows where a dialog is too heavy: first click arms, second commits.',
          origin: 'custom',
          uses: ['actions/ConfirmButton.tsx'],
          Component: ButtonConfirmInline,
        },
        {
          id: 'ButtonAsLink',
          title: 'Rendered as a link',
          note: 'Button styling on a real anchor when the action navigates away.',
          origin: 'aura',
          Component: ButtonAsLink,
        },
        {
          id: 'ButtonToolbarCluster',
          title: 'Toolbar cluster',
          note: 'Three or more page actions: all ghost, 8px apart.',
          origin: 'aura',
          Component: ButtonToolbarCluster,
        },
        {
          id: 'ButtonDialogFooter',
          title: 'Dialog footer',
          note: 'Cancel as ghost, the commit as primary, right-aligned.',
          origin: 'aura',
          size: 'md',
          Component: ButtonDialogFooter,
        },
        {
          id: 'ButtonDestructiveFooter',
          title: 'Destructive confirmation footer',
          note: 'The safe choice names what is kept; the destructive one names what is lost.',
          origin: 'aura',
          size: 'md',
          Component: ButtonDestructiveFooter,
        },
        {
          id: 'ButtonStackedActions',
          title: 'Stacked actions',
          note: 'Full-width actions in a narrow panel, most important first.',
          origin: 'aura',
          Component: ButtonStackedActions,
        },
      ],
    },
  ],
});
