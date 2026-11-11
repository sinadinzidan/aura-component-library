import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LayoutPresetPicker } from './LayoutPresetPicker';

const PRESETS = [
  { id: 'ops', name: 'Operations', description: 'Alarms and live trends first.', items: [{ id: 'a', x: 0, y: 0, w: 12, h: 2 }] },
  { id: 'wall', name: 'Wall board', description: 'Four large KPIs.', items: [{ id: 'a', x: 0, y: 0, w: 6, h: 4 }] },
];

describe(LayoutPresetPicker.name, () => {
  it('shows each preset with a thumbnail and what it is for', () => {
    render(<LayoutPresetPicker presets={PRESETS} onApply={vi.fn()} />);

    expect(screen.getByRole('img', { name: 'Operations layout, 1 widgets' })).toBeInTheDocument();
    expect(screen.getByText('Four large KPIs.')).toBeInTheDocument();
  });

  it('applies the chosen preset', async () => {
    const onApply = vi.fn();
    render(<LayoutPresetPicker presets={PRESETS} onApply={onApply} />);

    await userEvent.click(screen.getByRole('button', { name: 'Apply Wall board layout' }));

    expect(onApply).toHaveBeenCalledWith('wall');
  });

  it('marks the preset in use instead of offering it', () => {
    render(<LayoutPresetPicker presets={PRESETS} activeId="ops" onApply={vi.fn()} />);

    expect(screen.getByText('In use')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Apply Operations layout' })).not.toBeInTheDocument();
  });
});
