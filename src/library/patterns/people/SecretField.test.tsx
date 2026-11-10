import { TooltipProvider } from '@cognite/aura/components/tooltip';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { MASK_CHARACTER } from './maskSecret';
import { SecretField } from './SecretField';

const SECRET = 'example-secret-historian-0001';
const MASK = MASK_CHARACTER.repeat(8);

describe(SecretField.name, () => {
  it('masks the value until asked', () => {
    renderField({ value: SECRET });

    expect(screen.getByText(`${MASK}0001`)).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it('reveals and hides the value', async () => {
    renderField({ value: SECRET });

    await userEvent.click(screen.getByRole('button', { name: 'Show client secret' }));
    expect(screen.getByText(SECRET)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Hide client secret' }));
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it('can start revealed', () => {
    renderField({ value: SECRET, defaultRevealed: true });

    expect(screen.getByText(SECRET)).toBeInTheDocument();
  });

  it('copies the full value while it is still masked', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    renderField({ value: SECRET, writeText });

    await userEvent.click(screen.getByRole('button', { name: 'Copy client secret' }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(SECRET));
  });

  it('applies the mask options', () => {
    renderField({ value: SECRET, mask: { visibleStart: 8, visibleEnd: 4 } });

    expect(screen.getByText(`example-${MASK}0001`)).toBeInTheDocument();
  });

  it('offers copy but no reveal when the value must stay off screen', () => {
    renderField({ value: SECRET, revealable: false, defaultRevealed: true });

    expect(screen.queryByRole('button', { name: /Show|Hide/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy client secret' })).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it('shows a stored secret as a hint with no controls', () => {
    renderField({ masked: `${MASK}0001`, hint: 'Shown once when it was created.' });

    expect(screen.getByText(`${MASK}0001`)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText('Shown once when it was created.')).toBeInTheDocument();
  });
});

function renderField(props: Partial<ComponentProps<typeof SecretField>>) {
  return render(
    <TooltipProvider>
      <SecretField label="Client secret" writeText={vi.fn(() => Promise.resolve())} {...props} />
    </TooltipProvider>
  );
}
