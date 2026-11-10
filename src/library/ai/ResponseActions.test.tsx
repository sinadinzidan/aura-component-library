import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ResponseActions } from './ResponseActions';

describe(ResponseActions.name, () => {
  it('copies the response text and confirms in place', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    renderActions({ text: 'Tripped on high vibration.', writeText });

    await userEvent.click(screen.getByRole('button', { name: 'Copy response' }));

    expect(writeText).toHaveBeenCalledWith('Tripped on high vibration.');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument());
  });

  it('only shows the actions that have a handler', () => {
    renderActions({ text: 'x' });

    expect(screen.queryByRole('button', { name: 'Regenerate response' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Good response' })).not.toBeInTheDocument();
  });

  it('calls onRegenerate', async () => {
    const onRegenerate = vi.fn();
    renderActions({ text: 'x', onRegenerate });

    await userEvent.click(screen.getByRole('button', { name: 'Regenerate response' }));

    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('marks a rating as pressed and reports it', async () => {
    const onFeedback = vi.fn();
    renderActions({ text: 'x', onFeedback });

    await userEvent.click(screen.getByRole('button', { name: 'Good response' }));

    expect(onFeedback).toHaveBeenCalledWith('up');
    expect(screen.getByRole('button', { name: 'Good response' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('takes a rating back when it is clicked again', async () => {
    const onFeedback = vi.fn();
    renderActions({ text: 'x', onFeedback, defaultFeedback: 'down' });

    await userEvent.click(screen.getByRole('button', { name: 'Poor response' }));

    expect(onFeedback).toHaveBeenCalledWith(null);
    expect(screen.getByRole('button', { name: 'Poor response' })).toHaveAttribute('aria-pressed', 'false');
  });
});

function renderActions(props: ComponentProps<typeof ResponseActions>) {
  return render(
    <TooltipProvider>
      <ResponseActions {...props} />
    </TooltipProvider>
  );
}
