import { fireEvent, render, screen } from '@testing-library/react';

import { LayerFilter } from './LayerFilter';
import type { ViewerSystem } from './viewerModelLogic';

const ALL: ViewerSystem[] = ['separation', 'compression', 'cooling', 'piping', 'structure'];

describe(LayerFilter.name, () => {
  it('lists every system with its part count', () => {
    render(<LayerFilter enabled={ALL} onEnabledChange={() => undefined} mode="ghost" onModeChange={() => undefined} />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(5);
    expect(screen.getByText('Piping').closest('li')).toHaveTextContent('3');
  });

  it('switches a layer off', () => {
    const onEnabledChange = vi.fn();
    render(<LayerFilter enabled={ALL} onEnabledChange={onEnabledChange} mode="ghost" onModeChange={() => undefined} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Cooling and lube' }));

    expect(onEnabledChange).toHaveBeenCalledWith(['separation', 'compression', 'piping', 'structure']);
  });

  it('switches a layer back on', () => {
    const onEnabledChange = vi.fn();
    render(<LayerFilter enabled={['piping']} onEnabledChange={onEnabledChange} mode="ghost" onModeChange={() => undefined} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Structure' }));

    expect(onEnabledChange).toHaveBeenCalledWith(['piping', 'structure']);
  });

  it('chooses between ghosting and hiding', () => {
    const onModeChange = vi.fn();
    render(<LayerFilter enabled={ALL} onEnabledChange={() => undefined} mode="ghost" onModeChange={onModeChange} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Hide' }));

    expect(onModeChange).toHaveBeenCalledWith('hide');
  });
});
