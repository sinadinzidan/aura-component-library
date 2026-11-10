import { Alert, AlertActions, AlertButton, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
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
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from '@cognite/aura/components/empty-state';
import { Input } from '@cognite/aura/components/input';
import { ItemGroup } from '@cognite/aura/components/item';
import { Label } from '@cognite/aura/components/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@cognite/aura/components/select';
import { Switch } from '@cognite/aura/components/switch';
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import {
  IconArrowRight,
  IconBulb,
  IconCheck,
  IconDatabase,
  IconLock,
  IconMinus,
  IconShare,
  IconUsersGroup,
} from '@cognite/aura/icons';
import { useState } from 'react';

import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { ChoiceCardGroup } from '../../../library/forms/ChoiceCardGroup';
import { FormField } from '../../../library/forms/FormField';
import { MultiSelectCombobox } from '../../../library/forms/MultiSelectCombobox';
import { SelectAllCheckboxList } from '../../../library/forms/SelectAllCheckboxList';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { CapabilityMatrix } from '../../../library/patterns/people/CapabilityMatrix';
import { ExpiryBadge } from '../../../library/patterns/people/ExpiryBadge';
import { MemberRow } from '../../../library/patterns/people/MemberRow';
import { RoleBadge } from '../../../library/patterns/people/RoleBadge';
import type { MemberRole } from '../../../library/patterns/people/RoleBadge';
import { RoleSelect } from '../../../library/patterns/people/RoleSelect';
import { PEOPLE } from '../../data/plant';
import { DAY, HOUR, REFERENCE_NOW, formatAgo, formatDateTime } from '../../data/series';
import { definePage } from '../../types';

import source from './permissions-and-roles.tsx?raw';

const [INGRID, MAGNUS, AISHA, TOMAS, LIV, JONAS] = PEOPLE;

/** Work address in the plant's own fictional domain. */
function emailOf(name: string): string {
  const plain = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return `${plain.split(/\s+/).join('.')}@nordkapp.example`;
}

const MATRIX_ROLES = [
  { id: 'viewer', label: 'Viewer' },
  { id: 'editor', label: 'Editor' },
  { id: 'admin', label: 'Admin' },
];

const CAPABILITY_GROUPS = [
  {
    label: 'Data',
    capabilities: [
      { id: 'ts:read', label: 'Read time series and assets' },
      { id: 'ts:write', label: 'Write time series', description: 'Create, correct and delete data points' },
      { id: 'dash:edit', label: 'Edit dashboards' },
    ],
  },
  {
    label: 'Operations',
    capabilities: [
      { id: 'alarm:ack', label: 'Acknowledge alarms' },
      { id: 'wo:create', label: 'Create work orders' },
      { id: 'wo:approve', label: 'Approve work orders', description: 'Release work to the field' },
    ],
  },
  {
    label: 'Administration',
    capabilities: [
      { id: 'member:manage', label: 'Manage members and teams' },
      { id: 'key:manage', label: 'Manage API keys' },
    ],
  },
];

const ALL_CAPABILITIES = CAPABILITY_GROUPS.flatMap((group) => group.capabilities.map((capability) => capability.id));

const GRANTS: Record<string, readonly string[]> = {
  viewer: ['ts:read'],
  editor: ['ts:read', 'ts:write', 'dash:edit', 'alarm:ack', 'wo:create'],
  admin: ALL_CAPABILITIES,
};

const ROLE_CARDS: readonly { role: MemberRole; summary: string; can: readonly string[]; cannot: string; members: number }[] = [
  {
    role: 'viewer',
    summary: 'For people who follow the plant but do not change it.',
    can: ['Read time series, assets and dashboards', 'Export what they can see'],
    cannot: 'Cannot acknowledge alarms or change data',
    members: 14,
  },
  {
    role: 'editor',
    summary: 'For engineers and operators doing the daily work.',
    can: ['Everything a viewer can', 'Edit dashboards and write time series', 'Acknowledge alarms, create work orders'],
    cannot: 'Cannot approve work orders or manage members',
    members: 7,
  },
  {
    role: 'admin',
    summary: 'For the few who run the project.',
    can: ['Everything an editor can', 'Approve work orders', 'Manage members, teams and API keys'],
    cannot: 'Cannot delete the project or transfer ownership',
    members: 2,
  },
];

const ROLE_CHOICES = [
  { value: 'viewer', label: 'Viewer', description: 'Read data and dashboards. Changes nothing.', tag: 'Default' },
  { value: 'editor', label: 'Editor', description: 'Edit dashboards, write data, acknowledge alarms.' },
  { value: 'admin', label: 'Admin', disabledReason: 'Only the owner can make someone an admin.' },
];

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', description: 'Read only' },
  { value: 'editor', label: 'Editor', description: 'Read and change' },
  { value: 'admin', label: 'Admin', description: 'Change and manage access' },
];

const ACCESS_LEVELS = [
  { value: 'view', label: 'Can view' },
  { value: 'edit', label: 'Can edit' },
];

const SHARE_PEOPLE = PEOPLE.map((person) => ({ value: person.id, label: person.name }));

const DATA_SETS = [
  { id: 'ds1', name: 'Compressor telemetry', count: '1,284 time series', access: 'editor' },
  { id: 'ds2', name: 'Maintenance history', count: '9,412 work orders', access: 'viewer' },
  { id: 'ds3', name: 'Process safety events', count: '318 events', access: 'none' },
];
const DATA_SET_ACCESS = [
  { value: 'none', label: 'No access', description: 'Hidden from this group' },
  { value: 'viewer', label: 'Viewer', description: 'Read only' },
  { value: 'editor', label: 'Editor', description: 'Read and write' },
];

const GROUP_MAPPING = [
  { id: 'g1', group: 'nk-control-room', members: 18, role: 'editor', scope: 'Whole project' },
  { id: 'g2', group: 'nk-rotating-equipment', members: 6, role: 'editor', scope: 'Compressor telemetry' },
  { id: 'g3', group: 'nk-all-staff', members: 212, role: 'viewer', scope: 'Whole project' },
  { id: 'g4', group: 'ext-turbotech-service', members: 3, role: 'viewer', scope: 'Compressor telemetry' },
] as const;

const AUDIT = [
  { id: 'e1', actor: LIV.name, text: 'made Aisha Khan an admin', from: 'Editor', to: 'Admin', at: REFERENCE_NOW - 2 * HOUR },
  { id: 'e2', actor: AISHA.name, text: 'gave nk-rotating-equipment access to Compressor telemetry', from: 'No access', to: 'Editor', at: REFERENCE_NOW - 26 * HOUR },
  { id: 'e3', actor: 'System', text: 'removed temporary access for Sofia Lind', from: 'Viewer', to: 'No access', at: REFERENCE_NOW - 3 * DAY },
  { id: 'e4', actor: LIV.name, text: 'suspended Jonas Nyberg', from: 'Viewer', to: 'Suspended', at: REFERENCE_NOW - 9 * DAY },
];

const TEMPORARY = [
  { id: 't1', name: 'Sofia Lind', detail: 'TurboTech · Turbine overhaul', role: 'viewer', expiresAt: REFERENCE_NOW + 5 * DAY },
  { id: 't2', name: TOMAS.name, detail: 'Covering for the shift supervisor', role: 'admin', expiresAt: REFERENCE_NOW + 40 * DAY },
  { id: 't3', name: 'Erik Moen', detail: 'Audit, first quarter', role: 'viewer', expiresAt: REFERENCE_NOW - 2 * DAY },
] as const;

function PermissionRoleCards() {
  return (
    <div className="grid w-full gap-4 md:grid-cols-3">
      {ROLE_CARDS.map((card) => (
        <Card key={card.role}>
          <CardHeader>
            <CardHeaderCenter>
              <CardTitle as="h4">
                <RoleBadge role={card.role} />
              </CardTitle>
              <CardDescription>{card.summary}</CardDescription>
            </CardHeaderCenter>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2 text-sm text-base-foreground">
              {card.can.map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {line}
                </li>
              ))}
              <li className="flex items-start gap-2 text-muted-foreground">
                <IconMinus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {card.cannot}
              </li>
            </ul>
          </CardContent>
          <CardFooter className="mt-auto">
            <CardFooterStart>
              <span className="text-xs tabular-nums text-muted-foreground">{card.members} members</span>
            </CardFooterStart>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

function PermissionRolePicker() {
  const [role, setRole] = useState('viewer');

  return (
    <div className="w-full max-w-md">
      <ChoiceCardGroup
        label="Role for Nora Dahl"
        options={ROLE_CHOICES}
        value={role}
        onValueChange={setRole}
        helperText="You can change the role later from the member list."
      />
    </div>
  );
}

function PermissionRoleEffective() {
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-3">
        <PersonAvatar name={TOMAS.name} colorKey={TOMAS.id} sizes="xsm" />
        <p className="text-sm text-base-foreground">
          <span className="font-medium">{TOMAS.name}</span> on Compressor telemetry
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-default text-sm">
        <li className="flex min-h-9 items-center justify-between gap-3">
          <span className="text-muted-foreground">Project role</span>
          <RoleBadge role="viewer" />
        </li>
        <li className="flex min-h-9 items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-muted-foreground">
            <IconUsersGroup aria-hidden="true" className="size-4" />
            Through nk-rotating-equipment
          </span>
          <RoleBadge role="editor" />
        </li>
        <li className="flex min-h-9 items-center justify-between gap-3">
          <span className="font-medium text-base-foreground">Effective access</span>
          <span className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Highest wins</span>
            <RoleBadge role="editor" />
          </span>
        </li>
      </ul>
      <p className="text-xs text-muted-foreground">
        To lower it, remove {TOMAS.name.split(' ')[0]} from the group or change what the group can do.
      </p>
    </div>
  );
}

function PermissionRoleMatrix() {
  return <CapabilityMatrix caption="What each built-in role can do" roles={MATRIX_ROLES} groups={CAPABILITY_GROUPS} grants={GRANTS} />;
}

function PermissionRoleMatrixLegend() {
  return (
    <dl className="flex w-full max-w-xs flex-col gap-3 text-sm">
      <div className="flex items-center gap-3">
        <dt className="flex w-6 justify-center">
          <IconCheck aria-hidden="true" className="size-4 text-base-foreground" />
        </dt>
        <dd className="text-base-foreground">Allowed by the role</dd>
      </div>
      <div className="flex items-center gap-3">
        <dt className="flex w-6 justify-center">
          <IconMinus aria-hidden="true" className="size-4 text-base-foreground-disabled" />
        </dt>
        <dd className="text-base-foreground">Not allowed</dd>
      </div>
      <div className="flex items-center gap-3">
        <dt className="flex w-6 justify-center">
          <IconLock aria-hidden="true" className="size-4 text-muted-foreground" />
        </dt>
        <dd className="text-base-foreground">Fixed for built-in roles</dd>
      </div>
      <p className="text-xs text-muted-foreground">Marks, not colours: the matrix reads the same in print and for colour-blind readers.</p>
    </dl>
  );
}

function PermissionRoleMatrixEditable() {
  const [custom, setCustom] = useState<readonly string[]>(['ts:read', 'alarm:ack', 'wo:create', 'wo:approve']);
  const roles = [...MATRIX_ROLES, { id: 'supervisor', label: 'Shift supervisor' }];
  const toggle = (_roleId: string, capabilityId: string, granted: boolean) =>
    setCustom((current) => (granted ? [...current, capabilityId] : current.filter((id) => id !== capabilityId)));

  return (
    <div className="flex w-full flex-col gap-3">
      <CapabilityMatrix
        caption="Built-in roles next to the custom Shift supervisor role"
        roles={roles}
        groups={CAPABILITY_GROUPS}
        grants={{ ...GRANTS, supervisor: custom }}
        onToggle={toggle}
        lockedRoleIds={['viewer', 'editor', 'admin']}
      />
      <p className="text-xs tabular-nums text-muted-foreground">
        Shift supervisor has {custom.length} of {ALL_CAPABILITIES.length} capabilities. Built-in roles cannot be edited.
      </p>
    </div>
  );
}

function PermissionRoleCustomEditor() {
  const [name, setName] = useState('Shift supervisor');
  const [data, setData] = useState<readonly string[]>(['ts:read']);
  const [operations, setOperations] = useState<readonly string[]>(['alarm:ack', 'wo:create', 'wo:approve']);
  const total = data.length + operations.length;

  return (
    <form className="flex w-full max-w-2xl flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <FormField label="Role name" required error={name.trim() === '' ? 'Enter a role name.' : undefined}>
        {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
      </FormField>
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectAllCheckboxList
          label="Data"
          options={CAPABILITY_GROUPS[0].capabilities}
          value={data}
          onValueChange={setData}
          selectAllLabel="All data capabilities"
        />
        <SelectAllCheckboxList
          label="Operations"
          options={CAPABILITY_GROUPS[1].capabilities}
          value={operations}
          onValueChange={setOperations}
          selectAllLabel="All operations capabilities"
        />
      </div>
      <FormActions status={total === 0 ? 'Pick at least one capability.' : `${total} capabilities in this role`}>
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit" disabled={total === 0 || name.trim() === ''}>
          Save role
        </Button>
      </FormActions>
    </form>
  );
}

function PermissionRoleLeastPrivilege() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3 rounded-xl bg-muted-background p-4">
      <div className="flex items-start gap-3">
        <IconBulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-base-foreground">Editor may be more than {MAGNUS.name.split(' ')[0]} needs</p>
          <p className="text-xs text-muted-foreground">
            No dashboard or data edits in 90 days. Viewer plus “Create work orders” covers what he has used.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm">
          Review access
        </Button>
        <Button variant="ghost" size="sm">
          Dismiss
        </Button>
      </div>
    </div>
  );
}

function PermissionRoleLockedSetting() {
  return (
    <div className="flex w-full max-w-xs items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex items-center gap-2 text-sm font-medium text-base-foreground-disabled">
          <IconLock aria-hidden="true" className="size-3.5 shrink-0" />
          Require two-factor authentication
        </p>
        <p id="permission-role-locked-reason" className="text-xs text-muted-foreground">
          Set for the whole organisation. Only an organisation admin can change it.
        </p>
      </div>
      <Switch aria-label="Require two-factor authentication" aria-describedby="permission-role-locked-reason" checked disabled />
    </div>
  );
}

function PermissionRoleOwnerOnlyAction() {
  return (
    <div className="flex w-full max-w-xs flex-col items-start gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <span className="inline-flex rounded-lg outline-none focus-visible:shadow-focus-ring" tabIndex={0}>
              <Button variant="destructive" disabled aria-describedby="permission-role-owner-only">
                Delete project
              </Button>
            </span>
          }
        />
        <TooltipContent>Only the owner can delete a project</TooltipContent>
      </Tooltip>
      <p id="permission-role-owner-only" className="text-xs text-muted-foreground">
        Only the owner, {LIV.name}, can delete Nordkapp production.
      </p>
    </div>
  );
}

function PermissionRoleResourceAccessList() {
  const [roles, setRoles] = useState<Record<string, string>>({ lw: 'admin', ak: 'admin', ms: 'editor', ih: 'viewer' });
  const people = [LIV, AISHA, MAGNUS, INGRID];

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Who can open Vibration overview</h3>
        <span className="text-xs tabular-nums text-muted-foreground">{people.length} people</span>
      </div>
      <ItemGroup>
        {people.map((person) => (
          <MemberRow
            key={person.id}
            name={person.name}
            detail={emailOf(person.name)}
            colorKey={person.id}
            isYou={person.id === 'lw'}
            role={
              <div className="w-28 shrink-0">
                <RoleSelect
                  roles={ROLE_OPTIONS}
                  value={roles[person.id] ?? 'viewer'}
                  onValueChange={(next) => setRoles((current) => ({ ...current, [person.id]: next }))}
                  label={`Access for ${person.name}`}
                  lockedReason={person.id === 'lw' ? 'You cannot change your own access.' : undefined}
                />
              </div>
            }
          />
        ))}
      </ItemGroup>
    </div>
  );
}

function PermissionRoleShareDialog() {
  const [people, setPeople] = useState<string[]>(['ak']);
  const [level, setLevel] = useState('view');

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline">
            <IconShare /> Share dashboard
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Vibration overview</DialogTitle>
          <DialogDescription>People you add are notified and find it under Shared with me.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col">
            <Label htmlFor="permission-role-share-people">People</Label>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <MultiSelectCombobox
                  id="permission-role-share-people"
                  options={SHARE_PEOPLE}
                  value={people}
                  onValueChange={setPeople}
                  placeholder="Add people"
                  searchPlaceholder="Search people…"
                  emptyText="No one found."
                />
              </div>
              <div className="w-32 shrink-0">
                <Select items={ACCESS_LEVELS} value={level} onValueChange={setLevel}>
                  <SelectTrigger aria-label="Access level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESS_LEVELS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-muted-background px-3 py-2 text-sm">
            <IconUsersGroup aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 text-base-foreground">Rotating equipment already has view access</span>
            <span className="text-xs tabular-nums text-muted-foreground">4 people</span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Cancel</Button>} />
          <DialogClose render={<Button disabled={people.length === 0}>Share with {people.length || 'people'}</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionRoleDataSetScoped() {
  const [access, setAccess] = useState<Record<string, string>>(() =>
    Object.fromEntries(DATA_SETS.map((dataSet) => [dataSet.id, dataSet.access]))
  );

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium text-base-foreground">Data sets for nk-rotating-equipment</h3>
        <p className="text-xs text-muted-foreground">Access is granted per data set, never to the whole project.</p>
      </div>
      <ul className="flex flex-col divide-y divide-default">
        {DATA_SETS.map((dataSet) => (
          <li key={dataSet.id} className="flex min-h-14 items-center gap-3 py-2">
            <IconDatabase aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-base-foreground">{dataSet.name}</p>
              <p className="text-xs tabular-nums text-muted-foreground">{dataSet.count}</p>
            </div>
            <div className="w-32 shrink-0">
              <RoleSelect
                roles={DATA_SET_ACCESS}
                value={access[dataSet.id] ?? 'none'}
                onValueChange={(next) => setAccess((current) => ({ ...current, [dataSet.id]: next }))}
                label={`Access to ${dataSet.name}`}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PermissionRoleTemporaryAccess() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <h3 className="text-sm font-medium text-base-foreground">Temporary access</h3>
      <ul className="flex flex-col divide-y divide-default">
        {TEMPORARY.map((grant) => (
          <li key={grant.id} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <PersonAvatar name={grant.name} sizes="xsm" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-base-foreground">
                <span className="truncate">{grant.name}</span>
                <RoleBadge role={grant.role} />
              </p>
              <p className="truncate text-xs text-muted-foreground">{grant.detail}</p>
            </div>
            <ExpiryBadge expiresAt={grant.expiresAt} now={REFERENCE_NOW} soonWithinDays={7} showDetail />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PermissionRoleAccessRequest() {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'denied'>('pending');

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardHeaderStart>
          <PersonAvatar name={JONAS.name} colorKey={JONAS.id} />
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h4">{JONAS.name} asks for editor access</CardTitle>
          <CardDescription>Compressor telemetry · Requested {formatAgo(REFERENCE_NOW - 50 * 60_000)}</CardDescription>
        </CardHeaderCenter>
        <CardHeaderEnd>
          {decision === 'approved' ? <Badge variant="success">Approved</Badge> : null}
          {decision === 'denied' ? <Badge variant="archived">Denied</Badge> : null}
        </CardHeaderEnd>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-base-foreground">
          “I need to correct the calibration offset on 40-TT-4012 after replacing the transmitter (WO-104479).”
        </p>
      </CardContent>
      <CardFooter>
        <CardFooterStart>
          <span className="text-xs text-muted-foreground">
            {decision === 'pending' ? 'Currently a viewer' : 'Jonas is notified of your decision.'}
          </span>
        </CardFooterStart>
        <CardFooterEnd>
          {decision === 'pending' ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDecision('denied')}>
                Deny
              </Button>
              <Button size="sm" onClick={() => setDecision('approved')}>
                Approve for 7 days
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setDecision('pending')}>
              Undo
            </Button>
          )}
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function PermissionRoleRequestForm() {
  const [sent, setSent] = useState(false);

  return sent ? (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="info">
        <AlertTitle>Request sent to {LIV.name}</AlertTitle>
        <AlertDescription>You will be notified when it is approved or denied. Most requests are answered within a shift.</AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost" onClick={() => setSent(false)}>
            Withdraw request
          </AlertButton>
        </AlertActions>
      </Alert>
    </div>
  ) : (
    <form
      className="flex w-full max-w-md flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <p className="text-sm text-base-foreground">
        You can view <span className="font-medium">Compressor telemetry</span> but not change it.
      </p>
      <FormField label="Why do you need editor access?" helper={`Sent to the data set owner, ${LIV.name}.`}>
        {(control) => <Textarea {...control} rows={2} defaultValue="Correct the calibration offset on 40-TT-4012." />}
      </FormField>
      <div>
        <Button type="submit">Request editor access</Button>
      </div>
    </form>
  );
}

function PermissionRoleReadOnlyNotice() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Alert variant="info" alertStyle="strip" icon={<IconLock />}>
        <AlertDescription>You have view access. Ask an editor to change these limits.</AlertDescription>
      </Alert>
      <FormField label="High vibration limit" helper="mm/s, for 23-KA-9101 drive end">
        {(control) => <Input {...control} readOnly defaultValue="7.1" inputMode="decimal" />}
      </FormField>
      <FormField label="Trip limit" helper="mm/s">
        {(control) => <Input {...control} readOnly defaultValue="11.0" inputMode="decimal" />}
      </FormField>
    </div>
  );
}

function PermissionRoleNoAccessState() {
  return (
    <EmptyState type="no-access">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">You cannot open Process safety events</EmptyStateTitle>
      <EmptyStateDescription>This data set is limited to the process safety group.</EmptyStateDescription>
      <EmptyStateActions>
        <Button variant="secondary" size="sm">
          Request access
        </Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function PermissionRoleGroupMapping() {
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Directory groups and the role each one gets</caption>
      <thead>
        <tr className="border-b border-default text-left text-xs text-muted-foreground">
          <th scope="col" className="py-2 pr-4 font-medium">
            Directory group
          </th>
          <th scope="col" className="py-2 pr-4 text-right font-medium">
            Members
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Scope
          </th>
          <th scope="col" className="py-2 font-medium">
            Role
          </th>
        </tr>
      </thead>
      <tbody>
        {GROUP_MAPPING.map((row) => (
          <tr key={row.id} className="border-b border-default last:border-b-0">
            <th scope="row" className="py-2 pr-4 text-left font-mono text-sm font-normal text-base-foreground">
              {row.group}
            </th>
            <td className="py-2 pr-4 text-right tabular-nums text-base-foreground">{row.members}</td>
            <td className="py-2 pr-4 text-muted-foreground">{row.scope}</td>
            <td className="py-2">
              <RoleBadge role={row.role} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PermissionRoleAuditRows() {
  return (
    <ul className="flex w-full flex-col divide-y divide-default">
      {AUDIT.map((entry) => (
        <li key={entry.id} className="flex min-h-12 flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
          <p className="min-w-0 flex-1 text-base-foreground">
            <span className="font-medium">{entry.actor}</span> {entry.text}
          </p>
          <span className="flex w-48 shrink-0 items-center justify-end gap-2 text-xs text-muted-foreground">
            {entry.from}
            <IconArrowRight aria-hidden="true" className="size-3" />
            <span className="sr-only">changed to</span>
            <span className="font-medium text-base-foreground">{entry.to}</span>
          </span>
          <time className="w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{formatDateTime(entry.at)}</time>
        </li>
      ))}
    </ul>
  );
}

function PermissionRoleReviewReminder() {
  return (
    <div className="w-full max-w-md">
      <Alert variant="warning">
        <AlertTitle>Access review is due in 6 days</AlertTitle>
        <AlertDescription>23 members and 4 group mappings have not been confirmed since December.</AlertDescription>
        <AlertActions>
          <AlertButton>Start review</AlertButton>
          <AlertButton variant="ghost">Remind me tomorrow</AlertButton>
        </AlertActions>
      </Alert>
    </div>
  );
}

function PermissionRoleChangeImpact() {
  const [role, setRole] = useState('editor');
  const lost = GRANTS.editor.filter((id) => !(GRANTS[role] ?? []).includes(id)).length;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <div className="flex items-center gap-3">
        <PersonAvatar name={MAGNUS.name} colorKey={MAGNUS.id} sizes="xsm" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-base-foreground">{MAGNUS.name}</span>
        <div className="w-28 shrink-0">
          <RoleSelect roles={ROLE_OPTIONS} value={role} onValueChange={setRole} label={`Role for ${MAGNUS.name}`} />
        </div>
      </div>
      <div aria-live="polite" className="rounded-lg bg-muted-background p-3 text-sm">
        {role === 'editor' ? (
          <p className="text-muted-foreground">No change. Pick another role to see what it gives or takes away.</p>
        ) : role === 'viewer' ? (
          <p className="text-base-foreground">
            Loses {lost} capabilities, including writing time series and acknowledging alarms. 3 dashboards he owns
            stay his.
          </p>
        ) : (
          <p className="text-base-foreground">
            Gains {GRANTS.admin.length - GRANTS.editor.length} capabilities: approving work orders, managing members
            and API keys.
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={role === 'editor'}>
          Apply change
        </Button>
        <Button variant="ghost" size="sm" disabled={role === 'editor'} onClick={() => setRole('editor')}>
          Reset
        </Button>
      </div>
    </div>
  );
}

function PermissionRoleAccessPanel() {
  const [roles, setRoles] = useState<Record<string, string>>({ lw: 'admin', ak: 'admin', ms: 'editor', tb: 'editor', ih: 'viewer' });
  const people = [LIV, AISHA, MAGNUS, TOMAS, INGRID];

  return (
    <div className="flex h-112 w-full flex-col gap-4 overflow-y-auto rounded-xl border border-default bg-base-background p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-xl font-semibold tracking-tight text-base-foreground">Access to Compressor telemetry</h3>
          <p className="text-sm tabular-nums text-muted-foreground">Data set · 5 people and 2 groups · 1 request waiting</p>
        </div>
        <Button size="sm">
          <IconShare /> Add people or groups
        </Button>
      </div>
      <Alert variant="info" alertStyle="strip">
        <AlertDescription>{JONAS.name} asked for editor access 50 min ago.</AlertDescription>
        <AlertActions>
          <AlertButton variant="ghost">Review request</AlertButton>
        </AlertActions>
      </Alert>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-2 lg:col-span-2">
          <h4 className="text-sm font-medium text-base-foreground">People</h4>
          <ItemGroup>
            {people.map((person) => (
              <MemberRow
                key={person.id}
                name={person.name}
                detail={person.role}
                colorKey={person.id}
                isYou={person.id === 'lw'}
                role={
                  <div className="w-28 shrink-0">
                    <RoleSelect
                      roles={ROLE_OPTIONS}
                      value={roles[person.id] ?? 'viewer'}
                      onValueChange={(next) => setRoles((current) => ({ ...current, [person.id]: next }))}
                      label={`Access for ${person.name}`}
                      lockedReason={person.id === 'lw' ? 'You cannot change your own access.' : undefined}
                    />
                  </div>
                }
                actions={
                  person.id === 'lw' ? undefined : (
                    <ConfirmButton size="sm" confirmLabel="Confirm" aria-label={`Remove access for ${person.name}`} onConfirm={() => undefined}>
                      Remove
                    </ConfirmButton>
                  )
                }
              />
            ))}
          </ItemGroup>
        </section>
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium text-base-foreground">Groups</h4>
            <ul className="flex flex-col gap-2">
              {GROUP_MAPPING.filter((row) => row.scope === 'Compressor telemetry').map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-sm text-base-foreground">{row.group}</span>
                    <span className="block text-xs tabular-nums text-muted-foreground">{row.members} members</span>
                  </span>
                  <RoleBadge role={row.role} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-2 border-t border-default pt-4">
            <h4 className="text-sm font-medium text-base-foreground">Last change</h4>
            <p className="text-sm text-muted-foreground">
              {AUDIT[1].actor} {AUDIT[1].text}, {formatAgo(AUDIT[1].at)}.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default definePage({
  id: 'permissions-and-roles',
  title: 'Permissions and roles',
  summary:
    'What people are allowed to do, and how that is explained, granted, requested and reviewed: role cards and pickers, capability matrices, per-resource access, requests, and the notices shown when access stops.',
  guidance: {
    use: [
      'Roles described by what they can do, in the same words everywhere.',
      'Check and dash marks with text equivalents in every matrix.',
      'The reason and the person who can help beside anything locked or read-only.',
      'The least privileged role as the default, and an expiry on anything temporary.',
    ],
    avoid: [
      'Status colours for roles; a role is a rank, not a state.',
      'Hiding controls people cannot use without saying they exist.',
      'Role changes that apply before their effect is shown.',
      'Access that lives only on a person when a group would explain it.',
    ],
  },
  source,
  sections: [
    {
      id: 'roles',
      title: 'Roles',
      description: 'Explaining what a role is and choosing one.',
      specimens: [
        {
          id: 'PermissionRoleCards',
          title: 'Role cards',
          note: 'A roles overview: each role with who it is for, what it can do and where it stops.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/people/RoleBadge.tsx'],
          Component: PermissionRoleCards,
        },
        {
          id: 'PermissionRolePicker',
          title: 'Role picker',
          note: 'Choosing a role for one person when each option needs a sentence, and one may be out of reach.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/ChoiceCardGroup.tsx'],
          Component: PermissionRolePicker,
        },
        {
          id: 'PermissionRoleEffective',
          title: 'Effective permissions',
          note: 'Answering "why can they do that?": every source of access, then the result and the rule.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/RoleBadge.tsx', 'display/PersonAvatar.tsx'],
          Component: PermissionRoleEffective,
        },
      ],
    },
    {
      id: 'capabilities',
      title: 'Capabilities',
      description: 'Roles against capabilities, read-only and editable.',
      specimens: [
        {
          id: 'PermissionRoleMatrix',
          title: 'Capability matrix',
          note: 'Comparing built-in roles capability by capability, grouped by what they act on.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/people/CapabilityMatrix.tsx'],
          Component: PermissionRoleMatrix,
        },
        {
          id: 'PermissionRoleMatrixLegend',
          title: 'Matrix legend',
          note: 'Beside a matrix, to say once what the marks mean.',
          origin: 'custom',
          Component: PermissionRoleMatrixLegend,
        },
        {
          id: 'PermissionRoleCustomEditor',
          title: 'Custom role editor',
          note: 'Building a role from capabilities: one checkbox group per area, each with select all.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['forms/SelectAllCheckboxList.tsx', 'forms/FormField.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: PermissionRoleCustomEditor,
        },
        {
          id: 'PermissionRoleLeastPrivilege',
          title: 'Least-privilege suggestion',
          note: 'When usage shows a role is broader than needed: the evidence, the smaller role, and a review.',
          origin: 'custom',
          Component: PermissionRoleLeastPrivilege,
        },
        {
          id: 'PermissionRoleMatrixEditable',
          title: 'Editable matrix',
          note: 'Editing a custom role next to the built-in ones, which stay read-only for comparison.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/people/CapabilityMatrix.tsx'],
          Component: PermissionRoleMatrixEditable,
        },
      ],
    },
    {
      id: 'resource-access',
      title: 'Access to a resource',
      description: 'Who can open one dashboard or data set, and for how long.',
      specimens: [
        {
          id: 'PermissionRoleResourceAccessList',
          title: 'Access list with role select',
          note: 'The people on one resource, each with a role you can change, and your own row locked.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleSelect.tsx'],
          Component: PermissionRoleResourceAccessList,
        },
        {
          id: 'PermissionRoleDataSetScoped',
          title: 'Data set scoped access',
          note: 'A group with different access per data set, including none.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/RoleSelect.tsx'],
          Component: PermissionRoleDataSetScoped,
        },
        {
          id: 'PermissionRoleTemporaryAccess',
          title: 'Temporary access with expiry',
          note: 'Contractors, cover and audits: every grant states when it ends, and expired ones stay visible.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/ExpiryBadge.tsx', 'patterns/people/expiryState.ts', 'patterns/people/RoleBadge.tsx'],
          Component: PermissionRoleTemporaryAccess,
        },
        {
          id: 'PermissionRoleChangeImpact',
          title: 'Role change impact',
          note: 'Before a role change is applied: what the person gains or loses, in capabilities.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/RoleSelect.tsx', 'display/PersonAvatar.tsx'],
          Component: PermissionRoleChangeImpact,
        },
      ],
    },
    {
      id: 'requests-and-notices',
      title: 'Requests and notices',
      description: 'Asking for access, deciding on a request, and being told why something is closed.',
      specimens: [
        {
          id: 'PermissionRoleAccessRequest',
          title: 'Access request',
          note: 'The approver’s view: who asks, for what and why, with a time-boxed approval.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx'],
          Component: PermissionRoleAccessRequest,
        },
        {
          id: 'PermissionRoleRequestForm',
          title: 'Request access form',
          note: 'The requester’s view: what they have now, a reason, and who decides.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: PermissionRoleRequestForm,
        },
        {
          id: 'PermissionRoleReadOnlyNotice',
          title: 'Read-only notice',
          note: 'A form the person may see but not change: say so once at the top, and make fields read-only.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx'],
          Component: PermissionRoleReadOnlyNotice,
        },
        {
          id: 'PermissionRoleReviewReminder',
          title: 'Access review reminder',
          note: 'Periodic recertification: how much is unreviewed, the deadline, and where to start.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          Component: PermissionRoleReviewReminder,
        },
        {
          id: 'PermissionRoleShareDialog',
          title: 'Share dialog',
          note: 'Sharing one object from where it is used: people, an access level, and who already has access.',
          origin: 'custom',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: PermissionRoleShareDialog,
        },
        {
          id: 'PermissionRoleLockedSetting',
          title: 'Locked setting',
          note: 'A setting decided higher up: shown with its value, a lock, and who can change it.',
          origin: 'custom',
          Component: PermissionRoleLockedSetting,
        },
        {
          id: 'PermissionRoleOwnerOnlyAction',
          title: 'Owner-only action',
          note: 'An action the role does not allow: visible, disabled, and explained on focus and in text.',
          origin: 'custom',
          Component: PermissionRoleOwnerOnlyAction,
        },
      ],
    },
    {
      id: 'administration',
      title: 'Administration',
      description: 'Mapping groups to roles, auditing changes and managing access in one place.',
      specimens: [
        {
          id: 'PermissionRoleGroupMapping',
          title: 'Group-to-role mapping',
          note: 'Access granted through directory groups: which group, how many people, what scope, which role.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['patterns/people/RoleBadge.tsx'],
          Component: PermissionRoleGroupMapping,
        },
        {
          id: 'PermissionRoleNoAccessState',
          title: 'No access state',
          note: 'In place of content the person may not see: what it is, why, and how to ask.',
          origin: 'custom',
          Component: PermissionRoleNoAccessState,
        },
        {
          id: 'PermissionRoleAuditRows',
          title: 'Permission change audit',
          note: 'A log of who changed whose access: actor, change, before and after, and when.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          Component: PermissionRoleAuditRows,
        },
        {
          id: 'PermissionRoleAccessPanel',
          title: 'Access management panel',
          note: 'Everything about one resource’s access: a waiting request, people with roles, groups and the last change.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: [
            'patterns/people/MemberRow.tsx',
            'patterns/people/RoleSelect.tsx',
            'patterns/people/RoleBadge.tsx',
            'actions/ConfirmButton.tsx',
          ],
          Component: PermissionRoleAccessPanel,
        },
      ],
    },
  ],
});
