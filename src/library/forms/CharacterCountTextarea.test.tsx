import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { CharacterCountTextarea } from './CharacterCountTextarea';

describe(CharacterCountTextarea.name, () => {
  it('shows the current count against the limit', () => {
    render(<Harness initial="Bearing replaced" maxLength={40} />);

    expect(screen.getByText('16/40')).toBeInTheDocument();
  });

  it('updates the count while typing', async () => {
    render(<Harness initial="" maxLength={40} />);

    await userEvent.type(screen.getByLabelText('Notes'), 'Valve');

    expect(screen.getByText('5/40')).toBeInTheDocument();
  });

  it('shows the helper while within the limit', () => {
    render(<Harness initial="" maxLength={40} helper="Visible to the next shift." />);

    expect(screen.getByText('Visible to the next shift.')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).not.toBeInvalid();
  });

  it('keeps text past the limit, marks the field invalid and says how much to remove', async () => {
    render(<Harness initial="12345" maxLength={5} helper="Visible to the next shift." />);

    await userEvent.type(screen.getByLabelText('Notes'), '67');

    expect(screen.getByLabelText('Notes')).toHaveValue('1234567');
    expect(screen.getByLabelText('Notes')).toBeInvalid();
    expect(screen.getByText('Shorten the text by 2 characters.')).toBeInTheDocument();
    expect(screen.queryByText('Visible to the next shift.')).not.toBeInTheDocument();
  });

  it('uses the singular for one character over', () => {
    render(<Harness initial="123456" maxLength={5} />);

    expect(screen.getByText('Shorten the text by 1 character.')).toBeInTheDocument();
  });

  it('describes the textarea with the count', () => {
    render(<Harness initial="abc" maxLength={10} helper="Hint." />);

    expect(screen.getByLabelText('Notes')).toHaveAccessibleDescription(/3\/10/);
  });
});

type HarnessProps = { initial: string; maxLength: number; helper?: string };

function Harness({ initial, maxLength, helper }: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <CharacterCountTextarea
      aria-label="Notes"
      value={value}
      onValueChange={setValue}
      maxLength={maxLength}
      helper={helper}
    />
  );
}
