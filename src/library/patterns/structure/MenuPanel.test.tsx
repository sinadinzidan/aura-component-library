import { render, screen } from '@testing-library/react';

import { MenuPanel } from './MenuPanel';

describe(MenuPanel.name, () => {
  it('renders a named surface around its content', () => {
    render(
      <MenuPanel label="Account menu">
        <button type="button">Sign out</button>
      </MenuPanel>
    );

    expect(screen.getByRole('group', { name: 'Account menu' })).toContainElement(
      screen.getByRole('button', { name: 'Sign out' })
    );
  });

  it('shows the trigger outside the surface', () => {
    render(
      <MenuPanel label="Account menu" trigger={<button type="button">Ingrid Haugen</button>}>
        Sign out
      </MenuPanel>
    );

    expect(screen.getByRole('button', { name: 'Ingrid Haugen' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Account menu' })).not.toContainElement(
      screen.getByRole('button', { name: 'Ingrid Haugen' })
    );
  });

  it('lines up with the end of the trigger when asked', () => {
    const { container } = render(
      <MenuPanel label="Account menu" align="end">
        Sign out
      </MenuPanel>
    );

    expect(container.firstElementChild).toHaveClass('items-end');
  });

  it('applies the requested width', () => {
    render(
      <MenuPanel label="Notifications" width="lg">
        Nothing new
      </MenuPanel>
    );

    expect(screen.getByRole('group', { name: 'Notifications' })).toHaveClass('w-96');
  });
});
