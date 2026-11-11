import { render, screen } from '@testing-library/react';

import { MobileStack } from './MobileStack';
import type { StackEntry } from './navStack';

const ENTRY: StackEntry = { id: 'order-2', screen: 'order', title: 'WO-104482' };

function renderStack(direction: Parameters<typeof MobileStack>[0]['direction'], entry = ENTRY) {
  return render(<MobileStack entry={entry} direction={direction} render={(current) => <p>{current.title}</p>} />);
}

describe(MobileStack.name, () => {
  it('draws the top screen', () => {
    renderStack('none');

    expect(screen.getByText('WO-104482')).toBeInTheDocument();
  });

  it('starts a pushed screen off to the right and settles it in', async () => {
    renderStack('push');
    const screenElement = document.querySelector<HTMLElement>('[data-slot="mobile-stack-screen"]');

    expect(screenElement?.dataset.direction).toBe('push');
    await vi.waitFor(() => expect(screenElement?.style.transform).toBe('none'));
  });

  it('shows a tab change at once', () => {
    renderStack('switch');

    expect(document.querySelector<HTMLElement>('[data-slot="mobile-stack-screen"]')?.style.transform).toBe('none');
  });

  it('replaces the screen when the entry changes', () => {
    const { rerender } = renderStack('push');

    rerender(<MobileStack entry={{ id: 'asset-3', screen: 'asset', title: '23-KA-9103' }} direction="push" render={(current) => <p>{current.title}</p>} />);

    expect(screen.getByText('23-KA-9103')).toBeInTheDocument();
    expect(screen.queryByText('WO-104482')).not.toBeInTheDocument();
  });
});
