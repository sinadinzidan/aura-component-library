import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { FormFieldDef } from './formSchema';
import { RuleEditor } from './RuleEditor';

const SOURCES: FormFieldDef[] = [
  { id: 'kind', type: 'select', label: 'Work type', options: [{ value: 'corrective', label: 'Corrective' }, { value: 'preventive', label: 'Preventive' }] },
  { id: 'safe', type: 'switch', label: 'Isolated' },
];

describe(RuleEditor.name, () => {
  it('explains how to get a rule when nothing above can drive one', () => {
    render(<RuleEditor sources={[]} onChange={vi.fn()} />);

    expect(screen.getByText(/Add a select, radio group, checkbox or switch above/)).toBeInTheDocument();
  });

  it('starts a rule on the first field and its first value', async () => {
    const onChange = vi.fn();
    render(<RuleEditor sources={SOURCES} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Add visibility rule' }));

    expect(onChange).toHaveBeenCalledWith({ fieldId: 'kind', equals: 'corrective' });
  });

  it('reads the rule back as a sentence', () => {
    render(<RuleEditor sources={SOURCES} rule={{ fieldId: 'kind', equals: 'preventive' }} onChange={vi.fn()} />);

    expect(screen.getByText('Shown when Work type is Preventive.')).toBeInTheDocument();
  });

  it('removes the rule', async () => {
    const onChange = vi.fn();
    render(<RuleEditor sources={SOURCES} rule={{ fieldId: 'kind', equals: 'preventive' }} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove rule' }));

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('picks a different value', async () => {
    const onChange = vi.fn();
    render(<RuleEditor sources={SOURCES} rule={{ fieldId: 'kind', equals: 'corrective' }} onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Value that shows this field' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Preventive' }));

    expect(onChange).toHaveBeenCalledWith({ fieldId: 'kind', equals: 'preventive' });
  });

  it('resets the value when another field is chosen', async () => {
    const onChange = vi.fn();
    render(<RuleEditor sources={SOURCES} rule={{ fieldId: 'kind', equals: 'corrective' }} onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Field the rule depends on' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Isolated' }));

    expect(onChange).toHaveBeenCalledWith({ fieldId: 'safe', equals: 'true' });
  });
});
