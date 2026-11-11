import { screen } from '@testing-library/react';

import { AlertDialogTitle } from './AlertDialogTitle';
import { renderAlertDialog } from './testUtils';

describe(AlertDialogTitle.name, () => {
  it('names the alert dialog', () => {
    renderAlertDialog({ root: { defaultOpen: true } });

    expect(screen.getByRole('heading', { name: 'Delete pipeline?' })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toHaveAccessibleName('Delete pipeline?');
  });
});
