import { Button } from '@cognite/aura/components/button';
import { IconLock, IconLockOpen } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';
import { StatusIndicator } from '../StatusIndicator';

import { removalGate } from './isolationOrder';

export type LockBoardPerson = {
  id: string;
  name: string;
  /** Trade or role in the work party. */
  role: string;
  /** Number of the person's own padlock. */
  lock: string;
  /** Whether their lock is on the lock box now. */
  lockOn: boolean;
  /** When the lock went on or came off, e.g. "07:12". */
  at?: string;
};

export type LockBoardProps = {
  /** Lock box number. */
  boxId: string;
  /** How many isolation-lock keys are held inside the box. */
  keysInside: number;
  people: readonly LockBoardPerson[];
  /** Makes each person's lock a button. Called with the person id. */
  onToggle?: (personId: string) => void;
  className?: string;
};

/**
 * A group lock box as a board: the keys to the isolation locks are inside, and every member of
 * the work party hangs a personal lock on the box. The box cannot be opened, and so no isolation
 * removed, while any personal lock is on. Each hasp shows lock on or off as an icon and a word.
 */
export function LockBoard({ boxId, keysInside, people, onToggle, className }: LockBoardProps) {
  const on = people.filter((person) => person.lockOn).length;
  const gate = removalGate(people);
  return (
    <section data-slot="lock-board" data-ready={gate.ready} aria-label={`Lock box ${boxId}`} className={cn('flex w-full min-w-0 flex-col gap-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-sm font-medium text-base-foreground">
            Lock box <span className="font-mono">{boxId}</span>
          </h4>
          <span className="text-xs tabular-nums text-muted-foreground">
            Keys to {keysInside} isolation {keysInside === 1 ? 'lock' : 'locks'} inside
          </span>
        </div>
        <StatusIndicator variant="badge" tone={on > 0 ? 'success' : 'neutral'} shape={on > 0 ? 'dot' : 'ring'} label={`${on} of ${people.length} personal locks on`} />
      </div>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-2">
        {people.map((person) => {
          const Icon = person.lockOn ? IconLock : IconLockOpen;
          return (
            <li key={person.id} data-slot="lock-hasp" data-on={person.lockOn} className={cn('flex flex-col gap-2 rounded-lg p-3', person.lockOn ? 'bg-muted-background' : 'border border-dashed border-emphasized')}>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('flex items-center gap-1.5 text-xs font-medium', person.lockOn ? 'text-base-foreground' : 'text-muted-foreground')}>
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  {person.lockOn ? 'Lock on' : 'Lock off'}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{person.lock}</span>
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm text-base-foreground">{person.name}</span>
                <span className="text-xs text-muted-foreground">
                  {person.role}
                  {person.at ? <span className="tabular-nums"> · {person.lockOn ? 'since' : 'off'} {person.at}</span> : null}
                </span>
              </div>
              {onToggle ? (
                <Button variant="ghost" size="sm" className="w-full" onClick={() => onToggle(person.id)} aria-label={`${person.lockOn ? 'Remove lock' : 'Hang lock'} ${person.lock}, ${person.name}`}>
                  {person.lockOn ? 'Remove lock' : 'Hang lock'}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p data-slot="lock-board-gate" role="status" className={cn('text-xs', gate.ready ? 'text-medium-foreground' : 'text-base-foreground')}>
        {gate.summary}
      </p>
    </section>
  );
}
