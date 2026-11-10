import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ShowMore } from './ShowMore';

describe(ShowMore.name, () => {
  it('shows the summary and hides the rest at first', () => {
    renderShowMore({});

    expect(screen.getByText('Tripped on high vibration.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('reveals the rest and flips the label when expanded', async () => {
    renderShowMore({});

    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));

    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Bearing inspection is under way.')).toBeVisible();
  });

  it('collapses again on a second click', async () => {
    renderShowMore({});
    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));

    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));

    expect(screen.getByRole('button', { name: 'Show more' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts expanded when asked', () => {
    renderShowMore({ defaultOpen: true });

    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('reports each change', async () => {
    const { onOpenChange } = renderShowMore({});

    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('uses custom labels', () => {
    renderShowMore({ moreLabel: 'Read full note' });

    expect(screen.getByRole('button', { name: 'Read full note' })).toBeInTheDocument();
  });
});

function renderShowMore(overrides: { defaultOpen?: boolean; moreLabel?: string }) {
  const onOpenChange = vi.fn();
  render(
    <ShowMore
      summary="Tripped on high vibration."
      defaultOpen={overrides.defaultOpen}
      moreLabel={overrides.moreLabel}
      onOpenChange={onOpenChange}
    >
      Bearing inspection is under way.
    </ShowMore>
  );
  return { onOpenChange };
}
