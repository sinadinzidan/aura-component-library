import { Toggle } from '@cognite/aura/components/toggle';

import type { Reaction } from './reactions';

type ReactionBarProps = {
  reactions: readonly Reaction[];
  /** Called with the id of the reaction the viewer pressed or released. */
  onToggle: (id: string) => void;
  /** Accessible name of the group. */
  label?: string;
  /** Shows the counts without letting the viewer react, for a read-only thread. */
  disabled?: boolean;
};

/**
 * Reactions as counted toggles with text labels: "Agree 3", "Seen 1". A pressed toggle is the
 * viewer's own reaction, so the state is carried by `aria-pressed` and the outline as well as the
 * fill. Keep the vocabulary to a few words that mean something in the work, not a free picker.
 */
export function ReactionBar({ reactions, onToggle, label = 'Reactions', disabled = false }: ReactionBarProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {reactions.map((reaction) => (
        <Toggle
          key={reaction.id}
          size="sm"
          variant="outline"
          pressed={reaction.reacted}
          disabled={disabled}
          onPressedChange={() => onToggle(reaction.id)}
          aria-label={`${reaction.label}, ${reaction.count}`}
          label={reaction.label}
          count={reaction.count > 0 ? reaction.count : undefined}
        />
      ))}
    </div>
  );
}
