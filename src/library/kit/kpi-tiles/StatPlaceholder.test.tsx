import { render, screen, within } from '@testing-library/react';

import { StatPlaceholder } from './StatPlaceholder';

describe(StatPlaceholder.name, () => {
  it('marks a loading tile as busy without a figure', () => {
    render(<StatPlaceholder label="Availability" kind="loading" />);

    const tile = screen.getByRole('group', { name: 'Availability' });
    expect(tile).toHaveAttribute('aria-busy', 'true');
    expect(within(tile).getByText('Loading')).toBeInTheDocument();
  });

  it('says there is no data and why', () => {
    render(<StatPlaceholder label="Flaring" kind="empty" message="No readings in this period" />);

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('No readings in this period')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Flaring' })).toHaveAttribute('data-tone', 'neutral');
  });

  it('strikes the last trusted value on a bad signal', () => {
    render(<StatPlaceholder label="Bearing temperature" kind="bad" lastValue="61.4 °C" message="Signal lost at 05:02" />);

    expect(screen.getByText('61.4 °C').tagName).toBe('S');
    expect(screen.getByText('Bad signal')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Bearing temperature' })).toHaveAttribute('data-tone', 'critical');
  });

  it('shows the action for a stale value', () => {
    render(<StatPlaceholder label="Export flow" kind="stale" lastValue="412 m³/h" action={<button type="button">Reconnect</button>} />);

    expect(screen.getByText('Not updating')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
  });
});
