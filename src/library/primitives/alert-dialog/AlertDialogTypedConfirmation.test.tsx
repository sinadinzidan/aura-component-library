import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertDialogTypedConfirmation } from './AlertDialogTypedConfirmation';
import { renderAlertDialog } from './testUtils';

const action = () => within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete pipeline' });

describe(AlertDialogTypedConfirmation.name, () => {
  it('labels the field with the text to type', () => {
    renderAlertDialog({ root: { defaultOpen: true }, body: <AlertDialogTypedConfirmation text="23-KA-9103" /> });

    expect(screen.getByLabelText('Type 23-KA-9103 to confirm')).toBeInTheDocument();
  });

  it('keeps the action locked until the exact text is typed', async () => {
    const onConfirm = vi.fn();
    renderAlertDialog({
      root: { defaultOpen: true },
      action: { onConfirm },
      body: <AlertDialogTypedConfirmation text="23-KA-9103" />,
    });

    await userEvent.type(screen.getByRole('textbox'), '23-KA-910');
    expect(action()).toBeDisabled();
    await userEvent.type(screen.getByRole('textbox'), '3');
    await userEvent.click(action());

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('locks again when the text no longer matches', async () => {
    renderAlertDialog({ root: { defaultOpen: true }, body: <AlertDialogTypedConfirmation text="NK" /> });

    await userEvent.type(screen.getByRole('textbox'), 'NK');
    expect(action()).toBeEnabled();
    await userEvent.type(screen.getByRole('textbox'), '{Backspace}');

    expect(action()).toBeDisabled();
  });
});
