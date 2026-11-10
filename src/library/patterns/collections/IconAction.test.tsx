import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IconAction } from './IconAction';

function renderAction(props: { onClick?: () => void; disabled?: boolean } = {}) {
  return render(
    <TooltipProvider>
      <IconAction label="Acknowledge alarm" {...props}>
        <svg aria-hidden="true" />
      </IconAction>
    </TooltipProvider>
  );
}

describe(IconAction.name, () => {
  it('is named by its label', () => {
    renderAction();

    expect(screen.getByRole('button', { name: 'Acknowledge alarm' })).toBeInTheDocument();
  });

  it('runs its action when clicked', async () => {
    const onClick = vi.fn();
    renderAction({ onClick });

    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge alarm' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does nothing while disabled', async () => {
    const onClick = vi.fn();
    renderAction({ onClick, disabled: true });

    await userEvent.click(screen.getByRole('button', { name: 'Acknowledge alarm' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows the label as a tooltip on focus', async () => {
    renderAction();

    await userEvent.tab();

    expect(await screen.findByText('Acknowledge alarm')).toBeInTheDocument();
  });
});
