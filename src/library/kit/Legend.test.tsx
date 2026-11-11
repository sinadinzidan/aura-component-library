import { render, screen } from '@testing-library/react';

import { Legend } from './Legend';

describe(Legend.name, () => {
  it('lists every item with its tone, mark and value', () => {
    render(
      <Legend
        items={[
          { label: 'Today', tone: 'accent', mark: 'line' },
          { label: 'Plan', tone: 'warning', mark: 'dashed', value: '4.50' },
        ]}
      />
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('data-mark', 'line');
    expect(items[1]).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByText('4.50')).toBeInTheDocument();
  });
});
