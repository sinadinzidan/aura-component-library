import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { InlineEditText } from './InlineEditText';

describe(InlineEditText.name, () => {
  it('shows the value as text until editing starts', () => {
    render(<InlineEditText value="Compressor overview" label="dashboard name" onSave={vi.fn()} />);

    expect(screen.getByText('Compressor overview')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('opens a focused input with the current value', async () => {
    render(<InlineEditText value="Compressor overview" label="dashboard name" onSave={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard name' }));

    const input = screen.getByRole('textbox', { name: 'dashboard name' });
    expect(input).toHaveValue('Compressor overview');
    expect(input).toHaveFocus();
  });

  it('saves the trimmed text on Enter', async () => {
    const onSave = vi.fn();
    render(<InlineEditText value="Old name" label="dashboard name" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard name' }));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.type(screen.getByRole('textbox'), '  New name {Enter}');

    expect(onSave).toHaveBeenCalledWith('New name');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('saves with the save button', async () => {
    const onSave = vi.fn();
    render(<InlineEditText value="Old name" label="dashboard name" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard name' }));
    await userEvent.type(screen.getByRole('textbox'), ' 2');

    await userEvent.click(screen.getByRole('button', { name: 'Save dashboard name' }));

    expect(onSave).toHaveBeenCalledWith('Old name 2');
  });

  it('discards the draft on Escape', async () => {
    const onSave = vi.fn();
    render(<InlineEditText value="Old name" label="dashboard name" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard name' }));

    await userEvent.type(screen.getByRole('textbox'), ' draft{Escape}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText('Old name')).toBeInTheDocument();
  });

  it('does not call onSave when nothing changed', async () => {
    const onSave = vi.fn();
    render(<InlineEditText value="Old name" label="dashboard name" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard name' }));

    await userEvent.keyboard('{Enter}');

    expect(onSave).not.toHaveBeenCalled();
  });

  it('blocks an empty value and explains why', async () => {
    const onSave = vi.fn();
    render(<InlineEditText value="Old name" label="dashboard name" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard name' }));

    await userEvent.clear(screen.getByRole('textbox'));
    await userEvent.keyboard('{Enter}');

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a value.');
    expect(screen.getByRole('textbox')).toBeInvalid();
  });

  it('uses a custom validator', async () => {
    const validate = (value: string) => (value.length > 5 ? 'Use 5 characters or fewer.' : null);
    render(<InlineEditText value="Short" label="tag" onSave={vi.fn()} validate={validate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit tag' }));

    await userEvent.type(screen.getByRole('textbox'), 'er{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('Use 5 characters or fewer.');
  });

  it('returns focus to the edit button after saving', async () => {
    render(<InlineEditText value="Old name" label="dashboard name" onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit dashboard name' }));

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Edit dashboard name' })).toHaveFocus();
  });
});
