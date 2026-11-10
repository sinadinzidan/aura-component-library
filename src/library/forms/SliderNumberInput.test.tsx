import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SliderNumberInput } from './SliderNumberInput';

describe(SliderNumberInput.name, () => {
  it('shows the value in both the slider and the number field', () => {
    renderInput(40);

    // The thumb is hidden until Base UI has measured the track, which needs real layout, and
    // hidden elements have no computed name: find it by role and check the label wiring.
    const thumb = screen.getByRole('slider', { hidden: true });
    expect(thumb).toHaveValue('40');
    expect(thumb).toHaveAttribute('aria-labelledby', screen.getByText('Valve opening').id);
    expect(screen.getByRole('textbox', { name: 'Valve opening' })).toHaveValue('40');
  });

  it('commits a typed value on Enter', async () => {
    const onValueChange = renderInput(40);

    await typeValue('65{Enter}');

    expect(onValueChange).toHaveBeenCalledWith(65);
  });

  it('commits a typed value on blur', async () => {
    const onValueChange = renderInput(40);

    await typeValue('65');
    await userEvent.tab();

    expect(onValueChange).toHaveBeenCalledWith(65);
  });

  it('does not commit while the value is still being typed', async () => {
    const onValueChange = renderInput(40);

    await typeValue('65');

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('clamps a typed value to the range', async () => {
    const onValueChange = renderInput(40);

    await typeValue('250{Enter}');

    expect(onValueChange).toHaveBeenCalledWith(100);
  });

  it('snaps a typed value to the step', async () => {
    const onValueChange = renderInput(40, 5);

    await typeValue('63{Enter}');

    expect(onValueChange).toHaveBeenCalledWith(65);
  });

  it('discards input that is not a number', async () => {
    const onValueChange = renderInput(40);

    await typeValue('open{Enter}');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Valve opening' })).toHaveValue('40');
  });

  it('restores the value on Escape', async () => {
    const onValueChange = renderInput(40);

    await typeValue('65{Escape}');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Valve opening' })).toHaveValue('40');
  });
});

function renderInput(value: number, step = 1) {
  const onValueChange = vi.fn<(value: number) => void>();
  render(<SliderNumberInput label="Valve opening" value={value} onValueChange={onValueChange} step={step} unit="%" />);
  return onValueChange;
}

async function typeValue(text: string) {
  const field = screen.getByRole('textbox', { name: 'Valve opening' });
  await userEvent.clear(field);
  await userEvent.type(field, text);
}
