import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';

export type BillingPeriod = 'monthly' | 'annual';

export type BillingToggleProps = {
  value: BillingPeriod;
  onValueChange: (value: BillingPeriod) => void;
  /** What annual billing saves, stated next to the control: "Two months free". */
  annualNote?: string;
  /** Accessible name of the control. */
  label?: string;
  size?: 'small' | 'default';
};

function isBillingPeriod(value: unknown): value is BillingPeriod {
  return value === 'monthly' || value === 'annual';
}

/**
 * Switch between monthly and annual prices. The saving is written beside the control rather than
 * inside a coloured badge, so the choice reads the same in every theme.
 */
export function BillingToggle({ value, onValueChange, annualNote, label = 'Billing period', size = 'default' }: BillingToggleProps) {
  return (
    <div data-slot="billing-toggle" className="flex flex-wrap items-center gap-3">
      <SegmentedControl
        value={value}
        onValueChange={(next: unknown) => {
          if (isBillingPeriod(next)) onValueChange(next);
        }}
      >
        <SegmentedControlList aria-label={label} size={size}>
          <SegmentedControlButton value="monthly" size={size} tabContent="label-only">
            Monthly
          </SegmentedControlButton>
          <SegmentedControlButton value="annual" size={size} tabContent="label-only">
            Annual
          </SegmentedControlButton>
        </SegmentedControlList>
      </SegmentedControl>
      {annualNote ? <span className="text-sm text-muted-foreground">{annualNote}</span> : null}
    </div>
  );
}
