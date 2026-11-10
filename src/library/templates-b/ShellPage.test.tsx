import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { SidebarNavGroup } from '../patterns/structure/SidebarNav';

import { ShellPage } from './ShellPage';

const NAV: readonly SidebarNavGroup[] = [
  {
    id: 'main',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'orders', label: 'Work orders' },
    ],
  },
];

describe(ShellPage.name, () => {
  it('shows the product, the navigation and the page in main', () => {
    render(
      <ShellPage product="Nordkapp" nav={NAV} activeId="orders" trail={['Nordkapp', 'Work orders']}>
        <h1>Work orders</h1>
      </ShellPage>
    );

    const sidebar = screen.getByRole('complementary', { name: 'Sidebar' });
    expect(within(sidebar).getByText('Nordkapp')).toBeInTheDocument();
    expect(within(screen.getByRole('navigation', { name: 'Main' })).getByText('Overview')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Work orders' })).toBeInTheDocument();
  });

  it('marks the active destination as the current page', () => {
    render(
      <ShellPage product="Nordkapp" nav={NAV} activeId="orders" trail={['Work orders']}>
        Page
      </ShellPage>
    );

    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('button', { name: 'Work orders' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('reports the destination that was chosen', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <ShellPage product="Nordkapp" nav={NAV} activeId="orders" onNavigate={onNavigate} trail={['Work orders']}>
        Page
      </ShellPage>
    );

    await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('button', { name: 'Overview' }));

    expect(onNavigate).toHaveBeenCalledWith('overview');
  });

  it('renders the trail with the last entry as the current page', () => {
    render(
      <ShellPage product="Nordkapp" nav={NAV} trail={['Maintenance', 'Work orders', 'WO-104482']}>
        Page
      </ShellPage>
    );

    const trail = within(screen.getByRole('banner')).getByRole('navigation');
    expect(within(trail).getByText('Maintenance')).toBeInTheDocument();
    expect(within(trail).getByText('WO-104482')).toHaveAttribute('aria-current', 'page');
  });

  it('renders top bar content, a banner strip and a sidebar footer', () => {
    const { container } = render(
      <ShellPage
        product="Nordkapp"
        nav={NAV}
        trail={['Overview']}
        topbarEnd={<button type="button">Help</button>}
        banner={<p>You are offline</p>}
        sidebarFooter={<span>Ingrid Haugen</span>}
      >
        Page
      </ShellPage>
    );

    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'Help' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot="shell-page-banner"]')).toHaveTextContent('You are offline');
    expect(within(screen.getByRole('complementary', { name: 'Sidebar' })).getByText('Ingrid Haugen')).toBeInTheDocument();
  });

  it('centres a whole-page state in the content area', () => {
    render(
      <ShellPage product="Nordkapp" nav={NAV} trail={['Overview']} contentAlign="center">
        Not found
      </ShellPage>
    );

    expect(screen.getByRole('main')).toHaveAttribute('data-align', 'center');
    expect(screen.getByRole('main')).toHaveClass('items-center', 'justify-center');
  });

  it('drops the content padding when flush', () => {
    render(
      <ShellPage product="Nordkapp" nav={NAV} trail={['Overview']} flush>
        Page
      </ShellPage>
    );

    expect(screen.getByRole('main')).not.toHaveClass('p-6');
  });
});
