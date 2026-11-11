import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertDialogAcknowledgement } from './AlertDialogAcknowledgement';
import { renderAlertDialog } from './testUtils';

const action = () => within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete pipeline' });

describe(AlertDialogAcknowledgement.name, () => {
  it('keeps the action locked until the box is ticked', async () => {
    renderAlertDialog({
      root: { defaultOpen: true },
      body: <AlertDialogAcknowledgement>I understand that export stops</AlertDialogAcknowledgement>,
    });

    expect(action()).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: 'I understand that export stops' }));

    expect(action()).toBeEnabled();
  });

  it('does not lock the action when optional, and reports the choice', async () => {
    const onCheckedChange = vi.fn();
    renderAlertDialog({
      root: { defaultOpen: true },
      body: (
        <AlertDialogAcknowledgement required={false} onCheckedChange={onCheckedChange}>
          Don&apos;t ask again
        </AlertDialogAcknowledgement>
      ),
    });

    expect(action()).toBeEnabled();
    await userEvent.click(screen.getByRole('checkbox', { name: "Don't ask again" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('requires every acknowledgement when there are several', async () => {
    renderAlertDialog({
      root: { defaultOpen: true },
      body: (
        <>
          <AlertDialogAcknowledgement>The area is clear</AlertDialogAcknowledgement>
          <AlertDialogAcknowledgement>The permit is signed</AlertDialogAcknowledgement>
        </>
      ),
    });

    await userEvent.click(screen.getByRole('checkbox', { name: 'The area is clear' }));

    expect(action()).toBeDisabled();
  });
});
