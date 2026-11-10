import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SkipLink } from './SkipLink';

describe(SkipLink.name, () => {
  it('links to the target id', () => {
    render(<SkipLink targetId="main" />);

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
  });

  it('moves focus to the target when activated', async () => {
    render(
      <>
        <SkipLink targetId="main-region" />
        <button>Navigation</button>
        <main id="main-region" tabIndex={-1}>
          Content
        </main>
      </>
    );

    await userEvent.click(screen.getByRole('link', { name: 'Skip to content' }));

    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('is the first stop in the tab order', async () => {
    render(
      <>
        <SkipLink targetId="main" />
        <button>Navigation</button>
      </>
    );

    await userEvent.tab();

    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();
  });

  it('uses the injected finder', async () => {
    const target = document.createElement('div');
    target.tabIndex = -1;
    document.body.appendChild(target);
    const findTarget = vi.fn(() => target);
    render(<SkipLink targetId="elsewhere" findTarget={findTarget} label="Skip to alarm list" />);

    await userEvent.click(screen.getByRole('link', { name: 'Skip to alarm list' }));

    expect(findTarget).toHaveBeenCalledWith('elsewhere');
    expect(target).toHaveFocus();
    target.remove();
  });

  it('is hidden until focused in the overlay variant and visible in the inline variant', () => {
    const { rerender } = render(<SkipLink targetId="main" />);
    expect(screen.getByRole('link')).toHaveClass('sr-only');

    rerender(<SkipLink targetId="main" variant="inline" />);

    expect(screen.getByRole('link')).not.toHaveClass('sr-only');
  });
});
