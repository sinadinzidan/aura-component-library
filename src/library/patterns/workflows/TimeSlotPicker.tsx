import { Toggle } from '@cognite/aura/components/toggle';

export type TimeSlot = {
  id: string;
  /** The slot as shown: "08:00". */
  label: string;
  /** Why the slot cannot be picked: "booked", "outside shift". Disables it. */
  unavailable?: string;
};

export type TimeSlotPickerProps = {
  /** What the slots are for: "Available hours, Thursday 12 March". */
  label: string;
  slots: readonly TimeSlot[];
  /** Ids of the picked slots. */
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** `single` keeps one slot, for booking; `multiple` marks every free slot, for availability. */
  selection?: 'single' | 'multiple';
  /** Explains the disabled slots under the grid. Required reading when any slot is unavailable. */
  unavailableNote?: string;
};

/**
 * A grid of time slots as toggles: press the hours that work. Slots that cannot be picked stay in
 * the grid, disabled and named with the reason, so the day keeps its shape and nobody wonders
 * where 10:00 went.
 */
export function TimeSlotPicker({ label, slots, value, onValueChange, selection = 'multiple', unavailableNote }: TimeSlotPickerProps) {
  const change = (id: string, pressed: boolean) => {
    if (selection === 'single') {
      onValueChange(pressed ? [id] : []);
      return;
    }
    const rest = value.filter((current) => current !== id);
    onValueChange(pressed ? [...rest, id] : rest);
  };
  const hasUnavailable = slots.some((slot) => slot.unavailable !== undefined);

  return (
    <div data-slot="time-slot-picker" className="flex w-full min-w-0 flex-col gap-2">
      <div role="group" aria-label={label} className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
        {slots.map((slot) => (
          <Toggle
            key={slot.id}
            variant="outline"
            size="sm"
            className="w-full justify-center tabular-nums"
            pressed={value.includes(slot.id)}
            disabled={slot.unavailable !== undefined}
            aria-label={slot.unavailable ? `${slot.label}, ${slot.unavailable}` : slot.label}
            onPressedChange={(pressed) => change(slot.id, pressed)}
            label={slot.label}
          />
        ))}
      </div>
      {hasUnavailable && unavailableNote ? <p className="text-xs text-muted-foreground">{unavailableNote}</p> : null}
    </div>
  );
}
