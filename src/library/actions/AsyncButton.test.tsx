import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AsyncButton } from './AsyncButton';

describe(AsyncButton.name, () => {
  it('shows the pending label and marks itself busy while the action runs', async () => {
    const action = deferred();
    render(
      <AsyncButton onAction={() => action.promise} pendingLabel="Saving…">
        Save changes
      </AsyncButton>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByRole('button', { name: 'Saving…' })).toHaveAttribute('aria-busy', 'true');
  });

  it('ignores clicks while the action is in flight', async () => {
    const action = deferred();
    const onAction = vi.fn(() => action.promise);
    render(<AsyncButton onAction={onAction}>Run pipeline</AsyncButton>);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('button'));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('returns to its resting label when the action resolves', async () => {
    const action = deferred();
    render(
      <AsyncButton onAction={() => action.promise} pendingLabel="Saving…">
        Save changes
      </AsyncButton>
    );
    await userEvent.click(screen.getByRole('button'));

    action.resolve();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).not.toHaveAttribute('aria-busy'));
  });

  it('returns to its resting label when the action rejects', async () => {
    const action = deferred();
    render(<AsyncButton onAction={() => action.promise}>Save changes</AsyncButton>);
    await userEvent.click(screen.getByRole('button'));

    action.reject(new Error('failed'));

    await waitFor(() => expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy'));
  });
});

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}
