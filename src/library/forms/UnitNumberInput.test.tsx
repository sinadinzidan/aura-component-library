import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { UnitNumberInput } from './UnitNumberInput';

describe(UnitNumberInput.name, () => {
  it('shows the value and the unit', () => {
    render(<UnitNumberInput aria-label="High limit" unit="barg" value={52} onValueChange={vi.fn()} />);

    expect(screen.getByLabelText('High limit')).toHaveValue(52);
    expect(screen.getByText('barg')).toBeInTheDocument();
  });

  it('reports typed numbers', async () => {
    const onValueChange = vi.fn();
    render(<Harness initial={null} onValueChange={onValueChange} />);

    await userEvent.type(screen.getByLabelText('High limit'), '48');

    expect(onValueChange).toHaveBeenLastCalledWith(48);
  });

  it('reports null when the field is cleared', async () => {
    const onValueChange = vi.fn();
    render(<Harness initial={5} onValueChange={onValueChange} />);

    await userEvent.clear(screen.getByLabelText('High limit'));

    expect(onValueChange).toHaveBeenLastCalledWith(null);
  });

  it('steps up by the step without floating point noise', async () => {
    const onValueChange = vi.fn();
    render(<Harness initial={0.2} step={0.1} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Increase by 0.1 barg' }));

    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
  });

  it('steps down by the step', async () => {
    const onValueChange = vi.fn();
    render(<Harness initial={10} step={5} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Decrease by 5 barg' }));

    expect(onValueChange).toHaveBeenLastCalledWith(5);
  });

  it('disables the increment at the maximum', () => {
    render(<Harness initial={60} max={60} onValueChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Increase by 1 barg' })).toBeDisabled();
  });

  it('disables the decrement at the minimum', () => {
    render(<Harness initial={0} min={0} onValueChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Decrease by 1 barg' })).toBeDisabled();
  });

  it('starts stepping from the minimum when empty', async () => {
    const onValueChange = vi.fn();
    render(<Harness initial={null} min={10} onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Increase by 1 barg' }));

    expect(onValueChange).toHaveBeenLastCalledWith(11);
  });

  it('can hide the stepper', () => {
    render(<UnitNumberInput aria-label="High limit" unit="barg" value={1} onValueChange={vi.fn()} hideStepper />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

type HarnessProps = {
  initial: number | null;
  onValueChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
};

function Harness({ initial, onValueChange, min, max, step }: HarnessProps) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <UnitNumberInput
      aria-label="High limit"
      unit="barg"
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={(next) => {
        setValue(next);
        onValueChange(next);
      }}
    />
  );
}
