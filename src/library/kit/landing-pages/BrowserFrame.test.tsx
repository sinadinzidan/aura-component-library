import { render, screen } from '@testing-library/react';

import { BrowserFrame } from './BrowserFrame';

describe(BrowserFrame.name, () => {
  it('shows the address and draws the page in the given look', () => {
    render(
      <BrowserFrame url="nordkapp.test/home" look="poster">
        <main>Home</main>
      </BrowserFrame>,
    );

    expect(screen.getByText('nordkapp.test/home')).toBeInTheDocument();
    expect(screen.getByRole('main').closest('[data-look]')).toHaveAttribute('data-look', 'poster');
  });

  it('keeps the page at least as tall as asked', () => {
    render(
      <BrowserFrame url="nordkapp.test" look="studio" minHeight={720}>
        <main>Home</main>
      </BrowserFrame>,
    );

    expect(screen.getByRole('main').closest('[data-look]')?.parentElement).toHaveStyle({ minHeight: '720px' });
  });
});
