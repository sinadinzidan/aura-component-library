import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SplitButton } from './SplitButton';

describe(SplitButton.name, () => {
  it('runs the default action from the main button', async () => {
    const onClick = vi.fn();
    render(
      <SplitButton onClick={onClick} menuLabel="More save options" options={[]}>
        Save changes
      </SplitButton>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('runs a related action from the menu', async () => {
    const onSelect = vi.fn();
    render(
      <SplitButton
        onClick={vi.fn()}
        menuLabel="More save options"
        options={[{ id: 'draft', label: 'Save as draft', onSelect }]}
      >
        Save changes
      </SplitButton>
    );

    await userEvent.click(screen.getByRole('button', { name: 'More save options' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Save as draft' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('disables both halves together', () => {
    render(
      <SplitButton onClick={vi.fn()} menuLabel="More save options" options={[]} disabled>
        Save changes
      </SplitButton>
    );

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'More save options' })).toBeDisabled();
  });
});
