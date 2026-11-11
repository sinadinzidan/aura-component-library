import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertDialog } from './AlertDialog';
import { deferred, renderAlertDialog } from './testUtils';

const trigger = () => screen.getByRole('button', { name: 'Delete pipeline' });
const dialog = () => screen.getByRole('alertdialog');
const confirmButton = () => within(dialog()).getByRole('button', { name: /Delet/ });

describe(AlertDialog.name, () => {
  it('opens from the trigger as an alertdialog', async () => {
    renderAlertDialog();

    await userEvent.click(trigger());

    expect(screen.getByRole('alertdialog', { name: 'Delete pipeline?' })).toBeInTheDocument();
  });

  it('does not close on an outside press', async () => {
    renderAlertDialog({ root: { defaultOpen: true } });

    await userEvent.click(document.body);

    expect(dialog()).toBeInTheDocument();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    renderAlertDialog();
    await userEvent.click(trigger());

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger()).toHaveFocus());
  });

  it('confirms a synchronous action and closes', async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderAlertDialog({ root: { defaultOpen: true, onOpenChange }, action: { onConfirm } });

    await userEvent.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('stays open, busy and undismissable while the action is in flight', async () => {
    const action = deferred();
    renderAlertDialog({
      root: { defaultOpen: true },
      action: { onConfirm: () => action.promise, pendingLabel: 'Deleting…' },
    });

    await userEvent.click(confirmButton());
    await userEvent.keyboard('{Escape}');

    expect(within(dialog()).getByRole('button', { name: 'Deleting…' })).toHaveAttribute('aria-busy', 'true');
    expect(within(dialog()).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(dialog()).toHaveAttribute('aria-busy', 'true');
  });

  it('closes when the asynchronous action succeeds', async () => {
    const action = deferred();
    renderAlertDialog({ root: { defaultOpen: true }, action: { onConfirm: () => action.promise } });
    await userEvent.click(confirmButton());

    await act(async () => action.resolve());

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('stays open with an error when the action fails, and can be retried', async () => {
    const action = deferred();
    const onConfirm = vi.fn(() => action.promise);
    renderAlertDialog({
      root: { defaultOpen: true },
      action: { onConfirm, errorMessage: 'Could not delete the pipeline. Try again.' },
    });
    await userEvent.click(confirmButton());

    await act(async () => action.reject(new Error('offline')));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the pipeline. Try again.');
    await userEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });

  it('follows a controlled open prop', () => {
    renderAlertDialog({ root: { open: false } });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
