import { Button } from '@cognite/aura/components/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@cognite/aura/components/dialog';
import { Kbd } from '@cognite/aura/components/kbd';
import { IconKeyboard } from '@cognite/aura/icons';

import { VIEWER_SHORTCUTS } from './viewerKeymap';
import type { Shortcut } from './viewerKeymap';

export type KeyboardHelpProps = {
  shortcuts?: readonly Shortcut[];
  /** Controlled open state, so a "?" key can open it. Leave out to let the dialog manage itself. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const GROUPS: readonly Shortcut['group'][] = ['Navigate', 'Tools', 'View'];

/** The keyboard help overlay: a button that opens a dialog listing every shortcut by group. Closed until asked for. */
export function KeyboardHelp({ shortcuts = VIEWER_SHORTCUTS, open, onOpenChange }: KeyboardHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <IconKeyboard /> Keyboard shortcuts
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Click the viewer first so it has focus. Every shortcut has a button in the toolbar or panels as well.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          {GROUPS.map((group) => (
            <section key={group} aria-label={group} className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-muted-foreground">{group}</h3>
              <ul className="flex flex-col gap-1.5">
                {shortcuts
                  .filter((shortcut) => shortcut.group === group)
                  .map((shortcut) => (
                    <li key={shortcut.action} className="flex items-center justify-between gap-4 text-sm">
                      <span className="text-base-foreground">{shortcut.action}</span>
                      <span className="flex shrink-0 gap-1">
                        {shortcut.keys.map((key) => (
                          <Kbd key={key}>{key}</Kbd>
                        ))}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Close</Button>} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
