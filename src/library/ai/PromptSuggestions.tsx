import { Button } from '@cognite/aura/components/button';
import type { ReactNode } from 'react';

export type PromptSuggestion = {
  id: string;
  /** Short text on the chip. */
  label: string;
  /** Full prompt handed to `onSelect`; defaults to the label. */
  prompt?: string;
  icon?: ReactNode;
};

type PromptSuggestionsProps = {
  suggestions: readonly PromptSuggestion[];
  onSelect: (prompt: string, suggestion: PromptSuggestion) => void;
  /** Accessible name of the group. */
  label?: string;
  /** `wrap` flows chips in rows; `stack` gives each prompt its own full-width row. */
  layout?: 'wrap' | 'stack';
  disabled?: boolean;
};

/**
 * Starter prompts shown above a prompt input or in an empty thread. Selecting one hands back the
 * full prompt, so the caller decides whether to fill the input or send straight away.
 */
export function PromptSuggestions({
  suggestions,
  onSelect,
  label = 'Suggested prompts',
  layout = 'wrap',
  disabled = false,
}: PromptSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div
      role="group"
      aria-label={label}
      className={layout === 'stack' ? 'flex w-full flex-col gap-2' : 'flex w-full flex-wrap gap-2'}
    >
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.id}
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          className={layout === 'stack' ? 'w-full justify-start' : undefined}
          onClick={() => onSelect(suggestion.prompt ?? suggestion.label, suggestion)}
        >
          {suggestion.icon}
          <span className="truncate">{suggestion.label}</span>
        </Button>
      ))}
    </div>
  );
}
