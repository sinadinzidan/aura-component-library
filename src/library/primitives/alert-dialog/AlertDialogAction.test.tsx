import { screen, within } from '@testing-library/react';

import { AlertDialogAction } from './AlertDialogAction';
import { renderAlertDialog } from './testUtils';

const action = () => within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete pipeline' });

describe(AlertDialogAction.name, () => {
  it('uses the destructive button for a destructive dialog', () => {
    renderAlertDialog({ root: { defaultOpen: true, tone: 'destructive' } });

    expect(action()).toHaveAttribute('data-tone', 'destructive');
  });

  it('uses the default button for a neutral dialog', () => {
    renderAlertDialog({ root: { defaultOpen: true, tone: 'neutral' } });

    expect(action()).toHaveAttribute('data-tone', 'neutral');
  });

  it('can be disabled by the caller', () => {
    renderAlertDialog({ root: { defaultOpen: true }, action: { disabled: true } });

    expect(action()).toBeDisabled();
  });
});
