import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PidLayerToggles } from './PidLayerToggles';
import { ALL_LAYERS_ON } from './pidModel';

describe(PidLayerToggles.name, () => {
  it('shows one pressed toggle per visible layer in a named group', () => {
    render(<PidLayerToggles layers={{ ...ALL_LAYERS_ON, values: false }} onToggle={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Layers' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Process lines/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Live values/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the layer that was toggled', async () => {
    const onToggle = vi.fn();
    render(<PidLayerToggles layers={ALL_LAYERS_ON} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole('button', { name: /Instruments/ }));

    expect(onToggle).toHaveBeenCalledWith('instruments');
  });

  it('prints the alarm count on the alarm layer', () => {
    render(<PidLayerToggles layers={ALL_LAYERS_ON} onToggle={vi.fn()} alarmCount={3} />);

    expect(screen.getByRole('button', { name: /Alarms/ })).toHaveTextContent('3');
  });
});
