import { Button } from '@cognite/aura/components/button';
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '@cognite/aura/components/button-group';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconBellOff,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDots,
  IconDownload,
  IconMaximize,
  IconMinus,
  IconPlayerPlay,
  IconPlayerStop,
  IconPlus,
  IconShare,
  IconZoomIn,
  IconZoomOut,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { CopyButton } from '../../../library/actions/CopyButton';
import { SplitButton } from '../../../library/actions/SplitButton';
import { definePage } from '../../types';

import source from './button-group.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const SHIFT_DAYS = ['10 March', '11 March', '12 March'] as const;

function ButtonGroupHorizontal() {
  return (
    <ButtonGroup>
      <Button variant="outline">Acknowledge</Button>
      <Button variant="outline">Shelve</Button>
      <Button variant="outline">Escalate</Button>
    </ButtonGroup>
  );
}

function ButtonGroupVertical() {
  return (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">Open trend</Button>
      <Button variant="outline">Open P&amp;ID</Button>
      <Button variant="outline">Open 3D model</Button>
    </ButtonGroup>
  );
}

function ButtonGroupSecondary() {
  return (
    <ButtonGroup>
      <Button variant="secondary">Export CSV</Button>
      <Button variant="secondary">Export Parquet</Button>
    </ButtonGroup>
  );
}

function ButtonGroupPrimarySeparated() {
  return (
    <ButtonGroup>
      <Button>Run now</Button>
      <ButtonGroupSeparator />
      <Button>Schedule run</Button>
    </ButtonGroup>
  );
}

function ButtonGroupSizes() {
  return (
    <div className="flex flex-col items-center gap-3">
      <ButtonGroup>
        <Button variant="outline" size="sm">
          Previous
        </Button>
        <Button variant="outline" size="sm">
          Next
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline">Previous</Button>
        <Button variant="outline">Next</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button variant="outline" size="lg">
          Previous
        </Button>
        <Button variant="outline" size="lg">
          Next
        </Button>
      </ButtonGroup>
    </div>
  );
}

function ButtonGroupIconOnly() {
  return (
    <ButtonGroup aria-label="History">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Undo">
              <IconArrowBackUp />
            </Button>
          }
        />
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Redo">
              <IconArrowForwardUp />
            </Button>
          }
        />
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

function ButtonGroupIconAndLabel() {
  return (
    <ButtonGroup>
      <Button variant="outline">
        <IconShare /> Share
      </Button>
      <Button variant="outline">
        <IconDownload /> Export
      </Button>
    </ButtonGroup>
  );
}

function ButtonGroupWithText() {
  return (
    <ButtonGroup>
      <ButtonGroupText>Zoom</ButtonGroupText>
      <Button variant="outline" size="icon" aria-label="Zoom out">
        <IconZoomOut />
      </Button>
      <Button variant="outline" size="icon" aria-label="Zoom in">
        <IconZoomIn />
      </Button>
    </ButtonGroup>
  );
}

function ButtonGroupWithInput() {
  return (
    <div className="w-full max-w-xs">
      <Label htmlFor="button-group-tag">Asset tag</Label>
      <ButtonGroup className="w-full">
        <Input id="button-group-tag" defaultValue="23-KA-9101" />
        <Button variant="outline">Find</Button>
      </ButtonGroup>
    </div>
  );
}

function ButtonGroupFullWidth() {
  return (
    <ButtonGroup className="w-full max-w-xs">
      <Button variant="outline" className="flex-1">
        Decline
      </Button>
      <Button variant="outline" className="flex-1">
        Accept
      </Button>
    </ButtonGroup>
  );
}

function ButtonGroupDisabledItem() {
  return (
    <div className="flex flex-col items-center gap-2">
      <ButtonGroup>
        <Button variant="outline">Start</Button>
        <Button variant="outline" disabled>
          Stop
        </Button>
        <Button variant="outline">Reset trip</Button>
      </ButtonGroup>
      <p className="text-sm text-muted-foreground">The recompressor is already stopped.</p>
    </div>
  );
}

function ButtonGroupAllDisabled() {
  return (
    <div className="flex flex-col items-center gap-2">
      <ButtonGroup>
        <Button variant="outline" disabled>
          Acknowledge
        </Button>
        <Button variant="outline" disabled>
          Shelve
        </Button>
      </ButtonGroup>
      <p className="text-sm text-muted-foreground">Select an alarm to act on it.</p>
    </div>
  );
}

function ButtonGroupLoading() {
  return (
    <ButtonGroup>
      <AsyncButton variant="outline" onAction={() => wait(1600)} pendingLabel="Starting…">
        <IconPlayerPlay /> Start test
      </AsyncButton>
      <Button variant="outline">
        <IconPlayerStop /> Stop
      </Button>
    </ButtonGroup>
  );
}

function ButtonGroupNested() {
  return (
    <ButtonGroup>
      <ButtonGroup aria-label="History">
        <Button variant="outline" size="icon" aria-label="Undo">
          <IconArrowBackUp />
        </Button>
        <Button variant="outline" size="icon" aria-label="Redo">
          <IconArrowForwardUp />
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Zoom">
        <Button variant="outline" size="icon" aria-label="Zoom out">
          <IconZoomOut />
        </Button>
        <Button variant="outline" size="icon" aria-label="Zoom in">
          <IconZoomIn />
        </Button>
        <Button variant="outline" size="icon" aria-label="Fit to screen">
          <IconMaximize />
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  );
}

function ButtonGroupSplit() {
  return (
    <SplitButton
      variant="outline"
      onClick={() => undefined}
      menuLabel="More work order types"
      options={[
        { id: 'inspection', label: 'Create inspection', onSelect: () => undefined },
        { id: 'preventive', label: 'Create preventive job', onSelect: () => undefined },
      ]}
    >
      Create work order
    </SplitButton>
  );
}

function ButtonGroupWithMenu() {
  return (
    <ButtonGroup>
      <Button variant="outline">Edit</Button>
      <Button variant="outline">Duplicate</Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon" aria-label="More pipeline actions">
              <IconDots />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Move to data set</DropdownMenuItem>
          <DropdownMenuItem>View run history</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete pipeline</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </ButtonGroup>
  );
}

function ButtonGroupPager() {
  const pageCount = 14;
  const [page, setPage] = useState(2);

  return (
    <ButtonGroup aria-label="Pages">
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        <IconChevronLeft />
      </Button>
      <ButtonGroupText>
        <span className="tabular-nums">
          Page {page} of {pageCount}
        </span>
      </ButtonGroupText>
      <Button
        variant="outline"
        size="icon"
        aria-label="Next page"
        disabled={page === pageCount}
        onClick={() => setPage(page + 1)}
      >
        <IconChevronRight />
      </Button>
    </ButtonGroup>
  );
}

function ButtonGroupStepper() {
  const [hours, setHours] = useState(4);

  return (
    <div className="flex flex-col items-center gap-2">
      <span id="button-group-stepper-label" className="text-sm font-medium text-base-foreground">
        Estimated hours
      </span>
      <ButtonGroup aria-labelledby="button-group-stepper-label">
        <Button
          variant="outline"
          size="icon"
          aria-label="Decrease by one hour"
          disabled={hours === 1}
          onClick={() => setHours(hours - 1)}
        >
          <IconMinus />
        </Button>
        <ButtonGroupText>
          <span className="w-8 text-center tabular-nums" aria-live="polite">
            {hours} h
          </span>
        </ButtonGroupText>
        <Button
          variant="outline"
          size="icon"
          aria-label="Increase by one hour"
          disabled={hours === 24}
          onClick={() => setHours(hours + 1)}
        >
          <IconPlus />
        </Button>
      </ButtonGroup>
    </div>
  );
}

function ButtonGroupCopyValue() {
  return (
    <ButtonGroup>
      <ButtonGroupText>
        <span className="font-mono">23-VT-92740</span>
      </ButtonGroupText>
      <CopyButton variant="outline" size="icon" text="23-VT-92740" label="Copy sensor tag" iconOnly />
    </ButtonGroup>
  );
}

function ButtonGroupDateStepper() {
  const [index, setIndex] = useState(2);

  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-xl bg-muted-background p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-base-foreground">Discharge pressure</p>
        <p className="text-xs text-muted-foreground">23-KA-9101 · {SHIFT_DAYS[index]}</p>
      </div>
      <ButtonGroup aria-label="Day">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous day"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          <IconChevronLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIndex(SHIFT_DAYS.length - 1)}>
          Today
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next day"
          disabled={index === SHIFT_DAYS.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          <IconChevronRight />
        </Button>
      </ButtonGroup>
    </div>
  );
}

function ButtonGroupMapControls() {
  return (
    <ButtonGroup orientation="vertical" aria-label="Map zoom">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Zoom in">
              <IconPlus />
            </Button>
          }
        />
        <TooltipContent side="left">Zoom in</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Zoom out">
              <IconMinus />
            </Button>
          }
        />
        <TooltipContent side="left">Zoom out</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="outline" size="icon" aria-label="Fit plant to view">
              <IconMaximize />
            </Button>
          }
        />
        <TooltipContent side="left">Fit plant to view</TooltipContent>
      </Tooltip>
    </ButtonGroup>
  );
}

function ButtonGroupAlarmRow() {
  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-base-foreground">Discharge temperature high</p>
        <p className="text-xs text-muted-foreground">23-TT-92532 · 146.3 °C · limit 145.0 °C</p>
      </div>
      <ButtonGroup aria-label="Alarm actions">
        <Button variant="outline" size="sm">
          <IconCheck /> Acknowledge
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="outline" size="icon-sm" aria-label="Shelve for 1 hour">
                <IconBellOff />
              </Button>
            }
          />
          <TooltipContent>Shelve for 1 hour</TooltipContent>
        </Tooltip>
      </ButtonGroup>
    </div>
  );
}

function ButtonGroupVerticalPanel() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-muted-background p-4">
      <p className="text-sm font-medium text-base-foreground">Export pump B</p>
      <ButtonGroup orientation="vertical" className="w-full">
        <Button variant="outline">Start standby test</Button>
        <Button variant="outline">Switch duty to pump B</Button>
        <Button variant="outline">Isolate for maintenance</Button>
      </ButtonGroup>
    </div>
  );
}

export default definePage({
  id: 'button-group',
  title: 'Button group',
  summary:
    'A button group joins related buttons into one connected control, showing that the actions act on the same target.',
  docsSlug: 'button-group',
  guidance: {
    use: [
      'Two to four closely related commands on the same target, such as undo and redo.',
      'The same variant and size for every button in the group.',
      'A text segment for a short label or a value the buttons change.',
      'A split button when one default action has a few close alternatives.',
    ],
    avoid: [
      'Grouping unrelated actions just to save space — space them apart instead.',
      'Switching views or modes — that is a segmented control.',
      'More than a handful of actions — use a toolbar or a dropdown menu.',
      'Icon-only buttons without an accessible name and a tooltip.',
    ],
  },
  source,
  sections: [
    {
      id: 'orientation-and-emphasis',
      title: 'Orientation and emphasis',
      description: 'The group follows the variant of its buttons and runs in either direction.',
      specimens: [
        {
          id: 'ButtonGroupHorizontal',
          title: 'Horizontal',
          note: 'The default: a few commands of equal weight on one target.',
          origin: 'aura',
          Component: ButtonGroupHorizontal,
        },
        {
          id: 'ButtonGroupVertical',
          title: 'Vertical',
          note: 'Stacks the commands when width is tight, as in a side panel.',
          origin: 'aura',
          Component: ButtonGroupVertical,
        },
        {
          id: 'ButtonGroupSecondary',
          title: 'Secondary',
          note: 'A filled group when the pair needs more weight than outline gives.',
          origin: 'aura',
          Component: ButtonGroupSecondary,
        },
        {
          id: 'ButtonGroupPrimarySeparated',
          title: 'Primary with separator',
          note: 'Filled buttons have no border, so a separator keeps the two targets apart.',
          origin: 'aura',
          Component: ButtonGroupPrimarySeparated,
        },
      ],
    },
    {
      id: 'size-and-content',
      title: 'Size and content',
      description: 'Three heights, with labels, icons, a text segment or an input.',
      specimens: [
        {
          id: 'ButtonGroupSizes',
          title: 'Sizes',
          note: 'Small for toolbars and table rows, default elsewhere, large for focused flows.',
          origin: 'aura',
          Component: ButtonGroupSizes,
        },
        {
          id: 'ButtonGroupIconOnly',
          title: 'Icon only',
          note: 'Paired commands with universally known icons; each needs a name and a tooltip.',
          origin: 'aura',
          Component: ButtonGroupIconOnly,
        },
        {
          id: 'ButtonGroupIconAndLabel',
          title: 'Icon and label',
          note: 'When the icons alone would not be recognised.',
          origin: 'aura',
          Component: ButtonGroupIconAndLabel,
        },
        {
          id: 'ButtonGroupWithText',
          title: 'With text segment',
          note: 'A short, non-interactive label that says what the buttons change.',
          origin: 'aura',
          Component: ButtonGroupWithText,
        },
        {
          id: 'ButtonGroupWithInput',
          title: 'With input',
          note: 'A field and the one button that submits it, read as a single control.',
          origin: 'aura',
          Component: ButtonGroupWithInput,
        },
        {
          id: 'ButtonGroupFullWidth',
          title: 'Full width',
          note: 'Two equal choices that should fill a narrow panel or card.',
          origin: 'aura',
          Component: ButtonGroupFullWidth,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Parts of a group can be unavailable or busy without breaking the joined shape.',
      specimens: [
        {
          id: 'ButtonGroupDisabledItem',
          title: 'One button disabled',
          note: 'Keep the unavailable command in place and say why it cannot run.',
          origin: 'aura',
          Component: ButtonGroupDisabledItem,
        },
        {
          id: 'ButtonGroupAllDisabled',
          title: 'Whole group disabled',
          note: 'When nothing is selected yet; the hint says what unblocks it.',
          origin: 'aura',
          Component: ButtonGroupAllDisabled,
        },
        {
          id: 'ButtonGroupLoading',
          title: 'One button loading',
          note: 'A slow command stays busy while its neighbour remains usable. Click to try.',
          origin: 'custom',
          uses: ['actions/AsyncButton.tsx'],
          Component: ButtonGroupLoading,
        },
      ],
    },
    {
      id: 'patterns',
      title: 'Patterns',
      description: 'Groups combined with menus, values and each other.',
      specimens: [
        {
          id: 'ButtonGroupNested',
          title: 'Nested groups',
          note: 'Two sets of commands that belong to one tool strip but not to each other.',
          origin: 'aura',
          Component: ButtonGroupNested,
        },
        {
          id: 'ButtonGroupSplit',
          title: 'Split button',
          note: 'One default action plus a short menu of close alternatives.',
          origin: 'custom',
          uses: ['actions/SplitButton.tsx'],
          Component: ButtonGroupSplit,
        },
        {
          id: 'ButtonGroupWithMenu',
          title: 'With overflow menu',
          note: 'The two most used commands stay visible; the rest go behind the last segment.',
          origin: 'aura',
          Component: ButtonGroupWithMenu,
        },
        {
          id: 'ButtonGroupPager',
          title: 'Pager',
          note: 'Previous and next around the current position, for short paged lists.',
          origin: 'custom',
          Component: ButtonGroupPager,
        },
        {
          id: 'ButtonGroupStepper',
          title: 'Stepper',
          note: 'A small whole number that is nudged up or down more often than typed.',
          origin: 'custom',
          Component: ButtonGroupStepper,
        },
        {
          id: 'ButtonGroupCopyValue',
          title: 'Value with copy',
          note: 'A tag, ID or key shown read-only with a one-click copy attached.',
          origin: 'custom',
          uses: ['actions/CopyButton.tsx'],
          Component: ButtonGroupCopyValue,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Where a group earns its place on a real screen.',
      specimens: [
        {
          id: 'ButtonGroupDateStepper',
          title: 'Day stepper in a chart header',
          note: 'Step a chart back and forward a day at a time, with a way home.',
          origin: 'custom',
          size: 'md',
          Component: ButtonGroupDateStepper,
        },
        {
          id: 'ButtonGroupAlarmRow',
          title: 'Row actions',
          note: 'The two actions an operator takes on an alarm, compact enough for a list row.',
          origin: 'custom',
          size: 'md',
          Component: ButtonGroupAlarmRow,
        },
        {
          id: 'ButtonGroupMapControls',
          title: 'Map controls',
          note: 'Vertical icon group floating over a map, 3D model or P&ID.',
          origin: 'aura',
          surface: 'muted',
          Component: ButtonGroupMapControls,
        },
        {
          id: 'ButtonGroupVerticalPanel',
          title: 'Stacked panel actions',
          note: 'Full-width vertical group for an asset side panel.',
          origin: 'aura',
          Component: ButtonGroupVerticalPanel,
        },
      ],
    },
  ],
});
