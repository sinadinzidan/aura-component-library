import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TableRowAction } from './TableRowAction';

describe(TableRowAction.name, () => {
  it('is a link when it has an href', () => {
    render(<TableRowAction href="#wo-104482">WO-104482</TableRowAction>);

    expect(screen.getByRole('link', { name: 'WO-104482' })).toHaveAttribute('href', '#wo-104482');
  });

  it('is a button otherwise and reports clicks', async () => {
    const onClick = vi.fn();
    render(<TableRowAction onClick={onClick}>WO-104482</TableRowAction>);

    await userEvent.click(screen.getByRole('button', { name: 'WO-104482' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be activated from the keyboard', async () => {
    const onClick = vi.fn();
    render(<TableRowAction onClick={onClick}>WO-104482</TableRowAction>);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
