import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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

  it('shows the trigger outside the surface and marks it expanded', () => {
    render(
      <MenuPanel
        label="Account menu"
        trigger={(props) => (
          <button type="button" {...props}>
            Ingrid Haugen
          </button>
        )}
      >
        Sign out
      </MenuPanel>
    );

    const trigger = screen.getByRole('button', { name: 'Ingrid Haugen' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('group', { name: 'Account menu' })).not.toContainElement(trigger);
  });

  it('hides and shows the panel when the trigger is pressed', async () => {
    render(
      <MenuPanel
        label="Account menu"
        trigger={(props) => (
          <button type="button" {...props}>
            Ingrid Haugen
          </button>
        )}
      >
        Sign out
      </MenuPanel>
    );
    const trigger = screen.getByRole('button', { name: 'Ingrid Haugen' });

    await userEvent.click(trigger);

    expect(screen.queryByRole('group', { name: 'Account menu' })).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(trigger);

    expect(screen.getByRole('group', { name: 'Account menu' })).toBeInTheDocument();
  });

  it('can start closed', () => {
    render(
      <MenuPanel label="Account menu" defaultOpen={false}>
        Sign out
      </MenuPanel>
    );

    expect(screen.queryByRole('group', { name: 'Account menu' })).not.toBeInTheDocument();
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
