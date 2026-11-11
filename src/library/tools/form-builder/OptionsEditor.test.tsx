import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { OptionsEditor } from './OptionsEditor';

const OPTIONS = [
  { value: 'good', label: 'Good' },
  { value: 'worn', label: 'Worn' },
  { value: 'failed', label: 'Failed' },
];

describe(OptionsEditor.name, () => {
  it('edits a label and keeps the stored value', async () => {
    const onChange = vi.fn();
    render(<OptionsEditor options={OPTIONS} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Option 2 label'), '!');

    expect(onChange).toHaveBeenCalledWith([OPTIONS[0], { value: 'worn', label: 'Worn!' }, OPTIONS[2]]);
  });

  it('adds an option with a new value', async () => {
    const onChange = vi.fn();
    render(<OptionsEditor options={OPTIONS} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add option' }));

    expect(onChange).toHaveBeenCalledWith([...OPTIONS, { value: 'option-4', label: 'Option 4' }]);
  });

  it('removes an option', async () => {
    const onChange = vi.fn();
    render(<OptionsEditor options={OPTIONS} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Worn' }));

    expect(onChange).toHaveBeenCalledWith([OPTIONS[0], OPTIONS[2]]);
  });

  it('keeps the minimum number of options and says so', () => {
    render(<OptionsEditor options={OPTIONS.slice(0, 2)} onChange={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: 'Keep at least 2 options' })[0]).toBeDisabled();
  });

  it('moves an option down', async () => {
    const onChange = vi.fn();
    render(<OptionsEditor options={OPTIONS} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Move Good down' }));

    expect(onChange).toHaveBeenCalledWith([OPTIONS[1], OPTIONS[0], OPTIONS[2]]);
  });

  it('disables moving the first option up', () => {
    render(<OptionsEditor options={OPTIONS} onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Already first' })).toBeDisabled();
  });
});
