import { fireEvent, render, screen } from '@testing-library/react';

import { FilterPills } from './FilterPills';

const ITEMS = [
  { id: 'nk-20', label: 'Inlet', count: 1 },
  { id: 'nk-23', label: 'Compression', count: 4 },
];

describe(FilterPills.name, () => {
  it('marks the selected pills as pressed', () => {
    render(<FilterPills label="Filter by area" items={ITEMS} selected={['nk-23']} onToggle={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Compression/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Inlet/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the toggled pill', () => {
    const onToggle = vi.fn();
    render(<FilterPills label="Filter by area" items={ITEMS} selected={[]} onToggle={onToggle} />);

    fireEvent.click(screen.getByRole('button', { name: /Inlet/ }));

    expect(onToggle).toHaveBeenCalledWith('nk-20');
  });
});
