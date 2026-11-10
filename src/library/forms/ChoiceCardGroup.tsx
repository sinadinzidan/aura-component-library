import { Badge } from '@cognite/aura/components/badge';
import { HelperText } from '@cognite/aura/components/helper-text';
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemDescription,
  RadioGroupItemLabel,
} from '@cognite/aura/components/radio-group';
import { useId } from 'react';

export type ChoiceCardOption = {
  value: string;
  label: string;
  description?: string;
  /** A short neutral tag next to the label, such as "Recommended". */
  tag?: string;
  /** When set, the option cannot be picked and this sentence replaces its description. */
  disabledReason?: string;
};

type ChoiceCardGroupProps = {
  /** Names the group for assistive tech and is shown above the cards. */
  label: string;
  options: readonly ChoiceCardOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** `stack` puts cards under each other; `grid` gives each an equal column. */
  layout?: 'stack' | 'grid';
  helperText?: string;
  /** Form field name for native submission. */
  name?: string;
};

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Single choice shown as cards, for two to four options that each need a sentence of explanation.
 * Wraps Aura's card radio items with a group label, equal-width layout, an optional tag per option
 * and a visible reason on options that cannot be picked.
 */
export function ChoiceCardGroup({
  label,
  options,
  value,
  onValueChange,
  layout = 'stack',
  helperText,
  name,
}: ChoiceCardGroupProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const helperId = `${id}-helper`;

  return (
    <div className="flex w-full flex-col">
      <span id={labelId} className="pb-2 text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <RadioGroup
        name={name}
        value={value}
        onValueChange={(next) => {
          if (isString(next)) onValueChange(next);
        }}
        aria-labelledby={labelId}
        aria-describedby={helperText ? helperId : undefined}
        className={layout === 'grid' ? 'w-full grid-flow-col auto-cols-fr' : 'w-full'}
      >
        {options.map((option) => (
          <RadioGroupItem key={option.value} variant="card" className="w-full">
            <RadioGroupItemControl value={option.value} disabled={option.disabledReason !== undefined} />
            <RadioGroupItemLabel className="flex items-center justify-between gap-2">
              {option.label}
              {option.tag ? <Badge variant="secondary">{option.tag}</Badge> : null}
            </RadioGroupItemLabel>
            {(option.disabledReason ?? option.description) ? (
              <RadioGroupItemDescription>{option.disabledReason ?? option.description}</RadioGroupItemDescription>
            ) : null}
          </RadioGroupItem>
        ))}
      </RadioGroup>
      {helperText ? <HelperText id={helperId}>{helperText}</HelperText> : null}
    </div>
  );
}
