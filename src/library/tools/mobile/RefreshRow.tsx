import { Button } from '@cognite/aura/components/button';
import { IconRefresh } from '@cognite/aura/icons';

export type RefreshRowProps = {
  /** When the data was last loaded: "Updated 14:00". */
  status: string;
  refreshing: boolean;
  onRefresh: () => void;
};

/**
 * A row at the top of a list that says how fresh the data is and refreshes it on a tap. Phones
 * often hide refresh behind a pull gesture that keyboard and switch users cannot make; a visible
 * row works for everyone.
 */
export function RefreshRow({ status, refreshing, onRefresh }: RefreshRowProps) {
  return (
    <div data-slot="refresh-row" className="flex items-center justify-between gap-3 px-4 py-2">
      <p aria-live="polite" className="text-xs tabular-nums text-muted-foreground">
        {refreshing ? 'Refreshing' : status}
      </p>
      <Button variant="ghost" size="sm" disabled={refreshing} onClick={onRefresh}>
        <IconRefresh /> Refresh
      </Button>
    </div>
  );
}
