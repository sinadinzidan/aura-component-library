import { render, screen } from '@testing-library/react';

import { Panel } from './Panel';

describe(Panel.name, () => {
  it('is a region named by its title', () => {
    render(<Panel title="Open alarms">Rows</Panel>);

    expect(screen.getByRole('region', { name: 'Open alarms' })).toHaveTextContent('Rows');
  });

  it('shows subtitle, actions and footer', () => {
    render(
      <Panel title="Open alarms" subtitle="5 open" actions={<button type="button">View all</button>} footer="Updated 14:00">
        Rows
      </Panel>
    );

    expect(screen.getByText('5 open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View all' })).toBeInTheDocument();
    expect(screen.getByText('Updated 14:00')).toBeInTheDocument();
  });

  it('renders no header without a title, icon or actions', () => {
    const { container } = render(<Panel>Rows</Panel>);

    expect(container.querySelector('header')).toBeNull();
  });

  it('carries tone and padding for the look to style', () => {
    const { container } = render(
      <Panel tone="critical" padding="none">
        Rows
      </Panel>
    );

    expect(container.firstElementChild).toHaveAttribute('data-tone', 'critical');
    expect(container.firstElementChild).toHaveAttribute('data-pad', 'none');
  });

  it('is a default panel unless asked to float', () => {
    const { container, rerender } = render(<Panel>Rows</Panel>);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'default');

    rerender(<Panel variant="floating">Rows</Panel>);
    expect(container.firstElementChild).toHaveAttribute('data-variant', 'floating');
  });
});
