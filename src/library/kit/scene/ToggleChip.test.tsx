import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ToggleChip } from './ToggleChip';

describe(ToggleChip.name, () => {
  it('reports its state with aria-pressed', () => {
    render(
      <ToggleChip pressed onPressedChange={vi.fn()}>
        Casing
      </ToggleChip>
    );

    expect(screen.getByRole('button', { name: 'Casing' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('asks for the opposite state when clicked', async () => {
    const onPressedChange = vi.fn();
    render(
      <ToggleChip pressed={false} onPressedChange={onPressedChange}>
        Rotor
      </ToggleChip>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Rotor' }));

    expect(onPressedChange).toHaveBeenCalledWith(true);
  });

  it('shows a count and carries its tone', () => {
    render(
      <ToggleChip pressed onPressedChange={vi.fn()} count="4" tone="warning">
        Auxiliaries
      </ToggleChip>
    );

    const chip = screen.getByRole('button', { name: /Auxiliaries/ });
    expect(chip).toHaveTextContent('4');
    expect(chip).toHaveAttribute('data-tone', 'warning');
  });
});
