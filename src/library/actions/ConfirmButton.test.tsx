import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmButton } from './ConfirmButton';

describe(ConfirmButton.name, () => {
  it('does not confirm on the first click', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmButton confirmLabel="Confirm delete" onConfirm={onConfirm}>
        Delete
      </ConfirmButton>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeInTheDocument();
  });

  it('confirms on the second click and returns to rest', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmButton confirmLabel="Confirm delete" onConfirm={onConfirm}>
        Delete
      </ConfirmButton>
    );

    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('button'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('disarms when focus leaves', async () => {
    render(
      <ConfirmButton confirmLabel="Confirm delete" onConfirm={vi.fn()}>
        Delete
      </ConfirmButton>
    );
    await userEvent.click(screen.getByRole('button'));

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('disarms after the reset delay', async () => {
    let fire: () => void = () => undefined;
    const timers = {
      set: vi.fn((callback: () => void) => {
        fire = callback;
        return 1;
      }),
      clear: vi.fn(),
    };
    render(
      <ConfirmButton confirmLabel="Confirm delete" onConfirm={vi.fn()} resetAfterMs={2500} timers={timers}>
        Delete
      </ConfirmButton>
    );
    await userEvent.click(screen.getByRole('button'));
    expect(timers.set).toHaveBeenCalledWith(expect.any(Function), 2500);

    act(() => fire());

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
