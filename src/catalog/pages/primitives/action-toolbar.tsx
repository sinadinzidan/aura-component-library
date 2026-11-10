import {
  ActionToolbar,
  ActionToolbarAction,
  ActionToolbarActionClear,
  ActionToolbarActions,
  ActionToolbarPrimaryAction,
  ActionToolbarSelection,
  ActionToolbarSelectionSummary,
} from '@cognite/aura/components/action-toolbar';
import { Button } from '@cognite/aura/components/button';
import { CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import {
  IconBellOff,
  IconCheck,
  IconDots,
  IconDownload,
  IconTag,
  IconTrash,
  IconUserPlus,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { SelectionActionBar } from '../../../library/actions/SelectionActionBar';
import { ALARMS, ASSETS, findAsset, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './action-toolbar.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const OPEN_ORDERS = WORK_ORDERS.filter((order) => order.status !== 'done').slice(0, 5);
const OPEN_ALARMS = ALARMS.filter((alarm) => alarm.state !== 'cleared').slice(0, 4);
const ROTATING_ASSETS = ASSETS.filter((asset) => asset.type === 'compressor' || asset.type === 'pump');
const SENSOR_TAGS = ['23-PT-92531', '23-TT-92532', '23-VT-92540'] as const;

function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

function ActionToolbarDefault() {
  return (
    <ActionToolbar selectedCount={3}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Assign</ActionToolbarAction>
        <ActionToolbarAction>Export</ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarFit() {
  return (
    <ActionToolbar selectedCount={3} width="fit">
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Assign</ActionToolbarAction>
        <ActionToolbarAction>Export</ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarWithPrimary() {
  return (
    <ActionToolbar selectedCount={4}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Shelve</ActionToolbarAction>
        <ActionToolbarPrimaryAction>Acknowledge</ActionToolbarPrimaryAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarIconAndLabel() {
  return (
    <ActionToolbar selectedCount={3}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>
          <IconUserPlus /> Assign
        </ActionToolbarAction>
        <ActionToolbarAction>
          <IconDownload /> Export
        </ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarIconOnly() {
  return (
    <ActionToolbar selectedCount={12}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction iconOnly aria-label="Assign">
          <IconUserPlus />
        </ActionToolbarAction>
        <ActionToolbarAction iconOnly aria-label="Add label">
          <IconTag />
        </ActionToolbarAction>
        <ActionToolbarAction iconOnly aria-label="Export">
          <IconDownload />
        </ActionToolbarAction>
        <ActionToolbarAction iconOnly aria-label="Delete">
          <IconTrash />
        </ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarNounLabel() {
  return (
    <ActionToolbar selectedCount={2}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary label="alarms selected" />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Acknowledge</ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarCustomSummary() {
  return (
    <ActionToolbar selectedCount={3}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary>
          <span className="text-sm font-medium tabular-nums">3 of 128 selected</span>
        </ActionToolbarSelectionSummary>
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Export</ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarClearLabel() {
  return (
    <ActionToolbar selectedCount={128}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear label="Deselect all" />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Export</ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarSelectAll() {
  const total = 128;
  const [count, setCount] = useState(8);

  return (
    <ActionToolbar selectedCount={count}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        {count < total ? (
          <ActionToolbarAction variant="secondaryOnDark" onClick={() => setCount(total)}>
            Select all {total}
          </ActionToolbarAction>
        ) : (
          <ActionToolbarActionClear label="Back to this page" onClick={() => setCount(8)} />
        )}
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Export</ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarOverflow() {
  return (
    <ActionToolbar selectedCount={5}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Assign</ActionToolbarAction>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <ActionToolbarAction iconOnly aria-label="More actions">
                <IconDots />
              </ActionToolbarAction>
            }
          />
          <DropdownMenuContent align="end" side="top">
            <DropdownMenuItem>Change priority</DropdownMenuItem>
            <DropdownMenuItem>Move to another plan</DropdownMenuItem>
            <DropdownMenuItem>Export as CSV</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Delete work orders</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarDestructive() {
  return (
    <ActionToolbar selectedCount={2}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary>
          <span className="text-sm font-medium tabular-nums">2 pipelines selected</span>
        </ActionToolbarSelectionSummary>
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Pause</ActionToolbarAction>
        <ActionToolbarAction variant="destructive">
          <IconTrash /> Delete
        </ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarSingle() {
  return (
    <ActionToolbar selectedCount={1}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary>
          <span className="text-sm font-medium tabular-nums">1 work order selected</span>
        </ActionToolbarSelectionSummary>
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Open</ActionToolbarAction>
        <ActionToolbarAction>Duplicate</ActionToolbarAction>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarDisabledAction() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <ActionToolbar selectedCount={3}>
        <ActionToolbarSelection>
          <ActionToolbarSelectionSummary />
          <ActionToolbarActionClear />
        </ActionToolbarSelection>
        <ActionToolbarActions>
          <ActionToolbarAction>Assign</ActionToolbarAction>
          <ActionToolbarPrimaryAction disabled>Close work orders</ActionToolbarPrimaryAction>
        </ActionToolbarActions>
      </ActionToolbar>
      <p className="text-sm text-muted-foreground">2 of the selected work orders are still in progress.</p>
    </div>
  );
}

function ActionToolbarPending() {
  return (
    <ActionToolbar selectedCount={3}>
      <ActionToolbarSelection>
        <ActionToolbarSelectionSummary />
        <ActionToolbarActionClear />
      </ActionToolbarSelection>
      <ActionToolbarActions>
        <ActionToolbarAction>Assign</ActionToolbarAction>
        <AsyncButton variant="defaultOnDark" onAction={() => wait(1600)} pendingLabel="Exporting…">
          Export
        </AsyncButton>
      </ActionToolbarActions>
    </ActionToolbar>
  );
}

function ActionToolbarAppear() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        {SENSOR_TAGS.map((tag) => (
          <CheckboxItem key={tag}>
            <CheckboxItemControl
              checked={selected.includes(tag)}
              onCheckedChange={() => setSelected(toggleId(selected, tag))}
            />
            <CheckboxItemLabel>{tag}</CheckboxItemLabel>
          </CheckboxItem>
        ))}
      </div>
      <div className="flex h-14 w-full justify-center">
        <ActionToolbar selectedCount={selected.length} width="fit">
          <ActionToolbarSelection>
            <ActionToolbarSelectionSummary />
            <ActionToolbarActionClear onClick={() => setSelected([])} />
          </ActionToolbarSelection>
          <ActionToolbarActions>
            <ActionToolbarAction>Add to chart</ActionToolbarAction>
          </ActionToolbarActions>
        </ActionToolbar>
      </div>
    </div>
  );
}

function ActionToolbarConfirm() {
  const [confirming, setConfirming] = useState(false);

  return (
    <ActionToolbar selectedCount={3}>
      {confirming ? (
        <>
          <ActionToolbarSelection>
            <ActionToolbarSelectionSummary>
              <span className="text-sm font-medium">Delete 3 work orders? This cannot be undone.</span>
            </ActionToolbarSelectionSummary>
          </ActionToolbarSelection>
          <ActionToolbarActions>
            <ActionToolbarAction onClick={() => setConfirming(false)}>Keep</ActionToolbarAction>
            <ActionToolbarAction variant="destructive" onClick={() => setConfirming(false)}>
              Delete
            </ActionToolbarAction>
          </ActionToolbarActions>
        </>
      ) : (
        <>
          <ActionToolbarSelection>
            <ActionToolbarSelectionSummary />
            <ActionToolbarActionClear />
          </ActionToolbarSelection>
          <ActionToolbarActions>
            <ActionToolbarAction>Assign</ActionToolbarAction>
            <ActionToolbarAction onClick={() => setConfirming(true)}>
              <IconTrash /> Delete
            </ActionToolbarAction>
          </ActionToolbarActions>
        </>
      )}
    </ActionToolbar>
  );
}

function ActionToolbarDataDriven() {
  const [count, setCount] = useState(3);

  return (
    <div className="flex h-14 w-full items-center justify-center">
      <SelectionActionBar
        count={count}
        noun={{ one: 'work order', other: 'work orders' }}
        actions={[
          { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
          { id: 'export', label: 'Export', icon: <IconDownload />, onSelect: () => undefined },
        ]}
        onClear={() => setCount(0)}
      />
      {count === 0 ? (
        <Button variant="outline" onClick={() => setCount(3)}>
          Select 3 work orders again
        </Button>
      ) : null}
    </div>
  );
}

function ActionToolbarDataDrivenOverflow() {
  return (
    <SelectionActionBar
      count={1}
      noun={{ one: 'alarm', other: 'alarms' }}
      maxVisible={1}
      actions={[
        { id: 'ack', label: 'Acknowledge', icon: <IconCheck />, onSelect: () => undefined },
        { id: 'shelve', label: 'Shelve for 1 hour', icon: <IconBellOff />, onSelect: () => undefined },
        { id: 'export', label: 'Export as CSV', icon: <IconDownload />, onSelect: () => undefined },
        { id: 'delete', label: 'Delete from log', icon: <IconTrash />, onSelect: () => undefined, destructive: true },
      ]}
      onClear={() => undefined}
    />
  );
}

function ActionToolbarDataDrivenPrimary() {
  return (
    <SelectionActionBar
      count={6}
      noun={{ one: 'asset', other: 'assets' }}
      maxVisible={1}
      actions={[
        { id: 'label', label: 'Add label', onSelect: () => undefined },
        { id: 'export', label: 'Export', onSelect: () => undefined },
      ]}
      primaryAction={{ label: 'Compare', onSelect: () => undefined }}
      onClear={() => undefined}
    />
  );
}

function ActionToolbarOverList() {
  const [selected, setSelected] = useState<string[]>([OPEN_ORDERS[0].id, OPEN_ORDERS[1].id]);

  return (
    <div className="relative flex h-80 w-full flex-col">
      <p className="pb-2 text-sm font-medium text-base-foreground">Open work orders</p>
      <ul className="flex flex-col">
        {OPEN_ORDERS.map((order) => (
          <li key={order.id} className="flex items-center justify-between gap-3 py-1">
            <CheckboxItem>
              <CheckboxItemControl
                checked={selected.includes(order.id)}
                onCheckedChange={() => setSelected(toggleId(selected, order.id))}
              />
              <CheckboxItemLabel>{order.title}</CheckboxItemLabel>
            </CheckboxItem>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{order.id}</span>
          </li>
        ))}
      </ul>
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <SelectionActionBar
          count={selected.length}
          noun={{ one: 'work order', other: 'work orders' }}
          width="fit"
          actions={[
            { id: 'assign', label: 'Assign', icon: <IconUserPlus />, onSelect: () => undefined },
            { id: 'export', label: 'Export', icon: <IconDownload />, onSelect: () => undefined },
          ]}
          onClear={() => setSelected([])}
        />
      </div>
    </div>
  );
}

function ActionToolbarAlarmTriage() {
  const [selected, setSelected] = useState<string[]>([OPEN_ALARMS[0].id]);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const allSelected = selected.length === OPEN_ALARMS.length;

  const acknowledge = () => {
    setAcknowledged([...acknowledged, ...selected]);
    setSelected([]);
  };

  return (
    <div className="relative flex h-80 w-full flex-col">
      <div className="pb-2">
        <CheckboxItem>
          <CheckboxItemControl
            checked={allSelected}
            indeterminate={selected.length > 0 && !allSelected}
            onCheckedChange={() => setSelected(allSelected ? [] : OPEN_ALARMS.map((alarm) => alarm.id))}
          />
          <CheckboxItemLabel>Select all alarms</CheckboxItemLabel>
        </CheckboxItem>
      </div>
      <ul className="flex flex-col">
        {OPEN_ALARMS.map((alarm) => (
          <li key={alarm.id} className="flex items-center justify-between gap-3 py-1">
            <CheckboxItem>
              <CheckboxItemControl
                checked={selected.includes(alarm.id)}
                onCheckedChange={() => setSelected(toggleId(selected, alarm.id))}
              />
              <CheckboxItemLabel>{alarm.message}</CheckboxItemLabel>
            </CheckboxItem>
            <span className="shrink-0 text-xs text-muted-foreground">
              {acknowledged.includes(alarm.id) ? 'Acknowledged' : findAsset(alarm.assetId)?.tag}
            </span>
          </li>
        ))}
      </ul>
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <ActionToolbar selectedCount={selected.length} width="fit" aria-label="Actions for selected alarms">
          <ActionToolbarSelection>
            <ActionToolbarSelectionSummary />
            <ActionToolbarActionClear onClick={() => setSelected([])} />
          </ActionToolbarSelection>
          <ActionToolbarActions>
            <ActionToolbarAction iconOnly aria-label="Shelve for 1 hour">
              <IconBellOff />
            </ActionToolbarAction>
            <ActionToolbarPrimaryAction onClick={acknowledge}>Acknowledge</ActionToolbarPrimaryAction>
          </ActionToolbarActions>
        </ActionToolbar>
      </div>
    </div>
  );
}

function ActionToolbarOverCards() {
  const [selected, setSelected] = useState<string[]>([ROTATING_ASSETS[0].id, ROTATING_ASSETS[2].id]);

  return (
    <div className="relative flex h-80 w-full flex-col">
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {ROTATING_ASSETS.map((asset) => (
          <li key={asset.id} className="rounded-xl bg-muted-background p-3">
            <CheckboxItem>
              <CheckboxItemControl
                checked={selected.includes(asset.id)}
                onCheckedChange={() => setSelected(toggleId(selected, asset.id))}
              />
              <CheckboxItemLabel>{asset.name}</CheckboxItemLabel>
            </CheckboxItem>
            <p className="pl-6 text-xs text-muted-foreground">
              {asset.tag} · health {asset.healthScore}
            </p>
          </li>
        ))}
      </ul>
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <SelectionActionBar
          count={selected.length}
          noun={{ one: 'asset', other: 'assets' }}
          width="fit"
          maxVisible={1}
          actions={[
            { id: 'label', label: 'Add label', icon: <IconTag />, onSelect: () => undefined },
            { id: 'export', label: 'Export sensor data', onSelect: () => undefined },
            { id: 'watch', label: 'Add to watch list', onSelect: () => undefined },
          ]}
          primaryAction={{ label: 'Compare', onSelect: () => undefined, disabled: selected.length < 2 }}
          onClear={() => setSelected([])}
        />
      </div>
    </div>
  );
}

export default definePage({
  id: 'action-toolbar',
  title: 'Action toolbar',
  summary:
    'An action toolbar appears at the bottom of a view once items are selected and offers the actions that apply to that selection.',
  docsSlug: 'action-toolbar',
  guidance: {
    use: [
      'Bulk actions in tables, lists and card grids that only make sense with a selection.',
      'Centred at the bottom of the container the selection lives in.',
      'A short set of actions, with the rest behind an overflow menu.',
      'A count of what is selected and a clear way to drop the selection.',
    ],
    avoid: [
      'Page-level tools that work without a selection — use a toolbar.',
      'Showing it empty or disabled when nothing is selected.',
      'Destructive bulk actions without a confirming step.',
      'Making it draggable or letting it cover the rows being selected.',
    ],
  },
  source,
  sections: [
    {
      id: 'anatomy',
      title: 'Width and emphasis',
      description: 'A selection summary on the left, actions on the right. Shown here at rest; in an app it floats.',
      specimens: [
        {
          id: 'ActionToolbarDefault',
          title: 'Full width',
          note: 'The default: fills its container, up to 1200px, for wide tables.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarDefault,
        },
        {
          id: 'ActionToolbarFit',
          title: 'Fit to content',
          note: 'Hugs its content, down to 400px, so less of the list is covered.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarFit,
        },
        {
          id: 'ActionToolbarWithPrimary',
          title: 'With primary action',
          note: 'One filled action for what most selections end with.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarWithPrimary,
        },
        {
          id: 'ActionToolbarDestructive',
          title: 'With destructive action',
          note: 'A bulk delete stands apart from the safe actions beside it.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarDestructive,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'How the actions and the selection summary are worded and shown.',
      specimens: [
        {
          id: 'ActionToolbarIconAndLabel',
          title: 'Icon and label actions',
          note: 'Two or three actions, where there is room to name each one.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarIconAndLabel,
        },
        {
          id: 'ActionToolbarIconOnly',
          title: 'Icon-only actions',
          note: 'Four or more familiar actions; each gets its tooltip from the accessible name.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarIconOnly,
        },
        {
          id: 'ActionToolbarOverflow',
          title: 'With overflow menu',
          note: 'Keeps the bar focused: the top action visible, the rest in a menu that opens upward.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarOverflow,
        },
        {
          id: 'ActionToolbarNounLabel',
          title: 'Custom summary label',
          note: 'The label prop swaps "selected" for wording that names the items.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarNounLabel,
        },
        {
          id: 'ActionToolbarCustomSummary',
          title: 'Custom summary content',
          note: 'Children replace the summary, for example to show the selection out of a total.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarCustomSummary,
        },
        {
          id: 'ActionToolbarClearLabel',
          title: 'Custom clear label',
          note: 'A more explicit label when the whole list is selected.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarClearLabel,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Appearing, blocked, busy and confirming.',
      specimens: [
        {
          id: 'ActionToolbarAppear',
          title: 'Appears on selection',
          note: 'Hidden until something is selected, then slides in; clearing sends it away. Tick a box.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarAppear,
        },
        {
          id: 'ActionToolbarSingle',
          title: 'Single selection',
          note: 'With one item the label is singular and single-item actions can appear.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarSingle,
        },
        {
          id: 'ActionToolbarDisabledAction',
          title: 'Action unavailable',
          note: 'The action stays visible; a line says which selected items block it.',
          origin: 'aura',
          size: 'md',
          Component: ActionToolbarDisabledAction,
        },
        {
          id: 'ActionToolbarPending',
          title: 'Action in progress',
          note: 'A slow bulk action stays busy and cannot be started twice. Click Export.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/AsyncButton.tsx'],
          Component: ActionToolbarPending,
        },
        {
          id: 'ActionToolbarSelectAll',
          title: 'Extend to all results',
          note: 'After selecting a page, offer the rest of the result set in one step.',
          origin: 'custom',
          size: 'md',
          Component: ActionToolbarSelectAll,
        },
        {
          id: 'ActionToolbarConfirm',
          title: 'Confirm in place',
          note: 'A bulk delete asks once inside the bar instead of opening a dialog. Click Delete.',
          origin: 'custom',
          size: 'md',
          Component: ActionToolbarConfirm,
        },
      ],
    },
    {
      id: 'data-driven',
      title: 'Selection action bar',
      description: 'A library wrapper that words the count and handles overflow, so every bulk bar reads the same.',
      specimens: [
        {
          id: 'ActionToolbarDataDriven',
          title: 'From a list of actions',
          note: 'Pass a count, a noun and actions; clearing dismisses the bar.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/SelectionActionBar.tsx'],
          Component: ActionToolbarDataDriven,
        },
        {
          id: 'ActionToolbarDataDrivenOverflow',
          title: 'Automatic overflow',
          note: 'Actions past the visible limit move into a "More actions" menu on their own.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/SelectionActionBar.tsx'],
          Component: ActionToolbarDataDrivenOverflow,
        },
        {
          id: 'ActionToolbarDataDrivenPrimary',
          title: 'With primary action',
          note: 'The main outcome stays filled and last, whatever else overflows.',
          origin: 'custom',
          size: 'md',
          uses: ['actions/SelectionActionBar.tsx'],
          Component: ActionToolbarDataDrivenPrimary,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'The bar anchored to the bottom of the view whose selection it serves. Change the selection.',
      specimens: [
        {
          id: 'ActionToolbarOverList',
          title: 'Over a list',
          note: 'Bulk assign and export for a work order list.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/SelectionActionBar.tsx'],
          Component: ActionToolbarOverList,
        },
        {
          id: 'ActionToolbarAlarmTriage',
          title: 'With select all',
          note: 'A header checkbox selects every row; the primary action completes and clears.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ActionToolbarAlarmTriage,
        },
        {
          id: 'ActionToolbarOverCards',
          title: 'Over a card grid',
          note: 'Pick assets to compare; the primary action unlocks at two.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['actions/SelectionActionBar.tsx'],
          Component: ActionToolbarOverCards,
        },
      ],
    },
  ],
});
