import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SaveStatus } from './SaveStatus';

describe(SaveStatus.name, () => {
  it('shows nothing while idle without an idle text', () => {
    render(<SaveStatus state="idle" />);

    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('shows the idle text when given', () => {
    render(<SaveStatus state="idle" idleText="Changes save automatically" />);

    expect(screen.getByRole('status')).toHaveTextContent('Changes save automatically');
  });

  it('says when a save is in flight', () => {
    render(<SaveStatus state="saving" />);

    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });

  it('confirms a finished save', () => {
    render(<SaveStatus state="saved" savedText="Saved 14:00" />);

    expect(screen.getByRole('status')).toHaveTextContent('Saved 14:00');
  });

  it('reports a failed save and offers a retry', async () => {
    const onRetry = vi.fn();
    render(<SaveStatus state="error" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(screen.getByRole('status')).toHaveTextContent("Couldn't save");
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('has no retry button outside the error state', () => {
    render(<SaveStatus state="saved" onRetry={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
