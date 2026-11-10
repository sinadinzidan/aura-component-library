import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditableCell } from './EditableCell';

const LABEL = 'High limit for 23-PT-92531';

describe(EditableCell.name, () => {
  it('reads as a button that names the cell, its value and unit', () => {
    render(<EditableCell value="52.0" unit="barg" label={LABEL} onSave={vi.fn()} />);

    expect(screen.getByRole('button', { name: `Edit ${LABEL}, 52.0 barg` })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('opens a focused input with the current value on click', async () => {
    render(<EditableCell value="52.0" label={LABEL} onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button'));

    const input = screen.getByRole('textbox', { name: LABEL });
    expect(input).toHaveValue('52.0');
    expect(input).toHaveFocus();
  });

  it('opens on F2', async () => {
    render(<EditableCell value="52.0" label={LABEL} onSave={vi.fn()} />);
    screen.getByRole('button').focus();

    await userEvent.keyboard('{F2}');

    expect(screen.getByRole('textbox', { name: LABEL })).toBeInTheDocument();
  });

  it('saves the trimmed text on Enter and returns focus to the cell', async () => {
    const onSave = vi.fn();
    render(<EditableCell value="52.0" label={LABEL} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button'));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), ' 53.5 {Enter}');

    expect(onSave).toHaveBeenCalledWith('53.5');
    expect(screen.getByRole('button')).toHaveFocus();
  });

  it('saves when focus leaves the input', async () => {
    const onSave = vi.fn();
    render(<EditableCell value="52.0" label={LABEL} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button'));
    await userEvent.type(screen.getByRole('textbox'), '1');

    await userEvent.tab();

    expect(onSave).toHaveBeenCalledWith('52.01');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('discards the draft on Escape', async () => {
    const onSave = vi.fn();
    render(<EditableCell value="52.0" label={LABEL} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button'));

    await userEvent.type(screen.getByRole('textbox'), '9{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: `Edit ${LABEL}, 52.0` })).toHaveFocus();
  });

  it('does not save an unchanged value', async () => {
    const onSave = vi.fn();
    render(<EditableCell value="52.0" label={LABEL} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button'));

    await userEvent.keyboard('{Enter}');

    expect(onSave).not.toHaveBeenCalled();
  });

  it('keeps the cell open with a message when the value is invalid', async () => {
    const onSave = vi.fn();
    const validate = (text: string) => (Number.isNaN(Number(text)) ? 'Enter a number.' : null);
    render(<EditableCell value="52.0" label={LABEL} validate={validate} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button'));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), 'high{Enter}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number.');
    expect(screen.getByRole('textbox')).toBeInvalid();
  });

  it('starts open with a restored draft and its error, without taking focus', () => {
    const validate = (text: string) => (Number(text) > 60 ? 'Enter a value up to 60.' : null);
    render(<EditableCell value="52.0" defaultDraft="72" label={LABEL} validate={validate} onSave={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: LABEL });
    expect(input).toHaveValue('72');
    expect(input).not.toHaveFocus();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a value up to 60.');
  });

  it('shows a custom read-mode rendering', () => {
    render(<EditableCell value="9840" display="9,840" label="Shaft speed" onSave={vi.fn()} />);

    expect(screen.getByText('9,840')).toBeInTheDocument();
  });
});
