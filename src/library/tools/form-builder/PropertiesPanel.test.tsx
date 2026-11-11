import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FormFieldDef, FormSchema } from './formSchema';
import { PropertiesPanel } from './PropertiesPanel';

const FIELDS: FormFieldDef[] = [
  { id: 'kind', type: 'select', label: 'Work type', options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }] },
  { id: 'hours', type: 'number', label: 'Effort', unit: 'h', min: 1, max: 40 },
  { id: 'note', type: 'text', label: 'Note' },
  { id: 'head', type: 'heading', label: 'Safety' },
];
const SCHEMA: FormSchema = { title: 'T', fields: FIELDS };

function setup(index: number) {
  const onChange = vi.fn();
  render(<PropertiesPanel schema={SCHEMA} field={FIELDS[index]} onChange={onChange} />);
  return onChange;
}

describe(PropertiesPanel.name, () => {
  it('prompts to select a field when none is selected', () => {
    render(<PropertiesPanel schema={SCHEMA} field={null} onChange={vi.fn()} />);

    expect(screen.getByText('No field selected')).toBeInTheDocument();
  });

  it('edits the label', async () => {
    const onChange = setup(2);

    await userEvent.type(screen.getByLabelText('Label'), 's');

    expect(onChange).toHaveBeenCalledWith('note', { label: 'Notes' });
  });

  it('sets the field as required', async () => {
    const onChange = setup(2);

    await userEvent.click(screen.getByRole('switch', { name: 'Required' }));

    expect(onChange).toHaveBeenCalledWith('note', { required: true });
  });

  it('offers unit and range for a number and passes them as numbers', () => {
    const onChange = setup(1);

    fireEvent.change(screen.getByLabelText(/Maximum/), { target: { value: '24' } });

    expect(screen.getByLabelText(/Unit/)).toHaveValue('h');
    expect(onChange).toHaveBeenCalledWith('hours', { max: 24 });
  });

  it('clears a limit when its input is emptied', () => {
    const onChange = setup(1);

    fireEvent.change(screen.getByLabelText(/Minimum/), { target: { value: '' } });

    expect(onChange).toHaveBeenCalledWith('hours', { min: undefined });
  });

  it('offers options for a select', () => {
    setup(0);

    expect(screen.getByRole('list', { name: 'Options' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Unit/)).not.toBeInTheDocument();
  });

  it('offers only a label for a heading', () => {
    setup(3);

    expect(screen.getByLabelText('Label')).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Required' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Helper text/)).not.toBeInTheDocument();
  });

  it('adds a visibility rule from the fields above', async () => {
    const onChange = setup(1);

    await userEvent.click(screen.getByRole('button', { name: 'Add visibility rule' }));

    expect(onChange).toHaveBeenCalledWith('hours', { showWhen: { fieldId: 'kind', equals: 'a' } });
  });

  it('shows the problem with the field', () => {
    render(<PropertiesPanel schema={SCHEMA} field={FIELDS[0]} problem="Add at least two options." onChange={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Add at least two options.');
  });
});
