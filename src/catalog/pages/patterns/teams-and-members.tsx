import { Alert, AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { Avatar, AvatarIcon } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardFooterEnd,
  CardFooterStart,
  CardHeader,
  CardHeaderCenter,
  CardHeaderStart,
  CardTitle,
} from '@cognite/aura/components/card';
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
import { Textarea } from '@cognite/aura/components/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconCrown, IconMoon, IconSun, IconUserPlus, IconUsersGroup, IconWorld, IconX } from '@cognite/aura/icons';
import { useState } from 'react';

import { AsyncButton } from '../../../library/actions/AsyncButton';
import { ConfirmButton } from '../../../library/actions/ConfirmButton';
import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { LabelledProgress } from '../../../library/feedback/LabelledProgress';
import { DebouncedSearch } from '../../../library/forms/DebouncedSearch';
import { FormField } from '../../../library/forms/FormField';
import { MultiSelectCombobox } from '../../../library/forms/MultiSelectCombobox';
import { SelectAllCheckboxList } from '../../../library/forms/SelectAllCheckboxList';
import { FormActions } from '../../../library/patterns/data-entry/FormActions';
import { InviteForm } from '../../../library/patterns/people/InviteForm';
import { MemberRow } from '../../../library/patterns/people/MemberRow';
import type { MemberStatus } from '../../../library/patterns/people/MemberRow';
import { RoleBadge } from '../../../library/patterns/people/RoleBadge';
import type { MemberRole } from '../../../library/patterns/people/RoleBadge';
import { RoleSelect } from '../../../library/patterns/people/RoleSelect';
import { Table } from '../../../library/primitives/table/Table';
import { TableBody } from '../../../library/primitives/table/TableBody';
import { TableCaption } from '../../../library/primitives/table/TableCaption';
import { TableCell } from '../../../library/primitives/table/TableCell';
import { TableHead } from '../../../library/primitives/table/TableHead';
import { TableHeader } from '../../../library/primitives/table/TableHeader';
import { TableRow } from '../../../library/primitives/table/TableRow';
import { PEOPLE } from '../../data/plant';
import { DAY, HOUR, MINUTE, REFERENCE_NOW, formatAgo, formatDate } from '../../data/series';
import { definePage } from '../../types';

import source from './teams-and-members.tsx?raw';

const DOMAIN = 'nordkapp.example';

/** Work address in the plant's own fictional domain. */
function emailOf(name: string): string {
  const plain = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return `${plain.split(/\s+/).join('.')}@${DOMAIN}`;
}

type Member = {
  id: string;
  name: string;
  email: string;
  title: string;
  role: MemberRole;
  status: MemberStatus;
  external: boolean;
  lastActiveAt: number;
};

const ROLES_BY_PERSON: Record<string, MemberRole> = { lw: 'owner', ak: 'admin', ms: 'editor', tb: 'editor', ih: 'viewer', jn: 'viewer' };
const LAST_ACTIVE: Record<string, number> = { lw: 4 * MINUTE, ak: 42 * MINUTE, ms: 3 * HOUR, tb: 20 * MINUTE, ih: 2 * MINUTE, jn: 9 * DAY };

/** The plant's people as members of the Nordkapp project, plus one contractor. */
const MEMBERS: readonly Member[] = [
  ...PEOPLE.map((person) => ({
    id: person.id,
    name: person.name,
    email: emailOf(person.name),
    title: person.role,
    role: ROLES_BY_PERSON[person.id] ?? 'viewer',
    status: person.id === 'jn' ? ('suspended' as const) : ('active' as const),
    external: false,
    lastActiveAt: REFERENCE_NOW - (LAST_ACTIVE[person.id] ?? DAY),
  })),
  {
    id: 'sl',
    name: 'Sofia Lind',
    email: 'sofia.lind@turbotech.example',
    title: 'Turbine service engineer, TurboTech',
    role: 'guest',
    status: 'active',
    external: true,
    lastActiveAt: REFERENCE_NOW - 2 * DAY,
  },
];

const [INGRID, MAGNUS, AISHA, TOMAS, LIV, JONAS, SOFIA] = MEMBERS;

const ROLE_OPTIONS = [
  { value: 'viewer', label: 'Viewer', description: 'Read data and dashboards' },
  { value: 'editor', label: 'Editor', description: 'Create and change content' },
  { value: 'admin', label: 'Admin', description: 'Manage members and settings' },
];

const ROLE_LEGEND: readonly { role: MemberRole; can: string }[] = [
  { role: 'owner', can: 'Everything, including billing and deleting the project' },
  { role: 'admin', can: 'Manage members, teams and settings' },
  { role: 'editor', can: 'Create and change content' },
  { role: 'viewer', can: 'Read data and dashboards' },
  { role: 'guest', can: 'Only what is shared with them' },
];

type PendingInvite = { id: string; email: string; role: string; sentAt: number; invitedBy: string; expired?: boolean };

const INVITES: readonly PendingInvite[] = [
  { id: 'i1', email: 'nora.dahl@nordkapp.example', role: 'Editor', sentAt: REFERENCE_NOW - 2 * HOUR, invitedBy: 'Liv Wold' },
  { id: 'i2', email: 'erik.moen@nordkapp.example', role: 'Viewer', sentAt: REFERENCE_NOW - 3 * DAY, invitedBy: 'Aisha Khan' },
  { id: 'i3', email: 'p.vasquez@turbotech.example', role: 'Guest', sentAt: REFERENCE_NOW - 9 * DAY, invitedBy: 'Aisha Khan', expired: true },
];

type Team = { id: string; name: string; purpose: string; memberIds: readonly string[]; leadId: string };

const TEAMS: readonly Team[] = [
  { id: 'rot', name: 'Rotating equipment', purpose: 'Compressors, turbines and pumps', memberIds: ['ak', 'tb', 'ms', 'sl'], leadId: 'ak' },
  { id: 'ops', name: 'Control room, crew A', purpose: 'Day shift operations', memberIds: ['lw', 'ih', 'jn'], leadId: 'lw' },
  { id: 'maint', name: 'Maintenance planning', purpose: 'Work order backlog and shutdown scope', memberIds: ['ms', 'ak', 'jn', 'tb', 'lw', 'ih'], leadId: 'ms' },
];

const GROUP_OPTIONS = [
  {
    label: 'Teams',
    options: [
      { value: 'rot', label: 'Rotating equipment' },
      { value: 'ops', label: 'Control room, crew A' },
      { value: 'maint', label: 'Maintenance planning' },
      { value: 'inst', label: 'Instrumentation' },
    ],
  },
  {
    label: 'Directory groups',
    options: [
      { value: 'dir-nk-all', label: 'Nordkapp, all staff' },
      { value: 'dir-contractors', label: 'Contractors' },
    ],
  },
];

const SITE_ITEMS = [
  { value: 'nordkapp', label: 'Nordkapp' },
  { value: 'hammerfest', label: 'Hammerfest LNG' },
  { value: 'all', label: 'All sites' },
];

const STATUS_ITEMS = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];
const ROLE_FILTER_ITEMS = [
  { value: 'all', label: 'Any role' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'guest', label: 'Guest' },
];

const WEEKDAY = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' });
const ROSTER_DAYS = [0, 1, 2, 3].map((offset) => REFERENCE_NOW + offset * DAY);
const ROSTER: readonly { shift: string; hours: string; night: boolean; crews: readonly (readonly string[])[] }[] = [
  { shift: 'Day', hours: '07:00 to 19:00', night: false, crews: [['lw', 'ih', 'tb'], ['lw', 'ih', 'tb'], ['ms', 'jn'], ['ms', 'jn']] },
  { shift: 'Night', hours: '19:00 to 07:00', night: true, crews: [['ak', 'jn'], ['ak', 'jn'], ['lw', 'tb'], []] },
];

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function memberById(id: string): Member {
  return MEMBERS.find((member) => member.id === id) ?? MEMBERS[0];
}

function membersOf(ids: readonly string[]): Member[] {
  return MEMBERS.filter((member) => ids.includes(member.id));
}

function TeamMemberRows() {
  return (
    <ItemGroup className="w-full max-w-lg">
      <MemberRow name={LIV.name} detail={LIV.email} colorKey={LIV.id} isYou role={<RoleBadge role="owner" />} />
      <MemberRow name={AISHA.name} detail={AISHA.email} colorKey={AISHA.id} role={<RoleBadge role="admin" />} />
      <MemberRow name="Nora Dahl" detail="nora.dahl@nordkapp.example" colorKey="nd" status="invited" role={<RoleBadge role="editor" />} />
      <MemberRow name={JONAS.name} detail={JONAS.email} colorKey={JONAS.id} status="suspended" role={<RoleBadge role="viewer" />} />
    </ItemGroup>
  );
}

function TeamMemberExternalIndicator() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ItemGroup>
        <MemberRow name={TOMAS.name} detail={TOMAS.email} colorKey={TOMAS.id} role={<RoleBadge role="editor" />} />
        <MemberRow name={SOFIA.name} detail={SOFIA.email} colorKey={SOFIA.id} external role={<RoleBadge role="guest" />} />
      </ItemGroup>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <IconWorld aria-hidden="true" className="size-3.5 shrink-0" />
        External people sign in from outside {DOMAIN} and see only what is shared with them.
      </p>
    </div>
  );
}

function TeamMemberRemoveInline() {
  const [removed, setRemoved] = useState<readonly string[]>([]);
  const members = [MAGNUS, TOMAS, INGRID].filter((member) => !removed.includes(member.id));

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ItemGroup>
        {members.map((member) => (
          <MemberRow
            key={member.id}
            name={member.name}
            detail={member.title}
            colorKey={member.id}
            role={<RoleBadge role={member.role} />}
            actions={
              <ConfirmButton
                size="sm"
                confirmLabel="Confirm removal"
                aria-label={`Remove ${member.name}`}
                onConfirm={() => setRemoved((current) => [...current, member.id])}
              >
                Remove
              </ConfirmButton>
            }
          />
        ))}
      </ItemGroup>
      <div aria-live="polite" className="flex min-h-7 items-center justify-between gap-3 text-xs text-muted-foreground">
        {removed.length > 0 ? (
          <>
            <span>{removed.length} removed from Rotating equipment. They keep access to the project.</span>
            <Button variant="ghost" size="sm" onClick={() => setRemoved([])}>
              Undo
            </Button>
          </>
        ) : (
          <span>First click arms the button, the second removes.</span>
        )}
      </div>
    </div>
  );
}

function TeamMemberOwnerTransfer() {
  const [nextOwner, setNextOwner] = useState('ak');
  const candidates = [AISHA, MAGNUS].map((member) => ({ value: member.id, label: member.name }));

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center gap-3">
        <PersonAvatar name={LIV.name} colorKey={LIV.id} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-base-foreground">{LIV.name} owns Nordkapp production</p>
          <p className="text-xs text-muted-foreground">A project has one owner. Transferring makes you an admin.</p>
        </div>
        <IconCrown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <FormField label="New owner" helper="Only admins and editors with two-factor authentication can own a project.">
        {(control) => (
          <Select items={candidates} value={nextOwner} onValueChange={setNextOwner}>
            <SelectTrigger id={control.id} aria-describedby={control['aria-describedby']}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <div>
        <ConfirmButton confirmLabel={`Confirm transfer to ${memberById(nextOwner).name}`} onConfirm={() => undefined}>
          Transfer ownership
        </ConfirmButton>
      </div>
    </div>
  );
}

function TeamMemberRoleLegend() {
  return (
    <dl className="flex w-full max-w-xs flex-col gap-2">
      {ROLE_LEGEND.map((entry) => (
        <div key={entry.role} className="flex items-start gap-3">
          <dt className="w-20 shrink-0">
            <RoleBadge role={entry.role} />
          </dt>
          <dd className="text-xs text-muted-foreground">{entry.can}</dd>
        </div>
      ))}
    </dl>
  );
}

function TeamMemberSeatUsage() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <LabelledProgress
        label="Seats in use"
        value={23}
        max={25}
        valueText="23 of 25"
        hint="2 seats left. Guests and pending invitations do not use a seat."
      />
      <div>
        <Button variant="secondary" size="sm">
          Add seats
        </Button>
      </div>
    </div>
  );
}

function TeamMemberTeamCard() {
  const team = TEAMS[0];

  return (
    <Card className="w-full max-w-xs">
      <CardHeader>
        <CardHeaderStart>
          <Avatar variant="overflow" aria-hidden="true">
            <AvatarIcon>
              <IconUsersGroup />
            </AvatarIcon>
          </Avatar>
        </CardHeaderStart>
        <CardHeaderCenter>
          <CardTitle as="h4">{team.name}</CardTitle>
          <CardDescription>{team.purpose}</CardDescription>
        </CardHeaderCenter>
      </CardHeader>
      <CardFooter>
        <CardFooterStart>
          <AvatarGroup people={membersOf(team.memberIds)} max={3} sizes="xsm" label={`Members of ${team.name}`} />
        </CardFooterStart>
        <CardFooterEnd>
          <span className="text-xs tabular-nums text-muted-foreground">{team.memberIds.length} members</span>
        </CardFooterEnd>
      </CardFooter>
    </Card>
  );
}

function TeamMemberInviteSingle() {
  return (
    <div className="w-full max-w-lg">
      <InviteForm
        roles={ROLE_OPTIONS}
        defaultRole="viewer"
        existingEmails={MEMBERS.map((member) => member.email)}
        onInvite={() => undefined}
      />
    </div>
  );
}

function TeamMemberInviteMultiple() {
  return (
    <div className="w-full max-w-lg">
      <InviteForm
        multiple
        roles={ROLE_OPTIONS}
        defaultRole="viewer"
        internalDomain={DOMAIN}
        existingEmails={MEMBERS.map((member) => member.email)}
        onInvite={() => undefined}
      />
    </div>
  );
}

function TeamMemberPendingInvitations() {
  const [revoked, setRevoked] = useState<readonly string[]>([]);
  const invites = INVITES.filter((invite) => !revoked.includes(invite.id));

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-base-foreground">Pending invitations</h3>
        <span className="text-xs tabular-nums text-muted-foreground">{invites.length} waiting</span>
      </div>
      {invites.length === 0 ? (
        <div className="flex items-center justify-between gap-3 py-2 text-sm text-muted-foreground">
          No invitations are waiting.
          <Button variant="ghost" size="sm" onClick={() => setRevoked([])}>
            Reset example
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-default">
          {invites.map((invite) => (
            <li key={invite.id} className="flex min-h-14 items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-base-foreground">
                  <span className="truncate">{invite.email}</span>
                  {invite.expired ? <Badge variant="warning">Expired</Badge> : null}
                </p>
                <p className="truncate text-xs tabular-nums text-muted-foreground">
                  {invite.role} · Sent {formatAgo(invite.sentAt)} by {invite.invitedBy}
                </p>
              </div>
              <AsyncButton variant="ghost" size="sm" pendingLabel="Sending…" onAction={() => wait(1000)}>
                Resend
              </AsyncButton>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Revoke invitation for ${invite.email}`}
                      onClick={() => setRevoked((current) => [...current, invite.id])}
                    >
                      <IconX />
                    </Button>
                  }
                />
                <TooltipContent>Revoke invitation</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamMemberBulkAdd() {
  const [picked, setPicked] = useState<readonly string[]>(['ih']);
  const candidates = [INGRID, MAGNUS, JONAS, SOFIA].map((member) => ({
    id: member.id,
    label: member.name,
    description: member.status === 'suspended' ? 'Suspended accounts cannot be added.' : member.title,
    disabled: member.status === 'suspended',
  }));

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <SelectAllCheckboxList
        label="Add project members to Rotating equipment"
        options={candidates}
        value={picked}
        onValueChange={setPicked}
        selectAllLabel="Everyone not yet in the team"
      />
      <div>
        <Button disabled={picked.length === 0}>
          <IconUserPlus /> Add {picked.length === 0 ? 'members' : picked.length === 1 ? '1 member' : `${picked.length} members`}
        </Button>
      </div>
    </div>
  );
}

function TeamMemberCreateTeamForm() {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const taken = TEAMS.some((team) => team.name.toLowerCase() === name.trim().toLowerCase());
  const error = taken ? 'A team with this name already exists.' : touched && name.trim() === '' ? 'Enter a team name.' : undefined;

  return (
    <form
      className="flex w-full max-w-lg flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
      }}
    >
      <FormField label="Team name" required error={error} helper="Try “Rotating equipment” to see a name that is taken.">
        {(control) => <Input {...control} value={name} onChange={(event) => setName(event.target.value)} />}
      </FormField>
      <FormField label="Purpose" optional helper="One line shown on the team card.">
        {(control) => <Textarea {...control} rows={2} />}
      </FormField>
      <FormField label="Site">
        {(control) => (
          <Select items={SITE_ITEMS} defaultValue="nordkapp">
            <SelectTrigger id={control.id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SITE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </FormField>
      <FormActions status="You become the team lead.">
        <Button type="button" variant="ghost">
          Cancel
        </Button>
        <Button type="submit">Create team</Button>
      </FormActions>
    </form>
  );
}

function TeamMemberGroupPicker() {
  const [groups, setGroups] = useState<string[]>(['rot', 'dir-contractors']);

  return (
    <div className="flex w-full max-w-lg flex-col">
      <Label htmlFor="team-member-group-picker">Share the vibration dashboard with</Label>
      <MultiSelectCombobox
        id="team-member-group-picker"
        options={GROUP_OPTIONS}
        value={groups}
        onValueChange={setGroups}
        placeholder="Select teams or groups"
        searchPlaceholder="Search teams and groups…"
        emptyText="No team or group found."
      />
      <p className="pt-2 text-xs tabular-nums text-muted-foreground">
        {groups.length === 0
          ? 'Nobody outside the owners can open it.'
          : `${groups.length} ${groups.length === 1 ? 'group gets' : 'groups get'} view access. Membership changes apply automatically.`}
      </p>
    </div>
  );
}

function TeamMemberEmptyState() {
  return (
    <EmptyState type="new-object">
      <EmptyStateIcon />
      <EmptyStateTitle as="h4">No teams yet</EmptyStateTitle>
      <EmptyStateDescription>Teams let you share dashboards and assign work to a crew at once.</EmptyStateDescription>
      <EmptyStateActions>
        <Button size="sm">Create team</Button>
      </EmptyStateActions>
    </EmptyState>
  );
}

function TeamMemberTeamDirectory() {
  return (
    <ul className="flex w-full flex-col divide-y divide-default">
      {TEAMS.map((team) => (
        <li key={team.id} className="flex min-h-14 items-center gap-4 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-base-foreground">{team.name}</p>
            <p className="truncate text-xs text-muted-foreground">{team.purpose}</p>
          </div>
          <span className="hidden text-xs text-muted-foreground sm:inline">Lead: {memberById(team.leadId).name}</span>
          <AvatarGroup people={membersOf(team.memberIds)} max={4} sizes="xsm" label={`Members of ${team.name}`} />
          <span className="w-20 text-right text-xs tabular-nums text-muted-foreground">{team.memberIds.length} members</span>
          <Button variant="ghost" size="sm">
            Open
          </Button>
        </li>
      ))}
    </ul>
  );
}

function TeamMemberFilterBar() {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const visible = MEMBERS.filter(
    (member) =>
      (role === 'all' || member.role === role) &&
      (status === 'all' || member.status === status) &&
      `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase())
  );
  const filtered = query !== '' || role !== 'all' || status !== 'all';
  const clear = () => {
    setRole('all');
    setStatus('all');
  };

  return (
    <div className="flex h-96 w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-64">
          <DebouncedSearch aria-label="Search members" placeholder="Search by name or email" onSearch={setQuery} />
        </div>
        <div className="w-36">
          <Select items={ROLE_FILTER_ITEMS} value={role} onValueChange={setRole}>
            <SelectTrigger aria-label="Filter by role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus}>
            <SelectTrigger aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {role !== 'all' || status !== 'all' ? (
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear filters
          </Button>
        ) : null}
        <span aria-live="polite" className="ml-auto text-xs tabular-nums text-muted-foreground">
          {filtered ? `${visible.length} of ${MEMBERS.length} members` : `${MEMBERS.length} members`}
        </span>
      </div>
      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No member matches these filters.</p>
      ) : (
        <ItemGroup className="min-h-0 flex-1 overflow-y-auto">
          {visible.map((member) => (
            <MemberRow
              key={member.id}
              name={member.name}
              detail={member.email}
              colorKey={member.id}
              external={member.external}
              status={member.status}
              meta={`Active ${formatAgo(member.lastActiveAt)}`}
              role={<RoleBadge role={member.role} />}
            />
          ))}
        </ItemGroup>
      )}
    </div>
  );
}

function TeamMemberTable() {
  const [roles, setRoles] = useState<Record<string, string>>(() =>
    Object.fromEntries(MEMBERS.map((member) => [member.id, member.role]))
  );

  return (
    <Table>
      <TableCaption srOnly>Members of Nordkapp production and their roles</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead className="hidden lg:table-cell">Title</TableHead>
          <TableHead>Last active</TableHead>
          <TableHead className="w-40">Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {MEMBERS.map((member) => (
          <TableRow key={member.id}>
            <TableCell rowHeader>
              <span className="flex items-center gap-3">
                <PersonAvatar name={member.name} colorKey={member.id} sizes="xsm" />
                <span className="min-w-0">
                  <span className="flex items-center gap-2 font-medium text-base-foreground">
                    {member.name}
                    {member.external ? (
                      <Badge variant="secondary" outline>
                        <IconWorld aria-hidden="true" />
                        External
                      </Badge>
                    ) : null}
                    {member.status === 'suspended' ? <Badge variant="warning">Suspended</Badge> : null}
                  </span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">{member.email}</span>
                </span>
              </span>
            </TableCell>
            <TableCell muted className="hidden lg:table-cell">
              {member.title}
            </TableCell>
            <TableCell numeric align="start" muted>
              {formatAgo(member.lastActiveAt)}
            </TableCell>
            <TableCell>
              <RoleSelect
                roles={
                  member.role === 'owner'
                    ? [{ value: 'owner', label: 'Owner' }]
                    : member.role === 'guest'
                      ? [{ value: 'guest', label: 'Guest' }]
                      : ROLE_OPTIONS
                }
                value={roles[member.id] ?? member.role}
                onValueChange={(next) => setRoles((current) => ({ ...current, [member.id]: next }))}
                label={`Role for ${member.name}`}
                lockedReason={
                  member.role === 'owner'
                    ? 'Ownership is transferred, not changed.'
                    : member.role === 'guest'
                      ? 'External people can only be guests.'
                      : undefined
                }
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TeamMemberShiftRoster() {
  return (
    <Table layout="fixed" density="comfortable" hover={false}>
      <TableCaption srOnly>Control room roster for the next four days</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28">Shift</TableHead>
          {ROSTER_DAYS.map((day, index) => (
            <TableHead key={day}>
              <span className="tabular-nums">
                {WEEKDAY.format(day)} {formatDate(day)}
              </span>
              {index === 0 ? <span className="ml-2 font-normal">Today</span> : null}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ROSTER.map((row) => (
          <TableRow key={row.shift}>
            <TableCell rowHeader className="align-top">
              <span className="flex items-center gap-2 font-medium text-base-foreground">
                {row.night ? (
                  <IconMoon aria-hidden="true" className="size-4 text-muted-foreground" />
                ) : (
                  <IconSun aria-hidden="true" className="size-4 text-muted-foreground" />
                )}
                {row.shift}
              </span>
              <span className="block text-xs font-normal tabular-nums text-muted-foreground">{row.hours}</span>
            </TableCell>
            {row.crews.map((crew, index) => (
              <TableCell key={ROSTER_DAYS[index]} className="align-top">
                {crew.length === 0 ? (
                  <Badge variant="warning">Not staffed</Badge>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {crew.map((id) => (
                      <li key={id} className="flex items-center gap-2">
                        <PersonAvatar name={memberById(id).name} colorKey={id} sizes="xxsm" />
                        <span className="truncate text-base-foreground">{memberById(id).name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function TeamMemberOnShiftNow() {
  const crew = membersOf(['lw', 'ih', 'tb']);

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <div>
        <h3 className="text-sm font-medium text-base-foreground">On shift now</h3>
        <p className="text-xs tabular-nums text-muted-foreground">Crew A · Day shift until 19:00</p>
      </div>
      <ul className="flex flex-col gap-2">
        {crew.map((member) => (
          <li key={member.id} className="flex items-center gap-3">
            <PersonAvatar name={member.name} colorKey={member.id} sizes="xsm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-base-foreground">{member.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{member.title}</span>
            </span>
            {member.id === 'lw' ? <Badge variant="secondary">Lead</Badge> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamMemberBulkSelect() {
  const [selected, setSelected] = useState<readonly string[]>(['ms', 'tb']);
  const rows = [MAGNUS, TOMAS, INGRID, JONAS];
  const toggle = (id: string, checked: boolean) =>
    setSelected((current) => (checked ? [...current, id] : current.filter((entry) => entry !== id)));

  return (
    <div className="flex w-full max-w-lg flex-col gap-2">
      <div className="flex min-h-9 items-center gap-2 rounded-lg bg-muted-background px-3">
        <span aria-live="polite" className="text-sm font-medium tabular-nums text-base-foreground">
          {selected.length} selected
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={selected.length === 0}>
            Change role
          </Button>
          <Button variant="ghost" size="sm" disabled={selected.length === 0}>
            Add to team
          </Button>
          <Button variant="ghost" size="sm" disabled={selected.length === 0} onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      </div>
      <ItemGroup>
        {rows.map((member) => (
          <MemberRow
            key={member.id}
            name={member.name}
            detail={member.email}
            colorKey={member.id}
            status={member.status}
            role={<RoleBadge role={member.role} />}
            selection={{ checked: selected.includes(member.id), onChange: (checked) => toggle(member.id, checked) }}
          />
        ))}
      </ItemGroup>
    </div>
  );
}

function TeamMemberLastOwnerNotice() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <ItemGroup>
        <MemberRow
          name={LIV.name}
          detail={LIV.email}
          colorKey={LIV.id}
          isYou
          role={<RoleBadge role="owner" />}
          actions={
            <Button variant="ghost" size="sm" disabled>
              Leave project
            </Button>
          }
        />
      </ItemGroup>
      <Alert variant="info">
        <AlertTitle>You are the only owner</AlertTitle>
        <AlertDescription>Transfer ownership to an admin before you leave Nordkapp production.</AlertDescription>
      </Alert>
    </div>
  );
}

function TeamMemberTeamPage() {
  const team = TEAMS[0];
  const members = membersOf(team.memberIds);

  return (
    <div className="flex h-96 w-full flex-col gap-4 overflow-y-auto rounded-xl border border-default bg-base-background p-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="text-xl font-semibold tracking-tight text-base-foreground">{team.name}</h3>
          <p className="text-sm text-muted-foreground">
            {team.purpose} · Nordkapp · Lead: {memberById(team.leadId).name}
          </p>
        </div>
        <AvatarGroup people={members} max={4} label={`Members of ${team.name}`} />
        <Button size="sm">
          <IconUserPlus /> Add members
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="flex flex-col gap-2 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-medium text-base-foreground">Members</h4>
            <span className="text-xs tabular-nums text-muted-foreground">
              {members.length} people, {members.filter((member) => member.external).length} external
            </span>
          </div>
          <ItemGroup>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                name={member.name}
                detail={member.title}
                colorKey={member.id}
                external={member.external}
                meta={`Active ${formatAgo(member.lastActiveAt)}`}
                role={<RoleBadge role={member.id === team.leadId ? 'admin' : member.role} label={member.id === team.leadId ? 'Lead' : undefined} />}
              />
            ))}
          </ItemGroup>
        </section>
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium text-base-foreground">Pending</h4>
            <p className="text-sm text-base-foreground">nora.dahl@nordkapp.example</p>
            <p className="text-xs tabular-nums text-muted-foreground">Editor · Sent {formatAgo(INVITES[0].sentAt)}</p>
            <div>
              <Button variant="ghost" size="sm">
                Resend invitation
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-2 border-t border-default pt-4">
            <h4 className="text-sm font-medium text-base-foreground">Shared with this team</h4>
            <p className="text-sm text-muted-foreground">3 dashboards, 1 data set and the compressor trip review.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default definePage({
  id: 'teams-and-members',
  title: 'Teams and members',
  summary:
    'Who is in a project or team and how they got there: member rows and tables, invitations, team cards, group pickers and shift rosters. Roles stay neutral; only the exceptions carry colour.',
  guidance: {
    use: [
      'One row anatomy everywhere: person, then status, role and actions in that order.',
      'Status only for the exceptions: invited, suspended, external.',
      'The least privileged role as the default for every invitation.',
      'An inline two-step for removing one person; a dialog only when the effect is wider.',
    ],
    avoid: [
      'A green "Active" badge on every row.',
      'Rejecting a whole pasted list because one address is wrong.',
      'Letting the last owner leave or be removed.',
      'Role selects on rows whose role cannot change; show why instead.',
    ],
  },
  source,
  sections: [
    {
      id: 'members',
      title: 'Members',
      description: 'One person per row, and the actions that belong to a single person.',
      specimens: [
        {
          id: 'TeamMemberRows',
          title: 'Member rows',
          note: 'Any member list: active people carry no badge, so invited and suspended ones stand out.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: TeamMemberRows,
        },
        {
          id: 'TeamMemberExternalIndicator',
          title: 'External indicator',
          note: 'Lists that mix staff with contractors or partners, so nobody shares by accident.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: TeamMemberExternalIndicator,
        },
        {
          id: 'TeamMemberRemoveInline',
          title: 'Remove with inline confirm',
          note: 'Removing one person from a team: two clicks in the row, and an undo afterwards.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleBadge.tsx', 'actions/ConfirmButton.tsx'],
          Component: TeamMemberRemoveInline,
        },
        {
          id: 'TeamMemberOwnerTransfer',
          title: 'Owner transfer',
          note: 'Handing a project to someone else: pick the new owner, see what you become, confirm in place.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx', 'forms/FormField.tsx', 'actions/ConfirmButton.tsx'],
          Component: TeamMemberOwnerTransfer,
        },
        {
          id: 'TeamMemberRoleLegend',
          title: 'Role legend',
          note: 'Beside a member list or in help text, to explain the role badges once.',
          origin: 'custom',
          uses: ['patterns/people/RoleBadge.tsx'],
          Component: TeamMemberRoleLegend,
        },
        {
          id: 'TeamMemberSeatUsage',
          title: 'Seat usage',
          note: 'Above the invite form when seats are limited, with what does and does not count.',
          origin: 'custom',
          uses: ['feedback/LabelledProgress.tsx'],
          Component: TeamMemberSeatUsage,
        },
        {
          id: 'TeamMemberOnShiftNow',
          title: 'On shift now',
          note: 'A dashboard or handover panel: the crew currently responsible, with the lead marked.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: TeamMemberOnShiftNow,
        },
      ],
    },
    {
      id: 'invite-and-add',
      title: 'Invite and add',
      description: 'Bringing people in, one at a time or many at once.',
      specimens: [
        {
          id: 'TeamMemberInviteSingle',
          title: 'Invite by email',
          note: 'One address and a role on a single row. Try an empty, malformed or existing address.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/InviteForm.tsx', 'patterns/people/parseEmails.ts', 'patterns/people/RoleSelect.tsx'],
          Component: TeamMemberInviteSingle,
        },
        {
          id: 'TeamMemberInviteMultiple',
          title: 'Invite several people',
          note: 'A pasted list: it counts addresses, flags external ones and names the entries it cannot read.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/InviteForm.tsx', 'patterns/people/parseEmails.ts', 'patterns/people/RoleSelect.tsx'],
          Component: TeamMemberInviteMultiple,
        },
        {
          id: 'TeamMemberPendingInvitations',
          title: 'Pending invitations',
          note: 'Invitations not yet accepted: who sent them and when, with resend and revoke per row.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['actions/AsyncButton.tsx'],
          Component: TeamMemberPendingInvitations,
        },
        {
          id: 'TeamMemberBulkAdd',
          title: 'Bulk add from a list',
          note: 'Adding existing project members to a team: tick people, with ineligible ones explained.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/SelectAllCheckboxList.tsx'],
          Component: TeamMemberBulkAdd,
        },
      ],
    },
    {
      id: 'teams',
      title: 'Teams',
      description: 'Groups of people as things you can create, pick and browse.',
      specimens: [
        {
          id: 'TeamMemberCreateTeamForm',
          title: 'Create team form',
          note: 'A name, a purpose and a site. The name is checked for duplicates as it is typed.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/FormField.tsx', 'patterns/data-entry/FormActions.tsx'],
          Component: TeamMemberCreateTeamForm,
        },
        {
          id: 'TeamMemberGroupPicker',
          title: 'Group picker',
          note: 'Granting access to several teams or directory groups at once instead of person by person.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['forms/MultiSelectCombobox.tsx'],
          Component: TeamMemberGroupPicker,
        },
        {
          id: 'TeamMemberTeamCard',
          title: 'Team card',
          note: 'A team in a grid: name, purpose, and the faces that make it recognisable.',
          origin: 'custom',
          uses: ['display/AvatarGroup.tsx'],
          Component: TeamMemberTeamCard,
        },
        {
          id: 'TeamMemberTeamDirectory',
          title: 'Team directory',
          note: 'All teams as rows when there are more than a handful: lead, members and count line up.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/AvatarGroup.tsx'],
          Component: TeamMemberTeamDirectory,
        },
        {
          id: 'TeamMemberBulkSelect',
          title: 'Bulk selection',
          note: 'Changing several members at once: the bar states the count and holds the shared actions.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: TeamMemberBulkSelect,
        },
        {
          id: 'TeamMemberLastOwnerNotice',
          title: 'Last owner cannot leave',
          note: 'A blocked action with its reason and the step that unblocks it.',
          origin: 'custom',
          size: 'md',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: TeamMemberLastOwnerNotice,
        },
      ],
    },
    {
      id: 'lists-and-rosters',
      title: 'Lists and rosters',
      description: 'Whole member lists, with filtering, role editing and shift planning.',
      specimens: [
        {
          id: 'TeamMemberFilterBar',
          title: 'Member filter bar',
          note: 'More members than fit on screen: search plus role and status filters, with the match count.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['forms/DebouncedSearch.tsx', 'patterns/people/MemberRow.tsx', 'patterns/people/RoleBadge.tsx'],
          Component: TeamMemberFilterBar,
        },
        {
          id: 'TeamMemberTable',
          title: 'Member table with role select',
          note: 'Administrators reviewing everyone at once: roles change in place, fixed roles are locked with a reason.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/people/RoleSelect.tsx', 'display/PersonAvatar.tsx', 'primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: TeamMemberTable,
        },
        {
          id: 'TeamMemberEmptyState',
          title: 'Team empty state',
          note: 'Before the first team exists: what teams are for and the one action that starts.',
          origin: 'custom',
          Component: TeamMemberEmptyState,
        },
        {
          id: 'TeamMemberShiftRoster',
          title: 'Crew and shift roster',
          note: 'Who is on which shift over the coming days, with unstaffed shifts called out.',
          origin: 'custom',
          size: 'lg',
          align: 'stretch',
          uses: ['display/PersonAvatar.tsx', 'primitives/table/Table.tsx', 'primitives/table/TableCaption.tsx'],
          Component: TeamMemberShiftRoster,
        },
        {
          id: 'TeamMemberTeamPage',
          title: 'Team page',
          note: 'The whole team view: header, members, pending invitations and what the team can open.',
          origin: 'custom',
          size: 'full',
          align: 'stretch',
          uses: ['patterns/people/MemberRow.tsx', 'patterns/people/RoleBadge.tsx', 'display/AvatarGroup.tsx'],
          Component: TeamMemberTeamPage,
        },
      ],
    },
  ],
});
