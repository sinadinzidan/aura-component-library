import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { StateBlock } from './StateBlock';
import type { RegionStatus } from './StateBlock';

describe(StateBlock.name, () => {
  it('shows the content when ready', () => {
    renderBlock('ready');

    expect(screen.getByText('14 work orders')).toBeInTheDocument();
  });

  it('shows the skeleton in a busy region while loading', () => {
    renderBlock('loading');

    expect(screen.getByText('Skeleton').parentElement).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('14 work orders')).not.toBeInTheDocument();
  });

  it('shows the empty message with its action', () => {
    renderBlock('empty');

    expect(screen.getByRole('heading', { name: 'No work orders yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create work order' })).toBeInTheDocument();
  });

  it('retries from the error state', async () => {
    const onRetry = vi.fn(() => Promise.resolve());
    renderBlock('error', onRetry);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('heading', { name: "Couldn't load work orders" })).toBeInTheDocument();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the no-access message instead of the content', () => {
    renderBlock('no-access');

    expect(screen.getByRole('heading', { name: 'You need access to work orders' })).toBeInTheDocument();
    expect(screen.queryByText('14 work orders')).not.toBeInTheDocument();
  });
});

function renderBlock(status: RegionStatus, onRetry: () => Promise<unknown> = () => Promise.resolve()) {
  return render(
    <StateBlock
      status={status}
      loading={<span>Skeleton</span>}
      empty={{ title: 'No work orders yet', action: <button type="button">Create work order</button> }}
      error={{ title: "Couldn't load work orders", onRetry }}
      noAccess={{ title: 'You need access to work orders' }}
    >
      <p>14 work orders</p>
    </StateBlock>
  );
}
