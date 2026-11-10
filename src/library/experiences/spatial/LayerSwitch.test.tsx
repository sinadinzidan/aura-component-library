import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LayerSwitch } from './LayerSwitch';

const OPTIONS = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'piping', label: 'Piping' },
  { value: 'heat', label: 'Heat' },
] as const;

describe(LayerSwitch.name, () => {
  it('names the control and lists its options', () => {
    render(<LayerSwitch label="Layer" value="equipment" options={OPTIONS} onValueChange={vi.fn()} />);

    expect(screen.getByRole('tablist', { name: 'Layer' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['Equipment', 'Piping', 'Heat']);
  });

  it('marks the active option', () => {
    render(<LayerSwitch label="Layer" value="piping" options={OPTIONS} onValueChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'Piping' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Heat' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the chosen option', async () => {
    const onValueChange = vi.fn();
    render(<LayerSwitch label="Layer" value="equipment" options={OPTIONS} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Heat' }));

    expect(onValueChange).toHaveBeenCalledWith('heat');
  });

  it('can hide the visible label and keep the name', () => {
    render(<LayerSwitch label="Level" value="equipment" options={OPTIONS} onValueChange={vi.fn()} hideLabel />);

    expect(screen.queryByText('Level')).not.toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Level' })).toBeInTheDocument();
  });
});
