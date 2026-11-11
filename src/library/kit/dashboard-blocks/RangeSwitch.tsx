import { SegmentedControl, SegmentedControlButton, SegmentedControlList } from '@cognite/aura/components/segmented-control';

export type RangeOption = { id: string; label: string };

type RangeSwitchProps = {
  /** Names the control, for example "Time range". */
  label: string;
  options: readonly RangeOption[];
  value: string;
  onChange: (id: string) => void;
};

/** The period a dashboard covers, as a compact switch for its header. The look sets the corner radius. */
export function RangeSwitch({ label, options, value, onChange }: RangeSwitchProps) {
  return (
    <SegmentedControl value={value} onValueChange={(next) => onChange(String(next))}>
      <SegmentedControlList size="small" aria-label={label}>
        {options.map((option) => (
          <SegmentedControlButton key={option.id} value={option.id}>
            {option.label}
          </SegmentedControlButton>
        ))}
      </SegmentedControlList>
    </SegmentedControl>
  );
}
