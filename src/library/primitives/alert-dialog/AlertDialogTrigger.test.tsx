import { screen } from '@testing-library/react';

import { AlertDialogTrigger } from './AlertDialogTrigger';
import { renderAlertDialog } from './testUtils';

describe(AlertDialogTrigger.name, () => {
  it('renders the given button and marks it as opening a dialog', () => {
    renderAlertDialog();

    expect(screen.getByRole('button', { name: 'Delete pipeline' })).toHaveAttribute('aria-haspopup', 'dialog');
  });
});
