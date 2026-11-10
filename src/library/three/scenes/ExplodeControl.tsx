import { Button } from '@cognite/aura/components/button';
import { Slider } from '@cognite/aura/components/slider';
import { IconArrowsMaximize, IconArrowsMinimize } from '@cognite/aura/icons';

import { cn } from '../../../lib/utils';

import { clampUnit, explodePercent } from './explode';

export type ExplodeControlProps = {
  /** 0 (assembled) to 1 (fully exploded). */
  amount: number;
  onAmountChange: (amount: number) => void;
  /** Called by the button: explode when mostly assembled, assemble when mostly exploded. */
  onToggle: () => void;
  /** What separates, in the plural, for the button label: "Explode decks". */
  noun?: string;
  /** Layout classes. Give it a height; the slider fills what the button leaves. */
  className?: string;
};

/**
 * The control of an exploded view: a button that separates or reassembles everything in one go,
 * and a vertical slider for any amount in between — vertical because the parts move vertically.
 */
export function ExplodeControl({ amount, onAmountChange, onToggle, noun = 'decks', className }: ExplodeControlProps) {
  const percent = explodePercent(amount);
  const exploded = clampUnit(amount) > 0.5;

  return (
    <div data-slot="explode-control" className={cn('flex min-h-0 flex-col gap-3', className)}>
      <Button variant="outline" size="sm" onClick={onToggle} className="w-full">
        {exploded ? <IconArrowsMinimize /> : <IconArrowsMaximize />}
        {exploded ? `Assemble ${noun}` : `Explode ${noun}`}
      </Button>
      <div className="flex min-h-0 flex-1 items-stretch gap-3">
        <Slider
          orientation="vertical"
          aria-label="Separation"
          value={[percent]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => onAmountChange((value[0] ?? 0) / 100)}
        />
        <div className="flex min-w-0 flex-col justify-between text-xs text-muted-foreground">
          <span>Exploded</span>
          <span className="flex flex-col gap-0.5">
            <span>Separation</span>
            <span className="text-base font-semibold tabular-nums text-base-foreground">{percent} %</span>
          </span>
          <span>Assembled</span>
        </div>
      </div>
    </div>
  );
}
