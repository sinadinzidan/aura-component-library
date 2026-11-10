import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

import { SidePanel } from './SidePanel';

describe(SidePanel.name, () => {
  it('names the panel after the selected record', () => {
    renderPanel(<SidePanel title="1st stage compressor">Properties</SidePanel>);

    expect(screen.getByRole('complementary', { name: '1st stage compressor' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '1st stage compressor' })).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('has no close button unless it can be closed', () => {
    renderPanel(<SidePanel title="Compressor">Properties</SidePanel>);

    expect(screen.queryByRole('button', { name: 'Close panel' })).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is pressed', async () => {
    const onClose = vi.fn();
    renderPanel(
      <SidePanel title="Compressor" onClose={onClose}>
        Properties
      </SidePanel>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the given close label', () => {
    renderPanel(
      <SidePanel title="Compressor" onClose={vi.fn()} closeLabel="Close details">
        Properties
      </SidePanel>
    );

    expect(screen.getByRole('button', { name: 'Close details' })).toBeInTheDocument();
  });

  it('renders description, status, actions, toolbar and footer when given', () => {
    renderPanel(
      <SidePanel
        title="Compressor"
        description="23-KA-9101"
        status={<span>Running</span>}
        actions={<button type="button">Open full page</button>}
        toolbar={<div role="tablist" />}
        footer={<button type="button">Save changes</button>}
      >
        Properties
      </SidePanel>
    );

    expect(screen.getByText('23-KA-9101')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open full page' })).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toContainElement(screen.getByRole('button', { name: 'Save changes' }));
  });

  it('docks to the edge without a card outline', () => {
    renderPanel(
      <SidePanel title="Compressor" frame="edge">
        Properties
      </SidePanel>
    );

    expect(screen.getByRole('complementary')).toHaveClass('border-l');
    expect(screen.getByRole('complementary')).not.toHaveClass('rounded-xl');
  });
});

function renderPanel(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}
