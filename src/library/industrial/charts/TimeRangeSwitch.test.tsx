import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TimeRangeSwitch } from './TimeRangeSwitch';

describe(TimeRangeSwitch.name, () => {
  it('offers the default ranges under an accessible name', () => {
    render(<TimeRangeSwitch value="24h" onValueChange={vi.fn()} />);

    expect(screen.getByRole('tablist', { name: 'Time range' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['1 h', '8 h', '24 h', '7 d']);
  });

  it('marks the current range as selected', () => {
    render(<TimeRangeSwitch value="8h" onValueChange={vi.fn()} />);

    expect(screen.getByRole('tab', { name: 'Last 8 hours' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Last hour' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the picked range', async () => {
    const onValueChange = vi.fn();
    render(<TimeRangeSwitch value="24h" onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));

    expect(onValueChange).toHaveBeenCalledWith('7d');
  });

  it('renders custom options', () => {
    render(
      <TimeRangeSwitch
        label="Shift"
        value="day"
        onValueChange={vi.fn()}
        options={[
          { value: 'day', label: 'Day' },
          { value: 'night', label: 'Night', disabled: true },
        ]}
      />
    );

    expect(screen.getByRole('tablist', { name: 'Shift' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Night' })).toHaveAttribute('aria-disabled', 'true');
  });
});
