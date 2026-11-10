import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from './ConfirmDialog';

describe(ConfirmDialog.name, () => {
  it('shows the title, consequence and specific action when open', () => {
    renderDialog({});

    expect(screen.getByRole('dialog', { name: 'Delete 23-KA-9103?' })).toBeInTheDocument();
    expect(screen.getByText('All history is removed.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete asset' })).toBeEnabled();
  });

  it('renders nothing while closed', () => {
    renderDialog({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirms and closes when the action is synchronous', async () => {
    const { onConfirm, onOpenChange } = renderDialog({});

    await userEvent.click(screen.getByRole('button', { name: 'Delete asset' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes without confirming when cancelled', async () => {
    const { onConfirm, onOpenChange } = renderDialog({});

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the action locked until the exact name is typed', async () => {
    const { onConfirm } = renderDialog({ confirmText: '23-KA-9103' });
    const confirm = screen.getByRole('button', { name: 'Delete asset' });

    await userEvent.type(screen.getByRole('textbox'), '23-KA-910');
    expect(confirm).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), '3');
    await userEvent.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('stays open, busy and undismissable while the action is in flight', async () => {
    const action = deferred();
    const { onOpenChange } = renderDialog({ onConfirm: vi.fn(() => action.promise), pendingLabel: 'Deleting…' });

    await userEvent.click(screen.getByRole('button', { name: 'Delete asset' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Deleting…' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes once the pending action resolves', async () => {
    const action = deferred();
    const { onOpenChange } = renderDialog({ onConfirm: vi.fn(() => action.promise) });
    await userEvent.click(screen.getByRole('button', { name: 'Delete asset' }));

    action.resolve();

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('stays open and reports the failure when the action rejects', async () => {
    const action = deferred();
    const { onOpenChange } = renderDialog({
      onConfirm: vi.fn(() => action.promise),
      errorMessage: 'Could not delete the asset. Try again.',
    });
    await userEvent.click(screen.getByRole('button', { name: 'Delete asset' }));

    action.reject(new Error('failed'));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the asset. Try again.');
    expect(screen.getByRole('button', { name: 'Delete asset' })).toBeEnabled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

type Overrides = {
  open?: boolean;
  confirmText?: string;
  pendingLabel?: string;
  errorMessage?: string;
  onConfirm?: () => void | Promise<void>;
};

function renderDialog(overrides: Overrides) {
  const onConfirm = overrides.onConfirm ?? vi.fn();
  const onOpenChange = vi.fn();
  render(
    <ConfirmDialog
      open={overrides.open ?? true}
      onOpenChange={onOpenChange}
      title="Delete 23-KA-9103?"
      description="All history is removed."
      confirmLabel="Delete asset"
      destructive
      confirmText={overrides.confirmText}
      pendingLabel={overrides.pendingLabel}
      errorMessage={overrides.errorMessage}
      onConfirm={onConfirm}
    />
  );
  return { onConfirm, onOpenChange };
}

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}
