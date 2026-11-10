import { render, screen } from '@testing-library/react';

import { PageFrame } from './PageFrame';

describe(PageFrame.name, () => {
  it('is a named group that holds the page', () => {
    render(
      <PageFrame title="Sign in">
        <h1>Sign in to Nordkapp</h1>
      </PageFrame>
    );

    const frame = screen.getByRole('group', { name: 'Template: Sign in' });
    expect(frame).toContainElement(screen.getByRole('heading', { name: 'Sign in to Nordkapp' }));
  });

  it('uses the given label instead of the default', () => {
    render(
      <PageFrame title="Sign in" label="Preview of the sign-in page">
        Page
      </PageFrame>
    );

    expect(screen.getByRole('group', { name: 'Preview of the sign-in page' })).toBeInTheDocument();
  });

  it('shows the title and address in a strip hidden from assistive technology', () => {
    const { container } = render(
      <PageFrame title="Sign in" address="nordkapp.example/sign-in">
        Page
      </PageFrame>
    );

    const strip = container.querySelector('[data-slot="page-frame-strip"]');
    expect(strip).toHaveAttribute('aria-hidden', 'true');
    expect(strip).toHaveTextContent('Sign in');
    expect(strip).toHaveTextContent('nordkapp.example/sign-in');
  });

  it('gives the viewport a fixed height, its own scroll and keyboard focus', () => {
    const { container } = render(
      <PageFrame title="Sign in" height="lg">
        Page
      </PageFrame>
    );

    const viewport = container.querySelector('[data-slot="page-frame-viewport"]');
    expect(viewport).toHaveClass('h-176', 'overflow-y-auto');
    expect(viewport).toHaveAttribute('tabindex', '0');
  });

  it('narrows to a handset column for the phone device', () => {
    render(
      <PageFrame title="Sign in" device="phone">
        Page
      </PageFrame>
    );

    const frame = screen.getByRole('group');
    expect(frame).toHaveAttribute('data-device', 'phone');
    expect(frame).toHaveClass('max-w-sm');
  });
});
