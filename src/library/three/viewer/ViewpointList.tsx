import { Button } from '@cognite/aura/components/button';
import { Input } from '@cognite/aura/components/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@cognite/aura/components/tooltip';
import { IconBookmark, IconTrash } from '@cognite/aura/icons';
import { useState } from 'react';

import { cn } from '../../../lib/utils';

import { describeView, directionOfPose } from './viewCubeLogic';
import type { Viewpoint } from './viewpoints';

export type ViewpointListProps = {
  viewpoints: readonly Viewpoint[];
  /** Fly the camera to a saved viewpoint. */
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
  /** Save the current camera under a name; an empty name asks for an automatic one. */
  onSave: (name: string) => void;
  className?: string;
};

/** Saved camera positions: a name field and a Save button, then one button per viewpoint that flies the camera there. */
export function ViewpointList({ viewpoints, onRestore, onDelete, onSave, className }: ViewpointListProps) {
  const [name, setName] = useState('');

  return (
    <div data-slot="viewpoint-list" className={cn('flex w-full flex-col gap-3', className)}>
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(name);
          setName('');
        }}
      >
        <Input aria-label="Viewpoint name" placeholder="Name this view" value={name} onChange={(event) => setName(event.target.value)} />
        <Button type="submit" variant="outline" size="sm" className="shrink-0">
          <IconBookmark /> Save view
        </Button>
      </form>
      {viewpoints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No saved views yet. Move the camera where you want it, then save.</p>
      ) : (
        <ul aria-label="Saved views" className="flex flex-col gap-1">
          {viewpoints.map((viewpoint) => (
            <li key={viewpoint.id} className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-auto min-w-0 flex-1 flex-col items-start gap-0 py-1.5" onClick={() => onRestore(viewpoint.id)}>
                <span className="max-w-full truncate text-sm font-medium">{viewpoint.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{describeView(directionOfPose(viewpoint.target))}</span>
              </Button>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete ${viewpoint.name}`} onClick={() => onDelete(viewpoint.id)}>
                      <IconTrash />
                    </Button>
                  }
                />
                <TooltipContent>Delete {viewpoint.name}</TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
