import { render, screen } from '@testing-library/react';

import { Crumbs } from './Crumbs';

describe(Crumbs.name, () => {
  it('lists the path and marks the last entry as the current page', () => {
    render(<Crumbs items={['Nordkapp', 'Gas compression', 'Recompressor']} />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Recompressor')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('Nordkapp')).not.toHaveAttribute('aria-current');
  });
});
