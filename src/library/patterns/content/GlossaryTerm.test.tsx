import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GlossaryTerm } from './GlossaryTerm';

function renderTerm() {
  return render(
    <TooltipProvider>
      <p>
        The <GlossaryTerm definition="Piping and instrumentation diagram.">P&ID</GlossaryTerm> shows the valve.
      </p>
    </TooltipProvider>
  );
}

describe(GlossaryTerm.name, () => {
  it('keeps the term in the sentence as a focusable button', () => {
    renderTerm();

    expect(screen.getByRole('button', { name: 'P&ID' })).toBeInTheDocument();
    expect(screen.getByText(/shows the valve/)).toBeInTheDocument();
  });

  it('keeps the definition closed until asked', () => {
    renderTerm();

    expect(screen.queryByText('Piping and instrumentation diagram.')).not.toBeInTheDocument();
  });

  it('shows the definition on keyboard focus', async () => {
    renderTerm();

    await userEvent.tab();

    expect(await screen.findByText('Piping and instrumentation diagram.')).toBeInTheDocument();
  });
});
