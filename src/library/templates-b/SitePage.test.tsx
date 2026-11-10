import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SitePage } from './SitePage';

const LINKS = [
  { id: 'product', label: 'Product' },
  { id: 'docs', label: 'Docs' },
];

describe(SitePage.name, () => {
  it('renders the mark, the sections and the footer in their landmarks', () => {
    render(
      <SitePage brand={<span>Nordkapp</span>} footer={<span>Terms</span>}>
        <h1>See the whole plant</h1>
      </SitePage>
    );

    expect(within(screen.getByRole('banner')).getByText('Nordkapp')).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'See the whole plant' })).toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByText('Terms')).toBeInTheDocument();
  });

  it('marks the current destination', () => {
    render(
      <SitePage brand="Nordkapp" links={LINKS} activeLinkId="docs">
        Page
      </SitePage>
    );

    const nav = screen.getByRole('navigation', { name: 'Site' });
    expect(within(nav).getByRole('button', { name: 'Docs' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('button', { name: 'Product' })).not.toHaveAttribute('aria-current');
  });

  it('reports the destination that was chosen', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <SitePage brand="Nordkapp" links={LINKS} onNavigate={onNavigate}>
        Page
      </SitePage>
    );

    await user.click(screen.getByRole('button', { name: 'Product' }));

    expect(onNavigate).toHaveBeenCalledWith('product');
  });

  it('leaves out the navigation and footer when there is nothing to put in them', () => {
    render(<SitePage brand="Nordkapp">Page</SitePage>);

    expect(screen.queryByRole('navigation')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('shows header actions', () => {
    render(
      <SitePage brand="Nordkapp" actions={<button type="button">Sign in</button>}>
        Page
      </SitePage>
    );

    expect(within(screen.getByRole('banner')).getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });
});
