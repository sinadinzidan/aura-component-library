import { Badge } from '@cognite/aura/components/badge';
import { IconChevronDown, IconChevronRight, IconRobot } from '@cognite/aura/icons';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import { PersonAvatar } from '../../display/PersonAvatar';

type ActivityRowProps = {
  /** Who did it: a person's name, or the name of the rule, pipeline or integration. */
  actor: string;
  /** `system` swaps the avatar for an icon tile and labels the row "Automated". */
  actorKind?: 'person' | 'system';
  /** Stable key for the avatar colour, usually the user id. */
  colorKey?: string;
  /** Icon for a system actor. A robot when left out. */
  icon?: ReactNode;
  /** What they did, past tense, lower case: "acknowledged", "changed the priority of". */
  verb: string;
  /** What it was done to: a name, tag or id. */
  object?: ReactNode;
  /** When, already formatted: "13:46" or "14 min ago". */
  time: string;
  /** One always-visible line under the sentence: a `ChangeDiff`, a quoted comment. */
  summary?: ReactNode;
  /** Extra detail behind an expand button, such as a `PropertyList` of the event's fields. */
  details?: ReactNode;
  defaultOpen?: boolean;
};

/**
 * One line of an activity feed, always in the same order: actor, verb, object, time. People get
 * their avatar; rules, pipelines and integrations get an icon tile and the word "Automated", so
 * the two never look alike. Detail that most readers skip sits behind an expand button.
 * Render inside a `ul` or `ol`.
 */
export function ActivityRow({
  actor,
  actorKind = 'person',
  colorKey,
  icon,
  verb,
  object,
  time,
  summary,
  details,
  defaultOpen = false,
}: ActivityRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const detailsId = useId();
  const system = actorKind === 'system';

  return (
    <li data-slot="activity-row" data-actor={actorKind} className="flex w-full min-w-0 gap-3 py-2">
      <span className="flex size-6 shrink-0 items-center justify-center">
        {system ? (
          <span
            aria-hidden="true"
            className="flex size-6 items-center justify-center rounded-md bg-muted-background text-medium-foreground [&>svg]:size-3.5"
          >
            {icon ?? <IconRobot />}
          </span>
        ) : (
          <PersonAvatar name={actor} colorKey={colorKey} sizes="xsm" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-start gap-3">
          <p className="min-w-0 flex-1 text-sm leading-6 text-medium-foreground">
            <span className="font-medium text-base-foreground">{actor}</span> {verb}
            {object ? <> <span className="font-medium text-base-foreground">{object}</span></> : null}
            {system ? (
              <>
                {' '}
                <Badge variant="secondary" outline className="ml-1 align-middle">
                  Automated
                </Badge>
              </>
            ) : null}
          </p>
          <span className="shrink-0 text-xs leading-6 tabular-nums text-muted-foreground">{time}</span>
          {details ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={detailsId}
              aria-label={`${open ? 'Hide' : 'Show'} details: ${actor} ${verb}`}
              onClick={() => setOpen((current) => !current)}
              className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-base-background-hover hover:text-base-foreground focus-visible:shadow-focus-ring"
            >
              {open ? <IconChevronDown aria-hidden="true" className="size-4" /> : <IconChevronRight aria-hidden="true" className="size-4" />}
            </button>
          ) : null}
        </div>
        {summary ? <div className="min-w-0">{summary}</div> : null}
        {details ? (
          <div id={detailsId} hidden={!open} className="mt-1 min-w-0 rounded-lg bg-muted-background p-3">
            {details}
          </div>
        ) : null}
      </div>
    </li>
  );
}
