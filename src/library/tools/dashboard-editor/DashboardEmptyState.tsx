import { Button } from '@cognite/aura/components/button';
import { IconPlus } from '@cognite/aura/icons';

type DashboardEmptyStateProps = {
  title?: string;
  description?: string;
  /** Widgets worth starting with, offered as one-click buttons. */
  suggestions?: readonly { type: string; label: string }[];
  onAdd?: (type: string) => void;
  /** Opens the full widget list. */
  onBrowse?: () => void;
};

/**
 * What an empty dashboard shows in place of the grid: a dashed drop area that says what goes
 * here and offers the two ways to start — a few suggested widgets, or the full list.
 */
export function DashboardEmptyState({
  title = 'This dashboard has no widgets',
  description = 'Add a widget to start. Widgets snap to a 12-column grid and can be moved and resized afterwards.',
  suggestions = [],
  onAdd,
  onBrowse,
}: DashboardEmptyStateProps) {
  return (
    <div data-slot="dashboard-empty" className="flex w-full flex-col items-center gap-4 rounded-xl border border-dashed border-emphasized px-6 py-10 text-center">
      <div className="flex max-w-md flex-col gap-1">
        <p className="text-sm font-medium text-base-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {suggestions.length > 0 && onAdd ? (
        <div role="group" aria-label="Suggested widgets" className="flex flex-wrap items-center justify-center gap-2">
          {suggestions.map((suggestion) => (
            <Button key={suggestion.type} variant="secondary" size="sm" onClick={() => onAdd(suggestion.type)}>
              <IconPlus /> {suggestion.label}
            </Button>
          ))}
        </div>
      ) : null}
      {onBrowse ? (
        <Button variant="ghost" size="sm" onClick={onBrowse}>
          Browse all widgets
        </Button>
      ) : null}
    </div>
  );
}
