import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SaveBar } from './SaveBar';

describe(SaveBar.name, () => {
  it('renders nothing while there is nothing to save', () => {
    const { container } = render(<SaveBar dirtyCount={0} onSave={vi.fn()} onDiscard={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows a quiet message instead when one is given', () => {
    render(<SaveBar dirtyCount={0} cleanText="All changes saved" onSave={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('All changes saved');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('counts the unsaved changes', () => {
    render(<SaveBar dirtyCount={3} onSave={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('3 unsaved changes');
  });

  it('uses the singular for one change', () => {
    render(<SaveBar dirtyCount={1} onSave={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('1 unsaved change');
  });

  it('saves and discards from its buttons', async () => {
    const onSave = vi.fn();
    const onDiscard = vi.fn();
    render(<SaveBar dirtyCount={2} onSave={onSave} onDiscard={onDiscard} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('locks both buttons while saving', () => {
    render(<SaveBar dirtyCount={2} saving onSave={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard' })).toBeDisabled();
  });

  it('replaces the count with the error after a failed save', () => {
    render(<SaveBar dirtyCount={2} error="Couldn't save changes. Try again." onSave={vi.fn()} onDiscard={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent("Couldn't save changes. Try again.");
  });
});
