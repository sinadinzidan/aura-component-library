import { fireEvent, render, screen } from '@testing-library/react';

import { ChangeRow } from './ChangeRow';

describe(ChangeRow.name, () => {
  it('shows the value today, the proposed value and the risk in words', () => {
    render(
      <ul>
        <ChangeRow title="High vibration alarm limit" from="7.1 mm/s" to="6.5 mm/s" risk={{ label: 'Low risk', tone: 'success' }} included onToggle={vi.fn()} />
      </ul>,
    );

    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent('From 7.1 mm/s');
    expect(row).toHaveTextContent('to 6.5 mm/s');
    expect(row).toHaveTextContent('Low risk');
    expect(screen.getByRole('checkbox', { name: /High vibration alarm limit/ })).toBeChecked();
  });

  it('reports leaving a change out', () => {
    const onToggle = vi.fn();
    render(
      <ul>
        <ChangeRow title="Shelve alarm" from="Active" to="Shelved 8 h" risk={{ label: 'Review', tone: 'warning' }} included onToggle={onToggle} />
      </ul>,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledWith(false);
  });
});
