import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { UnsavedChangesPrompt } from './UnsavedChangesPrompt';

describe(UnsavedChangesPrompt.name, () => {
  it('renders nothing while closed', () => {
    renderPrompt({ open: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('names the consequence and offers to stay or discard', () => {
    renderPrompt({});

    expect(screen.getByRole('heading', { name: 'Leave without saving?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save and leave' })).not.toBeInTheDocument();
  });

  it('closes without discarding when the user stays', async () => {
    const { onOpenChange, onDiscard } = renderPrompt({});

    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('discards on request', async () => {
    const { onDiscard } = renderPrompt({});

    await userEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('locks every action while a save is in flight', async () => {
    const pending = deferred();
    renderPrompt({ onSave: () => pending.promise });

    await userEvent.click(screen.getByRole('button', { name: 'Save and leave' }));

    expect(screen.getByRole('button', { name: 'Save and leave' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Keep editing' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Discard changes' })).toBeDisabled();
  });

  it('says so when the save fails and lets the user try again', async () => {
    const pending = deferred();
    renderPrompt({ onSave: () => pending.promise });
    await userEvent.click(screen.getByRole('button', { name: 'Save and leave' }));

    pending.reject(new Error('offline'));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save your changes"));
    expect(screen.getByRole('button', { name: 'Save and leave' })).toBeEnabled();
  });
});

function renderPrompt(props: Partial<ComponentProps<typeof UnsavedChangesPrompt>>) {
  const onOpenChange = vi.fn();
  const onDiscard = vi.fn();
  render(<UnsavedChangesPrompt open onOpenChange={onOpenChange} onDiscard={onDiscard} {...props} />);
  return { onOpenChange, onDiscard };
}

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}
