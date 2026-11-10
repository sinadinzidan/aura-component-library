import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RetryBlock } from './RetryBlock';

describe(RetryBlock.name, () => {
  it('says what failed and how to recover', () => {
    render(<RetryBlock title="Couldn't load alarms" description="Check your connection." onRetry={() => Promise.resolve()} />);

    expect(screen.getByRole('heading', { name: "Couldn't load alarms" })).toBeInTheDocument();
    expect(screen.getByText('Check your connection.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('marks the button busy while the retry runs', async () => {
    const attempt = deferred();
    render(<RetryBlock title="Couldn't load alarms" onRetry={() => attempt.promise} />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('button', { name: 'Retrying…' })).toHaveAttribute('aria-busy', 'true');
  });

  it('ignores clicks while a retry is in flight', async () => {
    const attempt = deferred();
    const onRetry = vi.fn(() => attempt.promise);
    render(<RetryBlock title="Couldn't load alarms" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('button'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('reports a retry that failed again', async () => {
    const attempt = deferred();
    render(<RetryBlock title="Couldn't load alarms" onRetry={() => attempt.promise} />);
    await userEvent.click(screen.getByRole('button'));

    attempt.reject(new Error('offline'));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Still failing after 2 attempts.'));
    expect(screen.getByRole('button', { name: 'Try again' })).not.toHaveAttribute('aria-busy');
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
