import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConditionRow } from './ConditionRow';
import { TEST_FIELDS, cond } from './fixtures';

function setup(props: Partial<Parameters<typeof ConditionRow>[0]> = {}) {
  const handlers = { onChangeField: vi.fn(), onChangeOperator: vi.fn(), onChangeValue: vi.fn(), onRemove: vi.fn(), onMove: vi.fn() };
  render(
    <ul>
      <ConditionRow condition={cond('c1', 'score', 'gt', { a: '50' })} fields={TEST_FIELDS} position={2} {...handlers} {...props} />
    </ul>,
  );
  return handlers;
}

describe(ConditionRow.name, () => {
  it('shows the field, operator and value of the condition', () => {
    setup();

    expect(screen.getByLabelText('Condition 2 field')).toHaveTextContent('Health score');
    expect(screen.getByLabelText('Condition 2 operator')).toHaveTextContent('is above');
    expect(screen.getByLabelText('Condition 2 value')).toHaveValue(50);
  });

  it('offers only the operators of the field type', async () => {
    setup();

    await userEvent.click(screen.getByLabelText('Condition 2 operator'));

    expect(await screen.findByRole('option', { name: 'is between' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'contains' })).not.toBeInTheDocument();
  });

  it('reports a new operator', async () => {
    const { onChangeOperator } = setup();

    await userEvent.click(screen.getByLabelText('Condition 2 operator'));
    await userEvent.click(await screen.findByRole('option', { name: 'is between' }));

    expect(onChangeOperator).toHaveBeenCalledWith('between');
  });

  it('reports a new field', async () => {
    const { onChangeField } = setup();

    await userEvent.click(screen.getByLabelText('Condition 2 field'));
    await userEvent.click(await screen.findByRole('option', { name: 'State' }));

    expect(onChangeField).toHaveBeenCalledWith('state');
  });

  it('removes and moves', async () => {
    const { onRemove, onMove } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Remove condition 2' }));
    await userEvent.click(screen.getByRole('button', { name: 'Move condition 2 down' }));

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(1);
  });

  it('disables moving at the ends and says which end', () => {
    setup({ canMoveUp: false });

    expect(screen.getByRole('button', { name: 'Condition 2 is first' })).toBeDisabled();
  });

  it('says what is missing and links it to the value', () => {
    setup({ condition: cond('c1', 'score', 'gt'), problem: 'Enter a number.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a number.');
    expect(screen.getByLabelText('Condition 2 value')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows plain text with no controls when read-only', () => {
    setup({ readOnly: true, summary: 'Health score is above 50 %' });

    expect(screen.getByText('Health score is above 50 %')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
