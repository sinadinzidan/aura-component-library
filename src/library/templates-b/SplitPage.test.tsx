import { render, screen, within } from '@testing-library/react';

import { SplitPage } from './SplitPage';

describe(SplitPage.name, () => {
  it('puts the task in main and the support in a named aside', () => {
    render(
      <SplitPage aside={<p>One plant, one picture</p>} asideLabel="About Nordkapp">
        <h1>Sign in</h1>
      </SplitPage>
    );

    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(within(screen.getByRole('complementary', { name: 'About Nordkapp' })).getByText('One plant, one picture')).toBeInTheDocument();
  });

  it('renders the header and footer of the working half', () => {
    render(
      <SplitPage aside="Aside" asideLabel="About" header={<span>Nordkapp</span>} footer={<a href="#terms">Terms</a>}>
        Form
      </SplitPage>
    );

    expect(within(screen.getByRole('banner')).getByText('Nordkapp')).toBeInTheDocument();
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Terms' })).toBeInTheDocument();
  });

  it('moves the aside to the left edge when asked', () => {
    const { container } = render(
      <SplitPage aside="Aside" asideLabel="About" asideSide="left">
        Form
      </SplitPage>
    );

    expect(screen.getByRole('complementary')).toHaveClass('border-r');
    expect(container.querySelector('[data-slot="split-page-main"]')).toHaveClass('@3xl:order-2');
  });

  it('gives the task two thirds when the aside takes a third', () => {
    const { container } = render(
      <SplitPage aside="Aside" asideLabel="About" asideShare="third">
        Form
      </SplitPage>
    );

    expect(container.querySelector('[data-slot="split-page-main"]')).toHaveClass('@3xl:col-span-2');
  });

  it('tints the aside by default and leaves it plain on request', () => {
    const { rerender } = render(
      <SplitPage aside="Aside" asideLabel="About">
        Form
      </SplitPage>
    );
    expect(screen.getByRole('complementary')).toHaveAttribute('data-surface', 'muted');

    rerender(
      <SplitPage aside="Aside" asideLabel="About" asideSurface="plain">
        Form
      </SplitPage>
    );
    expect(screen.getByRole('complementary')).not.toHaveClass('bg-muted-background');
  });
});
