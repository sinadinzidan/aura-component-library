import { Button } from '@cognite/aura/components/button';
import { IconArrowBackUp, IconArrowForwardUp, IconLock, IconPencil, IconPlus } from '@cognite/aura/icons';
import type { ReactNode } from 'react';

import { IconAction } from '../../patterns/collections/IconAction';

import type { EditorMode } from './editorReducer';

type EditorToolbarProps = {
  /** Name of the dashboard. */
  title: string;
  /** A quiet line under the title: scope, owner or last saved. */
  description?: ReactNode;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Restores the default layout. Hidden when left out. */
  onReset?: () => void;
  /** Whether the "Add widget" panel is showing. */
  paletteOpen?: boolean;
  onTogglePalette?: () => void;
  /** When set the dashboard cannot be edited, and this sentence says why. */
  readOnlyReason?: string;
};

/**
 * The bar above an editable dashboard. In view mode it holds the title and the way into editing;
 * in edit mode it adds undo, redo, reset and the widget list, and the primary action becomes
 * "Done". A read-only dashboard shows the reason in place of the edit button.
 */
export function EditorToolbar({
  title,
  description,
  mode,
  onModeChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onReset,
  paletteOpen = false,
  onTogglePalette,
  readOnlyReason,
}: EditorToolbarProps) {
  const editing = mode === 'edit' && readOnlyReason === undefined;

  return (
    <div data-slot="editor-toolbar" data-mode={editing ? 'edit' : 'view'} className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-col">
        <h3 className="truncate text-base font-semibold text-base-foreground">{title}</h3>
        {description ? <p className="truncate text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {readOnlyReason !== undefined ? (
        <p data-slot="read-only-notice" className="flex min-w-0 items-center gap-2 text-sm text-medium-foreground">
          <IconLock aria-hidden className="size-4 shrink-0" />
          <span>
            <span className="font-medium">Read-only.</span> {readOnlyReason}
          </span>
        </p>
      ) : editing ? (
        <div role="toolbar" aria-label="Dashboard editing" className="flex flex-wrap items-center gap-2">
          <IconAction label={canUndo ? 'Undo' : 'Nothing to undo'} disabled={!canUndo} onClick={onUndo}>
            <IconArrowBackUp />
          </IconAction>
          <IconAction label={canRedo ? 'Redo' : 'Nothing to redo'} disabled={!canRedo} onClick={onRedo}>
            <IconArrowForwardUp />
          </IconAction>
          {onReset ? (
            <Button variant="ghost" onClick={onReset}>
              Reset layout
            </Button>
          ) : null}
          {onTogglePalette ? (
            <Button variant="secondary" aria-expanded={paletteOpen} onClick={onTogglePalette}>
              <IconPlus /> Add widget
            </Button>
          ) : null}
          <Button onClick={() => onModeChange('view')}>Done editing</Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={() => onModeChange('edit')}>
          <IconPencil /> Edit dashboard
        </Button>
      )}
    </div>
  );
}
