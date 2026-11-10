import { Badge } from '@cognite/aura/components/badge';
import { Item, ItemCheckbox, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@cognite/aura/components/item';
import { IconBan, IconMailForward, IconWorld } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../display/PersonAvatar';

export type MemberStatus = 'active' | 'invited' | 'suspended';

type MemberRowProps = {
  name: string;
  /** Second line: email address or job title. */
  detail?: ReactNode;
  /** Stable key for the avatar colour, usually the user id. */
  colorKey?: string;
  /** Marks the signed-in person's own row with "(you)". */
  isYou?: boolean;
  /** Someone from outside the organisation. Adds an "External" tag beside the name. */
  external?: boolean;
  /** `active` shows nothing; the exceptions are what people scan for. */
  status?: MemberStatus;
  /** The role, as a `RoleBadge` (read-only) or a `RoleSelect` (editable). */
  role?: ReactNode;
  /** Quiet text before the role: last active time, team, shift. */
  meta?: ReactNode;
  /** Always-visible controls at the end of the row: remove, overflow menu. */
  actions?: ReactNode;
  /** Adds a leading checkbox for bulk actions. */
  selection?: { checked: boolean; onChange: (checked: boolean) => void };
};

/**
 * One person in a member list: avatar, name and detail on the left; status, role and actions on
 * the right, always in that order so a column of rows lines up. Active members carry no status
 * badge, so invited, suspended and external people stand out. Render inside an `ItemGroup`.
 */
export function MemberRow({
  name,
  detail,
  colorKey,
  isYou = false,
  external = false,
  status = 'active',
  role,
  meta,
  actions,
  selection,
}: MemberRowProps) {
  return (
    <Item disabled={status === 'suspended'} className="min-h-11 gap-3">
      {selection ? (
        <ItemCheckbox
          aria-label={`Select ${name}`}
          checked={selection.checked}
          onCheckedChange={(checked) => selection.onChange(checked)}
        />
      ) : null}
      <ItemMedia>
        <PersonAvatar name={name} colorKey={colorKey} sizes="xsm" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="flex items-center gap-2">
          <span className="truncate">{name}</span>
          {isYou ? <span className="shrink-0 text-muted-foreground">(you)</span> : null}
          {external ? (
            <Badge variant="secondary" outline>
              <IconWorld aria-hidden="true" />
              External
            </Badge>
          ) : null}
        </ItemTitle>
        {detail ? <ItemDescription>{detail}</ItemDescription> : null}
      </ItemContent>
      {meta ? <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{meta}</span> : null}
      {status === 'invited' ? (
        <Badge variant="archived">
          <IconMailForward aria-hidden="true" />
          Invited
        </Badge>
      ) : null}
      {status === 'suspended' ? (
        <Badge variant="warning">
          <IconBan aria-hidden="true" />
          Suspended
        </Badge>
      ) : null}
      {role}
      {actions ? <span className="flex shrink-0 items-center gap-1">{actions}</span> : null}
    </Item>
  );
}
