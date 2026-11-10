import { Avatar, AvatarFallback } from '@cognite/aura/components/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';

import { PersonAvatar } from './PersonAvatar';

export type AvatarGroupPerson = { id: string; name: string; initials?: string };

type AvatarGroupSize = 'default' | 'xsm' | 'xxsm';

const RADIUS: Record<AvatarGroupSize, string> = {
  default: 'rounded-lg',
  xsm: 'rounded-md',
  xxsm: 'rounded-sm',
};

const OVERLAP: Record<AvatarGroupSize, string> = {
  default: '-space-x-2',
  xsm: '-space-x-1.5',
  xxsm: '-space-x-1',
};

type AvatarGroupProps = {
  people: readonly AvatarGroupPerson[];
  /** How many avatars to show before the rest collapse into "+N". */
  max?: number;
  sizes?: AvatarGroupSize;
  /** Accessible name for the whole group, for example "Assignees". */
  label: string;
};

/**
 * Overlapping avatars for the people on a record. Past `max`, the rest collapse into one
 * overflow avatar whose tooltip and accessible name list who is hidden.
 */
export function AvatarGroup({ people, max = 4, sizes = 'default', label }: AvatarGroupProps) {
  const limit = Math.max(1, max);
  const visible = people.length > limit ? people.slice(0, limit) : people;
  const hidden = people.slice(visible.length);
  const hiddenNames = hidden.map((person) => person.name).join(', ');
  const cutout = `inline-flex ring-2 ring-base-background ${RADIUS[sizes]}`;

  return (
    <div role="group" aria-label={label} className={`flex items-center ${OVERLAP[sizes]}`}>
      {visible.map((person) => (
        <span key={person.id} className={cutout}>
          <PersonAvatar name={person.name} initials={person.initials} colorKey={person.id} sizes={sizes} />
        </span>
      ))}
      {hidden.length > 0 ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={`${hidden.length} more: ${hiddenNames}`}
                className={`${cutout} outline-none focus-visible:shadow-focus-ring`}
              >
                <Avatar variant="overflow" sizes={sizes} aria-hidden="true">
                  <AvatarFallback>+{hidden.length}</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <TooltipContent>{hiddenNames}</TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  );
}
