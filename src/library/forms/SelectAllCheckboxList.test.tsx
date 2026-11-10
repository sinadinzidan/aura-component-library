import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SelectAllCheckboxList } from './SelectAllCheckboxList';
import type { SelectAllCheckboxOption } from './SelectAllCheckboxList';

describe(SelectAllCheckboxList.name, () => {
  it('names the group and shows how many options are selected', () => {
    renderList(['pressure']);

    expect(screen.getByRole('group', { name: 'Columns' })).toBeInTheDocument();
    expect(screen.getByText('1 of 4 selected')).toBeInTheDocument();
  });

  it('marks the parent as indeterminate when only some options are selected', () => {
    renderList(['pressure']);

    expect(screen.getByRole('checkbox', { name: 'Select all' })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('checks the parent when every enabled option is selected', () => {
    renderList(['pressure', 'temperature', 'flow']);

    expect(screen.getByRole('checkbox', { name: 'Select all' })).toHaveAttribute('aria-checked', 'true');
  });

  it('selects every enabled option from the parent and skips disabled ones', async () => {
    const onValueChange = renderList(['pressure']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onValueChange).toHaveBeenCalledWith(['pressure', 'temperature', 'flow']);
  });

  it('clears every enabled option from the parent but keeps locked ones', async () => {
    const onValueChange = renderList(['pressure', 'temperature', 'flow', 'vibration']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    expect(onValueChange).toHaveBeenCalledWith(['vibration']);
  });

  it('toggles one option and keeps the list order', async () => {
    const onValueChange = renderList(['flow']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Pressure' }));

    expect(onValueChange).toHaveBeenCalledWith(['pressure', 'flow']);
  });

  it('hides the count line when the formatter returns nothing', () => {
    render(
      <SelectAllCheckboxList
        label="Columns"
        options={OPTIONS}
        value={[]}
        onValueChange={vi.fn()}
        formatCount={() => ''}
      />
    );

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

const OPTIONS: readonly SelectAllCheckboxOption[] = [
  { id: 'pressure', label: 'Pressure' },
  { id: 'temperature', label: 'Temperature' },
  { id: 'flow', label: 'Flow' },
  { id: 'vibration', label: 'Vibration', disabled: true },
];

function renderList(value: string[]) {
  const onValueChange = vi.fn<(value: string[]) => void>();
  render(<SelectAllCheckboxList label="Columns" options={OPTIONS} value={value} onValueChange={onValueChange} />);
  return onValueChange;
}
