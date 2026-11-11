import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TEST_FIELDS, cond } from './fixtures';
import { ValueEditor } from './ValueEditor';

const field = (key: string) => {
  const found = TEST_FIELDS.find((entry) => entry.key === key);
  if (!found) throw new Error(key);
  return found;
};

describe(ValueEditor.name, () => {
  it('shows one text box for a text operator', async () => {
    const onChange = vi.fn();
    render(<ValueEditor condition={cond('c', 'name', 'contains')} field={field('name')} label="Condition 1" onChange={onChange} />);

    await userEvent.type(screen.getByLabelText('Condition 1 value'), 'p');

    expect(onChange).toHaveBeenCalledWith({ a: 'p' });
  });

  it('shows a number with its unit', () => {
    render(<ValueEditor condition={cond('c', 'score', 'gt')} field={field('score')} label="Condition 1" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Condition 1 value')).toHaveAttribute('type', 'number');
    expect(screen.getByText('%')).toBeInTheDocument();
  });

  it('shows both ends for a range', () => {
    const onChange = vi.fn();
    render(<ValueEditor condition={cond('c', 'score', 'between')} field={field('score')} label="Condition 1" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Condition 1 to'), { target: { value: '80' } });

    expect(screen.getByLabelText('Condition 1 from')).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({ b: '80' });
  });

  it('shows a date picker for a date operator', () => {
    render(<ValueEditor condition={cond('c', 'due', 'before')} field={field('due')} label="Condition 1" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Condition 1 value')).toHaveAttribute('type', 'date');
  });

  it('shows an amount and a unit for a relative date', () => {
    const onChange = vi.fn();
    render(<ValueEditor condition={cond('c', 'due', 'in-last', { a: '7' })} field={field('due')} label="Condition 1" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Condition 1 amount'), { target: { value: '14' } });

    expect(onChange).toHaveBeenCalledWith({ a: '14' });
    expect(screen.getByLabelText('Condition 1 unit')).toHaveTextContent('days');
  });

  it('shows a list to pick from for any-of', () => {
    render(<ValueEditor condition={cond('c', 'state', 'is-any-of', { list: ['running'] })} field={field('state')} label="Condition 1" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Condition 1 values')).toBeInTheDocument();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('shows a select for a single enum value', () => {
    render(<ValueEditor condition={cond('c', 'state', 'is', { a: 'standby' })} field={field('state')} label="Condition 1" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Condition 1 value')).toHaveTextContent('Standby');
  });

  it('shows no editor when the operator needs no value', () => {
    render(<ValueEditor condition={cond('c', 'overdue', 'is-true')} field={field('overdue')} label="Condition 1" onChange={vi.fn()} />);

    expect(screen.getByText('No value needed')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('marks the input invalid', () => {
    render(<ValueEditor condition={cond('c', 'name', 'contains')} field={field('name')} label="Condition 1" onChange={vi.fn()} invalid describedBy="why" />);

    expect(screen.getByLabelText('Condition 1 value')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Condition 1 value')).toHaveAttribute('aria-describedby', 'why');
  });
});
