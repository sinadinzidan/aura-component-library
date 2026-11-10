import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InfoTooltip } from './InfoTooltip';

describe(InfoTooltip.name, () => {
  it('renders a named button and keeps the hint hidden at rest', () => {
    renderTooltip();

    expect(screen.getByRole('button', { name: 'About health score' })).toBeInTheDocument();
    expect(screen.queryByText('Health score. Combines vibration and temperature.')).not.toBeInTheDocument();
  });

  it('shows the hint when the button receives keyboard focus', async () => {
    renderTooltip();

    await userEvent.tab();

    expect(await screen.findByText('Health score. Combines vibration and temperature.')).toBeInTheDocument();
  });

  it('hides the hint on Escape', async () => {
    renderTooltip();
    await userEvent.tab();
    await screen.findByText('Health score. Combines vibration and temperature.');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByText('Health score. Combines vibration and temperature.')).not.toBeInTheDocument();
  });
});

function renderTooltip() {
  return render(
    <TooltipProvider>
      <InfoTooltip label="About health score">Health score. Combines vibration and temperature.</InfoTooltip>
    </TooltipProvider>
  );
}
