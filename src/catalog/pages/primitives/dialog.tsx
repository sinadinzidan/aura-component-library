import { Button } from '@cognite/aura/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@cognite/aura/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Kbd, KbdGroup } from '@cognite/aura/components/kbd';
import { Label } from '@cognite/aura/components/label';
import { Loader } from '@cognite/aura/components/loader';
import { Progress } from '@cognite/aura/components/progress';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import { ScrollArea } from '@cognite/aura/components/scroll-area';
import { Search } from '@cognite/aura/components/search';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Textarea } from '@cognite/aura/components/textarea';
import { IconChevronDown, IconCircleCheck, IconTrash } from '@cognite/aura/icons';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { ConfirmDialog } from '../../../library/overlays/ConfirmDialog';
import { ASSETS, PEOPLE, SENSORS, WORK_ORDERS, findAsset, findPerson } from '../../data/plant';
import { definePage } from '../../types';

import source from './dialog.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const fail = (ms: number) =>
  new Promise<void>((_resolve, reject) => window.setTimeout(() => reject(new Error('Request failed')), ms));

const COMPRESSORS = ASSETS.filter((asset) => asset.type === 'compressor' || asset.type === 'pump');

const EQUIPMENT = ASSETS.filter((asset) => asset.type !== 'site' && asset.type !== 'area' && asset.type !== 'system');

const OPEN_WORK_ORDERS = WORK_ORDERS.filter((order) => order.status === 'open' || order.status === 'planned');

const PERMIT_CONDITIONS = [
  'Isolate the recompressor electrically and lock out breaker 23-EL-9103.',
  'Close and tag suction valve 23-XV-9130 and discharge valve 23-XV-9131.',
  'Depressurise the casing to flare and confirm 0 barg on 23-PT-92731.',
  'Purge with nitrogen until the gas test reads below 1% LEL.',
  'Barrier off the compressor deck and post the permit at the access point.',
  'Keep a gas detector running at the work site for the whole job.',
  'Stop work and contact the control room if any alarm sounds in area NK-23.',
  'Remove all tools and reinstate guards before handing the permit back.',
  'The area authority inspects the site before the isolation is lifted.',
  'Record the bearing clearances in the work order before closing it.',
];

const SHORTCUTS = [
  { keys: ['⌘', 'K'], action: 'Search assets and time series' },
  { keys: ['⌘', '↵'], action: 'Run the current query' },
  { keys: ['A'], action: 'Acknowledge the selected alarm' },
  { keys: ['G', 'W'], action: 'Go to work orders' },
  { keys: ['?'], action: 'Show this list' },
];

const WIZARD_STEPS = ['Source', 'Schedule', 'Review'];

const SCHEDULE_LABELS: Record<string, string> = {
  continuous: 'Continuous',
  hourly: 'Every hour',
  daily: 'Every day at 02:00',
};

function DialogBasic() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open rename dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename data set</DialogTitle>
          <DialogDescription>The new name shows everywhere the data set is referenced.</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <Label htmlFor="dialog-basic-name">Name</Label>
          <Input id="dialog-basic-name" defaultValue="Nordkapp compressor telemetry" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Rename data set</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogInformational() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open health score explanation</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How health score is calculated</DialogTitle>
          <DialogDescription>
            Health score is a 0 to 100 summary of how close an asset runs to its design envelope.
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-base-foreground">
          <li>Vibration against the ISO 20816 zone limits, weighted 40%.</li>
          <li>Bearing and discharge temperature against operating limits, weighted 35%.</li>
          <li>Open corrective work orders and overdue inspections, weighted 25%.</li>
        </ul>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogWithoutCloseButton() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open shift handover</Button>} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Accept shift handover</DialogTitle>
          <DialogDescription>
            Liv Wold hands over 4 active alarms and 2 work orders in progress. You become the responsible operator
            for Nordkapp.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Not now</Button>} />
          <DialogClose render={<Button>Accept handover</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogGlassOverlay() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open new workspace dialog</Button>} />
      <DialogContent overlay="glass" shadow="glow">
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>A workspace keeps charts, canvases and notes for one investigation.</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <Label htmlFor="dialog-glass-name">Workspace name</Label>
          <Input id="dialog-glass-name" defaultValue="Recompressor trip, week 46" />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Create workspace</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogNarrow() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open sign-out dialog</Button>} />
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Sign out of Nordkapp?</DialogTitle>
          <DialogDescription>Your open workspaces are saved and restored when you sign in again.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Stay signed in</Button>} />
          <DialogClose render={<Button>Sign out</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogWide() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open time series comparison</Button>} />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>1st stage compressor readings</DialogTitle>
          <DialogDescription>Current values against the operating limits for 23-KA-9101.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-6 gap-y-2 pt-2 text-sm">
          <span className="text-xs font-medium text-muted-foreground">Tag</span>
          <span className="text-xs font-medium text-muted-foreground">Measurement</span>
          <span className="text-right text-xs font-medium text-muted-foreground">Value</span>
          <span className="text-right text-xs font-medium text-muted-foreground">High limit</span>
          {SENSORS.filter((sensor) => sensor.assetId === '23-ka-9101').map((sensor) => (
            <div key={sensor.id} className="contents">
              <span className="font-mono text-base-foreground">{sensor.tag}</span>
              <span className="text-base-foreground">{sensor.name}</span>
              <span className="text-right tabular-nums text-base-foreground">
                {sensor.value.toFixed(sensor.decimals)} {sensor.unit}
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {sensor.highLimit.toFixed(sensor.decimals)} {sensor.unit}
              </span>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Close</Button>} />
          <DialogClose render={<Button>Add to chart</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogScrollable() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open permit conditions</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permit to work conditions</DialogTitle>
          <DialogDescription>WO-104482, inspect recompressor drive-end bearing.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-56">
          <ol className="list-decimal space-y-3 pl-5 pr-4 text-sm text-base-foreground">
            {PERMIT_CONDITIONS.map((condition) => (
              <li key={condition}>{condition}</li>
            ))}
          </ol>
        </ScrollArea>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Accept conditions</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogWithForm() {
  const [open, setOpen] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Open work order form</Button>} />
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Create work order</DialogTitle>
            <DialogDescription>The maintenance planner is notified when you create it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="dialog-form-title" required>
                Title
              </Label>
              <Input id="dialog-form-title" required defaultValue="Vibration survey, 1st stage compressor" />
            </div>
            <div>
              <Label htmlFor="dialog-form-asset">Asset</Label>
              <Select defaultValue="23-KA-9101">
                <SelectTrigger id="dialog-form-asset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPRESSORS.map((asset) => (
                    <SelectItem key={asset.id} value={asset.tag}>
                      {asset.tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dialog-form-description">Description</Label>
              <Textarea id="dialog-form-description" placeholder="What should the technician look for?" />
              <HelperText>Include the alarm or observation that triggered the job.</HelperText>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <Button type="submit">Create work order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogFooterHierarchy() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open publish dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish data model</DialogTitle>
          <DialogDescription>
            Version 14 of Nordkapp equipment becomes the version every app reads. Drafts stay private to you.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button variant="secondary">Save draft</Button>} />
          <DialogClose render={<Button>Publish model</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogFooterSplit() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open saved view settings</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit saved view</DialogTitle>
          <DialogDescription>Saved views keep the filters, columns and sort order of a table.</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <Label htmlFor="dialog-split-name">View name</Label>
          <Input id="dialog-split-name" defaultValue="Tripped and critical" />
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose
            render={
              <Button variant="ghost">
                <IconTrash /> Delete view
              </Button>
            }
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <DialogClose render={<Button>Save view</Button>} />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogSaving() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    void wait(2000).then(() => {
      setSaving(false);
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape, the backdrop and the close button are all ignored until the save settles.
        if (!saving) setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="outline">Open alarm limit editor</Button>} />
      <DialogContent showCloseButton={!saving}>
        <form onSubmit={save}>
          <DialogHeader>
            <DialogTitle>Change high limit</DialogTitle>
            <DialogDescription>23-TT-92532, discharge temperature. The new limit applies at once.</DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Label htmlFor="dialog-saving-limit">High limit (°C)</Label>
            <Input id="dialog-saving-limit" type="number" defaultValue={145} readOnly={saving} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={saving} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} aria-busy={saving || undefined}>
              {saving ? <Loader size={16} aria-hidden /> : null}
              {saving ? 'Saving…' : 'Save limit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogValidationError() {
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('23-KA-9101');

  const taken = ASSETS.some((asset) => asset.tag === tag.trim().toUpperCase());
  const empty = tag.trim() === '';
  const error = empty ? 'Enter a tag for the asset.' : taken ? 'This tag is already in use at Nordkapp.' : null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (error === null) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Open new asset dialog</Button>} />
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Add asset</DialogTitle>
            <DialogDescription>The asset is added under Gas compression, NK-23.</DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Label htmlFor="dialog-invalid-tag" required>
              Functional location tag
            </Label>
            <Input
              id="dialog-invalid-tag"
              value={tag}
              aria-invalid={error !== null}
              aria-describedby="dialog-invalid-tag-help"
              onChange={(event) => setTag(event.target.value)}
            />
            <HelperText id="dialog-invalid-tag-help" isError={error !== null}>
              {error ?? 'Area, type and sequence number, such as 23-KA-9104.'}
            </HelperText>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <Button type="submit">Add asset</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DialogSuccess() {
  const assignee = findPerson('tb');

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open creation result</Button>} />
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <div className="flex size-10 items-center justify-center rounded-full bg-success-background text-success-foreground">
          <IconCircleCheck aria-hidden="true" className="size-5" />
        </div>
        <DialogHeader className="pt-4">
          <DialogTitle>Work order created</DialogTitle>
          <DialogDescription>
            WO-104483 is assigned to {assignee?.name} and due before the next shift. The permit request is sent to
            the area authority.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Close</Button>} />
          <DialogClose render={<Button>View work order</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogLoadingContent() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const sensor = SENSORS[0];

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => setLoaded(true), 1600);
    return () => window.clearTimeout(handle);
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setLoaded(false);
        setOpen(next);
      }}
    >
      <DialogTrigger render={<Button variant="outline">Open time series details</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sensor.tag}</DialogTitle>
          <DialogDescription>{sensor.name}, 1st stage compressor.</DialogDescription>
        </DialogHeader>
        <div className="pt-2" aria-busy={!loaded}>
          {loaded ? (
            <MetadataList
              items={[
                { label: 'Unit', value: sensor.unit },
                { label: 'Latest value', value: `${sensor.value.toFixed(1)} ${sensor.unit}` },
                { label: 'Operating range', value: `${sensor.lowLimit} to ${sensor.highLimit} ${sensor.unit}` },
                { label: 'Data quality', value: 'Good' },
              ]}
            />
          ) : (
            <div className="flex flex-col gap-2" role="status" aria-label="Loading time series details">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogUnsavedChanges() {
  const initial = 'Abnormal vibration on drive-end bearing after restart.';
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(initial);
  const [confirming, setConfirming] = useState(false);

  const discard = () => {
    setNote(initial);
    setConfirming(false);
    setOpen(false);
  };

  const changeOpen = (next: boolean) => {
    // A dirty form is not thrown away on Escape or a backdrop click; ask first.
    if (!next && note !== initial) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button variant="outline">Open shift note editor</Button>} />
      {confirming ? (
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>Your edits to the shift note are lost. This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={discard}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit shift note</DialogTitle>
            <DialogDescription>Change the text, then close the dialog to see the guard.</DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Label htmlFor="dialog-unsaved-note">Note</Label>
            <Textarea id="dialog-unsaved-note" value={note} onChange={(event) => setNote(event.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setNote(initial);
                setOpen(false);
              }}
            >
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function DialogDestructiveConfirm() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open delete confirmation</Button>} />
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete pipeline?</DialogTitle>
          <DialogDescription>
            All runs and history of Compressor telemetry ingest will be permanently removed. This can&apos;t be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button variant="destructive">Delete pipeline</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogTypedConfirm() {
  const [open, setOpen] = useState(false);
  const asset = findAsset('23-ka-9103');
  const tag = asset?.tag ?? '';

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open typed delete confirmation
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${tag}?`}
        description="The asset, its 14 time series and 3 years of history will be permanently removed. This can't be undone."
        confirmLabel="Delete asset"
        pendingLabel="Deleting…"
        destructive
        confirmText={tag}
        onConfirm={() => wait(1600)}
      />
    </>
  );
}

function DialogConfirmAsync() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open restart confirmation
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Restart pipeline?"
        description="Compressor telemetry ingest stops for about a minute. Data that arrives meanwhile is backfilled."
        confirmLabel="Restart pipeline"
        pendingLabel="Restarting…"
        onConfirm={() => wait(1800)}
      />
    </>
  );
}

function DialogBulkConfirm() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open bulk delete confirmation</Button>} />
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete {OPEN_WORK_ORDERS.length} work orders?</DialogTitle>
          <DialogDescription>
            The work orders and their attachments will be permanently removed. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 rounded-lg bg-muted-background p-3 text-sm">
          {OPEN_WORK_ORDERS.map((order) => (
            <li key={order.id} className="flex gap-3">
              <span className="shrink-0 font-mono text-muted-foreground">{order.id}</span>
              <span className="min-w-0 truncate text-base-foreground">{order.title}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose
            render={<Button variant="destructive">Delete {OPEN_WORK_ORDERS.length} work orders</Button>}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogConfirmFailure() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open shelve confirmation
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Shelve alarm for 8 hours?"
        description="Bearing temperature signal lost on 40-PA-4001 is hidden from the alarm list until the end of the shift."
        confirmLabel="Shelve alarm"
        pendingLabel="Shelving…"
        errorMessage="The alarm system did not respond. Check the connection and try again."
        onConfirm={() => fail(1200)}
      />
    </>
  );
}

function DialogMultiStep() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [schedule, setSchedule] = useState('hourly');
  const last = step === WIZARD_STEPS.length - 1;

  const changeOpen = (next: boolean) => {
    if (next) setStep(0);
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button variant="outline">Open pipeline wizard</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create extraction pipeline</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[step]}
          </DialogDescription>
        </DialogHeader>
        <Progress
          size="sm"
          value={((step + 1) / WIZARD_STEPS.length) * 100}
          aria-label={`Step ${step + 1} of ${WIZARD_STEPS.length}`}
        />
        <div className="min-h-36 pt-4">
          {step === 0 ? (
            <div>
              <Label htmlFor="dialog-wizard-source">OPC UA server address</Label>
              <Input id="dialog-wizard-source" defaultValue="opc.tcp://historian.nordkapp.test:4840" />
              <HelperText>The extractor reads every tag under this server.</HelperText>
            </div>
          ) : null}
          {step === 1 ? (
            <RadioGroup
              aria-label="Schedule"
              value={schedule}
              onValueChange={(value) => {
                if (typeof value === 'string') setSchedule(value);
              }}
            >
              <RadioGroupItem>
                <RadioGroupItemControl value="continuous" />
                <RadioGroupItemLabel>Continuous</RadioGroupItemLabel>
                <RadioGroupItemDescription>Streams values as they change.</RadioGroupItemDescription>
              </RadioGroupItem>
              <RadioGroupItem>
                <RadioGroupItemControl value="hourly" />
                <RadioGroupItemLabel>Every hour</RadioGroupItemLabel>
                <RadioGroupItemDescription>Batches the last hour of values.</RadioGroupItemDescription>
              </RadioGroupItem>
              <RadioGroupItem>
                <RadioGroupItemControl value="daily" />
                <RadioGroupItemLabel>Every day at 02:00</RadioGroupItemLabel>
                <RadioGroupItemDescription>For slow-moving reference data.</RadioGroupItemDescription>
              </RadioGroupItem>
            </RadioGroup>
          ) : null}
          {step === 2 ? (
            <MetadataList
              items={[
                { label: 'Source', value: 'historian.nordkapp.test' },
                { label: 'Schedule', value: SCHEDULE_LABELS[schedule] },
                { label: 'Data set', value: 'Nordkapp compressor telemetry' },
                { label: 'Owner', value: findPerson('ak')?.name },
              ]}
            />
          ) : null}
        </div>
        <DialogFooter className="sm:justify-between">
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {step > 0 ? (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            ) : null}
            {last ? (
              <Button onClick={() => setOpen(false)}>Create pipeline</Button>
            ) : (
              <Button onClick={() => setStep(step + 1)}>Continue</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogShare() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open share dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share workspace</DialogTitle>
          <DialogDescription>People you add can open Recompressor trip, week 46.</DialogDescription>
        </DialogHeader>
        <div className="flex items-end gap-2 pt-2">
          <div className="min-w-0 flex-1">
            <Label htmlFor="dialog-share-email">Email address</Label>
            <Input id="dialog-share-email" type="email" placeholder="name@example.com" />
          </div>
          <Button variant="secondary">Send invite</Button>
        </div>
        <ul className="space-y-3 pt-4">
          {PEOPLE.slice(0, 4).map((person, index) => (
            <li key={person.id} className="flex items-center gap-3">
              <PersonAvatar name={person.name} colorKey={person.id} sizes="xsm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-base-foreground">{person.name}</p>
                <p className="truncate text-xs text-muted-foreground">{person.role}</p>
              </div>
              <span className="text-sm text-muted-foreground">{index === 0 ? 'Owner' : 'Can edit'}</span>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose render={<Button>Done</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogAssetPicker() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('23-ka-9101');

  const matches = EQUIPMENT.filter((asset) =>
    `${asset.tag} ${asset.name}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open asset picker</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link an asset</DialogTitle>
          <DialogDescription>The work order shows on the asset you pick.</DialogDescription>
        </DialogHeader>
        <Search
          aria-label="Search assets"
          placeholder="Search by tag or name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
        />
        <ScrollArea className="mt-2 h-52">
          {matches.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No assets match “{query}”.</p>
          ) : (
            <RadioGroup
              aria-label="Assets"
              value={selected}
              onValueChange={(value) => {
                if (typeof value === 'string') setSelected(value);
              }}
            >
              {matches.map((asset) => (
                <RadioGroupItem key={asset.id}>
                  <RadioGroupItemControl value={asset.id} />
                  <RadioGroupItemLabel>{asset.tag}</RadioGroupItemLabel>
                  <RadioGroupItemDescription>{asset.name}</RadioGroupItemDescription>
                </RadioGroupItem>
              ))}
            </RadioGroup>
          )}
        </ScrollArea>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button>Link asset</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DialogFromMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline">
              Open data set actions <IconChevronDown />
            </Button>
          }
        />
        <DropdownMenuContent align="start">
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpen(true)}>Archive…</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Archive data set?</DialogTitle>
            <DialogDescription>
              Nordkapp compressor telemetry becomes read-only and is hidden from search. You can restore it from
              the archive at any time.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost">Cancel</Button>} />
            <DialogClose render={<Button>Archive data set</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DialogKeyboardShortcuts() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open keyboard shortcuts</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <dl className="space-y-3 pt-2 text-sm">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.action} className="flex items-center justify-between gap-4">
              <dt className="text-base-foreground">{shortcut.action}</dt>
              <dd>
                <KbdGroup>
                  {shortcut.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

function DialogRecordDetails() {
  const order = WORK_ORDERS[0];
  const asset = findAsset(order.assetId);

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open work order details</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{order.id}</DialogTitle>
          <DialogDescription>{order.title}</DialogDescription>
        </DialogHeader>
        <div className="pt-2">
          <MetadataList
            items={[
              { label: 'Status', value: <StatusBadge status={order.status} /> },
              { label: 'Asset', value: asset ? `${asset.tag}, ${asset.name}` : undefined },
              { label: 'Priority', value: order.priority },
              { label: 'Assignee', value: findPerson(order.assigneeId)?.name },
              { label: 'Estimate', value: `${order.estimatedHours} h` },
            ]}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Close</Button>} />
          <DialogClose render={<Button>Open work order</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default definePage({
  id: 'dialog',
  title: 'Dialog',
  summary:
    'A dialog takes over the page for one focused task: a short form, a decision, or content that needs attention before the user carries on.',
  docsSlug: 'dialog',
  guidance: {
    use: [
      'A short form or decision that needs focus without leaving the page.',
      'Confirming an irreversible action: name the object, state the consequence, label the button with the action.',
      'Cancel as ghost on the left, the committing action furthest right.',
      'Flows of three or more steps split into steps with visible progress.',
    ],
    avoid: [
      'Feedback a toast or an inline alert can carry.',
      '"Are you sure?" with OK and Cancel; say what is lost and name the action.',
      'Long or multi-page forms; give those a page or a drawer.',
      'Letting a dialog close while its action is still saving.',
    ],
  },
  source,
  sections: [
    {
      id: 'basics',
      title: 'Basics',
      description: 'What the Dialog API gives you: header, footer, the close button and the backdrop.',
      specimens: [
        {
          id: 'DialogBasic',
          title: 'Basic',
          note: 'A title, one line of context, one field and two actions; the default for a small task.',
          origin: 'aura',
          Component: DialogBasic,
        },
        {
          id: 'DialogInformational',
          title: 'Informational',
          note: 'Explaining something too long for a tooltip or popover, with a single way out.',
          origin: 'aura',
          Component: DialogInformational,
        },
        {
          id: 'DialogWithoutCloseButton',
          title: 'Without close button',
          note: 'When the footer already offers an explicit exit and the user must pick one of the two.',
          origin: 'aura',
          Component: DialogWithoutCloseButton,
        },
        {
          id: 'DialogGlassOverlay',
          title: 'Glass overlay with glow',
          note: 'A creation moment where the page behind should stay recognisable instead of dimmed.',
          origin: 'aura',
          Component: DialogGlassOverlay,
        },
      ],
    },
    {
      id: 'size-and-content',
      title: 'Size and content',
      description: 'Width follows the content. The footer orders actions by importance.',
      specimens: [
        {
          id: 'DialogNarrow',
          title: 'Narrow',
          note: 'A one-sentence decision; cap the width so the text does not stretch into one long line.',
          origin: 'aura',
          Component: DialogNarrow,
        },
        {
          id: 'DialogWide',
          title: 'Wide',
          note: 'Tabular or side-by-side content that needs more than the default 512px.',
          origin: 'aura',
          Component: DialogWide,
        },
        {
          id: 'DialogScrollable',
          title: 'Scrollable content',
          note: 'Long content scrolls inside while the title and the actions stay in view.',
          origin: 'aura',
          Component: DialogScrollable,
        },
        {
          id: 'DialogWithForm',
          title: 'With form',
          note: 'Three or four fields that create one record; Enter submits.',
          origin: 'aura',
          Component: DialogWithForm,
        },
        {
          id: 'DialogFooterHierarchy',
          title: 'Three-action footer',
          note: 'Exit, a safe alternative and the commit, with emphasis rising to the right.',
          origin: 'aura',
          Component: DialogFooterHierarchy,
        },
        {
          id: 'DialogFooterSplit',
          title: 'Split footer',
          note: 'A rare, unrelated action such as delete sits apart on the left, away from save.',
          origin: 'aura',
          Component: DialogFooterSplit,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'What the dialog does while it is saving, loading, invalid, dirty or done.',
      specimens: [
        {
          id: 'DialogSaving',
          title: 'Blocks close while saving',
          note: 'A save that must not be interrupted: Escape, the backdrop and Cancel wait for it. Save to try.',
          origin: 'custom',
          Component: DialogSaving,
        },
        {
          id: 'DialogValidationError',
          title: 'Validation error',
          note: 'The error sits under its field and the dialog stays open until it is fixed.',
          origin: 'aura',
          Component: DialogValidationError,
        },
        {
          id: 'DialogLoadingContent',
          title: 'Loading content',
          note: 'Open at once and fill in when the data arrives, so the click always gets a response.',
          origin: 'custom',
          Component: DialogLoadingContent,
        },
        {
          id: 'DialogUnsavedChanges',
          title: 'Unsaved changes guard',
          note: 'A form worth protecting: closing with edits asks before it throws them away.',
          origin: 'custom',
          Component: DialogUnsavedChanges,
        },
        {
          id: 'DialogSuccess',
          title: 'Success acknowledgement',
          note: 'Only when the result carries something the user needs next, such as a new ID; otherwise use a toast.',
          origin: 'custom',
          Component: DialogSuccess,
        },
      ],
    },
    {
      id: 'confirmations',
      title: 'Confirmations',
      description: 'Stopping the user before a consequential action. Name the object, the consequence and the action.',
      specimens: [
        {
          id: 'DialogDestructiveConfirm',
          title: 'Destructive confirmation',
          note: 'Deleting one thing that cannot be restored.',
          origin: 'aura',
          Component: DialogDestructiveConfirm,
        },
        {
          id: 'DialogTypedConfirm',
          title: 'Typed-name confirmation',
          note: 'High-impact deletes where a stray click must not be enough; the button unlocks on an exact match.',
          origin: 'custom',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: DialogTypedConfirm,
        },
        {
          id: 'DialogConfirmAsync',
          title: 'Confirmation that waits',
          note: 'A disruptive but reversible action; the dialog stays up until the request settles.',
          origin: 'custom',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: DialogConfirmAsync,
        },
        {
          id: 'DialogBulkConfirm',
          title: 'Bulk confirmation',
          note: 'One confirmation for the whole selection, naming the count and listing what is affected.',
          origin: 'aura',
          Component: DialogBulkConfirm,
        },
        {
          id: 'DialogConfirmFailure',
          title: 'Confirmation that fails',
          note: 'When the action can fail, the dialog stays open with the reason and a retry. Confirm to try.',
          origin: 'custom',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: DialogConfirmFailure,
        },
      ],
    },
    {
      id: 'compositions',
      title: 'Compositions',
      description: 'Dialogs built around a task: a wizard, a picker, sharing, a record.',
      specimens: [
        {
          id: 'DialogMultiStep',
          title: 'Multi-step',
          note: 'A setup of three short steps with progress, Back, and the commit only on the last step.',
          origin: 'custom',
          Component: DialogMultiStep,
        },
        {
          id: 'DialogAssetPicker',
          title: 'Search and pick',
          note: 'Choosing one record from a list too long for a select.',
          origin: 'custom',
          Component: DialogAssetPicker,
        },
        {
          id: 'DialogShare',
          title: 'Share with people',
          note: 'Inviting people and seeing who already has access in one place.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: DialogShare,
        },
        {
          id: 'DialogRecordDetails',
          title: 'Record details',
          note: 'A quick look at one record from a table row, with a way through to the full page.',
          origin: 'custom',
          uses: ['display/MetadataList.tsx', 'display/StatusBadge.tsx'],
          Component: DialogRecordDetails,
        },
        {
          id: 'DialogFromMenu',
          title: 'Opened from a menu',
          note: 'The trigger is a menu item, so the dialog is controlled from state instead of a DialogTrigger.',
          origin: 'aura',
          Component: DialogFromMenu,
        },
        {
          id: 'DialogKeyboardShortcuts',
          title: 'Keyboard shortcuts',
          note: 'Reference content opened on demand, with only the close button to dismiss.',
          origin: 'aura',
          Component: DialogKeyboardShortcuts,
        },
      ],
    },
  ],
});
