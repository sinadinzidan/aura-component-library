import { AlertDescription, AlertTitle } from '@cognite/aura/components/alert';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createMemoryDismissalStore } from './dismissalStore';
import { DismissibleAlert } from './DismissibleAlert';

describe(DismissibleAlert.name, () => {
  it('shows the message when it has not been dismissed', () => {
    renderAlert(createMemoryDismissalStore());

    expect(screen.getByRole('alert')).toHaveTextContent('Maintenance on Saturday');
  });

  it('hides the message and records the dismissal when closed', async () => {
    const store = createMemoryDismissalStore();
    const onDismiss = vi.fn();
    renderAlert(store, onDismiss);

    await userEvent.click(screen.getByRole('button', { name: 'Close alert' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(store.isDismissed('maintenance')).toBe(true);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stays hidden on the next mount once dismissed', () => {
    renderAlert(createMemoryDismissalStore(['maintenance']));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

function renderAlert(store: ReturnType<typeof createMemoryDismissalStore>, onDismiss?: () => void) {
  return render(
    <DismissibleAlert id="maintenance" store={store} variant="info" onDismiss={onDismiss}>
      <AlertTitle>Maintenance on Saturday</AlertTitle>
      <AlertDescription>Ingestion pauses from 02:00 to 04:00 UTC.</AlertDescription>
    </DismissibleAlert>
  );
}
