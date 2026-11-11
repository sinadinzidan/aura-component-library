import { render, screen } from '@testing-library/react';

import { DropArea } from './DropArea';

describe(DropArea.name, () => {
  it('prompts for a file while empty', () => {
    const { container } = render(<DropArea title="Drop a CSV file" hint="Up to 20 MB" action={<button type="button">Browse</button>} />);

    expect(screen.getByText('Drop a CSV file')).toBeInTheDocument();
    expect(screen.getByText('Up to 20 MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Browse' })).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('data-state', 'empty');
  });

  it('shows the chosen file instead of the prompt', () => {
    const { container } = render(<DropArea title="Drop a CSV file" hint="Up to 20 MB" file={{ name: 'limits.csv', detail: '42 rows' }} />);

    expect(screen.getByText('limits.csv')).toBeInTheDocument();
    expect(screen.getByText('42 rows')).toBeInTheDocument();
    expect(screen.queryByText('Drop a CSV file')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-state', 'filled');
  });
});
