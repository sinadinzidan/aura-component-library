import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditableDescription } from './EditableDescription';

const TEXT = 'Vibration rose after the last start.';

describe(EditableDescription.name, () => {
  it('shows the text until editing starts', () => {
    render(<EditableDescription value={TEXT} label="description" onSave={vi.fn()} />);

    expect(screen.getByText(TEXT)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('shows a placeholder line for an empty value', () => {
    render(<EditableDescription value="" label="description" emptyText="Add a description" onSave={vi.fn()} />);

    expect(screen.getByText('Add a description')).toBeInTheDocument();
  });

  it('opens a focused textarea with the current text', async () => {
    render(<EditableDescription value={TEXT} label="description" onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit description' }));

    const textarea = screen.getByRole('textbox', { name: 'description' });
    expect(textarea).toHaveValue(TEXT);
    expect(textarea).toHaveFocus();
  });

  it('saves the trimmed text with the Save button', async () => {
    const onSave = vi.fn();
    render(<EditableDescription value={TEXT} label="description" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit description' }));
    await userEvent.type(screen.getByRole('textbox'), ' Check bearing. ');

    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith(`${TEXT} Check bearing.`);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('saves on Control + Enter and keeps plain Enter for new lines', async () => {
    const onSave = vi.fn();
    render(<EditableDescription value="Line one" label="description" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit description' }));

    await userEvent.type(screen.getByRole('textbox'), '{Enter}Line two{Control>}{Enter}{/Control}');

    expect(onSave).toHaveBeenCalledWith('Line one\nLine two');
  });

  it('discards the draft on Escape and returns focus to the edit button', async () => {
    const onSave = vi.fn();
    render(<EditableDescription value={TEXT} label="description" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit description' }));

    await userEvent.type(screen.getByRole('textbox'), ' draft{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit description' })).toHaveFocus();
  });

  it('spells out the keys while editing', async () => {
    render(<EditableDescription value={TEXT} label="description" platform="other" onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit description' }));

    expect(screen.getByRole('textbox')).toHaveAccessibleDescription(/Control \+ Enter.*to save.*Escape.*to cancel/);
  });

  it('counts characters against the limit', async () => {
    render(<EditableDescription value="Short" label="description" maxLength={200} onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit description' }));

    expect(screen.getByText('5/200')).toBeInTheDocument();
  });
});
