import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MobileDrawer } from './MobileDrawer';
import type { MobileDrawerProps } from './MobileDrawer';

function renderDrawer(props: Partial<MobileDrawerProps> = {}) {
  return render(
    <MobileDrawer
      open
      label="Main menu"
      header={<p>Nordkapp plant</p>}
      items={[{ id: 'work', label: 'Work orders', icon: <svg aria-hidden="true" />, detail: '23' }, { id: 'assets', label: 'Assets', icon: <svg aria-hidden="true" /> }]}
      activeId="work"
      onSelect={() => undefined}
      onClose={() => undefined}
      {...props}
    />
  );
}

describe(MobileDrawer.name, () => {
  it('renders nothing while closed', () => {
    renderDrawer({ open: false });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('lists the destinations, marks the current one and takes focus', () => {
    renderDrawer();

    expect(screen.getByRole('navigation', { name: 'Main menu' })).toHaveFocus();
    expect(screen.getByRole('button', { name: /Work orders/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('selects a destination and closes', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderDrawer({ onSelect, onClose });

    await userEvent.click(screen.getByRole('button', { name: /Assets/ }));

    expect(onSelect).toHaveBeenCalledWith('assets');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes with the scrim and with Escape', async () => {
    const onClose = vi.fn();
    renderDrawer({ onClose });

    await userEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
