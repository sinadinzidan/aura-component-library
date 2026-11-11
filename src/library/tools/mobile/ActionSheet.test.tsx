import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ActionSheet } from './ActionSheet';

function renderSheet(open = true, onClose = () => undefined, onSelect = () => undefined) {
  return render(
    <ActionSheet
      open={open}
      onClose={onClose}
      title="WO-104482"
      actions={[
        { id: 'assign', label: 'Assign to me', onSelect },
        { id: 'delete', label: 'Delete draft', destructive: true, onSelect: () => undefined },
      ]}
    />
  );
}

describe(ActionSheet.name, () => {
  it('renders nothing while closed', () => {
    renderSheet(false);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a dialog named by its subject, with Cancel last, and takes focus', () => {
    renderSheet();

    const dialog = screen.getByRole('dialog', { name: 'WO-104482' });
    expect(dialog).toHaveFocus();
    const buttons = screen.getAllByRole('button').filter((button) => dialog.contains(button));
    expect(buttons.map((button) => button.textContent)).toEqual(['Assign to me', 'Delete draft', 'Cancel']);
  });

  it('runs the chosen action and closes', async () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    renderSheet(true, onClose, onSelect);

    await userEvent.click(screen.getByRole('button', { name: 'Assign to me' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes with Cancel, the scrim and Escape', async () => {
    const onClose = vi.fn();
    renderSheet(true, onClose);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close actions' }));
    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
