import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimeSlotPicker } from './TimeSlotPicker';

const SLOTS = [
  { id: '08', label: '08:00' },
  { id: '09', label: '09:00' },
  { id: '10', label: '10:00', unavailable: 'booked' },
];

describe(TimeSlotPicker.name, () => {
  it('names the group and shows the picked slots as pressed', () => {
    render(<TimeSlotPicker label="Available hours" slots={SLOTS} value={['09']} onValueChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Available hours' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '09:00' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '08:00' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds a slot to the selection', async () => {
    const onValueChange = vi.fn();
    render(<TimeSlotPicker label="Available hours" slots={SLOTS} value={['09']} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('button', { name: '08:00' }));

    expect(onValueChange).toHaveBeenCalledWith(['09', '08']);
  });

  it('removes a picked slot', async () => {
    const onValueChange = vi.fn();
    render(<TimeSlotPicker label="Available hours" slots={SLOTS} value={['09']} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('button', { name: '09:00' }));

    expect(onValueChange).toHaveBeenCalledWith([]);
  });

  it('keeps one slot when selection is single', async () => {
    const onValueChange = vi.fn();
    render(<TimeSlotPicker label="Start time" slots={SLOTS} value={['09']} onValueChange={onValueChange} selection="single" />);

    await userEvent.click(screen.getByRole('button', { name: '08:00' }));

    expect(onValueChange).toHaveBeenCalledWith(['08']);
  });

  it('disables an unavailable slot and names the reason', () => {
    render(<TimeSlotPicker label="Available hours" slots={SLOTS} value={[]} onValueChange={vi.fn()} unavailableNote="Greyed hours are booked." />);

    expect(screen.getByRole('button', { name: '10:00, booked' })).toBeDisabled();
    expect(screen.getByText('Greyed hours are booked.')).toBeInTheDocument();
  });

  it('leaves the note out when every slot is free', () => {
    render(<TimeSlotPicker label="Available hours" slots={SLOTS.slice(0, 2)} value={[]} onValueChange={vi.fn()} unavailableNote="Greyed hours are booked." />);

    expect(screen.queryByText('Greyed hours are booked.')).not.toBeInTheDocument();
  });
});
