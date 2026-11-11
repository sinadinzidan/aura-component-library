import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterGroup } from './FilterGroup';

const OPTIONS = [
  { id: 'nk-20', label: 'Inlet', count: 3 },
  { id: 'nk-23', label: 'Compression', count: 5, tone: 'warning' as const },
];

describe(FilterGroup.name, () => {
  it('is a group named by its title with checked options and counts', () => {
    render(<FilterGroup title="Area" options={OPTIONS} value={['nk-23']} />);

    expect(screen.getByRole('group', { name: 'Area' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Compression/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Inlet/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Compression/ })).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('adds an unchecked option and removes a checked one', async () => {
    const onChange = vi.fn();
    render(<FilterGroup title="Area" options={OPTIONS} value={['nk-23']} onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: /Inlet/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Compression/ }));

    expect(onChange).toHaveBeenNthCalledWith(1, ['nk-23', 'nk-20']);
    expect(onChange).toHaveBeenNthCalledWith(2, []);
  });
});
