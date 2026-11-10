import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { CheckboxGroup, CheckboxItem, CheckboxItemControl, CheckboxItemLabel } from '@cognite/aura/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@cognite/aura/components/dialog';
import { HelperText } from '@cognite/aura/components/helper-text';
import { Input } from '@cognite/aura/components/input';
import { Label } from '@cognite/aura/components/label';
import {
  Popover,
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
import { toast } from '@cognite/aura/components/sonner-toast';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconArrowRight, IconCircleCheck, IconTrash } from '@cognite/aura/icons';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { StatusBadge } from '../../../library/display/StatusBadge';
import { SingleToaster } from '../../../library/feedback/SingleToaster';
import { ConfirmDialog } from '../../../library/overlays/ConfirmDialog';
import { UnsavedChangesPrompt } from '../../../library/patterns/states/UnsavedChangesPrompt';
import { ALARMS, PEOPLE, findAsset } from '../../data/plant';
import { definePage } from '../../types';

import source from './confirmations.tsx?raw';

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

const TRIP_ALARM = ALARMS[0];
const SIGNAL_ALARM = ALARMS[4];
const EXPORT_PUMP = findAsset('27-pa-2001b');
const COMPRESSOR = findAsset('23-ka-9101');

const SAVED_VIEWS = [
  { id: 'vibration', name: 'Compressor vibration', meta: '4 charts' },
  { id: 'export', name: 'Gas export, last 7 days', meta: '2 charts' },
  { id: 'alarms', name: 'Active alarms by area', meta: '1 table' },
] as const;

const ANNOTATIONS = [
  { id: 'a1', text: 'Vibration rising after restart', meta: '12 Mar 13:46' },
  { id: 'a2', text: 'Seal gas pressure adjusted', meta: '12 Mar 11:20' },
  { id: 'a3', text: 'Baseline after overhaul', meta: '2 Mar 09:05' },
] as const;

const STOP_REASONS = [
  { id: 'planned', label: 'Planned maintenance' },
  { id: 'abnormal', label: 'Abnormal condition' },
  { id: 'test', label: 'Operator test' },
] as const;

const SHELVE_DURATIONS = [
  { id: '1h', label: '1 hour', until: '15:00' },
  { id: 'shift', label: 'Until end of shift', until: '22:00' },
  { id: '24h', label: '24 hours', until: '14:00 tomorrow' },
] as const;

const LABEL_PAIRS = [
  { avoid: 'OK', write: 'Delete pipeline' },
  { avoid: 'Yes', write: 'Remove member' },
  { avoid: 'Confirm', write: 'Stop compressor' },
  { avoid: 'No', write: 'Keep editing' },
] as const;

/** The thing an action applies to, with the control that starts the action. */
function ConfirmationSubject({
  name,
  meta,
  status,
  children,
}: {
  name: string;
  meta: string;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-medium text-base-foreground">{name}</span>
          <span className="truncate text-xs text-muted-foreground">{meta}</span>
        </div>
        {status}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

/** A static look-alike of a confirmation, for comparing wording without opening two dialogs. */
function ConfirmationMock({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-default p-4">
      <div className="flex flex-col gap-2">
        <p className="text-base font-medium text-base-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex justify-end gap-2">{children}</div>
    </div>
  );
}

function ConfirmationDestructive() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <>
      <ConfirmationSubject
        name="Compressor telemetry ingest"
        meta={deleted ? 'Deleted just now' : 'Pipeline · 214 runs'}
      >
        {deleted ? (
          <Button variant="ghost" size="sm" onClick={() => setDeleted(false)}>
            Reset example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <IconTrash /> Delete pipeline
          </Button>
        )}
      </ConfirmationSubject>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete Compressor telemetry ingest?"
        description="All 214 runs and their history are permanently removed. This can't be undone."
        confirmLabel="Delete pipeline"
        destructive
        onConfirm={() => setDeleted(true)}
      />
    </>
  );
}

function ConfirmationTypedName() {
  const [open, setOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  return (
    <>
      <ConfirmationSubject name="nordkapp-production" meta={deleted ? 'Deleted just now' : 'Data set · 1,284 time series'}>
        {deleted ? (
          <Button variant="ghost" size="sm" onClick={() => setDeleted(false)}>
            Reset example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <IconTrash /> Delete data set
          </Button>
        )}
      </ConfirmationSubject>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete nordkapp-production?"
        description="1,284 time series and every dashboard built on them stop working. This can't be undone."
        confirmLabel="Delete data set"
        confirmText="nordkapp-production"
        destructive
        onConfirm={() => setDeleted(true)}
      />
    </>
  );
}

function ConfirmationConsequenceList() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ConfirmationSubject name="Aisha Khan" meta="Rotating equipment engineer · Member since 2023">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Remove from project
        </Button>
      </ConfirmationSubject>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove Aisha Khan from Nordkapp?</DialogTitle>
            <DialogDescription>She loses access immediately. You can invite her again later.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-sm font-medium text-base-foreground">What happens</p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-medium-foreground">
              <li>3 work orders assigned to her become unassigned.</li>
              <li>Her 2 private dashboards are transferred to you.</li>
              <li>Her comments and annotations stay, marked as former member.</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => setOpen(false)}>
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmationAcknowledgeCheckbox() {
  const [open, setOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  const changeOpen = (next: boolean) => {
    if (!next) setUnderstood(false);
    setOpen(next);
  };

  return (
    <>
      <ConfirmationSubject name="Discharge pressure" meta="23-PT-92531 · High limit 52.0 barg">
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Disable alarm rule
        </Button>
      </ConfirmationSubject>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Disable the high pressure alarm?</DialogTitle>
            <DialogDescription>
              Nobody is notified if discharge pressure passes 52.0 barg until the rule is enabled again.
            </DialogDescription>
          </DialogHeader>
          <CheckboxGroup className="pt-2">
            <CheckboxItem>
              <CheckboxItemControl checked={understood} onCheckedChange={(checked) => setUnderstood(checked === true)} />
              <CheckboxItemLabel>I understand that this limit is not monitored while the rule is disabled.</CheckboxItemLabel>
            </CheckboxItem>
          </CheckboxGroup>
          {understood ? null : <HelperText>Tick the box to disable the rule.</HelperText>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={!understood} onClick={() => changeOpen(false)}>
              Disable rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmationBulkDelete() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(12);

  return (
    <>
      <ConfirmationSubject
        name={count === 0 ? 'No time series selected' : `${count} time series selected`}
        meta={count === 0 ? 'Deleted just now' : 'Across 3 assets in Gas compression'}
      >
        {count === 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setCount(12)}>
            Reset example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <IconTrash /> Delete selected
          </Button>
        )}
      </ConfirmationSubject>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${count} time series?`}
        description="Their data points are permanently removed, and 4 charts that use them show gaps. This can't be undone."
        confirmLabel={`Delete ${count} time series`}
        destructive
        onConfirm={() => setCount(0)}
      />
    </>
  );
}

function ConfirmationAsyncPending() {
  const [open, setOpen] = useState(false);
  const [rotated, setRotated] = useState(false);

  return (
    <>
      <ConfirmationSubject name="Extractor API key" meta={rotated ? 'Rotated just now' : 'Created 14 months ago'}>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Rotate key
        </Button>
      </ConfirmationSubject>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Rotate the extractor API key?"
        description="The current key stops working at once. Extractors pause until they are given the new key."
        confirmLabel="Rotate key"
        pendingLabel="Rotating…"
        onConfirm={() => wait(1600).then(() => setRotated(true))}
      />
    </>
  );
}

function ConfirmationReversible() {
  return (
    <ConfirmationMock
      title="Archive Compressor vibration?"
      description="The dashboard is hidden from the team. You can restore it from Archived at any time."
    >
      <Button variant="ghost">Cancel</Button>
      <Button>Archive dashboard</Button>
    </ConfirmationMock>
  );
}

function ConfirmationIrreversible() {
  return (
    <ConfirmationMock
      title="Delete Compressor vibration?"
      description="The dashboard and its 4 charts are permanently removed for everyone. This can't be undone."
    >
      <Button variant="ghost">Cancel</Button>
      <Button variant="destructive">Delete dashboard</Button>
    </ConfirmationMock>
  );
}

function ConfirmationUnsavedChanges() {
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState('52.0');
  const dirty = limit !== '52.0';

  const discard = () => {
    setLimit('52.0');
    setOpen(false);
  };

  return (
    <>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <div>
          <Label htmlFor="confirmation-unsaved-limit">High limit, barg</Label>
          <Input id="confirmation-unsaved-limit" value={limit} onChange={(event) => setLimit(event.target.value)} />
          <HelperText>{dirty ? 'Unsaved changes' : 'Change the value, then leave.'}</HelperText>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => (dirty ? setOpen(true) : undefined)}>
            Back to alarm rules
          </Button>
        </div>
      </div>
      <UnsavedChangesPrompt
        open={open}
        onOpenChange={setOpen}
        title="Leave without saving the limit?"
        description={`The high limit goes back to 52.0 barg. Your change to ${limit} is lost.`}
        onDiscard={discard}
      />
    </>
  );
}

function ConfirmationUnsavedWithSave() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <>
      <ConfirmationSubject
        name="Shift handover note"
        meta={saved ? 'Saved just now' : 'Edited 2 minutes ago · Not saved'}
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSaved(false);
            setOpen(true);
          }}
        >
          Close editor
        </Button>
      </ConfirmationSubject>
      <UnsavedChangesPrompt
        open={open}
        onOpenChange={setOpen}
        title="Save the handover note before closing?"
        description="You added 3 lines about the recompressor trip. Closing without saving loses them."
        discardLabel="Close without saving"
        saveLabel="Save and close"
        onDiscard={() => setOpen(false)}
        onSave={() =>
          wait(1200).then(() => {
            setSaved(true);
            setOpen(false);
          })
        }
      />
    </>
  );
}

function ConfirmationLabelPairs() {
  return (
    <table className="w-full max-w-xs text-left text-sm">
      <thead>
        <tr className="border-b border-default text-xs text-muted-foreground">
          <th className="py-2 pr-4 font-medium">Instead of</th>
          <th className="py-2 font-medium">Write</th>
        </tr>
      </thead>
      <tbody>
        {LABEL_PAIRS.map((pair) => (
          <tr key={pair.avoid} className="border-b border-default last:border-b-0">
            <td className="py-2 pr-4 text-muted-foreground">{pair.avoid}</td>
            <td className="py-2 font-medium text-base-foreground">{pair.write}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConfirmationInlineTwoStep() {
  const [deleted, setDeleted] = useState<readonly string[]>([]);
  const views = SAVED_VIEWS.filter((view) => !deleted.includes(view.id));

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">Saved views</h4>
        {deleted.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setDeleted([])}>
            Reset example
          </Button>
        ) : null}
      </div>
      {views.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No saved views.</p> : null}
      <ul className="flex flex-col">
        {views.map((view) => (
          <li key={view.id} className="flex min-h-11 items-center gap-4 border-b border-default last:border-b-0">
            <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{view.name}</span>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">{view.meta}</span>
            <ConfirmButton size="sm" confirmLabel="Confirm delete" onConfirm={() => setDeleted([...deleted, view.id])}>
              <IconTrash /> Delete
            </ConfirmButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfirmationInlineRow() {
  const [asking, setAsking] = useState<string | null>(null);
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const members = PEOPLE.slice(2, 5).filter((person) => !removed.includes(person.id));

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">On call this week</h4>
        {removed.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setRemoved([])}>
            Reset example
          </Button>
        ) : null}
      </div>
      <ul className="flex flex-col">
        {members.map((person) => (
          <li key={person.id} className="flex min-h-14 items-center gap-3 border-b border-default last:border-b-0">
            {asking === person.id ? (
              <>
                <span className="min-w-0 flex-1 text-sm text-base-foreground">
                  Remove {person.name} from the rota? Their shifts become unassigned.
                </span>
                <Button variant="ghost" size="sm" onClick={() => setAsking(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setRemoved([...removed, person.id]);
                    setAsking(null);
                  }}
                >
                  Remove
                </Button>
              </>
            ) : (
              <>
                <PersonAvatar name={person.name} sizes="xsm" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm text-base-foreground">{person.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{person.role}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => setAsking(person.id)}>
                  Remove
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConfirmationPopover() {
  const [open, setOpen] = useState(false);
  const [removed, setRemoved] = useState(false);

  return (
    <ConfirmationSubject
      name="Discharge temperature"
      meta={removed ? 'Removed from this dashboard' : 'Chart on Compressor vibration · 23-TT-92532'}
    >
      {removed ? (
        <Button variant="ghost" size="sm" onClick={() => setRemoved(false)}>
          Reset example
        </Button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button variant="outline" size="sm">
                Remove from dashboard
              </Button>
            }
          />
          <PopoverContent align="start" className="w-72">
            <PopoverHeader>
              <PopoverHeaderContent>
                <PopoverTitle>Remove this chart?</PopoverTitle>
              </PopoverHeaderContent>
              <PopoverDescription>The time series is kept. You can add the chart again from the library.</PopoverDescription>
            </PopoverHeader>
            <PopoverSlot>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setRemoved(true);
                    setOpen(false);
                  }}
                >
                  Remove chart
                </Button>
              </div>
            </PopoverSlot>
          </PopoverContent>
        </Popover>
      )}
    </ConfirmationSubject>
  );
}

function ConfirmationUndoToast() {
  const [deleted, setDeleted] = useState<readonly string[]>([]);
  const annotations = ANNOTATIONS.filter((annotation) => !deleted.includes(annotation.id));

  const remove = (id: string) => {
    setDeleted((current) => [...current, id]);
    toast('Annotation deleted', {
      duration: 8000,
      action: { label: 'Undo', onClick: () => setDeleted((current) => current.filter((other) => other !== id)) },
    });
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-4">
        <h4 className="text-sm font-medium text-base-foreground">Chart annotations</h4>
        {deleted.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setDeleted([])}>
            Reset example
          </Button>
        ) : null}
      </div>
      {annotations.length === 0 ? <p className="py-2 text-sm text-muted-foreground">No annotations.</p> : null}
      <ul className="flex flex-col">
        {annotations.map((annotation) => (
          <li key={annotation.id} className="flex min-h-11 items-center gap-4 border-b border-default last:border-b-0">
            <span className="min-w-0 flex-1 truncate text-sm text-base-foreground">{annotation.text}</span>
            <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">{annotation.meta}</span>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete annotation: ${annotation.text}`}
                    onClick={() => remove(annotation.id)}
                  >
                    <IconTrash />
                  </Button>
                }
              />
              <TooltipContent>Delete annotation</TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>
      <SingleToaster />
    </div>
  );
}

function ConfirmationAcknowledgeAlarm() {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [acknowledged, setAcknowledged] = useState<string | null>(null);

  return (
    <>
      <ConfirmationSubject
        name={TRIP_ALARM.message}
        meta={
          acknowledged === null
            ? `${TRIP_ALARM.sensorTag} · ${TRIP_ALARM.value}, limit ${TRIP_ALARM.limit}`
            : `Acknowledged by you at 14:00${acknowledged ? ` · "${acknowledged}"` : ''}`
        }
      >
        {acknowledged === null ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            Acknowledge
          </Button>
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setAcknowledged(null)}>
            Reset example
          </Button>
        )}
      </ConfirmationSubject>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Acknowledge this alarm?</DialogTitle>
            <DialogDescription>
              This records that you have seen it. The alarm stays active until vibration is back under {TRIP_ALARM.limit}.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <Label htmlFor="confirmation-ack-comment">Comment for the next shift</Label>
            <Textarea
              id="confirmation-ack-comment"
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <HelperText>Optional. Shown in the alarm log with your name.</HelperText>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAcknowledged(comment.trim());
                setComment('');
                setOpen(false);
              }}
            >
              Acknowledge alarm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmationShelveAlarm() {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState('shift');
  const [shelvedUntil, setShelvedUntil] = useState<string | null>(null);
  const selected = SHELVE_DURATIONS.find((option) => option.id === duration) ?? SHELVE_DURATIONS[1];

  return (
    <>
      <ConfirmationSubject
        name={SIGNAL_ALARM.message}
        meta={shelvedUntil ? `Shelved until ${shelvedUntil}` : `${SIGNAL_ALARM.sensorTag} · Cooling water pump`}
      >
        {shelvedUntil ? (
          <Button variant="ghost" size="sm" onClick={() => setShelvedUntil(null)}>
            Reset example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Shelve alarm
          </Button>
        )}
      </ConfirmationSubject>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Shelve this alarm?</DialogTitle>
            <DialogDescription>
              It is hidden from the alarm list and returns on its own. A work order to replace the transmitter is planned.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <p id="confirmation-shelve-label" className="text-sm font-medium text-base-foreground">
              Shelve for
            </p>
            <RadioGroup
              aria-labelledby="confirmation-shelve-label"
              value={duration}
              onValueChange={(value) => {
                if (typeof value === 'string') setDuration(value);
              }}
            >
              {SHELVE_DURATIONS.map((option) => (
                <RadioGroupItem key={option.id}>
                  <RadioGroupItemControl value={option.id} />
                  <RadioGroupItemLabel>{option.label}</RadioGroupItemLabel>
                </RadioGroupItem>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShelvedUntil(selected.until);
                setOpen(false);
              }}
            >
              Shelve until {selected.until}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmationStartEquipment() {
  const [open, setOpen] = useState(false);
  const [checks, setChecks] = useState<readonly string[]>([]);
  const [running, setRunning] = useState(false);
  const preStartChecks = ['Suction valve 27-XV-2011 is open', 'The pump area is clear of people'];
  const ready = checks.length === preStartChecks.length;

  const changeOpen = (next: boolean) => {
    if (!next) setChecks([]);
    setOpen(next);
  };

  return (
    <>
      <ConfirmationSubject
        name={EXPORT_PUMP?.name ?? 'Export pump B'}
        meta={`${EXPORT_PUMP?.tag} · Gas export`}
        status={<StatusBadge status={running ? 'running' : 'standby'} />}
      >
        {running ? (
          <Button variant="ghost" size="sm" onClick={() => setRunning(false)}>
            Reset example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Start pump
          </Button>
        )}
      </ConfirmationSubject>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Start {EXPORT_PUMP?.name} ({EXPORT_PUMP?.tag})?</DialogTitle>
            <DialogDescription>
              The start command is sent to the control system at once. Export flow rises by about 200 m³/h.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-sm font-medium text-base-foreground">Before you start</p>
            <CheckboxGroup>
              {preStartChecks.map((check) => (
                <CheckboxItem key={check}>
                  <CheckboxItemControl
                    checked={checks.includes(check)}
                    onCheckedChange={(checked) =>
                      setChecks(checked === true ? [...checks, check] : checks.filter((other) => other !== check))
                    }
                  />
                  <CheckboxItemLabel>{check}</CheckboxItemLabel>
                </CheckboxItem>
              ))}
            </CheckboxGroup>
            {ready ? null : <HelperText>Confirm both checks to start the pump.</HelperText>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => changeOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!ready}
              onClick={() => {
                setRunning(true);
                changeOpen(false);
              }}
            >
              Start pump
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmationStopEquipment() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [stopped, setStopped] = useState(false);

  const changeOpen = (next: boolean) => {
    if (!next) {
      setReason('');
      setComment('');
    }
    setOpen(next);
  };

  return (
    <>
      <ConfirmationSubject
        name={COMPRESSOR?.name ?? '1st stage compressor'}
        meta={`${COMPRESSOR?.tag} · Gas compression`}
        status={<StatusBadge status={stopped ? 'stopped' : 'running'} />}
      >
        {stopped ? (
          <Button variant="ghost" size="sm" onClick={() => setStopped(false)}>
            Reset example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Stop compressor
          </Button>
        )}
      </ConfirmationSubject>
      <Dialog open={open} onOpenChange={changeOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Stop {COMPRESSOR?.name} ({COMPRESSOR?.tag})?</DialogTitle>
            <DialogDescription>
              Gas export drops by about 2.1 MSm³/d, and the 2nd stage compressor trips on low suction within minutes. A
              restart takes about 40 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex flex-col gap-2">
              <p id="confirmation-stop-reason" className="text-sm font-medium text-base-foreground">
                Reason for stopping
              </p>
              <RadioGroup
                aria-labelledby="confirmation-stop-reason"
                value={reason}
                onValueChange={(value) => {
                  if (typeof value === 'string') setReason(value);
                }}
              >
                {STOP_REASONS.map((option) => (
                  <RadioGroupItem key={option.id}>
                    <RadioGroupItemControl value={option.id} />
                    <RadioGroupItemLabel>{option.label}</RadioGroupItemLabel>
                  </RadioGroupItem>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label htmlFor="confirmation-stop-comment">Comment</Label>
              <Textarea
                id="confirmation-stop-comment"
                rows={2}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <HelperText>
                {reason === '' ? 'Choose a reason to stop the compressor.' : 'Recorded in the operations log with your name.'}
              </HelperText>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => changeOpen(false)}>
              Keep running
            </Button>
            <Button
              variant="destructive"
              disabled={reason === ''}
              onClick={() => {
                setStopped(true);
                changeOpen(false);
              }}
            >
              Stop compressor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ConfirmationSuccess() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-3 text-center">
      <IconCircleCheck aria-hidden className="size-6 text-success-foreground-strong" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">Pipeline deleted</p>
        <p className="text-sm text-muted-foreground">214 runs were removed. 2 dashboards that used it now show no data.</p>
      </div>
      <Button variant="secondary" size="sm">
        View affected dashboards <IconArrowRight />
      </Button>
    </div>
  );
}

function ConfirmationFailedRetry() {
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);

  const shelve = () =>
    wait(1200).then(() => {
      setAttempts(attempts + 1);
      if (attempts === 0) throw new Error('Alarm system unavailable');
      setDone(true);
    });

  return (
    <>
      <ConfirmationSubject name="Motor current high" meta={done ? 'Shelved until 22:00' : '27-IT-20013 · Export pump A'}>
        {done ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDone(false);
              setAttempts(0);
            }}
          >
            Reset example
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Shelve alarm
          </Button>
        )}
      </ConfirmationSubject>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Shelve alarm until 22:00?"
        description="Motor current high on Export pump A is hidden from the alarm list until the end of the shift."
        confirmLabel={attempts === 0 ? 'Shelve alarm' : 'Try again'}
        pendingLabel="Shelving…"
        errorMessage="Couldn't shelve the alarm. The alarm system did not respond. Try again."
        onConfirm={shelve}
      />
    </>
  );
}

function ConfirmationPartialResult() {
  return (
    <div className="w-full max-w-xs">
      <Alert variant="warning">
        <AlertTitle>9 of 12 time series deleted</AlertTitle>
        <AlertDescription>3 are used by a calculation and were kept.</AlertDescription>
        <AlertActions>
          <AlertButton>Show the 3</AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

export default definePage({
  id: 'confirmations',
  title: 'Confirmations',
  summary:
    'How to stop for a moment before an action that costs something: the question, the consequence, a specific button, and a way back. Heavier for what cannot be undone, lighter (or just an undo) for what can.',
  guidance: {
    use: [
      'A title that names the object and the action, and a body that states the consequence and reversibility.',
      'A confirm button labelled with the action itself: "Delete pipeline", "Stop compressor".',
      'Typed confirmation or an acknowledgement for the rare action with wide, permanent impact.',
      'Undo instead of a dialog when the action is cheap to reverse.',
    ],
    avoid: [
      '"Are you sure?" with OK and Cancel.',
      'A dialog for every delete; people stop reading them.',
      'A toast as the only safety net for something permanent.',
      'A disabled confirm button with no hint of what unlocks it.',
    ],
  },
  source,
  sections: [
    {
      id: 'dialogs',
      title: 'Confirmation dialogs',
      description: 'A dialog interrupts, so it is kept for actions that are permanent or wide. Each trigger opens one.',
      specimens: [
        {
          id: 'ConfirmationDestructive',
          title: 'Destructive confirm',
          note: 'A permanent delete of one object: name it, state what is lost, label the button with the action.',
          origin: 'custom',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: ConfirmationDestructive,
        },
        {
          id: 'ConfirmationTypedName',
          title: 'Typed-name confirmation',
          note: 'A delete that breaks things for other people: typing the name proves the right object is meant.',
          origin: 'custom',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: ConfirmationTypedName,
        },
        {
          id: 'ConfirmationConsequenceList',
          title: 'With a consequence list',
          note: 'An action with several side effects: list them so none of them is a surprise afterwards.',
          origin: 'custom',
          align: 'stretch',
          Component: ConfirmationConsequenceList,
        },
        {
          id: 'ConfirmationAcknowledgeCheckbox',
          title: 'Checkbox acknowledgement',
          note: 'A risk the user has to accept knowingly: the button unlocks when the statement is ticked.',
          origin: 'custom',
          align: 'stretch',
          Component: ConfirmationAcknowledgeCheckbox,
        },
        {
          id: 'ConfirmationBulkDelete',
          title: 'Bulk delete with count',
          note: 'Many objects at once: one confirmation that names the count, in the title and on the button.',
          origin: 'custom',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: ConfirmationBulkDelete,
        },
        {
          id: 'ConfirmationAsyncPending',
          title: 'Confirm that takes time',
          note: 'The action runs for a moment: the dialog stays, shows progress and cannot be dismissed midway.',
          origin: 'custom',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: ConfirmationAsyncPending,
        },
      ],
    },
    {
      id: 'wording',
      title: 'Wording and unsaved work',
      description: 'The same question reads differently when it can be undone. Shown inline so the two can be compared.',
      specimens: [
        {
          id: 'ConfirmationReversible',
          title: 'Reversible wording',
          note: 'The action can be undone later: say how to get it back, and use the primary button.',
          origin: 'custom',
          size: 'md',
          Component: ConfirmationReversible,
        },
        {
          id: 'ConfirmationIrreversible',
          title: 'Irreversible wording',
          note: 'The action is permanent: say what is lost and for whom, and use the destructive button.',
          origin: 'custom',
          size: 'md',
          Component: ConfirmationIrreversible,
        },
        {
          id: 'ConfirmationUnsavedChanges',
          title: 'Unsaved-changes prompt',
          note: 'Leaving a form with edits: staying is the easy exit and the body says what is lost. Edit, then leave.',
          origin: 'custom',
          uses: ['patterns/states/UnsavedChangesPrompt.tsx'],
          Component: ConfirmationUnsavedChanges,
        },
        {
          id: 'ConfirmationUnsavedWithSave',
          title: 'Save before leaving',
          note: 'The form can be saved from the prompt: offer it as the primary of three choices.',
          origin: 'custom',
          align: 'stretch',
          uses: ['patterns/states/UnsavedChangesPrompt.tsx'],
          Component: ConfirmationUnsavedWithSave,
        },
        {
          id: 'ConfirmationLabelPairs',
          title: 'Button labels',
          note: 'Writing the buttons: each one says what it does, so the choice is clear without the body text.',
          origin: 'custom',
          Component: ConfirmationLabelPairs,
        },
      ],
    },
    {
      id: 'lighter',
      title: 'Lighter than a dialog',
      description: 'For contained, low-cost actions: confirm in place, or skip the question and offer undo.',
      specimens: [
        {
          id: 'ConfirmationInlineTwoStep',
          title: 'Inline two-step',
          note: 'Dense rows of small things: the first click arms the button, the second commits. Click to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/ConfirmButton.tsx'],
          Component: ConfirmationInlineTwoStep,
        },
        {
          id: 'ConfirmationInlineRow',
          title: 'Question in the row',
          note: 'The consequence needs a sentence but not a dialog: the row itself asks and answers.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: ConfirmationInlineRow,
        },
        {
          id: 'ConfirmationPopover',
          title: 'Popover confirm',
          note: 'A reversible removal next to its trigger: a short question without dimming the page.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ConfirmationPopover,
        },
        {
          id: 'ConfirmationUndoToast',
          title: 'Undo instead of confirm',
          note: 'Deleting is cheap to reverse: do it at once and keep an Undo open for a few seconds.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/SingleToaster.tsx'],
          Component: ConfirmationUndoToast,
        },
      ],
    },
    {
      id: 'operational',
      title: 'Operational actions',
      description: 'Actions on live equipment and alarms. The dialog states the process effect and records who and why.',
      specimens: [
        {
          id: 'ConfirmationAcknowledgeAlarm',
          title: 'Acknowledge with comment',
          note: 'Acknowledging an alarm: say what it does and does not do, and take a note for the next shift.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ConfirmationAcknowledgeAlarm,
        },
        {
          id: 'ConfirmationShelveAlarm',
          title: 'Shelve for a duration',
          note: 'Hiding a nuisance alarm: the choice of duration is part of the confirmation, and the button repeats it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ConfirmationShelveAlarm,
        },
        {
          id: 'ConfirmationStartEquipment',
          title: 'Start equipment',
          note: 'A start command to live equipment: name the tag, state the effect and confirm the pre-start checks.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: ConfirmationStartEquipment,
        },
        {
          id: 'ConfirmationStopEquipment',
          title: 'Stop equipment, with reason',
          note: 'Stopping running equipment: state the production effect and require a reason for the log.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/StatusBadge.tsx'],
          Component: ConfirmationStopEquipment,
        },
      ],
    },
    {
      id: 'outcomes',
      title: 'After confirming',
      description: 'What the user sees once the action has run: done, failed, or partly done.',
      specimens: [
        {
          id: 'ConfirmationSuccess',
          title: 'Success acknowledgement',
          note: 'The action had side effects worth knowing: confirm in place and point to what changed.',
          origin: 'custom',
          Component: ConfirmationSuccess,
        },
        {
          id: 'ConfirmationFailedRetry',
          title: 'Failed, with retry',
          note: 'The action failed: keep the dialog open, say why and let the user try again. First attempt fails.',
          origin: 'custom',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: ConfirmationFailedRetry,
        },
        {
          id: 'ConfirmationPartialResult',
          title: 'Partly done',
          note: 'A bulk action finished for some items only: give the count and a way to see the rest.',
          origin: 'custom',
          Component: ConfirmationPartialResult,
        },
      ],
    },
  ],
});
