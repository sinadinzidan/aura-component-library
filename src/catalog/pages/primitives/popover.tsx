import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  CheckboxGroup,
  CheckboxItem,
  CheckboxItemControl,
  CheckboxItemLabel,
} from '@cognite/aura/components/checkbox';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverHeaderContent,
  PopoverSlot,
  PopoverTitle,
  PopoverTrigger,
} from '@cognite/aura/components/popover';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconBell,
  IconBookmark,
  IconCalendar,
  IconColumns,
  IconExternalLink,
  IconHelp,
  IconInfoCircle,
  IconShare,
  IconTrash,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { FilterPopover } from '../../../library/overlays/FilterPopover';
import type { FilterGroup } from '../../../library/overlays/FilterPopover';
import { ALARMS, PEOPLE, SENSORS, findAsset } from '../../data/plant';
import { formatAgo } from '../../data/series';
import { definePage } from '../../types';

import source from './popover.tsx?raw';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;

const ALIGNMENTS = ['start', 'center', 'end'] as const;

const DATE_PRESETS = [
  { id: '1h', label: 'Last hour' },
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'shift', label: 'Current shift' },
];

const COLUMNS = [
  { id: 'tag', label: 'Tag', locked: true },
  { id: 'name', label: 'Name', locked: false },
  { id: 'state', label: 'Run state', locked: false },
  { id: 'health', label: 'Health score', locked: false },
  { id: 'criticality', label: 'Criticality', locked: false },
  { id: 'parent', label: 'Parent area', locked: false },
];

const ASSET_FILTERS: readonly FilterGroup[] = [
  {
    id: 'state',
    label: 'Run state',
    options: [
      { id: 'running', label: 'Running' },
      { id: 'standby', label: 'Standby' },
      { id: 'tripped', label: 'Tripped' },
    ],
  },
  {
    id: 'criticality',
    label: 'Criticality',
    options: [
      { id: 'A', label: 'A, safety or production critical' },
      { id: 'B', label: 'B, important' },
      { id: 'C', label: 'C, low impact' },
    ],
  },
];

const ACTIVE_ALARMS = ALARMS.filter((alarm) => alarm.state === 'active').slice(0, 3);

function PopoverBasic() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open data quality note</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Data quality</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>
            Uncertain means the transmitter reported a value outside its calibrated range in the last hour.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

function PopoverWithAction() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open calibration reminder</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Calibration due</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>23-TT-91141 was last calibrated 13 months ago. The interval is 12 months.</PopoverDescription>
        </PopoverHeader>
        <PopoverSlot>
          <Button variant="outline" size="sm">
            Create work order
          </Button>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverUntitled() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open limits</Button>} />
      <PopoverContent aria-label="Operating limits for 23-PT-92531" className="w-56">
        <MetadataList
          items={[
            { label: 'High-high', value: '55.0 barg' },
            { label: 'High', value: '52.0 barg' },
            { label: 'Low', value: '40.0 barg' },
          ]}
        />
      </PopoverContent>
    </Popover>
  );
}

function PopoverIconTrigger() {
  return (
    <div className="flex items-center gap-1 text-sm font-medium text-base-foreground">
      Health score
      <Popover>
        <Tooltip>
          <PopoverTrigger
            render={
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label="About health score">
                    <IconHelp />
                  </Button>
                }
              />
            }
          />
          <TooltipContent>About health score</TooltipContent>
        </Tooltip>
        <PopoverContent align="start">
          <PopoverHeader>
            <PopoverHeaderContent>
              <PopoverTitle>Health score</PopoverTitle>
              <PopoverClose />
            </PopoverHeaderContent>
            <PopoverDescription>
              A 0 to 100 summary of vibration, temperature and open corrective work. Below 50 the asset needs
              attention this shift.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PopoverSides() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SIDES.map((side) => (
        <Popover key={side}>
          <PopoverTrigger render={<Button variant="outline">Open on {side}</Button>} />
          <PopoverContent side={side} className="w-56">
            <PopoverDescription>Opens on the {side} and flips when there is no room.</PopoverDescription>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function PopoverAlignments() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {ALIGNMENTS.map((align) => (
        <Popover key={align}>
          <PopoverTrigger render={<Button variant="outline">Open at {align}</Button>} />
          <PopoverContent align={align} className="w-56">
            <PopoverDescription>The panel lines up with the {align} of its trigger.</PopoverDescription>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}

function PopoverWide() {
  const alarm = ALARMS[1];
  const asset = findAsset(alarm.assetId);

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open alarm summary</Button>} />
      <PopoverContent className="w-96">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>{alarm.message}</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>
            {asset?.tag}, {asset?.name}. Raised {formatAgo(alarm.raisedAt)}.
          </PopoverDescription>
        </PopoverHeader>
        <PopoverSlot>
          <MetadataList
            items={[
              { label: 'Source', value: alarm.sensorTag },
              { label: 'Value', value: alarm.value },
              { label: 'Limit', value: alarm.limit },
            ]}
          />
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverModal() {
  return (
    <Popover modal>
      <PopoverTrigger render={<Button variant="outline">Open setpoint editor</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Anti-surge setpoint</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>The page behind does not scroll or respond until you finish here.</PopoverDescription>
        </PopoverHeader>
        <PopoverSlot>
          <div className="w-full">
            <Label htmlFor="popover-modal-setpoint">Margin (%)</Label>
            <Input id="popover-modal-setpoint" type="number" defaultValue={10} />
          </div>
          <PopoverClose render={<Button size="sm">Apply setpoint</Button>} />
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverFormFields() {
  const [open, setOpen] = useState(false);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline">Open limit editor</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Operating limits</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>23-PT-92531, discharge pressure.</PopoverDescription>
        </PopoverHeader>
        <form onSubmit={save} className="flex w-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="popover-form-low">Low (barg)</Label>
              <Input id="popover-form-low" type="number" defaultValue={40} />
            </div>
            <div>
              <Label htmlFor="popover-form-high">High (barg)</Label>
              <Input id="popover-form-high" type="number" defaultValue={52} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save limits
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function PopoverList() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconBell /> Open active alarms <Badge variant="secondary">{ACTIVE_ALARMS.length}</Badge>
          </Button>
        }
      />
      <PopoverContent className="w-80" align="start">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Active alarms</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot>
          <ul className="flex w-full flex-col gap-3">
            {ACTIVE_ALARMS.map((alarm) => (
              <li key={alarm.id} className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-base-foreground">{alarm.message}</span>
                <span className="text-xs text-muted-foreground">
                  {findAsset(alarm.assetId)?.tag} · {formatAgo(alarm.raisedAt)}
                </span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="w-full">
            View all alarms
          </Button>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverDatePresets() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState('24h');
  const current = DATE_PRESETS.find((item) => item.id === preset);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline" aria-label={`Open time range, ${current?.label}`}>
            <IconCalendar /> {current?.label}
          </Button>
        }
      />
      <PopoverContent aria-label="Time range" align="start" className="w-56">
        <RadioGroup
          aria-label="Time range"
          value={preset}
          onValueChange={(value) => {
            if (typeof value !== 'string') return;
            setPreset(value);
            setOpen(false);
          }}
        >
          {DATE_PRESETS.map((item) => (
            <RadioGroupItem key={item.id}>
              <RadioGroupItemControl value={item.id} />
              <RadioGroupItemLabel>{item.label}</RadioGroupItemLabel>
            </RadioGroupItem>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}

function PopoverLegend() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm">
            <IconInfoCircle /> Open status legend
          </Button>
        }
      />
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Run states</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot>
          <dl className="grid w-full grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm">
            <dt>
              <StatusBadge status="running" />
            </dt>
            <dd className="text-muted-foreground">In operation and within limits</dd>
            <dt>
              <StatusBadge status="standby" />
            </dt>
            <dd className="text-muted-foreground">Ready to start on demand</dd>
            <dt>
              <StatusBadge status="maintenance" />
            </dt>
            <dd className="text-muted-foreground">Isolated for planned work</dd>
            <dt>
              <StatusBadge status="tripped" />
            </dt>
            <dd className="text-muted-foreground">Stopped by a protection system</dd>
          </dl>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverRecordDetails() {
  const sensor = SENSORS[3];

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open {sensor.tag} details</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>{sensor.name}</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>{sensor.tag}</PopoverDescription>
        </PopoverHeader>
        <PopoverSlot>
          <MetadataList
            items={[
              { label: 'Latest value', value: `${sensor.value} ${sensor.unit}` },
              { label: 'High limit', value: `${sensor.highLimit} ${sensor.unit}` },
              { label: 'Trip limit', value: `${sensor.highHighLimit} ${sensor.unit}` },
              { label: 'Calibrated', value: undefined },
            ]}
          />
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverHelpWithLink() {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline">Open aggregation help</Button>} />
      <PopoverContent className="w-80">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Time granularity</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>
            Controls how data points are aggregated in the chart. Coarser steps load faster but hide short spikes,
            so use one minute or finer when you investigate a trip.
          </PopoverDescription>
        </PopoverHeader>
        <PopoverSlot>
          <Button
            variant="outline"
            size="sm"
            render={<a href="https://docs.cognite.com/dev/concepts/aggregation/" target="_blank" rel="noreferrer" />}
          >
            Read about aggregates <IconExternalLink />
          </Button>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverControlled() {
  const [open, setOpen] = useState(false);
  const [snoozed, setSnoozed] = useState<string | null>(null);

  const snooze = (label: string) => {
    setSnoozed(label);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline">Open snooze options</Button>} />
        <PopoverContent aria-label="Snooze alarm" className="w-56">
          <PopoverSlot>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => snooze('1 hour')}>
              Snooze for 1 hour
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => snooze('8 hours')}>
              Snooze until end of shift
            </Button>
          </PopoverSlot>
        </PopoverContent>
      </Popover>
      <p className="text-sm text-muted-foreground" role="status">
        {snoozed ? `Snoozed for ${snoozed}.` : 'Not snoozed.'}
      </p>
    </div>
  );
}

function PopoverLoading() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => setLoaded(true), 1400);
    return () => window.clearTimeout(handle);
  }, [open]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setLoaded(false);
        setOpen(next);
      }}
    >
      <PopoverTrigger render={<Button variant="outline">Open last run</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Last run</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot aria-busy={!loaded}>
          {loaded ? (
            <MetadataList
              items={[
                { label: 'Finished', value: '14 minutes ago' },
                { label: 'Duration', value: '2 min 41 s' },
                { label: 'Rows written', value: '182,400' },
              ]}
            />
          ) : (
            <div className="flex w-full flex-col gap-2" role="status" aria-label="Loading last run">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          )}
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverEmpty() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconBookmark /> Open saved views
          </Button>
        }
      />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Saved views</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>
            No saved views yet. Save the current filters and columns to come back to them later.
          </PopoverDescription>
        </PopoverHeader>
        <PopoverSlot>
          <Button variant="outline" size="sm">
            Save current view
          </Button>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverInvalidField() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const invalid = submitted && name.trim() === '';

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (name.trim() === '') return;
    setOpen(false);
    setSubmitted(false);
    setName('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="outline">Open save view form</Button>} />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Save view</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <form onSubmit={save} noValidate className="flex w-full flex-col gap-3">
          <div>
            <Label htmlFor="popover-invalid-name" required>
              View name
            </Label>
            <Input
              id="popover-invalid-name"
              value={name}
              aria-invalid={invalid}
              aria-describedby="popover-invalid-name-help"
              onChange={(event) => setName(event.target.value)}
            />
            <HelperText id="popover-invalid-name-help" isError={invalid}>
              {invalid ? 'Enter a name to save the view.' : 'Shown in the saved views list.'}
            </HelperText>
          </div>
          <Button type="submit" size="sm" className="w-full">
            Save view
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function PopoverFilter() {
  const [filters, setFilters] = useState<Record<string, string[]>>({ state: ['tripped'], criticality: ['A'] });
  const active = [...(filters.state ?? []), ...(filters.criticality ?? [])];

  return (
    <div className="flex flex-col items-center gap-2">
      <FilterPopover groups={ASSET_FILTERS} value={filters} onApply={setFilters} align="center" />
      <p className="text-sm text-muted-foreground" role="status">
        {active.length === 0 ? 'Showing all assets.' : `Filtered by ${active.join(', ')}.`}
      </p>
    </div>
  );
}

function PopoverColumnVisibility() {
  const [visible, setVisible] = useState<readonly string[]>(['tag', 'name', 'state', 'health']);

  const toggle = (id: string, checked: boolean) => {
    setVisible(checked ? [...visible, id] : visible.filter((item) => item !== id));
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconColumns /> Open columns <Badge variant="secondary">{visible.length}</Badge>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-60">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Columns</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot>
          <CheckboxGroup aria-label="Visible columns" className="w-full">
            {COLUMNS.map((column) => (
              <CheckboxItem key={column.id}>
                <CheckboxItemControl
                  checked={visible.includes(column.id)}
                  disabled={column.locked}
                  onCheckedChange={(checked) => toggle(column.id, checked)}
                />
                <CheckboxItemLabel>{column.label}</CheckboxItemLabel>
              </CheckboxItem>
            ))}
          </CheckboxGroup>
          <p className="text-xs text-muted-foreground">Tag identifies the row and is always shown.</p>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverShare() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconShare /> Open share options
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Share chart</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
        </PopoverHeader>
        <PopoverSlot>
          <div className="flex w-full items-end gap-2">
            <div className="min-w-0 flex-1">
              <Label htmlFor="popover-share-email">Email address</Label>
              <Input id="popover-share-email" type="email" placeholder="name@example.com" />
            </div>
            <Button variant="secondary">Invite</Button>
          </div>
          <ul className="flex w-full flex-col gap-2">
            {PEOPLE.slice(0, 3).map((person) => (
              <li key={person.id} className="flex items-center gap-2">
                <PersonAvatar name={person.name} colorKey={person.id} sizes="xxsm" />
                <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{person.name}</span>
                <span className="text-xs text-muted-foreground">Can view</span>
              </li>
            ))}
          </ul>
          <CopyButton
            variant="outline"
            size="sm"
            text="https://fusion.cognite.test/charts/recompressor-trip"
            label="Copy link"
          />
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function PopoverConfirm() {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground" role="status">
          Annotation removed.
        </p>
        <Button variant="ghost" size="sm" onClick={() => setRemoved(false)}>
          Restore annotation
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconTrash /> Open remove confirmation
          </Button>
        }
      />
      <PopoverContent>
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Remove annotation?</PopoverTitle>
          </PopoverHeaderContent>
          <PopoverDescription>The note on the 14:02 trip is removed for everyone viewing this chart.</PopoverDescription>
        </PopoverHeader>
        <div className="flex w-full justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setOpen(false);
              setRemoved(true);
            }}
          >
            Remove annotation
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PopoverQuickAssign() {
  const [open, setOpen] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const assignee = PEOPLE.find((person) => person.id === assigneeId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button variant="outline">
            {assignee ? <PersonAvatar name={assignee.name} colorKey={assignee.id} sizes="xxsm" /> : null}
            {assignee ? assignee.name : 'Open assignee picker'}
          </Button>
        }
      />
      <PopoverContent aria-label="Assign work order" align="start" className="w-64">
        <RadioGroup
          aria-label="Assignee"
          value={assigneeId ?? ''}
          onValueChange={(value) => {
            if (typeof value !== 'string') return;
            setAssigneeId(value);
            setOpen(false);
          }}
        >
          {PEOPLE.slice(0, 5).map((person) => (
            <RadioGroupItem key={person.id}>
              <RadioGroupItemControl value={person.id} />
              <RadioGroupItemLabel>{person.name}</RadioGroupItemLabel>
            </RadioGroupItem>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
}

export default definePage({
  id: 'popover',
  title: 'Popover',
  summary:
    'A popover opens a small panel next to the control that triggered it, for a few options, short fields or formatted detail, and stays open until it is dismissed.',
  docsSlug: 'popover',
  guidance: {
    use: [
      'A few options, one or two fields, or formatted detail that belongs to one control.',
      'A close button or a clear completing action, so there is an obvious way out.',
      'An aria-label on the panel when it has no visible title.',
      'Tooltip for a one-line hint, hover card for a read-only preview, dialog for anything longer.',
    ],
    avoid: [
      'Content the task depends on; show that inline.',
      'Long forms and multi-step flows.',
      'A popover inside a popover.',
      'A list of actions; that is a dropdown menu.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'The header, description, slot and trigger parts on their own.',
      specimens: [
        {
          id: 'PopoverBasic',
          title: 'Basic',
          note: 'A titled explanation that is too long for a tooltip.',
          origin: 'aura',
          Component: PopoverBasic,
        },
        {
          id: 'PopoverWithAction',
          title: 'With action',
          note: 'The explanation leads to one obvious next step.',
          origin: 'aura',
          Component: PopoverWithAction,
        },
        {
          id: 'PopoverUntitled',
          title: 'Untitled',
          note: 'Compact content that explains itself; name the panel with aria-label instead of a title.',
          origin: 'aura',
          Component: PopoverUntitled,
        },
        {
          id: 'PopoverIconTrigger',
          title: 'Icon trigger',
          note: 'Help that sits next to a label; the icon button keeps its own tooltip.',
          origin: 'aura',
          Component: PopoverIconTrigger,
        },
      ],
    },
    {
      id: 'placement-and-size',
      title: 'Placement and size',
      description: 'Where the panel opens, how it lines up with the trigger, and how wide it is.',
      specimens: [
        {
          id: 'PopoverSides',
          title: 'Sides',
          note: 'Bottom by default; pick another side when the panel would cover what the user is working on.',
          origin: 'aura',
          Component: PopoverSides,
        },
        {
          id: 'PopoverAlignments',
          title: 'Alignments',
          note: 'Start for triggers at the left of a toolbar, end for triggers at the right edge.',
          origin: 'aura',
          size: 'md',
          Component: PopoverAlignments,
        },
        {
          id: 'PopoverWide',
          title: 'Wide',
          note: 'Wider than the default 288px only when titles or values would otherwise truncate.',
          origin: 'aura',
          Component: PopoverWide,
        },
        {
          id: 'PopoverModal',
          title: 'Modal',
          note: 'A small edit that must be finished or dismissed before the page responds again.',
          origin: 'aura',
          Component: PopoverModal,
        },
      ],
    },
    {
      id: 'content',
      title: 'Content',
      description: 'What usually goes inside: fields, lists, choices and reference detail.',
      specimens: [
        {
          id: 'PopoverFormFields',
          title: 'With form fields',
          note: 'Editing one or two values in place; saving closes the panel.',
          origin: 'aura',
          Component: PopoverFormFields,
        },
        {
          id: 'PopoverList',
          title: 'With list',
          note: 'A short preview of a longer list, with a way through to all of it.',
          origin: 'aura',
          Component: PopoverList,
        },
        {
          id: 'PopoverDatePresets',
          title: 'Date presets',
          note: 'One choice from a handful of presets; the trigger shows the current one and picking closes.',
          origin: 'custom',
          Component: PopoverDatePresets,
        },
        {
          id: 'PopoverLegend',
          title: 'Legend',
          note: 'Explaining the statuses on a screen with icon and label, so it reads without colour.',
          origin: 'custom',
          uses: ['display/StatusBadge.tsx'],
          Component: PopoverLegend,
        },
        {
          id: 'PopoverRecordDetails',
          title: 'Record details',
          note: 'Label and value pairs for one item, including a value that is missing.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx'],
          Component: PopoverRecordDetails,
        },
        {
          id: 'PopoverHelpWithLink',
          title: 'Help with link',
          note: 'Two sentences of help and a link out to the full documentation.',
          origin: 'aura',
          Component: PopoverHelpWithLink,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Controlled, loading, empty and invalid.',
      specimens: [
        {
          id: 'PopoverControlled',
          title: 'Controlled',
          note: 'The open state lives outside, so choosing an option can close the panel.',
          origin: 'aura',
          Component: PopoverControlled,
        },
        {
          id: 'PopoverLoading',
          title: 'Loading',
          note: 'Opens at once and fills in when the data arrives.',
          origin: 'custom',
          Component: PopoverLoading,
        },
        {
          id: 'PopoverEmpty',
          title: 'Empty',
          note: 'Nothing to list yet: say so and offer the action that creates the first item.',
          origin: 'aura',
          Component: PopoverEmpty,
        },
        {
          id: 'PopoverInvalidField',
          title: 'Invalid field',
          note: 'A failed submit keeps the panel open with the error under the field. Save empty to try.',
          origin: 'aura',
          Component: PopoverInvalidField,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Popovers as the working part of a toolbar or a row.',
      specimens: [
        {
          id: 'PopoverFilter',
          title: 'Filter popover',
          note: 'Grouped filters edited as a draft and applied in one step, with the active count on the trigger.',
          origin: 'custom',
          uses: ['overlays/FilterPopover.tsx'],
          Component: PopoverFilter,
        },
        {
          id: 'PopoverColumnVisibility',
          title: 'Column visibility',
          note: 'Choosing table columns, with the identifying column locked on.',
          origin: 'custom',
          Component: PopoverColumnVisibility,
        },
        {
          id: 'PopoverShare',
          title: 'Share and invite',
          note: 'Inviting a person, seeing who has access and copying the link without leaving the view.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'actions/CopyButton.tsx'],
          Component: PopoverShare,
        },
        {
          id: 'PopoverConfirm',
          title: 'Confirm in place',
          note: 'A low-stakes removal that deserves a pause but not a full dialog.',
          origin: 'custom',
          Component: PopoverConfirm,
        },
        {
          id: 'PopoverQuickAssign',
          title: 'Quick assign',
          note: 'Setting one field on a row; the trigger then shows the chosen value.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: PopoverQuickAssign,
        },
      ],
    },
  ],
});
