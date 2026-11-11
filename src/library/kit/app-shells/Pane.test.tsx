import { render, screen } from '@testing-library/react';

import { Pane } from './Pane';

describe(Pane.name, () => {
  it('is a region named by its title, with subtitle, actions and footer', () => {
    render(
      <Pane title="Work orders" subtitle="6 open" actions={<button type="button">New</button>} footer="Page 1 of 3">
        Rows
      </Pane>
    );

    expect(screen.getByRole('region', { name: 'Work orders' })).toHaveTextContent('Rows');
    expect(screen.getByText('6 open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });

  it('renders no header without a title or actions and carries surface and padding', () => {
    const { container } = render(
      <Pane surface="well" padding="none">
        Rows
      </Pane>
    );

    expect(container.querySelector('header')).toBeNull();
    expect(container.firstElementChild).toHaveAttribute('data-surface', 'well');
    expect(container.firstElementChild).toHaveAttribute('data-pad', 'none');
  });
});
