import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FilterChip } from './FilterChip';

describe(FilterChip.name, () => {
  it('shows the property and its value', () => {
    render(<FilterChip label="Site" value="Nordkapp" onRemove={vi.fn()} />);

    expect(screen.getByText('Site:')).toBeInTheDocument();
    expect(screen.getByText('Nordkapp')).toBeInTheDocument();
  });

  it('names the remove button after the whole filter', () => {
    render(<FilterChip label="Site" value="Nordkapp" onRemove={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Remove filter Site: Nordkapp' })).toBeInTheDocument();
  });

  it('calls onRemove when the remove button is pressed', async () => {
    const onRemove = vi.fn();
    render(<FilterChip label="Site" value="Nordkapp" onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove filter Site: Nordkapp' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
