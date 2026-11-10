import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Badge } from '@cognite/aura/components/badge';
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
import { ItemGroup } from '@cognite/aura/components/item';
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
  RadioGroupItemDescription,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import { Switch } from '@cognite/aura/components/switch';
import {
  IconCalendarRepeat,
  IconChevronDown,
  IconDownload,
  IconFileSpreadsheet,
  IconFileText,
  IconLock,
  IconPrinter,
  IconShare,
  IconTable,
  IconX,
} from '@cognite/aura/icons';
import { useEffect, useState } from 'react';

import { CopyButton } from '../../../library/actions/CopyButton';
import { SplitButton } from '../../../library/actions/SplitButton';
import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { FormField } from '../../../library/forms/FormField';
import { MultiSelectCombobox } from '../../../library/forms/MultiSelectCombobox';
import { SelectAllCheckboxList } from '../../../library/forms/SelectAllCheckboxList';
import { ExportProgress } from '../../../library/patterns/collaboration/ExportProgress';
import type { ExportStatus } from '../../../library/patterns/collaboration/ExportProgress';
import { ShareLinkField } from '../../../library/patterns/collaboration/ShareLinkField';
import { EntityRow } from '../../../library/patterns/collections/EntityRow';
import { IconAction } from '../../../library/patterns/collections/IconAction';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { OptionSelect } from '../../../library/patterns/data-entry/OptionSelect';
import { MemberRow } from '../../../library/patterns/people/MemberRow';
import { RoleSelect } from '../../../library/patterns/people/RoleSelect';
import type { RoleOption } from '../../../library/patterns/people/RoleSelect';
import { SectionHeader } from '../../../library/patterns/structure/SectionHeader';
import { PEOPLE } from '../../data/plant';
import { definePage } from '../../types';

import source from './sharing-and-export.tsx?raw';

const SHARE_EXPORT_URL = 'https://fusion.cognite.test/nordkapp/dashboards/gas-compression';
const SHARE_EXPORT_ME = PEOPLE[4];

const SHARE_EXPORT_ROLES: readonly RoleOption[] = [
  { value: 'view', label: 'Can view', description: 'Open the dashboard and its data' },
  { value: 'comment', label: 'Can comment', description: 'View and take part in threads' },
  { value: 'edit', label: 'Can edit', description: 'Change panels, limits and sharing' },
];

const SHARE_EXPORT_OWNER_ROLES: readonly RoleOption[] = [{ value: 'owner', label: 'Owner' }, ...SHARE_EXPORT_ROLES];

const SHARE_EXPORT_ACCESS: Readonly<Record<string, string>> = { ih: 'edit', ak: 'edit', ms: 'comment', tb: 'view' };

const SHARE_EXPORT_COLUMNS = [
  { id: 'raised', label: 'Raised at' },
  { id: 'tag', label: 'Tag' },
  { id: 'message', label: 'Alarm text' },
  { id: 'severity', label: 'Severity' },
  { id: 'value', label: 'Value and limit' },
  { id: 'ack', label: 'Acknowledged by' },
];

const SHARE_EXPORT_REPORTS = [
  { id: 'r1', name: 'Weekly alarm summary', schedule: 'Mondays at 07:00', next: 'Next 16 Mar', format: 'PDF', recipients: ['lw', 'ih', 'ak'], on: true },
  { id: 'r2', name: 'Open work orders by priority', schedule: 'Every day at 06:00', next: 'Next 13 Mar', format: 'CSV', recipients: ['ms', 'tb'], on: true },
  { id: 'r3', name: 'Monthly availability and OEE', schedule: 'First day of the month at 08:00', next: 'Paused', format: 'PDF', recipients: ['lw', 'ms', 'ak', 'ih', 'jn'], on: false },
];

function shareExportPeople(ids: readonly string[]) {
  return PEOPLE.filter((person) => ids.includes(person.id));
}

/** Per-person access levels for the shared-with lists. */
function useShareExportAccess() {
  const [access, setAccess] = useState<Readonly<Record<string, string>>>(SHARE_EXPORT_ACCESS);
  return {
    access,
    members: PEOPLE.filter((person) => person.id in access),
    setRole: (id: string, role: string) => setAccess((current) => ({ ...current, [id]: role })),
    remove: (id: string) => setAccess((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== id))),
    add: (ids: readonly string[], role: string) =>
      setAccess((current) => ({ ...current, ...Object.fromEntries(ids.map((id) => [id, role])) })),
    reset: () => setAccess(SHARE_EXPORT_ACCESS),
  };
}

/** The access-level select at a fixed width, so a column of rows lines up and names keep their room. */
function ShareExportLevel({
  value,
  onValueChange,
  label,
  size = 'sm',
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  size?: 'sm' | 'default';
}) {
  return (
    <span className="block w-36 shrink-0">
      <RoleSelect roles={SHARE_EXPORT_ROLES} value={value} onValueChange={onValueChange} label={label} size={size} />
    </span>
  );
}

function ShareExportOwnerRow() {
  return (
    <MemberRow
      name={SHARE_EXPORT_ME.name}
      colorKey={SHARE_EXPORT_ME.id}
      detail={SHARE_EXPORT_ME.role}
      isYou
      role={
        <RoleSelect
          roles={SHARE_EXPORT_OWNER_ROLES}
          value="owner"
          onValueChange={() => undefined}
          label={`Access for ${SHARE_EXPORT_ME.name}`}
          lockedReason="Ownership is transferred, not changed here."
        />
      }
    />
  );
}

function ShareExportLinkCopy() {
  return (
    <div className="w-full max-w-lg">
      <ShareLinkField
        label="Link to this dashboard"
        url={SHARE_EXPORT_URL}
        hint="Only people with access to Gas compression can open this link."
      />
    </div>
  );
}

function ShareExportLinkAccess() {
  const [mode, setMode] = useState('restricted');

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <h4 className="text-sm font-medium text-base-foreground">Who can open the link</h4>
      <RadioGroup value={mode} onValueChange={(value) => setMode(String(value))} aria-label="Who can open the link">
        <RadioGroupItem>
          <RadioGroupItemControl value="restricted" />
          <RadioGroupItemLabel>Restricted</RadioGroupItemLabel>
          <RadioGroupItemDescription>Only the people and groups you add below.</RadioGroupItemDescription>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="organisation" />
          <RadioGroupItemLabel>Anyone in the organisation</RadioGroupItemLabel>
          <RadioGroupItemDescription>Everyone who signs in to the Nordkapp project can view.</RadioGroupItemDescription>
        </RadioGroupItem>
      </RadioGroup>
      <p className="text-xs text-muted-foreground" role="status">
        {mode === 'restricted' ? '5 people have access.' : '214 people in the organisation can view. 5 people keep their own access level.'}
      </p>
    </div>
  );
}

function ShareExportPublicWarning() {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-base-foreground">Public link</span>
          <span className="text-xs text-muted-foreground">Anyone with the link can view, without signing in.</span>
        </div>
        <Switch aria-label="Public link" checked={enabled} onCheckedChange={setEnabled} />
      </div>
      {enabled ? (
        <>
          <Alert variant="warning" className="w-full">
            <AlertTitle>This link works for anyone who has it</AlertTitle>
            <AlertDescription>
              It shows live production values for gas compression. It expires on 19 Mar and every visit is recorded in
              the audit log.
            </AlertDescription>
          </Alert>
          <ShareLinkField label="Public link" hideLabel url={`${SHARE_EXPORT_URL}?share=pk_7f3a91`} copyLabel="Copy public link" />
        </>
      ) : (
        <p className="text-xs text-muted-foreground">The public link is off. Existing copies of it stopped working.</p>
      )}
    </div>
  );
}

function ShareExportViewTimeRange() {
  const [range, setRange] = useState('fixed');
  const query = range === 'fixed' ? '?from=2026-03-11T14:00Z&to=2026-03-12T14:00Z' : '?range=24h';

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <RadioGroup value={range} onValueChange={(value) => setRange(String(value))} aria-label="Time range in the shared view">
        <RadioGroupItem>
          <RadioGroupItemControl value="fixed" />
          <RadioGroupItemLabel>What I see now</RadioGroupItemLabel>
          <RadioGroupItemDescription>11 Mar 14:00 to 12 Mar 14:00, with the 3 filters applied.</RadioGroupItemDescription>
        </RadioGroupItem>
        <RadioGroupItem>
          <RadioGroupItemControl value="live" />
          <RadioGroupItemLabel>Live view</RadioGroupItemLabel>
          <RadioGroupItemDescription>The last 24 hours from whenever the link is opened.</RadioGroupItemDescription>
        </RadioGroupItem>
      </RadioGroup>
      <ShareLinkField label="Link to this view" url={`${SHARE_EXPORT_URL}${query}`} />
    </div>
  );
}

function ShareExportPopover() {
  const sharing = useShareExportAccess();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline">
            <IconShare /> Share dashboard
          </Button>
        }
      />
      <PopoverContent align="end" className="w-96">
        <PopoverHeader>
          <PopoverHeaderContent>
            <PopoverTitle>Share Gas compression</PopoverTitle>
            <PopoverClose />
          </PopoverHeaderContent>
          <PopoverDescription>{sharing.members.length + 1} people have access.</PopoverDescription>
        </PopoverHeader>
        <PopoverSlot>
          <div className="flex w-full flex-col gap-3">
            <ItemGroup aria-label="People with access">
              <ShareExportOwnerRow />
              {sharing.members.slice(0, 2).map((person) => (
                <MemberRow
                  key={person.id}
                  name={person.name}
                  colorKey={person.id}
                  role={
                    <ShareExportLevel value={sharing.access[person.id]} onValueChange={(role) => sharing.setRole(person.id, role)} label={`Access for ${person.name}`} />
                  }
                />
              ))}
            </ItemGroup>
            <CopyButton variant="secondary" text={SHARE_EXPORT_URL} label="Copy link" copiedLabel="Link copied" className="w-full" />
          </div>
        </PopoverSlot>
      </PopoverContent>
    </Popover>
  );
}

function ShareExportDialog() {
  const [invited, setInvited] = useState<string[]>(['jn']);
  const [role, setRole] = useState('view');

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open share dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Gas compression</DialogTitle>
          <DialogDescription>People you add get a notification with a link to the dashboard.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <FormField label="Add people">
                {(control) => (
                  <MultiSelectCombobox
                    id={control.id}
                    options={PEOPLE.map((person) => ({ value: person.id, label: person.name }))}
                    value={invited}
                    onValueChange={setInvited}
                    placeholder="Search by name"
                  />
                )}
              </FormField>
            </div>
            <ShareExportLevel value={role} onValueChange={setRole} label="Access level for the people you add" size="default" />
          </div>
          <ShareLinkField label="Or copy the link" url={SHARE_EXPORT_URL} hint="Only people with access can open it." />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button disabled={invited.length === 0}>Share dashboard</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ShareExportEmbed() {
  const snippet = `<iframe\n  src="${SHARE_EXPORT_URL}/embed?panel=discharge-pressure"\n  width="640" height="360"\n  title="Discharge pressure, 23-PT-92531">\n</iframe>`;

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-base-foreground">Embed this panel</span>
        <CopyButton variant="ghost" size="sm" text={snippet} label="Copy code" copiedLabel="Code copied" />
      </div>
      <pre className="rounded-lg bg-muted-background p-3 font-mono text-xs leading-5 break-all whitespace-pre-wrap text-base-foreground">{snippet}</pre>
      <p className="text-xs text-muted-foreground">Viewers still sign in. The embed follows the access of this dashboard.</p>
    </div>
  );
}

function ShareExportSharedWith() {
  const sharing = useShareExportAccess();

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <SectionHeader title="People with access" count={sharing.members.length + 1} size="sm" as="h4" />
      <ItemGroup aria-label="People with access">
        <ShareExportOwnerRow />
        {sharing.members.map((person) => (
          <MemberRow
            key={person.id}
            name={person.name}
            colorKey={person.id}
            detail={person.role}
            role={
              <ShareExportLevel value={sharing.access[person.id]} onValueChange={(role) => sharing.setRole(person.id, role)} label={`Access for ${person.name}`} />
            }
          />
        ))}
      </ItemGroup>
    </div>
  );
}

function ShareExportRevoke() {
  const sharing = useShareExportAccess();
  const [removed, setRemoved] = useState<string | null>(null);

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <ItemGroup aria-label="People with access">
        {sharing.members.slice(0, 3).map((person) => (
          <MemberRow
            key={person.id}
            name={person.name}
            colorKey={person.id}
            detail={person.role}
            role={<span className="text-sm text-medium-foreground">{SHARE_EXPORT_ROLES.find((role) => role.value === sharing.access[person.id])?.label}</span>}
            actions={
              <IconAction
                label={`Remove access for ${person.name}`}
                onClick={() => {
                  sharing.remove(person.id);
                  setRemoved(person.name);
                }}
              >
                <IconX />
              </IconAction>
            }
          />
        ))}
      </ItemGroup>
      <div className="flex min-h-7 items-center justify-between gap-3 px-2" role="status">
        {removed ? (
          <>
            <span className="text-sm text-medium-foreground">{removed} can no longer open this dashboard.</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sharing.reset();
                setRemoved(null);
              }}
            >
              Undo
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Removing access takes effect at once, including for open sessions.</span>
        )}
      </div>
    </div>
  );
}

function ShareExportInvite() {
  const sharing = useShareExportAccess();
  const [picked, setPicked] = useState<string[]>(['jn']);
  const [role, setRole] = useState('view');
  const candidates = PEOPLE.filter((person) => !(person.id in sharing.access) && person.id !== SHARE_EXPORT_ME.id);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <FormField label="Add people">
            {(control) => (
              <MultiSelectCombobox
                id={control.id}
                options={candidates.map((person) => ({ value: person.id, label: person.name }))}
                value={picked}
                onValueChange={setPicked}
                placeholder="Search by name"
                emptyText="Everyone already has access"
              />
            )}
          </FormField>
        </div>
        <ShareExportLevel value={role} onValueChange={setRole} label="Access level for the people you add" size="default" />
        <Button
          disabled={picked.length === 0}
          onClick={() => {
            sharing.add(picked, role);
            setPicked([]);
          }}
        >
          Share
        </Button>
      </div>
      <p className="text-xs text-muted-foreground" role="status">
        {sharing.members.length + 1} people have access.
      </p>
    </div>
  );
}

function ShareExportRequestAccess() {
  const [requested, setRequested] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
      <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-muted-background text-medium-foreground">
        <IconLock className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h4 className="text-base font-semibold text-base-foreground">You need access to this dashboard</h4>
        <p className="text-sm text-muted-foreground">
          Gas compression is shared with 5 people. {SHARE_EXPORT_ME.name} owns it and can add you.
        </p>
      </div>
      {requested ? (
        <p className="flex min-h-9 items-center text-sm text-medium-foreground" role="status">
          Request sent to {SHARE_EXPORT_ME.name}. You get a notification when it is answered.
        </p>
      ) : (
        <Button onClick={() => setRequested(true)}>Request access</Button>
      )}
    </div>
  );
}

function ShareExportMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            <IconDownload /> Export <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <IconTable /> CSV, for spreadsheets
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconFileSpreadsheet /> Parquet, for analysis tools
        </DropdownMenuItem>
        <DropdownMenuItem>
          <IconFileText /> PDF, for reading and printing
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ShareExportSplit() {
  return (
    <SplitButton
      variant="secondary"
      onClick={() => undefined}
      menuLabel="More export formats"
      options={[
        { id: 'parquet', label: 'Export as Parquet', onSelect: () => undefined },
        { id: 'pdf', label: 'Export as PDF', onSelect: () => undefined },
        { id: 'options', label: 'Export with options', onSelect: () => undefined },
      ]}
    >
      <IconDownload /> Export as CSV
    </SplitButton>
  );
}

function ShareExportPrintNotice() {
  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-base-foreground">Print this dashboard</span>
        <p className="text-sm text-muted-foreground">
          The printed version uses the light theme, hides navigation and expands every panel. Live values are frozen at
          12 Mar 14:00 UTC.
        </p>
      </div>
      <div>
        <Button variant="outline" size="sm">
          <IconPrinter /> Print dashboard
        </Button>
      </div>
    </div>
  );
}

function ShareExportOptionsForm() {
  const [columns, setColumns] = useState<string[]>(['raised', 'tag', 'message', 'severity']);
  const [format, setFormat] = useState('csv');

  return (
    <form className="flex w-full max-w-lg flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Time range">
          {(control) => (
            <OptionSelect
              id={control.id}
              defaultValue="30d"
              options={[
                { value: '24h', label: 'Last 24 hours' },
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: 'view', label: 'Same as the table' },
              ]}
            />
          )}
        </FormField>
        <FormField label="Format" helper={format === 'pdf' ? 'PDF holds at most 5,000 rows.' : undefined}>
          {(control) => (
            <OptionSelect
              id={control.id}
              aria-describedby={control['aria-describedby']}
              value={format}
              onValueChange={setFormat}
              options={[
                { value: 'csv', label: 'CSV' },
                { value: 'parquet', label: 'Parquet' },
                { value: 'pdf', label: 'PDF' },
              ]}
            />
          )}
        </FormField>
      </div>
      <SelectAllCheckboxList label="Columns" options={SHARE_EXPORT_COLUMNS} value={columns} onValueChange={setColumns} selectAllLabel="All columns" />
      <FormActions status={<span className="text-xs tabular-nums text-muted-foreground">About 8,400 rows · 1.1 MB</span>}>
        <Button variant="ghost" type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={columns.length === 0}>
          Export alarm history
        </Button>
      </FormActions>
    </form>
  );
}

function ShareExportInProgress() {
  const [cancelled, setCancelled] = useState(false);
  const [value, setValue] = useState(44);
  const [stepping, setStepping] = useState(false);
  const finished = value >= 100;
  const status: ExportStatus = cancelled ? 'cancelled' : finished ? 'ready' : 'running';

  useEffect(() => {
    if (!stepping || finished) return;
    const handle = window.setInterval(() => {
      setValue((current) => Math.min(100, current + 8));
    }, 300);
    return () => window.clearInterval(handle);
  }, [stepping, finished]);

  return (
    <div className="w-full max-w-lg">
      <ExportProgress
        fileName="alarm-history-february.csv"
        status={status}
        value={value}
        detail={`${Math.round(value * 4120).toLocaleString('en-US')} of 412,000 rows`}
        readyText="18.4 MB · Available for 7 days"
        icon={<IconTable />}
        onCancel={() => {
          setStepping(false);
          setCancelled(true);
        }}
        onDownload={() => undefined}
        onRetry={() => {
          setValue(0);
          setCancelled(false);
          setStepping(true);
        }}
      />
    </div>
  );
}

function ShareExportReady() {
  return (
    <div className="w-full max-w-lg">
      <ExportProgress
        fileName="work-orders-open-2026-03-12.parquet"
        status="ready"
        readyText="2.6 MB · Available for 7 days"
        icon={<IconFileSpreadsheet />}
        onDownload={() => undefined}
      />
    </div>
  );
}

function ShareExportFailed() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-5">
      <ExportProgress
        fileName="compressor-telemetry-q1.csv"
        status="failed"
        errorText="The range holds more than 5 million rows. Narrow it or use Parquet."
        icon={<IconTable />}
        onRetry={() => undefined}
      />
      <ExportProgress fileName="availability-report-february.pdf" status="cancelled" icon={<IconFileText />} onRetry={() => undefined} />
    </div>
  );
}

function ShareExportScheduleForm() {
  const [frequency, setFrequency] = useState('weekly');
  const [recipients, setRecipients] = useState<string[]>(['lw', 'ih']);

  return (
    <form className="flex w-full max-w-lg flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Frequency">
          {(control) => (
            <OptionSelect
              id={control.id}
              value={frequency}
              onValueChange={setFrequency}
              options={[
                { value: 'daily', label: 'Every day' },
                { value: 'weekly', label: 'Every week' },
                { value: 'monthly', label: 'Every month' },
              ]}
            />
          )}
        </FormField>
        <FormField label={frequency === 'daily' ? 'Time' : frequency === 'weekly' ? 'Day and time' : 'Day of month and time'}>
          {(control) => (
            <OptionSelect
              id={control.id}
              key={frequency}
              defaultValue="a"
              options={
                frequency === 'daily'
                  ? [
                      { value: 'a', label: '06:00' },
                      { value: 'b', label: '18:00' },
                    ]
                  : frequency === 'weekly'
                    ? [
                        { value: 'a', label: 'Monday 07:00' },
                        { value: 'b', label: 'Friday 15:00' },
                      ]
                    : [
                        { value: 'a', label: 'First day, 08:00' },
                        { value: 'b', label: 'Last day, 16:00' },
                      ]
              }
            />
          )}
        </FormField>
      </div>
      <FormField label="Recipients" helper="Recipients get the report by email as a PDF. They need access to the dashboard.">
        {(control) => (
          <MultiSelectCombobox
            id={control.id}
            aria-describedby={control['aria-describedby']}
            options={PEOPLE.map((person) => ({ value: person.id, label: person.name }))}
            value={recipients}
            onValueChange={setRecipients}
            placeholder="Add recipients"
          />
        )}
      </FormField>
      <FormActions status={<span className="text-xs text-muted-foreground">First report: Monday 16 Mar, 07:00 UTC</span>}>
        <Button type="submit" disabled={recipients.length === 0}>
          Schedule report
        </Button>
      </FormActions>
    </form>
  );
}

function ShareExportScheduleRows() {
  const [off, setOff] = useState<readonly string[]>(SHARE_EXPORT_REPORTS.filter((report) => !report.on).map((report) => report.id));

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <SectionHeader title="Scheduled reports" count={SHARE_EXPORT_REPORTS.length} size="sm" as="h4" />
      <ItemGroup aria-label="Scheduled reports">
        {SHARE_EXPORT_REPORTS.map((report) => {
          const paused = off.includes(report.id);
          return (
            <EntityRow
              key={report.id}
              leading={<IconCalendarRepeat />}
              title={report.name}
              description={`${report.schedule} · ${report.format} · ${paused ? 'Paused' : report.next === 'Paused' ? 'Next 1 Apr' : report.next}`}
              meta={<AvatarGroup people={shareExportPeople(report.recipients)} max={3} sizes="xsm" label={`Recipients of ${report.name}`} />}
              trailing={
                <Switch
                  aria-label={`Send ${report.name}`}
                  checked={!paused}
                  onCheckedChange={(checked) =>
                    setOff((current) => (checked ? current.filter((id) => id !== report.id) : [...current, report.id]))
                  }
                />
              }
            />
          );
        })}
      </ItemGroup>
    </div>
  );
}

function ShareExportSharePanel() {
  const sharing = useShareExportAccess();
  const [mode, setMode] = useState('restricted');

  return (
    <div className="flex w-full max-w-lg flex-col gap-5 rounded-xl border border-default p-4">
      <SectionHeader title="Share Gas compression" description="Dashboard · Nordkapp" size="md" as="h3" />
      <ShareLinkField
        label="Link"
        url={SHARE_EXPORT_URL}
        hint={mode === 'restricted' ? 'Only the people below can open this link.' : 'Anyone in the organisation can open this link.'}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-base-foreground">Who can open the link</span>
        <span className="block w-60 shrink-0">
          <OptionSelect
            aria-label="Who can open the link"
            size="sm"
            width="compact"
            value={mode}
            onValueChange={setMode}
            options={[
              { value: 'restricted', label: 'Restricted' },
              { value: 'organisation', label: 'Anyone in the organisation' },
            ]}
          />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <SectionHeader title="People with access" count={sharing.members.length + 1} size="sm" as="h4" />
        <ItemGroup aria-label="People with access">
          <ShareExportOwnerRow />
          {sharing.members.map((person) => (
            <MemberRow
              key={person.id}
              name={person.name}
              colorKey={person.id}
              role={
                <ShareExportLevel value={sharing.access[person.id]} onValueChange={(role) => sharing.setRole(person.id, role)} label={`Access for ${person.name}`} />
              }
              actions={
                <IconAction label={`Remove access for ${person.name}`} onClick={() => sharing.remove(person.id)}>
                  <IconX />
                </IconAction>
              }
            />
          ))}
        </ItemGroup>
      </div>
    </div>
  );
}

function ShareExportCenter() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-5 rounded-xl border border-default p-4">
      <SectionHeader
        title="Exports"
        description="Files are kept for 7 days."
        size="md"
        as="h4"
        actions={<Badge variant="inProgress">1 running</Badge>}
      />
      <ExportProgress fileName="alarm-history-february.csv" status="running" value={62} detail="255,400 of 412,000 rows" icon={<IconTable />} onCancel={() => undefined} />
      <ExportProgress fileName="work-orders-open-2026-03-12.parquet" status="ready" readyText="2.6 MB · Today 13:20" icon={<IconFileSpreadsheet />} onDownload={() => undefined} />
      <ExportProgress fileName="weekly-alarm-summary-w10.pdf" status="ready" readyText="640 kB · Scheduled, 9 Mar" icon={<IconFileText />} onDownload={() => undefined} />
      <ExportProgress
        fileName="compressor-telemetry-q1.csv"
        status="failed"
        errorText="More than 5 million rows. Narrow the range."
        icon={<IconTable />}
        onRetry={() => undefined}
      />
    </div>
  );
}

export default definePage({
  id: 'sharing-and-export',
  title: 'Sharing and export',
  summary:
    'Sharing gives other people a way in: a link, an access level, a scheduled report. Export takes data out as a file. Both say exactly who or what is covered before the action is taken.',
  guidance: {
    use: [
      'Say who a link works for right under the link.',
      'Name the format by what it is for: spreadsheets, analysis tools, reading.',
      'Show the size of an export before it starts and let a long one be cancelled.',
      'Make revoking access immediate, and offer Undo instead of a confirmation.',
    ],
    avoid: [
      'A public link without an expiry and a visible warning.',
      'A bare "Copied" toast far from the button. Confirm in the button.',
      'Sharing a live view when the sender meant the moment they were looking at.',
      'Scheduled reports nobody can pause or see the recipients of.',
    ],
  },
  source,
  sections: [
    {
      id: 'share',
      title: 'Share',
      description: 'Links, who they work for, and the triggers that open the sharing controls.',
      specimens: [
        {
          id: 'ShareExportLinkCopy',
          title: 'Copy link',
          note: 'The quickest share: the link, a copy button that confirms in place, and who it works for.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ShareLinkField.tsx', 'actions/CopyButton.tsx'],
          Component: ShareExportLinkCopy,
        },
        {
          id: 'ShareExportLinkAccess',
          title: 'Link access setting',
          note: 'Choosing between named people and the whole organisation, with the reach of each written out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ShareExportLinkAccess,
        },
        {
          id: 'ShareExportPublicWarning',
          title: 'Public link warning',
          note: 'When a link works without signing in: say what it exposes and when it expires.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ShareLinkField.tsx'],
          Component: ShareExportPublicWarning,
        },
        {
          id: 'ShareExportViewTimeRange',
          title: 'Share a view with its time range',
          note: 'Lets the sender choose between the moment they are looking at and a live view. The link follows.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ShareLinkField.tsx'],
          Component: ShareExportViewTimeRange,
        },
        {
          id: 'ShareExportPopover',
          title: 'Share popover',
          note: 'Light sharing from a toolbar: who has access, their level and the link.',
          origin: 'custom',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleSelect.tsx', 'actions/CopyButton.tsx'],
          Component: ShareExportPopover,
        },
        {
          id: 'ShareExportDialog',
          title: 'Share dialog',
          note: 'When sharing includes inviting people, which needs room and a deliberate confirm.',
          origin: 'custom',
          uses: [
            'forms/MultiSelectCombobox.tsx',
            'forms/FormField.tsx',
            'patterns/people/RoleSelect.tsx',
            'patterns/collaboration/ShareLinkField.tsx',
          ],
          Component: ShareExportDialog,
        },
        {
          id: 'ShareExportEmbed',
          title: 'Embed snippet',
          note: 'For putting one panel on an intranet page or a wiki, with the access rule stated.',
          origin: 'custom',
          align: 'stretch',
          uses: ['actions/CopyButton.tsx'],
          Component: ShareExportEmbed,
        },
      ],
    },
    {
      id: 'people',
      title: 'People with access',
      description: 'Who can open the thing, at which level, and how that changes.',
      specimens: [
        {
          id: 'ShareExportSharedWith',
          title: 'Shared-with list',
          note: 'Everyone with access and their level; the owner is locked with the reason.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleSelect.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: ShareExportSharedWith,
        },
        {
          id: 'ShareExportRevoke',
          title: 'Revoke access',
          note: 'Removing someone takes effect at once and offers Undo. Remove a person to try.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/collections/IconAction.tsx'],
          Component: ShareExportRevoke,
        },
        {
          id: 'ShareExportInvite',
          title: 'Add people with a level',
          note: 'Several people get the same access level in one step.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/MultiSelectCombobox.tsx', 'forms/FormField.tsx', 'patterns/people/RoleSelect.tsx'],
          Component: ShareExportInvite,
        },
        {
          id: 'ShareExportRequestAccess',
          title: 'Request access',
          note: 'What a recipient without access sees: who owns the item and one way to ask.',
          origin: 'custom',
          size: 'md',
          Component: ShareExportRequestAccess,
        },
      ],
    },
    {
      id: 'export',
      title: 'Export',
      description: 'Choosing a format, setting options and following a file until it can be downloaded.',
      specimens: [
        {
          id: 'ShareExportMenu',
          title: 'Export menu',
          note: 'Three formats named by what they are for, not only by their extension.',
          origin: 'custom',
          Component: ShareExportMenu,
        },
        {
          id: 'ShareExportSplit',
          title: 'Export with a default',
          note: 'When one format is used nine times out of ten and the rest sit behind the caret.',
          origin: 'custom',
          uses: ['actions/SplitButton.tsx'],
          Component: ShareExportSplit,
        },
        {
          id: 'ShareExportPrintNotice',
          title: 'Print-friendly notice',
          note: 'Before printing a live dashboard: what the paper version changes and freezes.',
          origin: 'custom',
          align: 'stretch',
          Component: ShareExportPrintNotice,
        },
        {
          id: 'ShareExportOptionsForm',
          title: 'Export options',
          note: 'Range, columns and format, with the estimated size beside the action.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/SelectAllCheckboxList.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: ShareExportOptionsForm,
        },
        {
          id: 'ShareExportInProgress',
          title: 'Export in progress',
          note: 'A long export shows how far it is and can be cancelled. Cancel, then export again to see it finish.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ExportProgress.tsx'],
          Component: ShareExportInProgress,
        },
        {
          id: 'ShareExportReady',
          title: 'Export ready',
          note: 'The file with its size, how long it is kept, and the download.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ExportProgress.tsx'],
          Component: ShareExportReady,
        },
        {
          id: 'ShareExportFailed',
          title: 'Failed and cancelled',
          note: 'A failed export says why and what to change; a cancelled one confirms nothing was created.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ExportProgress.tsx'],
          Component: ShareExportFailed,
        },
      ],
    },
    {
      id: 'scheduled',
      title: 'Scheduled reports',
      description: 'An export that repeats and goes to people.',
      specimens: [
        {
          id: 'ShareExportScheduleForm',
          title: 'Schedule a report',
          note: 'Frequency, time and recipients, with the date of the first report as the check.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'forms/FormField.tsx',
            'forms/MultiSelectCombobox.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/data-entry/FormActions.tsx',
          ],
          Component: ShareExportScheduleForm,
        },
        {
          id: 'ShareExportScheduleRows',
          title: 'Scheduled report rows',
          note: 'Each report with its schedule, next run, recipients and a switch to pause it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collections/EntityRow.tsx', 'display/AvatarGroup.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: ShareExportScheduleRows,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'The whole sharing panel and an export centre.',
      specimens: [
        {
          id: 'ShareExportSharePanel',
          title: 'Share panel',
          note: 'Link, link access and the people list together, as the body of a share dialog.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: [
            'patterns/collaboration/ShareLinkField.tsx',
            'patterns/people/MemberRow.tsx',
            'patterns/people/RoleSelect.tsx',
            'patterns/collections/IconAction.tsx',
            'patterns/data-entry/OptionSelect.tsx',
            'patterns/structure/SectionHeader.tsx',
          ],
          Component: ShareExportSharePanel,
        },
        {
          id: 'ShareExportCenter',
          title: 'Export centre',
          note: 'Every recent export in one place, whatever state it is in.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/collaboration/ExportProgress.tsx', 'patterns/structure/SectionHeader.tsx'],
          Component: ShareExportCenter,
        },
      ],
    },
  ],
});
