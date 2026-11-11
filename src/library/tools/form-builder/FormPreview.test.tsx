import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormPreview } from './FormPreview';
import type { FormSchema } from './formSchema';

const SCHEMA: FormSchema = {
  title: 'Work order request',
  fields: [
    { id: 'title', type: 'text', label: 'Title', required: true },
    { id: 'kind', type: 'radio', label: 'Work type', required: true, options: [{ value: 'corrective', label: 'Corrective' }, { value: 'preventive', label: 'Preventive' }] },
    { id: 'reason', type: 'textarea', label: 'Failure description', required: true, showWhen: { fieldId: 'kind', equals: 'corrective' } },
    { id: 'hours', type: 'number', label: 'Effort', unit: 'h', min: 1, max: 40 },
  ],
};

describe(FormPreview.name, () => {
  it('shows no errors before the first submit', () => {
    render(<FormPreview schema={SCHEMA} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lists every error after a failed submit', async () => {
    render(<FormPreview schema={SCHEMA} />);

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Fix 2 fields to continue');
    expect(screen.getByText('Enter title.')).toBeInTheDocument();
    expect(screen.getByText('Choose work type.')).toBeInTheDocument();
  });

  it('shows a conditional field only when its rule is met', async () => {
    render(<FormPreview schema={SCHEMA} />);
    expect(screen.queryByLabelText(/Failure description/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Corrective' }));
    expect(screen.getByLabelText(/Failure description/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Preventive' }));
    expect(screen.queryByLabelText(/Failure description/)).not.toBeInTheDocument();
  });

  it('does not check a hidden required field', async () => {
    render(<FormPreview schema={SCHEMA} />);

    await userEvent.type(screen.getByLabelText(/Title/), 'Replace seal');
    await userEvent.click(screen.getByRole('radio', { name: 'Preventive' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByRole('status')).toHaveTextContent('Submitted. 2 answers recorded.');
  });

  it('checks a revealed required field', async () => {
    render(<FormPreview schema={SCHEMA} />);

    await userEvent.type(screen.getByLabelText(/Title/), 'Replace seal');
    await userEvent.click(screen.getByRole('radio', { name: 'Corrective' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Enter failure description.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('enforces a number range with its unit', async () => {
    render(<FormPreview schema={SCHEMA} />);

    fireEvent.change(screen.getByLabelText('Effort'), { target: { value: '99' } });
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(screen.getByText('Effort must be at most 40 h.')).toBeInTheDocument();
  });

  it('clears an error as soon as the answer is fixed', async () => {
    render(<FormPreview schema={SCHEMA} />);
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await userEvent.type(screen.getByLabelText(/Title/), 'Replace seal');

    expect(screen.queryByText('Enter title.')).not.toBeInTheDocument();
  });

  it('hands the visible answers to onSubmit', async () => {
    const onSubmit = vi.fn();
    render(<FormPreview schema={SCHEMA} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/Title/), 'Replace seal');
    await userEvent.click(screen.getByRole('radio', { name: 'Preventive' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmit).toHaveBeenCalledWith({ title: 'Replace seal', kind: 'preventive', hours: undefined });
  });

  it('clears the form', async () => {
    render(<FormPreview schema={SCHEMA} />);
    await userEvent.type(screen.getByLabelText(/Title/), 'Replace seal');

    await userEvent.click(screen.getByRole('button', { name: 'Clear form' }));

    expect(screen.getByLabelText(/Title/)).toHaveValue('');
  });
});
