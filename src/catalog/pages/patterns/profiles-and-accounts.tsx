import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderEnd,
  CardHeaderStart,
  CardTitle,
} from '@cognite/aura/components/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@cognite/aura/components/hover-card';
import { Input } from '@cognite/aura/components/input';
import { Progress } from '@cognite/aura/components/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Skeleton } from '@cognite/aura/components/skeleton';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconBan,
  IconCheck,
  IconChevronDown,
  IconCircle,
  IconKey,
  IconLock,
  IconMail,
  IconMessage,
  IconPencil,
  IconPhone,
  IconShieldLock,
  IconUpload,
} from '@cognite/aura/icons';
import { useState } from 'react';
import type { MouseEvent } from 'react';

import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { MetadataList } from '../../../library/display/MetadataList';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { FormField } from '../../../library/forms/FormField';
import { SettingSwitchRow } from '../../../library/forms/SettingSwitchRow';
import { Sparkline } from '../../../library/industrial/Sparkline';
import { ConfirmDialog } from '../../../library/overlays/ConfirmDialog';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { RoleBadge } from '../../../library/patterns/people/RoleBadge';
import type { MemberRole } from '../../../library/patterns/people/RoleBadge';
import { PEOPLE } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate, formatTime, makeValues } from '../../data/series';
import { definePage } from '../../types';

import source from './profiles-and-accounts.tsx?raw';

const [INGRID, MAGNUS, AISHA, TOMAS, LIV, JONAS] = PEOPLE;

/** Work address in the plant's own fictional domain. */
function emailOf(name: string): string {
  const plain = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return `${plain.split(/\s+/).join('.')}@nordkapp.example`;
}

const AISHA_EMAIL = emailOf(AISHA.name);
const AISHA_PHONE = '+47 555 01 142';

const LINK =
  'rounded-sm font-medium text-link-foreground underline-offset-4 outline-none hover:underline focus-visible:shadow-focus-ring';

const stay = (event: MouseEvent) => event.preventDefault();

const LANGUAGES = [
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'nb-NO', label: 'Norsk bokmål' },
  { value: 'de-DE', label: 'Deutsch' },
];
const UNIT_SYSTEMS = [
  { value: 'metric', label: 'Metric (barg, °C, m³/h)' },
  { value: 'imperial', label: 'Imperial (psig, °F, bbl/d)' },
];
const TIME_ZONES = [
  { value: 'plant', label: 'Plant time (Europe/Oslo)' },
  { value: 'browser', label: 'This device' },
  { value: 'utc', label: 'UTC' },
];
const THEMES = [
  { value: 'system', label: 'Match system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

type Membership = { id: string; team: string; site: string; role: MemberRole; memberIds: readonly string[] };

const MEMBERSHIPS: readonly Membership[] = [
  { id: 'rot', team: 'Rotating equipment', site: 'Nordkapp', role: 'admin', memberIds: ['ak', 'tb', 'ms'] },
  { id: 'maint', team: 'Maintenance planning', site: 'Nordkapp', role: 'editor', memberIds: ['ms', 'ak', 'jn', 'tb', 'lw'] },
  { id: 'rel', team: 'Reliability forum', site: 'All sites', role: 'viewer', memberIds: ['ak', 'lw', 'ih', 'jn', 'ms', 'tb'] },
];

const ACTIVITY = [
  { id: 'a1', text: 'Closed WO-104431, partial stroke test', at: REFERENCE_NOW - 3 * HOUR },
  { id: 'a2', text: 'Commented on the 23-KA-9103 trip review', at: REFERENCE_NOW - 26 * HOUR },
  { id: 'a3', text: 'Updated the vibration limits for 23-KA-9101', at: REFERENCE_NOW - 3 * DAY },
];

const COMPLETENESS = [
  { id: 'photo', label: 'Add a profile photo', done: false },
  { id: 'phone', label: 'Add a phone number', done: true },
  { id: 'team', label: 'Join a team', done: true },
  { id: 'mfa', label: 'Turn on two-factor authentication', done: true },
  { id: 'oncall', label: 'Set your on-call contact', done: false },
];

const IDENTITIES = [
  { id: 'sso', name: 'Single sign-on', detail: 'Managed by your organisation', icon: IconKey, connected: true, primary: true },
  { id: 'totp', name: 'Authenticator app', detail: 'Added 4 Mar', icon: IconShieldLock, connected: true, primary: false },
  { id: 'historian', name: 'Plant historian account', detail: 'Not connected', icon: IconLock, connected: false, primary: false },
];

const API_REQUESTS = makeValues({ seed: 71, points: 30, base: 4200, amplitude: 1400, noise: 500 });
const NUMBER = new Intl.NumberFormat('en-GB');

function membersOf(ids: readonly string[]) {
  return PEOPLE.filter((person) => ids.includes(person.id));
}

function ProfileAccountHeader() {
  return (
    <div className="flex w-full flex-wrap items-start gap-4">
      <PersonAvatar name={AISHA.name} colorKey={AISHA.id} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xl font-semibold tracking-tight text-base-foreground">{AISHA.name}</h3>
          <RoleBadge role="admin" />
        </div>
        <p className="text-sm text-muted-foreground">{AISHA.role} · Rotating equipment, Nordkapp</p>
        <MetadataList
          layout="inline"
          items={[
            { label: 'Email', value: AISHA_EMAIL },
            { label: 'Phone', value: <span className="tabular-nums">{AISHA_PHONE}</span> },
            { label: 'Local time', value: <span className="tabular-nums">{formatTime(REFERENCE_NOW + HOUR)}</span> },
          ]}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          <IconMessage /> Send message
        </Button>
        <Button variant="outline" size="sm">
          <IconPencil /> Edit profile
        </Button>
      </div>
    </div>
  );
}

function ProfileAccountCompactCard() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderStart>
          <PersonAvatar name={MAGNUS.name} colorKey={MAGNUS.id} />
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h4">{MAGNUS.name}</CardTitle>
          <CardDescription>{MAGNUS.role}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <MetadataList
          items={[
            { label: 'Team', value: 'Maintenance planning' },
            { label: 'Site', value: 'Nordkapp' },
            { label: 'Email', value: emailOf(MAGNUS.name) },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function ProfileAccountHoverSummary() {
  return (
    <p className="max-w-xs text-sm text-base-foreground">
      Bearing inspection assigned to{' '}
      <HoverCard>
        <HoverCardTrigger render={<a href="#profile" className={LINK} onClick={stay} />}>{TOMAS.name}</HoverCardTrigger>
        <HoverCardContent>
          <div className="flex items-start gap-3">
            <PersonAvatar name={TOMAS.name} colorKey={TOMAS.id} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-base-foreground">{TOMAS.name}</p>
              <p className="text-sm text-muted-foreground">{TOMAS.role}</p>
              <p className="pt-2 text-xs text-muted-foreground">On shift until 19:00 · Nordkapp</p>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>{' '}
      for the day shift.
    </p>
  );
}

function ProfileAccountContactCard() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderStart>
          <PersonAvatar name={LIV.name} colorKey={LIV.id} />
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h4">{LIV.name}</CardTitle>
          <CardDescription>{LIV.role}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">Prefers a call during shift</span>
        </CardFooterStart>
        <CardFooterEnd>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label={`Call ${LIV.name}`}>
                    <IconPhone />
                  </Button>
                }
              />
              <TooltipContent>Call {LIV.name}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label={`Email ${LIV.name}`}>
                    <IconMail />
                  </Button>
                }
              />
              <TooltipContent>Email {LIV.name}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button variant="ghost" size="icon-sm" aria-label={`Message ${LIV.name}`}>
                    <IconMessage />
                  </Button>
                }
              />
              <TooltipContent>Message {LIV.name}</TooltipContent>
            </Tooltip>
          </div>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function ProfileAccountAvatarUpload() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3">
        <PersonAvatar name={JONAS.name} colorKey={JONAS.id} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-base-foreground">Profile photo</p>
          <p className="text-xs text-muted-foreground">Your initials are shown until you add one.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          <IconUpload /> Upload photo
        </Button>
        <Button variant="ghost" size="sm" disabled>
          Remove
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">JPG or PNG, up to 2 MB. Nothing to remove yet.</p>
    </div>
  );
}

function ProfileAccountOnCallStatus() {
  const [onCall, setOnCall] = useState(true);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex items-center gap-3">
        <PersonAvatar name={LIV.name} colorKey={LIV.id} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-base-foreground">{LIV.name}</p>
          <p className="text-xs tabular-nums text-muted-foreground">Day shift · 07:00 to 19:00</p>
        </div>
        <Badge variant="success">
          <IconCheck aria-hidden="true" />
          On shift
        </Badge>
      </div>
      <SettingSwitchRow
        label="On call for gas compression"
        description={onCall ? 'Critical alarms page you until 19:00.' : 'Critical alarms go to the control room only.'}
        checked={onCall}
        onCheckedChange={setOnCall}
      />
    </div>
  );
}

function ProfileAccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" aria-label={`Account menu for ${INGRID.name}`}>
            <PersonAvatar name={INGRID.name} colorKey={INGRID.id} sizes="xsm" />
            <IconChevronDown />
          </Button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuHeader>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-base-foreground">{INGRID.name}</p>
            <p className="truncate text-xs text-muted-foreground">{emailOf(INGRID.name)}</p>
          </div>
        </DropdownMenuHeader>
        <DropdownMenuSeparator />
        <DropdownMenuItem>View profile</DropdownMenuItem>
        <DropdownMenuItem>Preferences</DropdownMenuItem>
        <DropdownMenuItem>Notification settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Switch project</DropdownMenuItem>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProfileAccountEditForm() {
  const [name, setName] = useState(AISHA.name);
  const dirty = name !== AISHA.name;

  return (
    <form className="flex w-full max-w-md flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <FormField label="Full name" required error={name.trim() === '' ? 'Enter your name.' : undefined}>
        {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
      </FormField>
      <FormField label="Job title">{(control) => <Input {...control} defaultValue={AISHA.role} />}</FormField>
      <FormField label="Phone" optional helper="Shown to your teams, and used for on-call pages.">
        {(control) => <Input {...control} type="tel" defaultValue={AISHA_PHONE} />}
      </FormField>
      <FormField label="About" optional>
        {(control) => (
          <Textarea {...control} rows={2} defaultValue="Compressors and turbines on Nordkapp. Ask me about vibration." />
        )}
      </FormField>
      <FormActions status={dirty ? 'Unsaved changes' : undefined}>
        <Button type="button" variant="ghost" disabled={!dirty} onClick={() => setName(AISHA.name)}>
          Discard
        </Button>
        <Button type="submit" disabled={name.trim() === ''}>
          Save profile
        </Button>
      </FormActions>
    </form>
  );
}

function ProfileAccountPreferences() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <FormField label="Language">
        {(control) => (
          <Select items={LANGUAGES} defaultValue="en-GB">
            <SelectTrigger id={control.id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <FormField label="Units" helper="Applies to readouts and charts. Stored values are not converted.">
        {(control) => (
          <Select items={UNIT_SYSTEMS} defaultValue="metric">
            <SelectTrigger id={control.id} aria-describedby={control['aria-describedby']}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_SYSTEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <FormField label="Time zone" helper="Plant time keeps alarms and shift logs aligned for everyone.">
        {(control) => (
          <Select items={TIME_ZONES} defaultValue="plant">
            <SelectTrigger id={control.id} aria-describedby={control['aria-describedby']}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_ZONES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <FormField label="Theme">
        {(control) => (
          <Select items={THEMES} defaultValue="system">
            <SelectTrigger id={control.id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {THEMES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
    </div>
  );
}

function ProfileAccountNotificationSummary() {
  const [critical, setCritical] = useState(true);
  const [assigned, setAssigned] = useState(true);
  const [digest, setDigest] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col">
      <div className="flex items-center justify-between gap-3 pb-1">
        <h3 className="text-sm font-medium text-base-foreground">Notifications</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {[critical, assigned, digest].filter(Boolean).length + 1} of 4 on
        </span>
      </div>
      <div className="flex flex-col divide-y divide-default">
        <SettingSwitchRow
          label="Trips and shutdowns"
          checked
          onCheckedChange={() => undefined}
          disabledReason="Always on for control room operators."
        />
        <SettingSwitchRow
          label="Critical alarms on my assets"
          description="Push and email, at once."
          checked={critical}
          onCheckedChange={setCritical}
        />
        <SettingSwitchRow
          label="Work orders assigned to me"
          description="In the app only."
          checked={assigned}
          onCheckedChange={setAssigned}
        />
        <SettingSwitchRow
          label="Weekly reliability digest"
          description="Email, Mondays at 07:00."
          checked={digest}
          onCheckedChange={setDigest}
        />
      </div>
    </div>
  );
}

function ProfileAccountConnectedIdentities() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <h3 className="text-sm font-medium text-base-foreground">Connected identities</h3>
      <ul className="flex flex-col divide-y divide-default">
        {IDENTITIES.map((identity) => (
          <li key={identity.id} className="flex min-h-14 items-center gap-3 py-2">
            <identity.icon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-base-foreground">
                <span className="truncate">{identity.name}</span>
                {identity.primary ? <Badge variant="secondary">Sign-in method</Badge> : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">{identity.detail}</p>
            </div>
            {identity.primary ? null : identity.connected ? (
              <Button variant="ghost" size="sm">
                Disconnect
              </Button>
            ) : (
              <Button variant="secondary" size="sm">
                Connect
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileAccountActivitySummary() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <dl className="grid grid-cols-3 gap-4">
        <div>
          <dt className="text-xs text-muted-foreground">Work orders closed</dt>
          <dd className="text-2xl font-semibold tabular-nums text-base-foreground">14</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Alarms acknowledged</dt>
          <dd className="text-2xl font-semibold tabular-nums text-base-foreground">37</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Comments written</dt>
          <dd className="text-2xl font-semibold tabular-nums text-base-foreground">9</dd>
        </div>
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-medium tabular-nums text-muted-foreground">
          Last 7 days · Signed in {formatAgo(REFERENCE_NOW - 42 * MINUTE)}
        </h3>
        <ul className="flex flex-col gap-2">
          {ACTIVITY.map((entry) => (
            <li key={entry.id} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0 truncate text-base-foreground">{entry.text}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(entry.at)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProfileAccountTeamMemberships() {
  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Teams</h3>
        <span className="text-xs tabular-nums text-muted-foreground">{MEMBERSHIPS.length} memberships</span>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {MEMBERSHIPS.map((membership) => (
          <li key={membership.id} className="flex min-h-14 items-center gap-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-base-foreground">{membership.team}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {membership.site} · {membership.memberIds.length} members
              </p>
            </div>
            <AvatarGroup people={membersOf(membership.memberIds)} max={3} sizes="xsm" label={`Members of ${membership.team}`} />
            <RoleBadge role={membership.role} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileAccountCompleteness() {
  const done = COMPLETENESS.filter((step) => step.done).length;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <LabelledProgress
        label="Profile completeness"
        value={done}
        max={COMPLETENESS.length}
        valueText={`${done} of ${COMPLETENESS.length} done`}
      />
      <ul className="flex flex-col gap-1">
        {COMPLETENESS.map((step) => (
          <li key={step.id} className="flex min-h-7 items-center gap-2 text-sm">
            {step.done ? (
              <IconCheck aria-hidden="true" className="size-4 shrink-0 text-success-foreground-strong" />
            ) : (
              <IconCircle aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={step.done ? 'text-muted-foreground' : 'text-base-foreground'}>{step.label}</span>
            <span className="sr-only">{step.done ? ', done' : ', to do'}</span>
            {step.done ? null : (
              <Button variant="ghost" size="sm" className="ml-auto">
                Add
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProfileAccountApiUsage() {
  const total = API_REQUESTS.reduce((sum, value) => sum + value, 0);
  const quota = 250_000;

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Your API requests, last 30 days</p>
          <p className="text-2xl font-semibold tabular-nums text-base-foreground">{NUMBER.format(Math.round(total))}</p>
        </div>
        <div className="w-40">
          <Sparkline values={API_REQUESTS} label="Your API requests per day, last 30 days" variant="bar" height={36} decimals={0} />
        </div>
      </div>
      <LabelledProgress
        label="Monthly personal quota"
        value={Math.round(total)}
        max={quota}
        valueText={`${Math.round((total / quota) * 100)}% of ${NUMBER.format(quota)}`}
        hint="Resets on 1 April. Requests from service accounts are not counted here."
        size="sm"
      />
    </div>
  );
}

function ProfileAccountManagedFields() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Alert variant="info" alertStyle="strip">
        <AlertDescription>Name and email come from your organisation&apos;s directory.</AlertDescription>
      </Alert>
      <FormField label="Full name" helper="Ask your administrator to change it in the directory.">
        {(control) => <Input {...control} readOnly defaultValue={AISHA.name} />}
      </FormField>
      <FormField label="Email address">{(control) => <Input {...control} readOnly defaultValue={AISHA_EMAIL} />}</FormField>
      <FormField label="Phone" optional>
        {(control) => <Input {...control} type="tel" defaultValue={AISHA_PHONE} />}
      </FormField>
    </div>
  );
}

function ProfileAccountDeleteDangerZone() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-base-foreground">Delete account</h3>
        <p className="text-sm text-muted-foreground">
          Removes your profile, preferences and personal API keys. Work orders and comments stay, shown as written by
          a former member.
        </p>
      </div>
      <Alert variant="warning">
        <AlertTitle>You own 2 teams</AlertTitle>
        <AlertDescription>Transfer Rotating equipment and Reliability forum before you delete the account.</AlertDescription>
      </Alert>
      <div>
        <Button variant="destructive" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete your account?"
        description="This cannot be undone. Type your email address to confirm."
        confirmLabel="Delete account"
        confirmText={AISHA_EMAIL}
        destructive
        onConfirm={() => undefined}
      />
    </div>
  );
}

function ProfileAccountDeactivated() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderStart>
          <Avatar variant="overflow" aria-hidden="true">
            <AvatarFallback>ND</AvatarFallback>
          </Avatar>
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h4">Nora Dahl</CardTitle>
          <CardDescription>Process engineer</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          <Badge variant="archived">
            <IconBan aria-hidden="true" />
            Deactivated
          </Badge>
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Left on {formatDate(REFERENCE_NOW - 40 * DAY)}. Their work orders and comments are kept.
        </p>
      </CardContent>
    </Card>
  );
}

function ProfileAccountLoading() {
  return (
    <div role="status" aria-label="Loading profile" className="flex w-full max-w-xs flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function ProfileAccountSparse() {
  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderStart>
          <PersonAvatar name="Nora Dahl" colorKey="nd" />
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h4">Nora Dahl</CardTitle>
          <CardDescription>Joined {formatAgo(REFERENCE_NOW - 2 * DAY)}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardContent>
        <MetadataList
          emptyValue="Not set"
          items={[{ label: 'Job title' }, { label: 'Team' }, { label: 'Phone' }, { label: 'Email', value: emailOf('Nora Dahl') }]}
        />
      </CardContent>
    </Card>
  );
}

function ProfileAccountSidePanel() {
  return (
    <div className="flex h-112 w-full max-w-xs flex-col gap-4 overflow-y-auto rounded-xl border border-default bg-card-background p-4">
      <div className="flex items-center gap-3">
        <PersonAvatar name={TOMAS.name} colorKey={TOMAS.id} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-base-foreground">{TOMAS.name}</p>
          <p className="truncate text-xs text-muted-foreground">{TOMAS.role}</p>
        </div>
        <Badge variant="success">
          <IconCheck aria-hidden="true" />
          On shift
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="flex-1">
          <IconMessage /> Message
        </Button>
        <Button variant="secondary" size="sm" className="flex-1">
          <IconPhone /> Call
        </Button>
      </div>
      <MetadataList
        items={[
          { label: 'Team', value: 'Rotating equipment' },
          { label: 'Site', value: 'Nordkapp' },
          { label: 'Shift', value: 'Day, until 19:00' },
          { label: 'Email', value: emailOf(TOMAS.name) },
          { label: 'Certified until', value: formatDate(REFERENCE_NOW + 140 * DAY) },
        ]}
      />
      <div className="flex flex-col gap-2 border-t border-default pt-4">
        <h3 className="text-xs font-medium text-muted-foreground">Working on</h3>
        <p className="text-sm text-base-foreground">Inspect recompressor drive-end bearing</p>
        <p className="font-mono text-xs text-muted-foreground">WO-104482 · 23-KA-9103</p>
        <Progress value={35} size="sm" aria-label="Work order progress" aria-valuetext="35% done" />
      </div>
    </div>
  );
}

function ProfileAccountProfilePage() {
  return (
    <div className="flex h-112 w-full flex-col gap-6 overflow-y-auto rounded-xl border border-default bg-base-background p-6">
      <div className="flex flex-wrap items-start gap-4">
        <PersonAvatar name={AISHA.name} colorKey={AISHA.id} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold tracking-tight text-base-foreground">{AISHA.name}</h3>
            <RoleBadge role="admin" />
          </div>
          <p className="text-sm text-muted-foreground">{AISHA.role} · Rotating equipment, Nordkapp</p>
        </div>
        <Button variant="outline" size="sm">
          <IconPencil /> Edit profile
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Contact</h4>
          <MetadataList
            items={[
              { label: 'Email', value: AISHA_EMAIL },
              { label: 'Phone', value: <span className="tabular-nums">{AISHA_PHONE}</span> },
              { label: 'Time zone', value: 'Europe/Oslo' },
              { label: 'Language', value: 'English' },
            ]}
          />
        </section>
        <section className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-muted-foreground">Teams</h4>
          <ul className="flex flex-col gap-2">
            {MEMBERSHIPS.map((membership) => (
              <li key={membership.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-base-foreground">{membership.team}</span>
                <RoleBadge role={membership.role} />
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="flex flex-col gap-3 border-t border-default pt-4">
        <h4 className="text-xs font-medium text-muted-foreground">Recent activity</h4>
        <ul className="flex flex-col gap-2">
          {ACTIVITY.map((entry) => (
            <li key={entry.id} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="min-w-0 truncate text-base-foreground">{entry.text}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{formatAgo(entry.at)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default definePage({
  id: 'profiles-and-accounts',
  title: 'Profiles and accounts',
  summary:
    'How a person appears across the product and how they manage their own account: profile headers and cards, contact and shift status, preferences, connected identities and the danger zone.',
  guidance: {
    use: [
      'The same avatar colour, name and role wherever a person appears.',
      'A profile sized to the question: hover summary to identify, card to contact, page to manage.',
      'Shift and on-call status next to the name when people decide who to call.',
      'Preferences that save on change, and say what they affect.',
    ],
    avoid: [
      'Editable fields for values the organisation directory owns.',
      'Empty profile fields that look like rendering bugs; say "Not set".',
      'Destructive account actions next to everyday ones.',
      'Personal contact details in places the whole organisation can see.',
    ],
  },
  source,
  sections: [
    {
      id: 'identity',
      title: 'Identity',
      description: 'A person at four sizes, from a hover on their name to the header of their profile.',
      specimens: [
        {
          id: 'ProfileAccountHeader',
          title: 'Profile header',
          note: 'The top of a profile page: who they are, where they work, how to reach them.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx', 'display/MetadataList.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: ProfileAccountHeader,
        },
        {
          id: 'ProfileAccountCompactCard',
          title: 'Compact profile card',
          note: 'A person in a grid or a side column, with the three facts that place them.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'display/MetadataList.tsx'],
          Component: ProfileAccountCompactCard,
        },
        {
          id: 'ProfileAccountHoverSummary',
          title: 'Hover summary',
          note: 'A name in running text or a table, when people need to check who it is without leaving.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: ProfileAccountHoverSummary,
        },
        {
          id: 'ProfileAccountContactCard',
          title: 'Contact card with actions',
          note: 'When the next step is to reach the person: call, email or message from the card.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: ProfileAccountContactCard,
        },
        {
          id: 'ProfileAccountAvatarUpload',
          title: 'Avatar upload',
          note: 'Profile settings before a photo exists: the initials fallback is shown as the current state.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: ProfileAccountAvatarUpload,
        },
        {
          id: 'ProfileAccountOnCallStatus',
          title: 'Shift and on-call status',
          note: 'Operations teams, where whether someone is on shift decides who gets paged.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'forms/SettingSwitchRow.tsx'],
          Component: ProfileAccountOnCallStatus,
        },
        {
          id: 'ProfileAccountMenu',
          title: 'Account menu',
          note: 'The avatar in the top bar: identity first, then profile, preferences and sign-out.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: ProfileAccountMenu,
        },
      ],
    },
    {
      id: 'settings',
      title: 'Account settings',
      description: 'What people change about themselves, one concern per block.',
      specimens: [
        {
          id: 'ProfileAccountEditForm',
          title: 'Edit profile form',
          note: 'The fields a person owns, with an unsaved-changes status and a way to discard.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: ProfileAccountEditForm,
        },
        {
          id: 'ProfileAccountPreferences',
          title: 'Preferences',
          note: 'Language, units, time zone and theme: each saves on change and says what it affects.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: ProfileAccountPreferences,
        },
        {
          id: 'ProfileAccountNotificationSummary',
          title: 'Notification preferences',
          note: 'A short list of what reaches the person and how, with mandatory ones locked and explained.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SettingSwitchRow.tsx'],
          Component: ProfileAccountNotificationSummary,
        },
        {
          id: 'ProfileAccountConnectedIdentities',
          title: 'Connected identities',
          note: 'The sign-in methods and linked accounts behind one profile, and which the organisation controls.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ProfileAccountConnectedIdentities,
        },
      ],
    },
    {
      id: 'activity-and-membership',
      title: 'Activity and membership',
      description: 'What the person has done, where they belong and how much they use.',
      specimens: [
        {
          id: 'ProfileAccountActivitySummary',
          title: 'Activity summary',
          note: 'A profile page section: three counts for the period and the latest things they did.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: ProfileAccountActivitySummary,
        },
        {
          id: 'ProfileAccountTeamMemberships',
          title: 'Team memberships',
          note: 'Every team the person is in, with their role in each and who else is there.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/AvatarGroup.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: ProfileAccountTeamMemberships,
        },
        {
          id: 'ProfileAccountCompleteness',
          title: 'Profile completeness',
          note: 'A new account: what is still missing, with the action beside each open item.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: ProfileAccountCompleteness,
        },
        {
          id: 'ProfileAccountApiUsage',
          title: 'Personal API usage',
          note: 'People who script against the API: their own request volume against their own quota.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['industrial/Sparkline.tsx', 'feedback/LabelledProgress.tsx'],
          Component: ProfileAccountApiUsage,
        },
      ],
    },
    {
      id: 'states',
      title: 'States and limits',
      description: 'Fields the person cannot change, accounts that are gone, and profiles that are not complete.',
      specimens: [
        {
          id: 'ProfileAccountManagedFields',
          title: 'Directory-managed fields',
          note: 'Name and email come from the identity provider: read-only, with who can change them.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: ProfileAccountManagedFields,
        },
        {
          id: 'ProfileAccountDeleteDangerZone',
          title: 'Delete account',
          note: 'The last block of account settings: what is lost, what blocks it, and a typed confirmation.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['overlays/ConfirmDialog.tsx'],
          Component: ProfileAccountDeleteDangerZone,
        },
        {
          id: 'ProfileAccountDeactivated',
          title: 'Deactivated profile',
          note: 'Someone who has left: neutral avatar, a clear tag, and what happened to their work.',
          origin: 'custom',
          Component: ProfileAccountDeactivated,
        },
        {
          id: 'ProfileAccountSparse',
          title: 'Sparse profile',
          note: 'A new joiner with little filled in: missing fields say "Not set" instead of disappearing.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'display/MetadataList.tsx'],
          Component: ProfileAccountSparse,
        },
        {
          id: 'ProfileAccountLoading',
          title: 'Loading profile',
          note: 'While a profile card loads: a skeleton in the shape of the avatar, name and details.',
          origin: 'custom',
          Component: ProfileAccountLoading,
        },
      ],
    },
    {
      id: 'blocks',
      title: 'Full blocks',
      description: 'The pieces assembled into a side panel and a profile page.',
      specimens: [
        {
          id: 'ProfileAccountSidePanel',
          title: 'Profile side panel',
          note: 'Opened from a work order or roster: who they are, how to reach them, what they are working on.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx', 'display/MetadataList.tsx'],
          Component: ProfileAccountSidePanel,
        },
        {
          id: 'ProfileAccountProfilePage',
          title: 'Profile page',
          note: 'The full profile: header, contact and teams side by side, then recent activity.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx', 'display/MetadataList.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: ProfileAccountProfilePage,
        },
      ],
    },
  ],
});
