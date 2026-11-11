import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormFieldControl } from './FormFieldControl';
import type { FormFieldDef } from './formSchema';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
];

const base = (patch: Partial<FormFieldDef>): FormFieldDef => ({ id: 'f', type: 'text', label: 'Field', ...patch });

describe(FormFieldControl.name, () => {
  it('labels a text field and reports typing', async () => {
    const onChange = vi.fn();
    render(<FormFieldControl field={base({ label: 'Tag', helper: 'As on the nameplate' })} value="" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Tag'), 'K');

    expect(onChange).toHaveBeenCalledWith('K');
    expect(screen.getByText('As on the nameplate')).toBeInTheDocument();
  });

  it('shows the error instead of the helper', () => {
    render(<FormFieldControl field={base({ label: 'Tag', helper: 'As on the nameplate' })} error="Enter tag." />);

    expect(screen.getByText('Enter tag.')).toBeInTheDocument();
    expect(screen.queryByText('As on the nameplate')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Tag')).toHaveAttribute('aria-invalid', 'true');
  });

  it('marks a required field', () => {
    render(<FormFieldControl field={base({ label: 'Tag', required: true })} />);

    expect(screen.getByLabelText(/Tag/)).toBeRequired();
  });

  it('shows the unit on a number field and reports the value as text', () => {
    const onChange = vi.fn();
    render(<FormFieldControl field={base({ type: 'number', label: 'Wall thickness', unit: 'mm' })} value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Wall thickness'), { target: { value: '8.2' } });

    expect(screen.getByText('mm')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('8.2');
  });

  it('reports a checkbox as a boolean', async () => {
    const onChange = vi.fn();
    render(<FormFieldControl field={base({ type: 'checkbox', label: 'Permit checked' })} value={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Permit checked' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reports a switch as a boolean', async () => {
    const onChange = vi.fn();
    render(<FormFieldControl field={base({ type: 'switch', label: 'Isolated' })} value={false} onChange={onChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Isolated' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('reports the chosen radio option', async () => {
    const onChange = vi.fn();
    render(<FormFieldControl field={base({ type: 'radio', label: 'Condition', options: OPTIONS })} value="" onChange={onChange} />);

    await userEvent.click(screen.getByRole('radio', { name: 'Beta' }));

    expect(onChange).toHaveBeenCalledWith('b');
    expect(screen.getByRole('group', { name: 'Condition' })).toBeInTheDocument();
  });

  it('shows the placeholder of a select until a value is chosen', () => {
    render(<FormFieldControl field={base({ type: 'select', label: 'Priority', options: OPTIONS, placeholder: 'Choose priority' })} />);

    expect(screen.getByText('Choose priority')).toBeInTheDocument();
  });

  it('renders a textarea, a date and a heading', () => {
    render(
      <>
        <FormFieldControl field={base({ type: 'textarea', label: 'Notes' })} />
        <FormFieldControl field={base({ type: 'date', label: 'Due date', id: 'd' })} />
        <FormFieldControl field={base({ type: 'heading', label: 'Safety', id: 'h' })} />
      </>,
    );

    expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
    expect(screen.getByLabelText('Due date')).toHaveAttribute('type', 'date');
    expect(screen.getByRole('heading', { name: 'Safety' })).toBeInTheDocument();
  });
});
