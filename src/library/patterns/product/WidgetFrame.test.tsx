import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render as baseRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { ReactElement } from 'react';

import { WidgetFrame } from './WidgetFrame';

const render = (ui: ReactElement) => baseRender(<TooltipProvider>{ui}</TooltipProvider>);

describe(WidgetFrame.name, () => {
  it('names the widget and shows its content when ready', () => {
    render(
      <WidgetFrame title="Open work orders" description="Nordkapp">
        <p>23</p>
      </WidgetFrame>
    );

    expect(screen.getByRole('group', { name: 'Open work orders' })).toBeInTheDocument();
    expect(screen.getByText('Nordkapp')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
  });

  it('shows a skeleton instead of content while loading', () => {
    const { container } = render(
      <WidgetFrame title="Open work orders" status="loading" footer="Updated 14:00">
        <p>23</p>
      </WidgetFrame>
    );

    expect(screen.getByRole('group')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('[data-slot="widget-skeleton"]')).not.toBeNull();
    expect(screen.queryByText('23')).not.toBeInTheDocument();
    expect(screen.queryByText('Updated 14:00')).not.toBeInTheDocument();
  });

  it('shows the empty message with its action', () => {
    render(
      <WidgetFrame
        title="Notes"
        status="empty"
        empty={{ title: 'No notes yet', description: 'Notes you add show here.', action: <button type="button">Add note</button> }}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('No notes yet');
    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
  });

  it('announces a failure and retries', async () => {
    const onRetry = vi.fn();
    render(<WidgetFrame title="Alarms" status="error" error={{ title: "Couldn't load alarms", description: 'The request timed out.', onRetry }} />);

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load alarms");
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('opens the menu and runs the chosen action', async () => {
    const onSelect = vi.fn();
    render(
      <WidgetFrame title="Alarms" actions={[{ id: 'refresh', label: 'Refresh data', onSelect }]}>
        <p>4</p>
      </WidgetFrame>
    );

    await userEvent.click(screen.getByRole('button', { name: 'More actions for Alarms' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Refresh data' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('has no menu button without actions and pins the footer when ready', () => {
    const { container } = render(
      <WidgetFrame title="Alarms" footer="Updated 14:00" headerEnd={<span>24 h</span>}>
        <p>4</p>
      </WidgetFrame>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('24 h')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="widget-footer"]')).toHaveTextContent('Updated 14:00');
  });
});
