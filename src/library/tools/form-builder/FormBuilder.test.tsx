import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormBuilder } from './FormBuilder';
import type { FormSchema } from './formSchema';

const SCHEMA: FormSchema = {
  title: 'Inspection checkpoint',
  fields: [
    { id: 'tag', type: 'text', label: 'Equipment tag', required: true },
    { id: 'cond', type: 'select', label: 'Condition', options: [{ value: 'a', label: 'Good' }, { value: 'b', label: 'Worn' }] },
  ],
};

const setup = () => render(<FormBuilder initialSchema={SCHEMA} />);

describe(FormBuilder.name, () => {
  it('shows the palette, the form and an empty properties panel', () => {
    setup();

    expect(screen.getByRole('complementary', { name: 'Field palette' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Inspection checkpoint fields' })).toBeInTheDocument();
    expect(screen.getByText('No field selected')).toBeInTheDocument();
  });

  it('adds a field from the palette and selects it', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Add Date field' }));

    expect(screen.getByRole('button', { name: 'Edit Date, Date field 3 of 3' })).toBeInTheDocument();
    expect(screen.getByText('Date field')).toBeInTheDocument();
    expect(screen.getByText('Added Date at position 3.')).toBeInTheDocument();
  });

  it('edits the selected field and the canvas follows', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Equipment tag, Text field 1 of 2' }));
    const label = within(screen.getByRole('complementary', { name: 'Field properties' })).getByLabelText('Label');
    await userEvent.clear(label);
    await userEvent.type(label, 'Tag number');

    expect(screen.getByRole('button', { name: 'Edit Tag number, Text field 1 of 2' })).toBeInTheDocument();
  });

  it('removes a field', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Condition' }));

    expect(screen.queryByRole('button', { name: /Edit Condition/ })).not.toBeInTheDocument();
  });

  it('flags a field that cannot work and counts the problems on the tab', async () => {
    setup();

    await userEvent.click(screen.getByRole('button', { name: 'Edit Condition, Select field 2 of 2' }));
    await userEvent.clear(screen.getByLabelText('Option 2 label'));

    expect(screen.getAllByText('Every option needs a label.').length).toBeGreaterThan(0);
    expect(screen.getByRole('tab', { name: /Build/ })).toHaveTextContent('1');
  });

  it('previews the real form', async () => {
    setup();

    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Enter equipment tag.')).toBeInTheDocument();
  });

  it('shows the schema as JSON', async () => {
    setup();

    await userEvent.click(screen.getByRole('tab', { name: 'JSON schema' }));

    expect(await screen.findByRole('button', { name: 'Copy JSON schema' })).toBeInTheDocument();
  });

  it('loads an example form', async () => {
    const example: FormSchema = { title: 'Work order request', fields: [{ id: 'a', type: 'text', label: 'Title' }] };
    render(<FormBuilder initialSchema={SCHEMA} examples={[{ id: 'wo', label: 'Work order request', schema: example }]} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Load an example form' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Work order request' }));

    expect(screen.getByRole('list', { name: 'Work order request fields' })).toBeInTheDocument();
  });
});
