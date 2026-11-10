import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AppTopbar } from './AppTopbar';
import type { AppTopbarCrumb } from './AppTopbar';

const TRAIL: readonly AppTopbarCrumb[] = [
  { id: 'app', label: 'Plant operations' },
  { id: 'orders', label: 'Work orders' },
  { id: 'order', label: 'WO-104482' },
];

describe(AppTopbar.name, () => {
  it('marks the last crumb as the current page', () => {
    render(<AppTopbar icon={<svg />} trail={TRAIL} />);

    expect(screen.getByText('WO-104482')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Work orders' })).toBeInTheDocument();
    expect(screen.getByText('WO-104482')).toHaveAttribute('aria-disabled', 'true');
  });

  it('reports the crumb that was chosen', async () => {
    const onNavigate = vi.fn();
    render(<AppTopbar icon={<svg />} trail={TRAIL} onNavigate={onNavigate} />);

    await userEvent.click(screen.getByRole('link', { name: 'Work orders' }));

    expect(onNavigate).toHaveBeenCalledWith(TRAIL[1]);
  });

  it('keeps a crumb with an address as a real link', () => {
    render(<AppTopbar icon={<svg />} trail={[{ id: 'app', label: 'Plant operations', href: '/overview.test' }, TRAIL[1]]} />);

    expect(screen.getByRole('link', { name: 'Plant operations' })).toHaveAttribute('href', '/overview.test');
  });

  it('shows metadata, global navigation and system controls when given', () => {
    render(
      <AppTopbar
        icon={<svg />}
        trail={TRAIL}
        metadata="Saved 2 min ago"
        center={<nav aria-label="Global" />}
        actions={<button type="button">Notifications</button>}
      />
    );

    expect(screen.getByText('Saved 2 min ago')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Global' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('shows the signed-in person as an avatar', () => {
    render(<AppTopbar icon={<svg />} trail={TRAIL} userName="Ingrid Haugen" />);

    expect(screen.getByText('IH')).toBeInTheDocument();
  });
});
