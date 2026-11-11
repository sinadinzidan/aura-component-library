import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertDialogFooter } from './AlertDialogFooter';
import { deferred, renderAlertDialog } from './testUtils';

describe(AlertDialogFooter.name, () => {
  it('shows no error at rest', () => {
    renderAlertDialog({ root: { defaultOpen: true } });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('places cancel before the confirming action', () => {
    renderAlertDialog({ root: { defaultOpen: true } });

    const buttons = within(screen.getByRole('alertdialog')).getAllByRole('button');

    expect(buttons.map((button) => button.textContent)).toEqual(['Cancel', 'Delete pipeline']);
  });

  it('announces a failed confirm above the buttons', async () => {
    const action = deferred();
    renderAlertDialog({ root: { defaultOpen: true }, action: { onConfirm: () => action.promise } });
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete pipeline' }));

    await act(async () => action.reject(new Error('offline')));

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong. Try again.');
  });
});
