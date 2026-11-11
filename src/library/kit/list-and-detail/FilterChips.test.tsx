import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterChips } from './FilterChips';

const OPTIONS = [
  { id: 'all', label: 'All', count: 8 },
  { id: 'open', label: 'Open', count: 2 },
];

describe(FilterChips.name, () => {
  it('presses the active option and shows counts', () => {
    render(<FilterChips label="Filter by status" options={OPTIONS} value="open" />);

    expect(screen.getByRole('group', { name: 'Filter by status' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /All/ })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('reports the chosen option', async () => {
    const onChange = vi.fn();
    render(<FilterChips label="Filter by status" options={OPTIONS} value="open" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /All/ }));

    expect(onChange).toHaveBeenCalledWith('all');
  });
});
