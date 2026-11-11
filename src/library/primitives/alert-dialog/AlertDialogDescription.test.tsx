import { screen } from '@testing-library/react';

import { AlertDialogDescription } from './AlertDialogDescription';
import { renderAlertDialog } from './testUtils';

describe(AlertDialogDescription.name, () => {
  it('describes the alert dialog with the consequence', () => {
    renderAlertDialog({ root: { defaultOpen: true } });

    expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription('All runs are removed.');
  });
});
