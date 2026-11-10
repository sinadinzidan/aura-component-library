import { Avatar, AvatarFallback, AvatarIcon, AvatarImage } from '@cognite/aura/components/avatar';
import { Badge } from '@cognite/aura/components/badge';
import { Button } from '@cognite/aura/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cognite/aura/components/dropdown-menu';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@cognite/aura/components/item';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconEngine, IconSparkles, IconUser, IconUserPlus } from '@cognite/aura/icons';

import { AvatarGroup } from '../../../library/display/AvatarGroup';
import { PersonAvatar } from '../../../library/display/PersonAvatar';
import { PEOPLE, WORK_ORDERS } from '../../data/plant';
import { definePage } from '../../types';

import source from './avatar.tsx?raw';

const [INGRID, MAGNUS, AISHA, TOMAS, LIV, JONAS] = PEOPLE;

/** Stand-in for a profile photo: a neutral silhouette that needs no network. */
const PORTRAIT =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 36'%3E%3Ccircle cx='18' cy='14' r='6.5' fill-opacity='.45'/%3E%3Cpath d='M4 38c0-9 6-14 14-14s14 5 14 14z' fill-opacity='.45'/%3E%3C/svg%3E";

/** A source that can never decode, to show what happens when a photo fails. */
const BROKEN_PORTRAIT = 'data:image/png;base64,AAAA';

function AvatarInitials() {
  return (
    <Avatar variant="decorative-2" aria-label={INGRID.name}>
      <AvatarFallback>{INGRID.initials}</AvatarFallback>
    </Avatar>
  );
}

function AvatarPhoto() {
  return (
    <Avatar variant="decorative-3" aria-label={AISHA.name}>
      <AvatarImage src={PORTRAIT} alt="" />
      <AvatarFallback>{AISHA.initials}</AvatarFallback>
    </Avatar>
  );
}

function AvatarPhotoFallback() {
  return (
    <Avatar variant="decorative-5" aria-label={MAGNUS.name}>
      <AvatarImage src={BROKEN_PORTRAIT} alt="" />
      <AvatarFallback>{MAGNUS.initials}</AvatarFallback>
    </Avatar>
  );
}

function AvatarAgent() {
  return (
    <Avatar variant="decorative-4" aria-label="Maintenance agent">
      <AvatarIcon>
        <IconSparkles />
      </AvatarIcon>
    </Avatar>
  );
}

function AvatarEntity() {
  return (
    <Avatar variant="overflow" aria-label="1st stage compressor">
      <AvatarIcon>
        <IconEngine />
      </AvatarIcon>
    </Avatar>
  );
}

function AvatarColorways() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Avatar variant="decorative-1" aria-label={INGRID.name}>
        <AvatarFallback>{INGRID.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-2" aria-label={MAGNUS.name}>
        <AvatarFallback>{MAGNUS.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-3" aria-label={AISHA.name}>
        <AvatarFallback>{AISHA.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-4" aria-label={TOMAS.name}>
        <AvatarFallback>{TOMAS.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-5" aria-label={LIV.name}>
        <AvatarFallback>{LIV.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-6" aria-label={JONAS.name}>
        <AvatarFallback>{JONAS.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-7" aria-label="Nora Dahl">
        <AvatarFallback>ND</AvatarFallback>
      </Avatar>
    </div>
  );
}

function AvatarOverflowColorway() {
  return (
    <Avatar variant="overflow" aria-label="4 more people">
      <AvatarFallback>+4</AvatarFallback>
    </Avatar>
  );
}

function AvatarSizes() {
  return (
    <div className="flex items-center gap-3">
      <Avatar variant="decorative-2" sizes="xxsm" aria-label={INGRID.name}>
        <AvatarFallback>{INGRID.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-2" sizes="xsm" aria-label={INGRID.name}>
        <AvatarFallback>{INGRID.initials}</AvatarFallback>
      </Avatar>
      <Avatar variant="decorative-2" aria-label={INGRID.name}>
        <AvatarFallback>{INGRID.initials}</AvatarFallback>
      </Avatar>
    </div>
  );
}

function AvatarStableColor() {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {PEOPLE.map((person) => (
        <PersonAvatar key={person.id} name={person.name} colorKey={person.id} />
      ))}
    </div>
  );
}

function AvatarWithTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button type="button" className="rounded-lg outline-none focus-visible:shadow-focus-ring">
            <Avatar variant="decorative-6" aria-label={`${JONAS.name}, ${JONAS.role}`}>
              <AvatarFallback>{JONAS.initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <TooltipContent>
        {JONAS.name} · {JONAS.role}
      </TooltipContent>
    </Tooltip>
  );
}

function AvatarPresence() {
  return (
    <div className="flex items-center gap-4">
      <span className="relative inline-flex">
        <Avatar variant="decorative-2" aria-label={`${INGRID.name}, on shift`}>
          <AvatarFallback>{INGRID.initials}</AvatarFallback>
        </Avatar>
        <Badge variant="success" dot aria-hidden="true" className="absolute -right-0.5 -bottom-0.5" />
      </span>
      <span className="relative inline-flex">
        <Avatar variant="decorative-5" aria-label={`${LIV.name}, off shift`}>
          <AvatarFallback>{LIV.initials}</AvatarFallback>
        </Avatar>
        <Badge variant="archived" dot aria-hidden="true" className="absolute -right-0.5 -bottom-0.5" />
      </span>
    </div>
  );
}

function AvatarWithCount() {
  return (
    <span className="relative inline-flex">
      <Avatar variant="decorative-3" aria-label={`${AISHA.name}, 3 unread mentions`}>
        <AvatarFallback>{AISHA.initials}</AvatarFallback>
      </Avatar>
      <Badge dot urgent aria-hidden="true" className="absolute -top-1.5 -right-2">
        3
      </Badge>
    </span>
  );
}

function AvatarAccountMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Account menu for ${INGRID.name}`}
            className="rounded-lg outline-none focus-visible:shadow-focus-ring"
          >
            <Avatar variant="decorative-2" aria-hidden="true">
              <AvatarFallback>{INGRID.initials}</AvatarFallback>
            </Avatar>
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem>View profile</DropdownMenuItem>
        <DropdownMenuItem>Change shift</DropdownMenuItem>
        <DropdownMenuItem>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AvatarUnassigned() {
  return (
    <div className="flex items-center gap-2">
      <Avatar variant="overflow" sizes="xsm" aria-hidden="true">
        <AvatarIcon>
          <IconUser />
        </AvatarIcon>
      </Avatar>
      <span className="text-sm text-muted-foreground">Unassigned</span>
    </div>
  );
}

function AvatarStack() {
  return <AvatarGroup people={PEOPLE.slice(0, 3)} label="Assignees" />;
}

function AvatarStackOverflow() {
  return <AvatarGroup people={PEOPLE} max={3} label="People on this shift" />;
}

function AvatarStackSmall() {
  return (
    <div className="flex items-center gap-2 text-sm text-medium-foreground">
      <AvatarGroup people={PEOPLE} max={4} sizes="xsm" label="Watchers" />
      {PEOPLE.length} watching
    </div>
  );
}

function AvatarOverflowMenu() {
  const shown = PEOPLE.slice(0, 2);
  const hidden = PEOPLE.slice(2);

  return (
    <div className="flex items-center gap-1">
      {shown.map((person) => (
        <PersonAvatar key={person.id} name={person.name} colorKey={person.id} sizes="xsm" />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`Show ${hidden.length} more people`}
              className="rounded-md outline-none focus-visible:shadow-focus-ring"
            >
              <Avatar variant="overflow" sizes="xsm" aria-hidden="true">
                <AvatarFallback>+{hidden.length}</AvatarFallback>
              </Avatar>
            </button>
          }
        />
        <DropdownMenuContent align="start">
          {hidden.map((person) => (
            <DropdownMenuItem key={person.id}>
              <PersonAvatar name={person.name} colorKey={person.id} sizes="xxsm" />
              {person.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function AvatarNameAndRole() {
  return (
    <div className="flex items-center gap-3">
      <Avatar variant="decorative-3" aria-hidden="true">
        <AvatarFallback>{AISHA.initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-base-foreground">{AISHA.name}</span>
        <span className="truncate text-xs text-muted-foreground">{AISHA.role}</span>
      </div>
    </div>
  );
}

function AvatarInlineAssignee() {
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-medium-foreground">
      Assigned to
      <Avatar variant="decorative-4" sizes="xxsm" aria-hidden="true">
        <AvatarFallback>{TOMAS.initials}</AvatarFallback>
      </Avatar>
      <span className="font-medium text-base-foreground">{TOMAS.name}</span>
    </p>
  );
}

function AvatarComment() {
  return (
    <div className="flex w-full max-w-sm gap-3">
      <Avatar variant="decorative-5" sizes="xsm" aria-hidden="true">
        <AvatarFallback>{LIV.initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-base-foreground">{LIV.name}</span>
          <span className="text-xs text-muted-foreground">14 min ago</span>
        </div>
        <p className="text-sm text-medium-foreground">
          Recompressor is isolated. Bearing inspection can start once the permit is signed.
        </p>
      </div>
    </div>
  );
}

function AvatarPeopleList() {
  return (
    <ItemGroup className="w-full max-w-sm">
      {PEOPLE.slice(0, 4).map((person) => (
        <Item key={person.id}>
          <ItemMedia>
            <PersonAvatar name={person.name} colorKey={person.id} sizes="xsm" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{person.name}</ItemTitle>
            <ItemDescription>{person.role}</ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  );
}

function AvatarWorkOrderRows() {
  const rows = WORK_ORDERS.slice(0, 4).map((order) => ({
    order,
    assignee: PEOPLE.find((person) => person.id === order.assigneeId),
  }));

  return (
    <ul className="flex w-full max-w-md flex-col gap-3">
      {rows.map(({ order, assignee }) => (
        <li key={order.id} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{order.id}</span>
          <span className="min-w-0 flex-1 truncate text-base-foreground">{order.title}</span>
          {assignee ? (
            <PersonAvatar name={assignee.name} colorKey={assignee.id} sizes="xxsm" />
          ) : (
            <Avatar variant="overflow" sizes="xxsm" aria-label="Unassigned">
              <AvatarIcon>
                <IconUser />
              </AvatarIcon>
            </Avatar>
          )}
        </li>
      ))}
    </ul>
  );
}

function AvatarShareRow() {
  return (
    <div className="flex items-center gap-3">
      <AvatarGroup people={PEOPLE.slice(0, 5)} max={3} sizes="xsm" label="People with access" />
      <Button variant="secondary" size="sm">
        <IconUserPlus /> Invite people
      </Button>
    </div>
  );
}

export default definePage({
  id: 'avatar',
  title: 'Avatar',
  summary:
    'An avatar stands in for a person, a team, an agent or an entity, so people can recognise who or what a row, comment or record belongs to at a glance.',
  docsSlug: 'avatar',
  guidance: {
    use: [
      'A photo when there is one, initials as the fallback, an icon for agents and things.',
      'Decorative colorways to tell people apart; keep one person on one colorway everywhere.',
      'Smaller sizes in tables and dense lists, the default size in headers and cards.',
      'An accessible name on every avatar that is not next to the visible name.',
    ],
    avoid: [
      'Using colorway to signal status — add a status dot or a Badge instead.',
      'Showing every member of a large group; collapse the rest into a "+N" avatar.',
      'An avatar on its own where the name matters and there is room to show it.',
    ],
  },
  source,
  sections: [
    {
      id: 'content',
      title: 'Content',
      description: 'What goes inside: initials, a photo, or an icon.',
      specimens: [
        {
          id: 'AvatarInitials',
          title: 'Initials',
          note: 'The default when there is no photo of the person.',
          origin: 'aura',
          Component: AvatarInitials,
        },
        {
          id: 'AvatarPhoto',
          title: 'Photo',
          note: 'When a profile photo exists; initials still sit underneath while it loads.',
          origin: 'aura',
          Component: AvatarPhoto,
        },
        {
          id: 'AvatarPhotoFallback',
          title: 'Photo that fails to load',
          note: 'Always pair the image with a fallback so a broken URL degrades to initials.',
          origin: 'aura',
          Component: AvatarPhotoFallback,
        },
        {
          id: 'AvatarAgent',
          title: 'Agent icon',
          note: 'An AI agent, bot or system user that has no name to abbreviate.',
          origin: 'aura',
          Component: AvatarAgent,
        },
        {
          id: 'AvatarEntity',
          title: 'Entity icon',
          note: 'A neutral tile for an asset, data set or other thing that leads a card or row.',
          origin: 'aura',
          Component: AvatarEntity,
        },
      ],
    },
    {
      id: 'colorways-and-sizes',
      title: 'Colorways and sizes',
      description: 'Seven decorative colorways that carry no meaning, one neutral overflow colorway, three sizes.',
      specimens: [
        {
          id: 'AvatarColorways',
          title: 'Decorative colorways',
          note: 'Tell people apart in a list; the colour never says anything about status.',
          origin: 'aura',
          Component: AvatarColorways,
        },
        {
          id: 'AvatarOverflowColorway',
          title: 'Overflow colorway',
          note: 'The neutral colorway for a "+N" avatar that summarises hidden members.',
          origin: 'aura',
          Component: AvatarOverflowColorway,
        },
        {
          id: 'AvatarSizes',
          title: 'Sizes',
          note: 'Extra-extra-small (20px) inline and in tables, extra-small (28px) in lists, default (36px) in headers.',
          origin: 'aura',
          Component: AvatarSizes,
        },
        {
          id: 'AvatarStableColor',
          title: 'Colorway from the person',
          note: 'Derives initials and colorway from the user, so the same person looks the same on every screen.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: AvatarStableColor,
        },
      ],
    },
    {
      id: 'states',
      title: 'States',
      description: 'Avatars that say more, or do something.',
      specimens: [
        {
          id: 'AvatarWithTooltip',
          title: 'With name tooltip',
          note: 'Wherever the avatar appears without the name next to it. Hover or focus to try.',
          origin: 'aura',
          Component: AvatarWithTooltip,
        },
        {
          id: 'AvatarPresence',
          title: 'With status dot',
          note: 'Shows whether someone is on shift; the status is also in the accessible name.',
          origin: 'aura',
          Component: AvatarPresence,
        },
        {
          id: 'AvatarWithCount',
          title: 'With unread count',
          note: 'Unread mentions or messages from one person in a conversation list.',
          origin: 'aura',
          Component: AvatarWithCount,
        },
        {
          id: 'AvatarAccountMenu',
          title: 'Account menu trigger',
          note: 'The signed-in user in a topbar; the avatar opens their menu.',
          origin: 'aura',
          Component: AvatarAccountMenu,
        },
        {
          id: 'AvatarUnassigned',
          title: 'Unassigned',
          note: 'Keeps the assignee column aligned when nobody owns the record yet.',
          origin: 'aura',
          Component: AvatarUnassigned,
        },
      ],
    },
    {
      id: 'groups',
      title: 'Groups',
      description: 'Several people on one record, with the overflow collapsed.',
      specimens: [
        {
          id: 'AvatarStack',
          title: 'Stack',
          note: 'A handful of assignees or collaborators that all fit.',
          origin: 'custom',
          uses: ['display/AvatarGroup.tsx', 'display/PersonAvatar.tsx'],
          Component: AvatarStack,
        },
        {
          id: 'AvatarStackOverflow',
          title: 'Stack with overflow',
          note: 'More people than there is room for; the "+N" names who is hidden on hover and focus.',
          origin: 'custom',
          uses: ['display/AvatarGroup.tsx', 'display/PersonAvatar.tsx'],
          Component: AvatarStackOverflow,
        },
        {
          id: 'AvatarStackSmall',
          title: 'Small stack with total',
          note: 'Watchers or viewers in a toolbar or table cell, with the total spelled out.',
          origin: 'custom',
          uses: ['display/AvatarGroup.tsx', 'display/PersonAvatar.tsx'],
          Component: AvatarStackSmall,
        },
        {
          id: 'AvatarOverflowMenu',
          title: 'Overflow that opens a menu',
          note: 'When people need to reach the hidden members, not only see their names.',
          origin: 'custom',
          uses: ['display/PersonAvatar.tsx'],
          Component: AvatarOverflowMenu,
        },
      ],
    },
    {
      id: 'in-context',
      title: 'In context',
      description: 'Avatars next to names, comments, rows and actions.',
      specimens: [
        {
          id: 'AvatarNameAndRole',
          title: 'With name and role',
          note: 'The owner or author of a record in a header or card.',
          origin: 'aura',
          Component: AvatarNameAndRole,
        },
        {
          id: 'AvatarInlineAssignee',
          title: 'Inline with text',
          note: 'Names a person inside a sentence or a metadata line.',
          origin: 'aura',
          Component: AvatarInlineAssignee,
        },
        {
          id: 'AvatarShareRow',
          title: 'Stack with invite action',
          note: 'Who has access, next to the action that adds someone.',
          origin: 'custom',
          uses: ['display/AvatarGroup.tsx', 'display/PersonAvatar.tsx'],
          Component: AvatarShareRow,
        },
        {
          id: 'AvatarComment',
          title: 'Comment',
          note: 'Activity feeds and comment threads: avatar, author, time, then the message.',
          origin: 'aura',
          size: 'md',
          Component: AvatarComment,
        },
        {
          id: 'AvatarPeopleList',
          title: 'People list',
          note: 'Picking or reviewing members, with the role as the second line.',
          origin: 'custom',
          size: 'md',
          uses: ['display/PersonAvatar.tsx'],
          Component: AvatarPeopleList,
        },
        {
          id: 'AvatarWorkOrderRows',
          title: 'Assignee column',
          note: 'The smallest size closes a dense row; unassigned rows keep a neutral placeholder.',
          origin: 'custom',
          size: 'md',
          uses: ['display/PersonAvatar.tsx'],
          Component: AvatarWorkOrderRows,
        },
      ],
    },
  ],
});
