import { render, screen, within } from '@testing-library/react';

import { CenteredPage } from './CenteredPage';

describe(CenteredPage.name, () => {
  it('puts the content in the main landmark', () => {
    render(
      <CenteredPage>
        <h1>Sign in</h1>
      </CenteredPage>
    );

    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('renders header and footer in their landmarks', () => {
    render(
      <CenteredPage header={<span>Nordkapp</span>} footer={<a href="#privacy">Privacy</a>}>
        Content
      </CenteredPage>
    );

    expect(within(screen.getByRole('banner')).getByText('Nordkapp')).toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Privacy' })).toBeInTheDocument();
  });

  it('leaves out header and footer when not given', () => {
    render(<CenteredPage>Content</CenteredPage>);

    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });

  it('caps the column at the chosen width', () => {
    render(
      <CenteredPage width="lg">
        <p>Content</p>
      </CenteredPage>
    );

    expect(screen.getByText('Content').parentElement).toHaveClass('max-w-2xl');
  });

  it('starts from the top when asked, and takes the chosen surface', () => {
    const { container } = render(
      <CenteredPage align="top" surface="base">
        Content
      </CenteredPage>
    );

    expect(screen.getByRole('main')).toHaveClass('justify-start');
    expect(container.querySelector('[data-slot="centered-page"]')).toHaveAttribute('data-surface', 'base');
  });
});
