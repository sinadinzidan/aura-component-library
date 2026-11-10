import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';

import { cn } from '../../../lib/utils';

export type LayerOption<T extends string> = { value: T; label: string };

export type LayerSwitchProps<T extends string> = {
  /** What is being switched: "Layer", "Level", "Mode". Shown before the control and used as its name. */
  label: string;
  value: T;
  options: readonly LayerOption<T>[];
  onValueChange: (value: T) => void;
  size?: 'small' | 'default';
  /** Hides the visible label; the control keeps it as its accessible name. */
  hideLabel?: boolean;
  className?: string;
};

/**
 * A labelled one-of-many switch for what a scene emphasises: a layer, a deck level or a display
 * mode. Exactly one option is active and the options are typed, so the handler gets the value it
 * declared. Pick it for two to five mutually exclusive views of the same scene.
 */
export function LayerSwitch<T extends string>({ label, value, options, onValueChange, size = 'small', hideLabel = false, className }: LayerSwitchProps<T>) {
  const select = (next: unknown) => {
    const match = options.find((option) => option.value === next);
    if (match) onValueChange(match.value);
  };

  return (
    <div data-slot="layer-switch" className={cn('flex min-w-0 items-center gap-2', className)}>
      {hideLabel ? null : (
        <span aria-hidden="true" className="shrink-0 text-xs font-medium text-muted-foreground">
          {label}
        </span>
      )}
      <SegmentedControl value={value} onValueChange={select}>
        <SegmentedControlList size={size} aria-label={label}>
          {options.map((option) => (
            <SegmentedControlButton key={option.value} value={option.value}>
              {option.label}
            </SegmentedControlButton>
          ))}
        </SegmentedControlList>
      </SegmentedControl>
    </div>
  );
}
