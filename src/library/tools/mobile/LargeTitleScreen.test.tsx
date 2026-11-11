import { fireEvent, render, screen } from '@testing-library/react';

import { LargeTitleScreen } from './LargeTitleScreen';

function scrollTo(top: number) {
  const scroller = document.querySelector('[data-slot="large-title-scroll"]');
  if (!scroller) throw new Error('no scroller');
  Object.defineProperty(scroller, 'scrollTop', { value: top, configurable: true });
  fireEvent.scroll(scroller);
}

describe(LargeTitleScreen.name, () => {
  it('shows the large title and hides the bar title at the top', () => {
    render(
      <LargeTitleScreen title="Work orders">
        <p>List</p>
      </LargeTitleScreen>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Work orders' })).toBeInTheDocument();
    expect(document.querySelector('[data-slot="large-title-screen"]')).not.toHaveAttribute('data-collapsed');
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('moves the title into the bar after scrolling', () => {
    render(
      <LargeTitleScreen title="Work orders">
        <p>List</p>
      </LargeTitleScreen>
    );

    scrollTo(80);

    expect(document.querySelector('[data-slot="large-title-screen"]')).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'Work orders' })).toBeInTheDocument();
  });

  it('starts collapsed when it starts scrolled', () => {
    render(
      <LargeTitleScreen title="Work orders" initialScrollTop={100}>
        <p>List</p>
      </LargeTitleScreen>
    );

    expect(document.querySelector('[data-slot="large-title-screen"]')).toHaveAttribute('data-collapsed', 'true');
  });

  it('shows leading and trailing controls in the bar', () => {
    render(
      <LargeTitleScreen title="Work orders" leading={<button type="button">Menu</button>} actions={<button type="button">Search</button>}>
        <p>List</p>
      </LargeTitleScreen>
    );

    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });
});
