import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';

import { PanelFrame } from './PanelFrame';

describe(PanelFrame.name, () => {
  it('names the frame after its title and describes it', () => {
    renderWithTooltips(
      <PanelFrame title="Invite people" description="They get an email with a sign-in link.">
        <p>Body</p>
      </PanelFrame>
    );

    const frame = screen.getByRole('region', { name: 'Invite people' });
    expect(frame).toHaveAccessibleDescription('They get an email with a sign-in link.');
    expect(frame).toContainElement(screen.getByText('Body'));
  });

  it('has no close button unless it can be closed', () => {
    renderWithTooltips(
      <PanelFrame title="Invite people">
        <p>Body</p>
      </PanelFrame>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('closes from the header button', async () => {
    const onClose = vi.fn();
    renderWithTooltips(
      <PanelFrame title="Invite people" onClose={onClose} closeLabel="Close dialog">
        <p>Body</p>
      </PanelFrame>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the footer and extra header content', () => {
    renderWithTooltips(
      <PanelFrame title="Invite people" headerExtra={<p>Step 1 of 3</p>} footer={<button type="button">Send invites</button>}>
        <p>Body</p>
      </PanelFrame>
    );

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send invites' })).toBeInTheDocument();
  });
});

function renderWithTooltips(ui: ReactNode) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}
