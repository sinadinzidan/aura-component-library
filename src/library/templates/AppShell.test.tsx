import { render, screen } from '@testing-library/react';

import { AppShell } from './AppShell';

describe(AppShell.name, () => {
  it('renders the content in a named main region', () => {
    render(<AppShell contentLabel="Work orders">Page</AppShell>);

    expect(screen.getByRole('main', { name: 'Work orders' })).toHaveTextContent('Page');
  });

  it('renders every slot it is given', () => {
    render(
      <AppShell
        sidebar={<nav aria-label="Main" />}
        topbar={<div>Top bar</div>}
        subbar={<div>Tabs</div>}
        inspector={<aside aria-label="Properties" />}
        statusBar={<div>Connected</div>}
        bottomBar={<div>Bottom navigation</div>}
      >
        Page
      </AppShell>
    );

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Properties' })).toBeInTheDocument();
    expect(screen.getByText('Top bar')).toBeInTheDocument();
    expect(screen.getByText('Tabs')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Bottom navigation')).toBeInTheDocument();
  });

  it('leaves out the wrappers of empty slots', () => {
    const { container } = render(<AppShell>Page</AppShell>);

    expect(container.querySelector('[data-slot="app-shell-sidebar"]')).toBeNull();
    expect(container.querySelector('[data-slot="app-shell-topbar"]')).toBeNull();
    expect(container.querySelector('[data-slot="app-shell-inspector"]')).toBeNull();
    expect(container.querySelector('[data-slot="app-shell-status-bar"]')).toBeNull();
  });

  it('starts the top bar after the sidebar by default', () => {
    const { container } = render(
      <AppShell sidebar={<nav aria-label="Main" />} topbar={<div>Top bar</div>}>
        Page
      </AppShell>
    );

    const sidebar = container.querySelector('[data-slot="app-shell-sidebar"]');
    const topbar = container.querySelector('[data-slot="app-shell-topbar"]');
    expect(topbar?.parentElement).toBe(sidebar?.nextElementSibling);
  });

  it('puts the top bar across the whole window when asked', () => {
    const { container } = render(
      <AppShell sidebar={<nav aria-label="Main" />} topbar={<div>Top bar</div>} topbarSpan="window">
        Page
      </AppShell>
    );

    const shell = container.querySelector('[data-slot="app-shell"]');
    expect(container.querySelector('[data-slot="app-shell-topbar"]')?.parentElement).toBe(shell);
  });

  it('scrolls the content by default and hands scrolling to the page when turned off', () => {
    const { rerender } = render(<AppShell>Page</AppShell>);
    expect(screen.getByRole('main')).toHaveClass('overflow-y-auto');

    rerender(<AppShell scroll={false}>Page</AppShell>);

    expect(screen.getByRole('main')).toHaveClass('overflow-hidden');
  });

  it('paints the muted surface behind card-based pages', () => {
    render(<AppShell surface="muted">Page</AppShell>);

    expect(screen.getByRole('main')).toHaveClass('bg-muted-background');
  });
});
