import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AlertDialogCancel } from './AlertDialogCancel';
import { renderAlertDialog } from './testUtils';

describe(AlertDialogCancel.name, () => {
  it('closes without running the action', async () => {
    const onConfirm = vi.fn();
    renderAlertDialog({ root: { defaultOpen: true }, action: { onConfirm } });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('does not confirm when Enter is pressed right after opening', async () => {
    const onConfirm = vi.fn();
    renderAlertDialog({ root: { defaultOpen: true }, action: { onConfirm } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());

    await userEvent.keyboard('{Enter}');

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
