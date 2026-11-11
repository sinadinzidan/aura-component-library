import { screen, waitFor } from '@testing-library/react';

import { AlertDialogContent } from './AlertDialogContent';
import { AlertDialogTypedConfirmation } from './AlertDialogTypedConfirmation';
import { renderAlertDialog } from './testUtils';

describe(AlertDialogContent.name, () => {
  it('has no close button: the footer actions are the only way out', () => {
    renderAlertDialog({ root: { defaultOpen: true } });

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('exposes the tone', () => {
    renderAlertDialog({ root: { defaultOpen: true, tone: 'neutral' } });

    expect(screen.getByRole('alertdialog')).toHaveAttribute('data-tone', 'neutral');
  });

  it('puts initial focus on the cancel action', async () => {
    renderAlertDialog({ root: { defaultOpen: true } });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
  });

  it('puts initial focus on the typed-confirmation field when there is one', async () => {
    renderAlertDialog({ root: { defaultOpen: true }, body: <AlertDialogTypedConfirmation text="nk-compressors" /> });

    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
  });
});
