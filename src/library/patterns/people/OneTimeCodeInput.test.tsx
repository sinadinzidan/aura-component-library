import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { OneTimeCodeInput } from './OneTimeCodeInput';

describe(OneTimeCodeInput.name, () => {
  it('renders one named box per digit inside a labelled group', () => {
    render(<Harness />);

    expect(screen.getByRole('group', { name: 'Verification code' })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
    expect(screen.getByRole('textbox', { name: 'Digit 1 of 6' })).toBeInTheDocument();
  });

  it('moves to the next box as digits are typed', async () => {
    render(<Harness />);

    await userEvent.click(box(1));
    await userEvent.keyboard('12');

    expect(box(1)).toHaveValue('1');
    expect(box(2)).toHaveValue('2');
    expect(box(3)).toHaveFocus();
  });

  it('ignores anything that is not a digit', async () => {
    render(<Harness />);

    await userEvent.click(box(1));
    await userEvent.keyboard('a-4');

    expect(box(1)).toHaveValue('4');
    expect(box(2)).toHaveValue('');
  });

  it('spreads a pasted code across the boxes', async () => {
    render(<Harness />);

    await userEvent.click(box(1));
    await userEvent.paste('428 913');

    expect(screen.getAllByRole('textbox').map((input) => input.getAttribute('value'))).toEqual(['4', '2', '8', '9', '1', '3']);
  });

  it('steps back and deletes with Backspace on an empty box', async () => {
    render(<Harness initial="12" />);

    await userEvent.click(box(3));
    await userEvent.keyboard('{Backspace}');

    expect(box(2)).toHaveValue('');
    expect(box(2)).toHaveFocus();
    expect(box(1)).toHaveValue('1');
  });

  it('moves between boxes with the arrow keys', async () => {
    render(<Harness initial="123" />);

    await userEvent.click(box(2));
    await userEvent.keyboard('{ArrowRight}');
    expect(box(3)).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(box(1)).toHaveFocus();
  });

  it('reports the full code once when the last digit is entered', async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);

    await userEvent.click(box(1));
    await userEvent.keyboard('428913');

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('428913');
  });

  it('writes at the end of the code when a later box is used', async () => {
    render(<Harness initial="1" />);

    await userEvent.click(box(5));
    await userEvent.keyboard('7');

    expect(box(2)).toHaveValue('7');
    expect(box(5)).toHaveValue('');
  });

  it('marks every box invalid', () => {
    render(<Harness invalid />);

    expect(box(1)).toHaveAttribute('aria-invalid', 'true');
    expect(box(6)).toHaveAttribute('aria-invalid', 'true');
  });

  it('honours a custom length', () => {
    render(<Harness length={4} />);

    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });
});

function box(position: number): HTMLElement {
  return screen.getByRole('textbox', { name: new RegExp(`^Digit ${position} of`) });
}

type HarnessProps = {
  initial?: string;
  length?: number;
  invalid?: boolean;
  onComplete?: (code: string) => void;
};

function Harness({ initial = '', length, invalid, onComplete }: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <OneTimeCodeInput
      label="Verification code"
      value={value}
      onValueChange={setValue}
      onComplete={onComplete}
      length={length}
      invalid={invalid}
    />
  );
}
